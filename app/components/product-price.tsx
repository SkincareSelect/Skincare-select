import type { Product } from "@/app/lib/types";
import { getProductPrice } from "@/app/lib/price-cut";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

export function ProductPrice({
  product,
  className = "",
  originalClassName = "text-sm text-slate-400",
  showSavings = false,
}: {
  product: Product;
  className?: string;
  originalClassName?: string;
  showSavings?: boolean;
}) {
  const salePrice = getProductPrice(product);
  const cut = product.priceCut;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={className}>{formatPrice(salePrice)}</span>
      {cut ? (
        <>
          <span className={`${originalClassName} line-through`}>{formatPrice(cut.originalPrice)}</span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            {cut.discountPercentage}% OFF
          </span>
          {showSavings ? (
            <span className="text-xs font-medium text-emerald-700">Save {formatPrice(cut.discountAmount)}</span>
          ) : null}
        </>
      ) : product.originalPrice && product.originalPrice > product.price ? (
        <span className={`${originalClassName} line-through`}>{formatPrice(product.originalPrice)}</span>
      ) : null}
    </div>
  );
}
