"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkMail } from "@/lib/mail";

type DealsResult = { ok: boolean; message: string };

export async function sendDealsEmail(): Promise<DealsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Authentication required." };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { ok: false, message: "Administrator access required." };
  }

  const { data: products, error: productsError } = await admin
    .from("products")
    .select('name, price, "originalPrice", badge, image, slug, hidden')
    .not("hidden", "is", true)
    .not("originalPrice", "is", null)
    .order("originalPrice", { ascending: false });

  if (productsError) {
    return { ok: false, message: productsError.message };
  }

  const deals = (products || []).filter(
    (p) => p.originalPrice && Number(p.originalPrice) > Number(p.price)
  );

  if (deals.length === 0) {
    return { ok: false, message: "No products are currently on discount." };
  }

  const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (usersError) {
    return { ok: false, message: usersError.message };
  }

  const recipients = Array.from(
    new Set(
      (authUsers?.users || [])
        .map((u) => u.email)
        .filter((email): email is string => Boolean(email))
    )
  );

  if (recipients.length === 0) {
    return { ok: false, message: "No customer accounts found to notify." };
  }

  const dealsHtml = deals
    .map((p) => {
      const off = Math.round(
        ((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100
      );
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <strong>${p.name}</strong>${p.badge ? ` <span style="color:#c2410c;">(${p.badge})</span>` : ""}<br/>
          <span style="text-decoration:line-through;color:#999;">K${Number(p.originalPrice).toFixed(2)}</span>
          &nbsp;
          <span style="color:#166534;font-weight:700;">K${Number(p.price).toFixed(2)}</span>
          &nbsp;<span style="color:#166534;">(${off}% off)</span>
        </td>
      </tr>`;
    })
    .join("");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const results = await sendBulkMail(recipients, () => ({
    subject: "New deals just dropped at Zhurie & Co",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#2f241f;">Deals you don't want to miss</h2>
      <p>Here's what's currently on discount at Zhurie &amp; Co:</p>
      <table style="width:100%;border-collapse:collapse;">${dealsHtml}</table>
      <p style="margin-top:24px;">
        <a href="${siteUrl}/deals" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Shop the deals</a>
      </p>
      <p style="color:#888;font-size:12px;margin-top:32px;">You're receiving this because you have an account with Zhurie &amp; Co.</p>
    </div>`,
    text: `Deals at Zhurie & Co:\n${deals
      .map((p) => `${p.name}: K${Number(p.originalPrice).toFixed(2)} -> K${Number(p.price).toFixed(2)}`)
      .join("\n")}\n\nShop now: ${siteUrl}/deals`,
  }));

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  if (sent === 0) {
    return {
      ok: false,
      message: `Failed to send to all ${results.length} recipient(s). ${failed[0]?.error ?? ""}`,
    };
  }

  return {
    ok: true,
    message:
      failed.length === 0
        ? `Deals email sent to ${sent} customer(s).`
        : `Sent to ${sent} of ${results.length} customer(s). ${failed.length} failed.`,
  };
}
