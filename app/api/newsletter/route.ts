import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type NewsletterRequest = {
  email?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  let body: NewsletterRequest;
  try {
    body = (await request.json()) as NewsletterRequest;
  } catch {
    return NextResponse.json({ error: "Subscription request must contain valid JSON." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      console.error("NEWSLETTER SUBSCRIPTION SAVE ERROR:", error);
      return NextResponse.json({ error: "We couldn't save your subscription. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIPTION ERROR:", error);
    return NextResponse.json({ error: "We couldn't save your subscription. Please try again." }, { status: 500 });
  }
}
