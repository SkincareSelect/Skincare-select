import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMobileMoneyProvider } from "@/lib/payments/providers";

const mobileMethods = ["Airtel Money", "MTN Mobile Money", "Zamtel Money"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      action?: "initiate" | "bank_confirm";
      order_id?: string;
      payment_id?: string;
      payment_method?: string;
      phone?: string;
      reference?: string;
    };
    const supabase = createAdminClient();
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to manage a payment for your order." }, { status: 401 });
    }

    if (body.action === "bank_confirm") {
      if (
        typeof body.payment_id !== "string" ||
        !body.payment_id ||
        typeof body.reference !== "string" ||
        !body.reference.trim() ||
        body.reference.length > 120
      ) {
        return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
      }
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("id,order_id")
        .eq("id", body.payment_id)
        .maybeSingle();
      if (paymentError) throw paymentError;
      if (!payment) return NextResponse.json({ error: "Payment was not found." }, { status: 404 });

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("id", payment.order_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (orderError) throw orderError;
      if (!order) return NextResponse.json({ error: "You cannot update a payment for this order." }, { status: 403 });

      const { error } = await supabase
        .from("payments")
        .update({ status: "awaiting_bank_verification", reference: body.reference.trim(), updated_at: new Date().toISOString() })
        .eq("id", payment.id)
        .eq("order_id", order.id);
      if (error) throw error;
      return NextResponse.json({ status: "awaiting_bank_verification" });
    }
    if (!body.order_id || !body.payment_method || !mobileMethods.includes(body.payment_method as (typeof mobileMethods)[number])) {
      return NextResponse.json({ error: "A valid mobile money payment request is required." }, { status: 400 });
    }
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,total,phone,email,customer_name")
      .eq("id", body.order_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: "Order was not found for this account." }, { status: 404 });
    const reference = body.reference || `ZC-${order.id.slice(0, 8).toUpperCase()}`;
    const provider = getMobileMoneyProvider();
    const result = await provider.initiate({
      amount: Number(order.total),
      phone: body.phone || order.phone,
      reference,
      customerName: order.customer_name,
      customerEmail: order.email ?? undefined,
    });
    const { data: payment, error } = await supabase.from("payments").update({
      payment_method: body.payment_method, amount: Number(order.total),
      reference, provider_transaction_id: result.providerTransactionId ?? null, status: result.status,
      updated_at: new Date().toISOString(),
    }).eq("order_id", order.id).eq("status", "pending").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !payment) throw error ?? new Error("Unable to create payment attempt.");
    if (result.status === "paid") {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "Payment Confirmed" })
        .eq("id", order.id);
      if (orderUpdateError) throw orderUpdateError;
    }
    return NextResponse.json({ payment_id: payment.id, reference, ...result });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    return NextResponse.json({ error: "Payment request could not be created." }, { status: 500 });
  }
}
