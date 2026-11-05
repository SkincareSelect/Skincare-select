import { NextResponse } from "next/server";
import type { FeaturedCampaignPost, StoreSettings } from "@/app/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const campaignTypes: StoreSettings["campaignType"][] = [
  "New product",
  "Promotion",
  "Awareness day",
  "Seasonal theme",
  "Announcement",
];

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
    console.error("CAMPAIGN ADMIN ACCESS ERROR:", error);
    return { error: NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 }) };
  }
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }

  return { admin };
}

function toCampaignPost(row: Record<string, unknown>): FeaturedCampaignPost {
  return {
    id: String(row.id),
    eyebrow: String(row.eyebrow ?? ""),
    type: row.campaign_type as FeaturedCampaignPost["type"],
    active: Boolean(row.is_active),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    visual: String(row.visual ?? ""),
    imageUrl: String(row.image_url ?? ""),
    footer: String(row.footer ?? ""),
    offer: String(row.offer ?? ""),
    link: String(row.link ?? ""),
    position: Number(row.position) || 0,
  };
}

function validatePost(value: unknown, index: number) {
  const postNumber = index + 1;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return `Post ${postNumber} is invalid.`;
  }
  const post = value as Partial<FeaturedCampaignPost>;
  const textLimits: Array<[unknown, number]> = [
    [post.eyebrow, 100],
    [post.title, 160],
    [post.description, 2000],
    [post.visual, 32],
    [post.imageUrl ?? "", 2000],
    [post.footer, 240],
    [post.offer, 240],
    [post.link ?? "", 2000],
  ];
  if (typeof post.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post.id)) {
    return `Post ${postNumber} has an invalid ID. Remove it and add the post again.`;
  }
  if (textLimits.some(([field, limit]) => typeof field !== "string" || field.length > limit)) {
    const fields: Array<[keyof FeaturedCampaignPost, number]> = [
      ["eyebrow", 100],
      ["title", 160],
      ["description", 2000],
      ["visual", 32],
      ["imageUrl", 2000],
      ["footer", 240],
      ["offer", 240],
      ["link", 2000],
    ];
    const invalidField = fields.find(([key, limit]) => {
      const field = post[key] ?? (key === "imageUrl" || key === "link" ? "" : undefined);
      return typeof field !== "string" || field.length > limit;
    });
    return `Post ${postNumber}: ${invalidField?.[0] ?? "A text field"} is too long or invalid.`;
  }
  if (typeof post.title !== "string" || !post.title.trim()) {
    return `Post ${postNumber}: Enter a title.`;
  }
  if (typeof post.type !== "string" || !campaignTypes.includes(post.type as FeaturedCampaignPost["type"])) {
    return `Post ${postNumber}: Choose a valid post type.`;
  }
  if (typeof post.active !== "boolean") {
    return `Post ${postNumber}: Show on homepage must be selected or cleared.`;
  }
  if (!Number.isSafeInteger(post.position) || (post.position as number) < 0) {
    return `Post ${postNumber} has an invalid position. Move it up or down and try again.`;
  }

  const imageUrl = post.imageUrl?.trim();
  if (imageUrl) {
    try {
      if (new URL(imageUrl).protocol !== "https:") {
        return `Post ${postNumber}: The image URL must use HTTPS.`;
      }
    } catch {
      return `Post ${postNumber}: Enter a valid HTTPS image URL.`;
    }
  }

  const link = post.link?.trim();
  const isInternalPath = Boolean(link?.startsWith("/") && !link.startsWith("//"));
  if (link && !isInternalPath && !/^https:\/\//i.test(link)) {
    return `Post ${postNumber}: Link must be a site path starting with / or an HTTPS URL.`;
  }

  return null;
}

export async function GET() {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  const { data, error } = await authorization.admin
    .from("featured_campaigns")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("FEATURED CAMPAIGNS LOAD ERROR:", error);
    return NextResponse.json({ error: "Could not load featured posts. Apply the featured-campaign-posts database migration and try again." }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data.map((row) => toCampaignPost(row)) });
}

export async function PUT(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  let campaigns: FeaturedCampaignPost[];
  try {
    const body = (await request.json()) as { campaigns?: unknown };
    if (!Array.isArray(body.campaigns) || body.campaigns.length > 30) {
      return NextResponse.json({ error: "Add no more than 30 featured posts and try again." }, { status: 400 });
    }
    const validationError = body.campaigns
      .map((post, index) => validatePost(post, index))
      .find((error): error is string => error !== null);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    campaigns = body.campaigns as FeaturedCampaignPost[];
  } catch {
    return NextResponse.json({ error: "Campaign data must be valid JSON." }, { status: 400 });
  }

  const existingResult = await authorization.admin.from("featured_campaigns").select("id");
  if (existingResult.error) {
    console.error("FEATURED CAMPAIGNS SAVE ERROR:", existingResult.error);
    return NextResponse.json({ error: "Could not load existing posts. Apply the featured-campaign-posts database migration and try again." }, { status: 500 });
  }

  const rows = campaigns.map((post) => ({
    id: post.id,
    eyebrow: post.eyebrow.trim(),
    campaign_type: post.type,
    is_active: post.active,
    title: post.title.trim(),
    description: post.description.trim(),
    visual: post.visual.trim() || "✨",
    image_url: post.imageUrl?.trim() ?? "",
    footer: post.footer.trim(),
    offer: post.offer.trim(),
    link: post.link?.trim() ?? "",
    position: post.position,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length > 0) {
    const { error } = await authorization.admin.from("featured_campaigns").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("FEATURED CAMPAIGNS SAVE ERROR:", error);
      return NextResponse.json({ error: "Could not save featured posts." }, { status: 500 });
    }
  }

  const keepIds = new Set(campaigns.map((post) => post.id));
  const staleIds = (existingResult.data ?? []).map((row) => row.id).filter((id) => !keepIds.has(id));
  if (staleIds.length > 0) {
    const { error } = await authorization.admin.from("featured_campaigns").delete().in("id", staleIds);
    if (error) {
      console.error("FEATURED CAMPAIGNS CLEANUP ERROR:", error);
      return NextResponse.json({ error: "Posts were saved, but removed posts could not be cleaned up. Reload and try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ campaigns });
}
