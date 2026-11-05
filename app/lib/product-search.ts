import type { Product } from "@/app/lib/types";

export function matchesProductSearch(product: Product, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const searchableText = [
    product.name,
    product.brand,
    product.category,
    product.subcategory,
    product.productType,
    product.sku,
    product.description,
    product.shortDescription,
    ...(product.benefits ?? []),
    ...(product.tags ?? []),
    ...(product.suitableFor ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return terms.every((term) => searchableText.includes(term));
}
