import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SignupBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(request: Request) {
  let body: SignupBody;

  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ message: "Invalid signup request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim() || email?.split("@")[0];

  if (!email || !password || !name) {
    return NextResponse.json(
      { message: "Email, password, and full name are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error || !data.user) {
      if (error?.code === "email_exists" || error?.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          { message: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: error?.message ?? "Unable to create account." },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: name,
      role: "customer",
    });

    if (profileError) {
      console.error("SIGNUP PROFILE ERROR:", profileError);
      return NextResponse.json(
        { message: "Account was created, but its profile could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error && error.message.includes("Missing Supabase")
            ? "Account registration is temporarily unavailable because the server is missing its Supabase configuration."
            : "Unable to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}
