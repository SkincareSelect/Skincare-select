import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  if (authError) {
    console.error("ADMIN ORDERS AUTH ERROR:", authError);
    return NextResponse.json({ message: "Unable to verify administrator access." }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("ADMIN ORDERS PROFILE ERROR:", profileError);
    return NextResponse.json({ message: "Unable to verify administrator access." }, { status: 500 });
  }
  if (
    profile?.role !== "admin" &&
    profile?.role !== "orders_admin" &&
    user.app_metadata?.role !== "admin"
  ) {
    return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  }

  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("*,order_items(*)")
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("ADMIN ORDERS LOAD ERROR:", ordersError);
    return NextResponse.json({ message: "Orders could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [] });
}
