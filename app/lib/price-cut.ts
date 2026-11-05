import type { Product } from "@/app/lib/types";

export type PriceCutRecord = {
  id?: string;
  product_id: string;
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  sale_price: number;
  is_active: boolean;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePriceCut(originalPrice: number, discountPercentage: number) {
  const discountAmount = roundMoney(originalPrice * (discountPercentage / 100));
  return {
    discountAmount,
    salePrice: roundMoney(originalPrice - discountAmount),
  };
}

export function applyPriceCuts(products: Product[], cuts: PriceCutRecord[]) {
  const activeCuts = new Map(cuts.filter((cut) => cut.is_active && cut.discount_percentage > 0).map((cut) => [cut.product_id, cut]));
  return products.map((product) => {
    const cut = activeCuts.get(product.id);
    if (!cut) return product;

    const originalPrice = Number(cut.original_price);
    const discountPercentage = Number(cut.discount_percentage);
    const calculated = calculatePriceCut(originalPrice, discountPercentage);
    if (
      !Number.isFinite(originalPrice) ||
      originalPrice < 0 ||
      !Number.isFinite(discountPercentage) ||
      discountPercentage <= 0 ||
      discountPercentage > 100 ||
      calculated.salePrice < 0
    ) {
      console.error("INVALID ACTIVE PRICE CUT:", { product_id: product.id });
      return product;
    }

    return {
      ...product,
      priceCut: {
        originalPrice,
        discountPercentage,
        discountAmount: calculated.discountAmount,
        salePrice: calculated.salePrice,
      },
    };
  });
}

export function getProductPrice(product: Product) {
  return product.priceCut?.salePrice ?? product.price;
}
