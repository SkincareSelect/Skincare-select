import type { Product } from "@/app/lib/types";

/**
 * Products store either an emoji placeholder (e.g. "🧴") or a real photo URL
 * (set via the admin image upload, which stores a Supabase Storage public URL)
 * in the same `image` field. This tells the two apart.
 */
export function isPhotoUrl(value?: string | null): value is string {
  if (!value) {
    return false;
  }
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

export function getProductPhoto(product: Pick<Product, "image" | "images">): string | null {
  if (isPhotoUrl(product.image)) {
    return product.image;
  }
  const first = product.images?.find((candidate) => isPhotoUrl(candidate));
  return first ?? null;
}
