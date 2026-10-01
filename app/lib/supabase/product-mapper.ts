import type { Product, ProductCategory } from "@/app/lib/types";

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

export function mapSupabaseProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    category: String(row.category ?? "Face Care") as ProductCategory,
    brand: optionalString(row.brand),
    price: Number(row.price ?? 0),
    originalPrice: optionalNumber(row.originalPrice ?? row.original_price),
    description: String(row.description ?? ""),
    shortDescription: String(row.shortDescription ?? row.short_description ?? row.description ?? ""),
    benefits: stringArray(row.benefits) ?? [],
    badge: optionalString(row.badge ?? row.tag),
    stock: Number(row.stock ?? 0),
    image: optionalString(row.image ?? row.image_url) ?? "🧴",
    images: stringArray(row.images),
    featured: Boolean(row.featured),
    hidden: Boolean(row.hidden ?? (row.is_active === false)),
    productType: optionalString(row.productType ?? row.product_type),
    discount: optionalNumber(row.discount),
    tags: stringArray(row.tags),
    newArrival: Boolean(row.newArrival ?? row.new_arrival),
    bestSeller: Boolean(row.bestSeller ?? row.best_seller),
    createdAt: optionalString(row.created_at ?? row.createdAt),
  };
}
