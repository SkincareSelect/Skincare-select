import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDpoConfig, dpoVerifyToken } from "@/lib/payments/dpo";

// The customer lands here after DPO's hosted checkout page (RedirectURL/BackURL).
// This is a convenience check only — the webhook (pushPayments) is the
// authoritative source of truth for marking an order paid. We still verify
// here so the customer sees an up-to-date status immediately instead of
// waiting on the webhook.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = (process.env.SITE_URL || url.origin).replace(/\/$/, "");
  const transactionToken = url.searchParams.get("TransactionToken") || url.searchParams.get("TransID");
  const config = getDpoConfig();

  if (!transactionToken || !config) {
    return NextResponse.redirect(`${siteUrl}/account?payment=pending`);
  }

  try {
    const verified = await dpoVerifyToken(config, transactionToken);
    const supabase = createAdminClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("id,order_id,amount")
      .eq("provider_transaction_id", transactionToken)
      .maybeSingle();

    if (payment && verified.paid) {
      const amountMatches = verified.amount === undefined || Math.abs(verified.amount - Number(payment.amount)) < 0.01;
      if (amountMatches) {
        await supabase.from("payments").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", payment.id);
        await supabase.from("orders").update({ status: "Paid" }).eq("id", payment.order_id);
        return NextResponse.redirect(`${siteUrl}/account?payment=paid`);
      }
    }
    return NextResponse.redirect(`${siteUrl}/account?payment=${verified.paid ? "paid" : "pending"}`);
  } catch (error) {
    console.error("DPO return verification error:", error);
    return NextResponse.redirect(`${siteUrl}/account?payment=pending`);
  }
}
