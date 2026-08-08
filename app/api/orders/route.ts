import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customer_name || !body.phone || !body.address || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required order information." }, { status: 400 });
    }
    const supabase = createAdminClient();
    const ids = body.items.map((i:{product_id:string})=>i.product_id);
    const { data: products, error: productError } = await supabase.from("products").select("id,name,price,stock,is_active").in("id", ids);
    if (productError) throw productError;
    const map = new Map((products||[]).map(p=>[p.id,p]));
    let subtotal = 0;
    for (const item of body.items) {
      const p = map.get(item.product_id);
      if (!p || !p.is_active || p.stock < item.quantity) return NextResponse.json({ error: `${item.name} is unavailable or has insufficient stock.` }, { status: 409 });
      subtotal += Number(p.price) * Number(item.quantity);
    }
    const deliveryFee = Number(body.delivery_fee || 0);
    const orderNumber = `SS-${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase.from("orders").insert({
      order_number: orderNumber, customer_name: body.customer_name, phone: body.phone,
      email: body.email || null, province: body.province, city: body.city, address: body.address,
      landmark: body.landmark || null, delivery_method: body.delivery_method,
      delivery_fee: deliveryFee, payment_method: body.payment_method, subtotal,
      total: subtotal + deliveryFee, status: "Pending payment", notes: body.notes || null
    }).select("id,order_number").single();
    if (error) throw error;
    const rows = body.items.map((i:{product_id:string;quantity:number})=>{
      const p = map.get(i.product_id)!;
      return { order_id: order.id, product_id: p.id, product_name: p.name, quantity: i.quantity, unit_price: p.price };
    });
    const { error: itemsError } = await supabase.from("order_items").insert(rows);
    if (itemsError) throw itemsError;
    return NextResponse.json({ order_number: order.order_number });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The order could not be saved. Check the server configuration." }, { status: 500 });
  }
}
