import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/app/lib/types";

const statuses: PaymentStatus[] = ["pending", "processing", "paid", "failed", "cancelled", "awaiting_bank_verification", "refunded"];

export async function PATCH(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" && profile?.role !== "orders_admin" && user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json() as { payment_id?: string; status?: PaymentStatus };
  if (!body.payment_id || !body.status || !statuses.includes(body.status)) return NextResponse.json({ error: "Invalid payment update." }, { status: 400 });
  const { data: payment, error } = await admin.from("payments").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.payment_id).select("order_id").single();
  if (error) return NextResponse.json({ error: "Payment could not be updated." }, { status: 500 });
  if (body.status === "paid") {
    const { error: orderError } = await admin
      .from("orders")
      .update({ status: "Payment Confirmed" })
      .eq("id", payment.order_id);
    if (orderError) {
      console.error("PAYMENT ORDER STATUS UPDATE ERROR:", orderError);
      return NextResponse.json({ error: "Payment was updated, but its order status could not be synchronized." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
