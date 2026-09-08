import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: "customer" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("ADMIN STATUS ERROR:", error);
    return NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 });
  }

  return NextResponse.json({
    full_name: profile?.full_name ?? null,
    role: profile?.role === "orders_admin"
      ? "orders_admin"
      : profile?.role === "admin" || user.app_metadata?.role === "admin"
        ? "admin"
        : "customer",
  });
}
