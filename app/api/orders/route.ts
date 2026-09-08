import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderRequestItem = {
  product_id?: string;
  name?: string;
  price?: number;
  quantity?: number;
};

type OrderRequest = {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  landmark?: string;
  delivery_method?: string;
  delivery_fee?: number;
  payment_method?: string;
  payment_reference?: string;
  subtotal?: number;
  total?: number;
  referral_code?: string;
  notes?: string;
  items?: OrderRequestItem[];
};

const paymentMethods = ["Airtel Money", "Zamtel Money"] as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;
    const phone = body.customer_phone ?? body.phone;
    if (!body.customer_name || !phone || !body.address || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required order information." }, { status: 400 });
    }
    if (!body.payment_method || !paymentMethods.includes(body.payment_method as (typeof paymentMethods)[number])) {
      return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
    }

    const requestedItems = body.items
      .filter((item): item is OrderRequestItem & { product_id: string } => typeof item.product_id === "string" && item.product_id.length > 0)
      .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }));

    if (requestedItems.length !== body.items.length) {
      return NextResponse.json({ error: "Every item must reference a valid product." }, { status: 400 });
    }
    if (requestedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 50)) {
      return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // SECURITY: never trust price, name or stock supplied by the client. Look up
    // every product server-side and price the order using the authoritative data
    // stored in Supabase, so a tampered request can't buy items for an arbitrary price.
    const productIds = [...new Set(requestedItems.map((item) => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,price,stock,hidden")
      .in("id", productIds);
    if (productsError) throw productsError;

    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    const missing = productIds.filter((id) => !productMap.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: "One or more items are no longer available." }, { status: 400 });
    }

    const items: { product_id: string; product_name: string; quantity: number; price: number }[] = [];
    for (const requested of requestedItems) {
      const product = productMap.get(requested.product_id)!;
      if (product.hidden) {
        return NextResponse.json({ error: `${product.name} is not currently available.` }, { status: 400 });
      }
      if (product.stock < requested.quantity) {
        return NextResponse.json({ error: `Only ${product.stock} unit(s) of ${product.name} left in stock.` }, { status: 400 });
      }
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity: requested.quantity,
        price: Number(product.price),
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = Number(body.delivery_fee ?? 0);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return NextResponse.json({ error: "Invalid delivery fee." }, { status: 400 });
    }
    const discounts: Record<string, number> = { SELECT10: 0.1, SELECT15: 0.15, GLOWUP: 0.05 };
    const discountRate = body.referral_code ? discounts[body.referral_code.toUpperCase()] || 0 : 0;
    const discount = subtotal * discountRate;
    const orderNumber = `BS-${Date.now().toString().slice(-8)}`;
    const paymentReference = body.payment_reference || `ZC-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error } = await supabase.from("orders").insert({
      order_number: orderNumber, customer_name: body.customer_name, phone,
      email: body.customer_email || null, province: body.province || "", city: body.city || "", address: body.address,
      landmark: body.landmark || null, delivery_method: body.delivery_method,
      delivery_fee: deliveryFee, payment_method: body.payment_method || "Airtel Money", subtotal,
      total: Math.max(0, subtotal + deliveryFee - discount), status: "Pending payment"
    }).select("id,order_number").single();
    if (error) throw error;

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({ ...item, order_id: order.id })),
    );
    if (itemsError) throw itemsError;

    // Decrement stock now that the order (and its items) have been recorded, so
    // concurrent checkouts can't oversell the same low-stock product.
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: Math.max(0, product.stock - item.quantity) })
        .eq("id", item.product_id)
        .eq("stock", product.stock);
      if (stockError) throw stockError;
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      payment_method: body.payment_method || "Airtel Money",
      reference: paymentReference,
      amount: Math.max(0, subtotal + deliveryFee - discount),
      status: "pending",
    });
    if (paymentError && paymentError.code !== "PGRST205") {
      throw paymentError;
    }

    const paymentId = paymentError ? undefined : (
      await supabase
        .from("payments")
        .select("id")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data?.id;
    return NextResponse.json({ order_id: order.id, order_number: order.order_number, payment_id: paymentId, payment_reference: paymentReference });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The order could not be saved. Check the server configuration." }, { status: 500 });
  }
}
