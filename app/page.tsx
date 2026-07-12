import Storefront from "@/components/Storefront";
import { createClient } from "@/lib/supabase/server";
import type { Product, StoreSettings } from "@/lib/types";

export const revalidate = 60;

export default async function Home() {
  let products: Product[] = [];
  let settings: StoreSettings | null = null;
  try {
    const supabase = await createClient();
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("store_settings").select("*").limit(1).maybeSingle()
    ]);
    products = (p || []) as Product[];
    settings = s as StoreSettings | null;
  } catch {}
  return <Storefront initialProducts={products} settings={settings}/>;
}
