import type { MetadataRoute } from "next";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-server";

const siteUrl = "https://zhurieandco.shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/returns",
    "/privacy",
    "/terms",
    "/referrals",
  ];
  const { products } = await fetchProductsFromSupabase();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: route === "" ? "daily" as const : "weekly" as const,
    })),
    ...(products ?? [])
      .filter((product) => !product.hidden)
      .map((product) => ({
        url: `${siteUrl}/shop/${encodeURIComponent(product.slug)}`,
        changeFrequency: "weekly" as const,
      })),
  ];
}
