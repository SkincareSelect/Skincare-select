import { NextResponse } from "next/server";
import type { StoreSettings } from "@/app/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function authorizeAdmin() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("STORE SETTINGS ADMIN ACCESS ERROR:", error);
    return { error: NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 }) };
  }
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }

  return { admin };
}

function isStoreSettings(value: unknown): value is StoreSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const settings = value as Partial<StoreSettings>;
  return (
    typeof settings.storeName === "string" &&
    typeof settings.storeLogo === "string" &&
    typeof settings.storeEmail === "string" &&
    typeof settings.phoneNumber === "string" &&
    typeof settings.whatsappNumber === "string" &&
    typeof settings.mtnNumber === "string" &&
    typeof settings.airtelNumber === "string" &&
    typeof settings.zamtelNumber === "string" &&
    typeof settings.deliveryFee === "number" &&
    Number.isFinite(settings.deliveryFee) &&
    settings.deliveryFee >= 0 &&
    typeof settings.businessHours === "string" &&
    typeof settings.paymentNumbers === "object" &&
    settings.paymentNumbers !== null &&
    typeof settings.bankDetails === "object" &&
    settings.bankDetails !== null &&
    typeof settings.socialLinks === "object" &&
    settings.socialLinks !== null
  );
}

function toDatabaseSettings(settings: StoreSettings) {
  return {
    store_name: settings.storeName,
    store_logo: settings.storeLogo,
    whatsapp_number: settings.whatsappNumber,
    payment_numbers: {
      ...settings.paymentNumbers,
      "MTN Mobile Money": settings.mtnNumber,
      "Airtel Money": settings.airtelNumber,
      "Zamtel Money": settings.zamtelNumber,
    },
    bank_details: {
      accountName: settings.bankAccountName || settings.bankDetails.accountName,
      accountNumber: settings.bankAccountNumber || settings.bankDetails.accountNumber,
      bankName: settings.bankName || settings.bankDetails.bankName,
      branch: settings.bankBranch || settings.bankDetails.branch,
      swiftCode: settings.bankDetails.swiftCode,
    },
    support_email: settings.supportEmail || settings.storeEmail,
    support_phone: settings.supportPhone || settings.phoneNumber,
    delivery_fee: settings.deliveryFee,
    business_hours: settings.businessHours,
    campaign_eyebrow: settings.campaignEyebrow,
    campaign_type: settings.campaignType,
    campaign_active: settings.campaignActive,
    campaign_title: settings.campaignTitle,
    campaign_description: settings.campaignDescription,
    campaign_visual: settings.campaignVisual,
    campaign_image_url: settings.campaignImageUrl ?? "",
    campaign_footer: settings.campaignFooter,
    campaign_offer: settings.campaignOffer,
    social_links: settings.socialLinks,
  };
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Settings must be sent as valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || !isStoreSettings((body as { settings?: unknown }).settings)) {
    return NextResponse.json({ error: "Store settings are incomplete or invalid." }, { status: 400 });
  }

  const payload = toDatabaseSettings((body as { settings: StoreSettings }).settings);
  const { data: existing, error: lookupError } = await authorization.admin
    .from("store_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("STORE SETTINGS LOAD BEFORE SAVE ERROR:", lookupError);
    return NextResponse.json({ error: `Could not load store settings: ${lookupError.message}` }, { status: 500 });
  }

  const result = existing
    ? await authorization.admin.from("store_settings").update(payload).eq("id", existing.id)
    : await authorization.admin.from("store_settings").insert(payload);
  if (result.error) {
    console.error("STORE SETTINGS SAVE ERROR:", result.error);
    return NextResponse.json({ error: `Supabase rejected the settings update: ${result.error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
