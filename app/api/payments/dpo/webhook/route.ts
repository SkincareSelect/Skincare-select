import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DPO_PUSH_PAYMENT_ACK_XML, getDpoConfig, parsePushPaymentXml, dpoVerifyToken } from "@/lib/payments/dpo";

// DPO's server-to-server "pushPayments" webhook. This is the authoritative
// source of truth for payment confirmation (the browser redirect is cosmetic).
// We re-verify the transaction with DPO directly (verifyToken) rather than
// trusting the webhook body alone, so a forged POST to this URL can't mark an
// order as paid.
export async function POST(request: Request) {
  const config = getDpoConfig();
  const rawXml = await request.text();
  try {
    if (!config) throw new Error("DPO is not configured.");
    const notification = parsePushPaymentXml(rawXml);
    if (!notification.transactionToken) throw new Error("Missing transaction token in push notification.");

    // Re-verify directly against DPO instead of trusting the webhook payload.
    const verified = await dpoVerifyToken(config, notification.transactionToken);

    const supabase = createAdminClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("id,order_id,amount")
      .eq("provider_transaction_id", notification.transactionToken)
      .maybeSingle();

    if (payment && verified.paid) {
      // Confirm the paid amount matches what we expect before marking it paid.
      const amountMatches = verified.amount === undefined || Math.abs(verified.amount - Number(payment.amount)) < 0.01;
      if (amountMatches) {
        await supabase.from("payments").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", payment.id);
        await supabase.from("orders").update({ status: "Paid" }).eq("id", payment.order_id);
      } else {
        console.error("DPO webhook amount mismatch", { expected: payment.amount, received: verified.amount });
      }
    } else if (payment && !verified.paid) {
      const status = verified.result === "904" ? "cancelled" : verified.result === "901" ? "failed" : "pending";
      await supabase.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("id", payment.id);
    }
  } catch (error) {
    console.error("DPO webhook error:", error);
  }
  // Always acknowledge with OK so DPO doesn't keep retrying; verification
  // failures are logged above and can be reconciled via /api/payments/dpo/return.
  return new NextResponse(DPO_PUSH_PAYMENT_ACK_XML, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
