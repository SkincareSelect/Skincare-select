import type { Payment, Product, Order, StoreSettings } from "@/app/lib/types";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

export async function fetchProductsFromSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return [] as Product[];
  }

  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    return [] as Product[];
  }

  return data as Product[];
}

export async function fetchOrdersFromSupabase() {
  const supabase = getSupabaseBrowserClient();
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
  const supabase = getSupabaseBrowserClient();
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
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("payments").upsert(payment, { onConflict: "id" });
  return !error;
}

export async function fetchSettingsFromSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("store_settings").select("*").limit(1).single();
  if (error || !data) {
    return null;
  }

  return data as StoreSettings;
}

export async function upsertProductToSupabase(product: Product) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("products").upsert(product, { onConflict: "id" });
  return !error;
}

export async function deleteProductFromSupabase(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  return !error;
}

export async function upsertOrderToSupabase(order: Order) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("orders").upsert(order, { onConflict: "id" });
  return !error;
}

export async function upsertSettingsToSupabase(settings: StoreSettings) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { error: new Error("No Supabase client") };
  }

  const { data, error } = await supabase.from("store_settings").select("id").limit(1).single();
  if (error) {
    return supabase.from("store_settings").insert(settings);
  }

  return supabase.from("store_settings").update(settings).eq("id", data.id);
}
