import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: adminProfile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("CUSTOMER ACCESS ERROR:", profileError);
    return NextResponse.json({ message: "Unable to verify administrator access." }, { status: 500 });
  }

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  }

  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id, full_name, role, created_at").eq("role", "customer").order("created_at", { ascending: false }),
    ]);

  if (usersError || profilesError) {
    console.error("CUSTOMER LIST ERROR:", usersError ?? profilesError);
    return NextResponse.json({ message: "Unable to load customer data." }, { status: 500 });
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const customers = (users?.users ?? [])
    .filter((customer) => profileById.has(customer.id))
    .map((customer) => {
      const profile = profileById.get(customer.id);
      return {
        id: customer.id,
        name: profile?.full_name || customer.user_metadata?.full_name || "Customer",
        email: customer.email ?? "No email",
        createdAt: profile?.created_at ?? customer.created_at,
        lastSignInAt: customer.last_sign_in_at,
      };
    });

  return NextResponse.json({ customers });
}
