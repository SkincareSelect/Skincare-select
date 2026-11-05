import type { Product } from "@/app/lib/types";

const concernGroups = [
  {
    label: "acne and blemishes",
    terms: ["acne", "blemish", "blemishes", "pimple", "pimples", "breakout", "breakouts", "spots"],
  },
  {
    label: "dark spots and uneven tone",
    terms: ["dark spots", "hyperpigmentation", "uneven tone", "uneven skin tone", "pigmentation", "discoloration"],
  },
  {
    label: "dryness and dehydration",
    terms: ["dry", "dryness", "dehydrated", "dehydration", "moisture", "hydration", "hydrating"],
  },
  {
    label: "oiliness",
    terms: ["oily", "oiliness", "excess oil", "shine", "shiny"],
  },
  {
    label: "sensitive skin",
    terms: ["sensitive", "sensitivity", "irritation", "irritated", "soothing", "soothe", "calm", "calming"],
  },
  {
    label: "dullness and glow",
    terms: ["dull", "dullness", "glow", "glowing", "radiance", "brightening", "brighten"],
  },
  {
    label: "pores and texture",
    terms: ["pores", "pore", "blackheads", "blackhead", "texture", "rough", "exfoliation", "exfoliate"],
  },
  {
    label: "sun protection",
    terms: ["sun", "sunscreen", "spf", "uv", "sunburn", "sun protection"],
  },
  {
    label: "aging concerns",
    terms: ["aging", "ageing", "wrinkles", "fine lines", "mature", "firmness", "anti-aging", "anti-ageing"],
  },
  {
    label: "hair care",
    terms: ["hair", "scalp", "shampoo", "conditioner", "dry hair", "hair growth"],
  },
  {
    label: "beard and men's grooming",
    terms: ["beard", "shaving", "shave", "men's grooming", "mens grooming", "facial hair"],
  },
  {
    label: "fragrance",
    terms: ["perfume", "fragrance", "scent", "cologne", "smell"],
  },
  {
    label: "makeup and beauty tools",
    terms: ["makeup", "make-up", "cosmetics", "mascara", "brushes", "beauty tools"],
  },
  {
    label: "baby care",
    terms: ["baby", "infant", "newborn", "nappy", "diaper"],
  },
  {
    label: "body care",
    terms: ["body", "body lotion", "body wash", "stretch marks"],
  },
] as const;

const ignoredWords = new Set([
  "a", "about", "after", "am", "and", "are", "as", "at", "be", "because", "best", "by",
  "can", "for", "from", "get", "good", "have", "help", "i", "in", "is", "it", "looking",
  "me", "my", "need", "of", "on", "or", "please", "product", "products", "recommend",
  "something", "that", "the", "this", "to", "want", "what", "with", "you",
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function productText(product: Product) {
  return normalize([
    product.name,
    product.brand,
    product.category,
    product.subcategory,
    product.productType,
    product.description,
    product.shortDescription,
    ...(product.benefits ?? []),
    ...(product.tags ?? []),
    ...(product.suitableFor ?? []),
    ...(product.ingredients ?? []),
  ].filter(Boolean).join(" "));
}

export type BeautyRecommendation = {
  product: Product;
  score: number;
  reasons: string[];
};

export function recommendBeautyProducts(description: string, products: Product[], limit = 6): BeautyRecommendation[] {
  const query = normalize(description);
  if (!query) return [];

  const requestedConcerns = concernGroups.filter((group) =>
    group.terms.some((term) => query.includes(normalize(term))),
  );
  const matchedTerms = query
    .split(" ")
    .filter((term) => term.length > 2 && !ignoredWords.has(term));

  return products
    .filter((product) => !product.hidden && product.stock > 0)
    .map((product) => {
      const text = productText(product);
      const strongText = normalize([
        product.name,
        product.category,
        product.subcategory,
        product.productType,
        ...(product.tags ?? []),
        ...(product.suitableFor ?? []),
      ].filter(Boolean).join(" "));
      const reasons = requestedConcerns
        .filter((group) => group.terms.some((term) => text.includes(normalize(term))))
        .map((group) => group.label);
      const concernScore = reasons.reduce((score, reason) => {
        const group = requestedConcerns.find((item) => item.label === reason);
        return score + (group?.terms.some((term) => strongText.includes(normalize(term))) ? 5 : 2);
      }, 0);
      const termScore = matchedTerms.reduce((score, term) => {
        if (strongText.includes(term)) return score + 3;
        if (text.includes(term)) return score + 1;
        return score;
      }, 0);

      return { product, score: concernScore + termScore, reasons };
    })
    .filter((recommendation) => recommendation.score > 0)
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name))
    .slice(0, limit);
}
