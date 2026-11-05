import type { FeaturedCampaignPost, Payment, Product, ProductCatalogueResult, Order, StoreSettings } from "@/app/lib/types";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { mapSupabaseProduct } from "@/app/lib/supabase/product-mapper";
import { mapSupabaseSettings } from "@/app/lib/supabase/settings-mapper";
import { applyPriceCuts, type PriceCutRecord } from "@/app/lib/price-cut";

export async function fetchProductsFromSupabase(): Promise<ProductCatalogueResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    console.error("PRODUCT LOAD ERROR: Supabase server configuration is missing.");
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("PRODUCT LOAD ERROR:", error);
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  if (!data) {
    console.error("PRODUCT LOAD ERROR: Supabase returned no product data.");
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  const { data: priceCuts, error: priceCutsError } = await supabase
    .from("price_cuts")
    .select("product_id,original_price,discount_percentage,discount_amount,sale_price,is_active")
    .eq("is_active", true);
  if (priceCutsError) {
    console.error("PRICE CUT LOAD ERROR:", priceCutsError);
    return { products: [], error: "Product prices are temporarily unavailable. Please try again later." };
  }

  return {
    products: applyPriceCuts(
      data.map((row) => mapSupabaseProduct(row)),
      (priceCuts ?? []) as PriceCutRecord[],
    ),
    error: null,
  };
}

export async function fetchOrdersFromSupabase() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as Order[];
  }

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    return [] as Order[];
  }

  return data as Order[];
}

export async function fetchPaymentsFromSupabase() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as Payment[];
  }

  const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    return [] as Payment[];
  }

  return data as Payment[];
}

export async function upsertPaymentToSupabase(payment: Payment) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("payments").upsert(payment, { onConflict: "id" });
  return !error;
}

export async function fetchSettingsFromSupabase() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSupabaseSettings(data);
}

export async function fetchCampaignFromSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("FEATURED CAMPAIGN LOAD ERROR: Supabase server configuration is missing.");
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("store_settings")
    .select("campaign_eyebrow, campaign_type, campaign_active, campaign_title, campaign_description, campaign_visual, campaign_image_url, campaign_footer, campaign_offer")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("FEATURED CAMPAIGN LOAD ERROR:", error);
    return null;
  }

  if (!data) {
    console.error("FEATURED CAMPAIGN LOAD ERROR: Supabase returned no campaign settings.");
    return null;
  }

  return {
    campaignEyebrow: data.campaign_eyebrow,
    campaignType: data.campaign_type,
    campaignActive: data.campaign_active,
    campaignTitle: data.campaign_title,
    campaignDescription: data.campaign_description,
    campaignVisual: data.campaign_visual,
    campaignImageUrl: data.campaign_image_url,
    campaignFooter: data.campaign_footer,
    campaignOffer: data.campaign_offer,
  };
}

export async function fetchFeaturedCampaignPosts(): Promise<FeaturedCampaignPost[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("FEATURED CAMPAIGNS LOAD ERROR: Supabase server configuration is missing.");
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("featured_campaigns")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("FEATURED CAMPAIGNS LOAD ERROR:", error);
    return null;
  }

  return data.map((row) => ({
    id: row.id,
    eyebrow: row.eyebrow,
    type: row.campaign_type,
    active: row.is_active,
    title: row.title,
    description: row.description,
    visual: row.visual,
    imageUrl: row.image_url,
    footer: row.footer,
    offer: row.offer,
    link: row.link,
    position: row.position,
  })) as FeaturedCampaignPost[];
}

export async function upsertProductToSupabase(product: Product) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("products").upsert(product, { onConflict: "id" });
  return !error;
}

export async function deleteProductFromSupabase(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  return !error;
}

export async function upsertOrderToSupabase(order: Order) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("orders").upsert(order, { onConflict: "id" });
  return !error;
}

export async function upsertSettingsToSupabase(settings: StoreSettings) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: new Error("No Supabase client") };
  }

  const { data, error } = await supabase.from("store_settings").select("id").limit(1).single();
  if (error) {
    return supabase.from("store_settings").insert(settings);
  }

  return supabase.from("store_settings").update(settings).eq("id", data.id);
}
