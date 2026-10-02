import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { initialSettings } from "@/app/lib/store-data";

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
  let body: OrderRequest;
  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return NextResponse.json({ error: "Order request must contain valid JSON." }, { status: 400 });
  }

  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const phoneValue = body.customer_phone ?? body.phone;
  const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
  const email = typeof body.customer_email === "string" ? body.customer_email.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const paymentReference = typeof body.payment_reference === "string" ? body.payment_reference.trim() : "";
  if (
    !customerName ||
    customerName.length > 120 ||
    !phone ||
    phone.length > 40 ||
    !address ||
    address.length > 500 ||
    (email !== "" && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
    !paymentReference ||
    paymentReference.length > 120 ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    return NextResponse.json({ error: "Enter valid contact, delivery, payment, and order details." }, { status: 400 });
  }
  if (typeof body.payment_method !== "string" || !paymentMethods.includes(body.payment_method as (typeof paymentMethods)[number])) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }

  const requestedItems = body.items.map((item) => {
    if (!item || typeof item.product_id !== "string" || !item.product_id.trim()) {
      return null;
    }
    return { product_id: item.product_id.trim(), quantity: Number(item.quantity) };
  });
  if (requestedItems.some((item) => item === null)) {
    return NextResponse.json({ error: "Every item must reference a valid product." }, { status: 400 });
  }

  const quantitiesByProduct = new Map<string, number>();
  for (const item of requestedItems) {
    if (!item) continue;
    const quantity = (quantitiesByProduct.get(item.product_id) ?? 0) + item.quantity;
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || quantity > 50) {
      return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
    }
    quantitiesByProduct.set(item.product_id, quantity);
  }
  const normalizedItems = [...quantitiesByProduct.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));

  try {
    const supabase = createAdminClient();
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();

    // SECURITY: never trust price, name or stock supplied by the client. Look up
    // every product server-side and price the order using the authoritative data
    // stored in Supabase, so a tampered request can't buy items for an arbitrary price.
    const productIds = normalizedItems.map((item) => item.product_id);
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
    for (const requested of normalizedItems) {
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
    const deliveryFee = initialSettings.deliveryFee;
    const discounts: Record<string, number> = { SELECT10: 0.1, SELECT15: 0.15, GLOWUP: 0.05 };
    const referralCode = typeof body.referral_code === "string"
      ? body.referral_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
      : "";
    const discountRate = discounts[referralCode] || 0;
    const discount = subtotal * discountRate;
    const orderNumber = `ZC-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { data: order, error } = await supabase.from("orders").insert({
      order_number: orderNumber, customer_name: customerName, phone,
      email: email || null, user_id: user?.id ?? null,
      province: typeof body.province === "string" ? body.province.trim().slice(0, 120) : "",
      city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : "",
      address,
      landmark: typeof body.landmark === "string" ? body.landmark.trim().slice(0, 200) || null : null,
      delivery_method: typeof body.delivery_method === "string" ? body.delivery_method.trim().slice(0, 80) : "Standard delivery",
      delivery_fee: deliveryFee, payment_method: body.payment_method || "Airtel Money", subtotal,
      payment_reference: paymentReference,
      total: Math.max(0, subtotal + deliveryFee - discount), status: "Payment Pending"
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
    return NextResponse.json({
        order_id: order.id,
        order_number: order.order_number,
        payment_id: paymentId,
        payment_reference: paymentReference,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total: Math.max(0, subtotal + deliveryFee - discount),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The order could not be saved. Check the server configuration." }, { status: 500 });
  }
}
