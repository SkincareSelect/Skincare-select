import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    if (body.action === "bank_confirm") {
      if (!body.payment_id || !body.reference) return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
      const { data, error } = await supabase.from("payments").update({ status: "awaiting_bank_verification", reference: body.reference, updated_at: new Date().toISOString() }).eq("id", body.payment_id).select("id").single();
      if (error || !data) throw error ?? new Error("Payment not found.");
      return NextResponse.json({ status: "awaiting_bank_verification" });
    }
    if (!body.order_id || !body.payment_method || !mobileMethods.includes(body.payment_method as (typeof mobileMethods)[number])) {
      return NextResponse.json({ error: "A valid mobile money payment request is required." }, { status: 400 });
    }
    const { data: order, error: orderError } = await supabase.from("orders").select("id,total,phone,email,customer_name").eq("id", body.order_id).single();
    if (orderError || !order) throw orderError ?? new Error("Order not found.");
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
      const { error: orderUpdateError } = await supabase.from("orders").update({ status: "Paid" }).eq("id", order.id);
      if (orderUpdateError) throw orderUpdateError;
    }
    return NextResponse.json({ payment_id: payment.id, reference, ...result });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    return NextResponse.json({ error: "Payment request could not be created." }, { status: 500 });
  }
}
