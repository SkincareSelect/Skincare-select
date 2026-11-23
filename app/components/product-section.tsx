import Link from "next/link";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";
import { ProductPrice } from "@/app/components/product-price";
import { shoeSizeSystemLabel } from "@/app/lib/shoe-size";

export function ProductSection({ products, title = "Featured products", subtitle = "Premium picks chosen for everyday routines." }: { products: Product[]; title?: string; subtitle?: string }) {
  if (products.length === 0) {
    return (
      <section className="border-y border-[#e8e2d8] py-8">
        <div className="text-sm text-[#68645e]">No products are available yet. Check back soon.</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">{title}</p>
          <h2 className="mt-3 text-3xl text-[#111111] sm:text-4xl">{subtitle}</h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center border border-[#111111] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-[#111111] transition hover:bg-[#111111] hover:text-white"
        >
          View the collection
        </Link>
      </div>

      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const original = product.originalPrice ?? 0;
          const discount = product.priceCut
            ? 0
            : product.discount ?? (original > product.price ? Math.round(((original - product.price) / original) * 100) : 0);

          return (
            <article
              key={product.id}
              className="group min-w-0"
            >
              <Link href={`/shop/${product.slug}`} className="block overflow-hidden bg-[#eeeae2]">
                <div className="aspect-[4/5]">
                  <ProductThumb product={product} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" emojiClassName="text-5xl" />
                </div>
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {product.brand ? <span className="text-[10px] uppercase tracking-[0.14em] text-[#777168]">{product.brand}</span> : null}
                {product.badge ? (
                  <span className="border border-[#e8e2d8] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#424242]">
                    {product.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <h3 className="text-lg leading-snug text-[#111111]">
                  <Link href={`/shop/${product.slug}`} className="transition hover:text-[#68645e]">{product.name}</Link>
                </h3>
                {discount > 0 ? (
                  <span className="shrink-0 border border-[#e8e2d8] px-2 py-0.5 text-[10px] font-medium text-[#424242]">-{discount}%</span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68645e]">{product.shortDescription}</p>
              {product.sizeOptions ? (
                <p className="mt-2 text-xs text-[#68645e]">
                  Available{" "}
                  {product.sizeOptions.type === "footwear"
                    ? `shoe sizes (${shoeSizeSystemLabel(product.sizeOptions.system) ?? "system not set"})`
                    : "apparel sizes"}
                  :{" "}
                  <span className="font-medium text-[#424242]">{product.sizeOptions.available.join(", ")}</span>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <ProductPrice product={product} className="text-sm font-medium text-[#111111]" originalClassName="text-xs text-[#777168]" />
                <Link
                  href={`/shop/${product.slug}`}
                  className="inline-flex min-h-10 items-center justify-center border border-[#111111] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#111111] transition hover:bg-[#111111] hover:text-white"
                >
                  View piece
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
