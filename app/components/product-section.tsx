import Link from "next/link";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

export function ProductSection({ products, title = "Featured products", subtitle = "Premium picks chosen for everyday routines." }: { products: Product[]; title?: string; subtitle?: string }) {
  if (products.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
        <div className="text-slate-600">No products are available yet. Check back soon.</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{subtitle}</h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full bg-[#2f241f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1713]"
        >
          View all products
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const original = product.originalPrice ?? 0;
          const discount = product.discount ?? (original > product.price ? Math.round(((original - product.price) / original) * 100) : 0);

          return (
            <article
              key={product.id}
              className="group overflow-hidden rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#d8c1b1] hover:shadow-md"
            >
              <div className="flex h-28 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#fff5ef,#f7efe7)] text-5xl">
                <ProductThumb product={product} className="h-full w-full" emojiClassName="text-5xl" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {product.badge ? (
                  <span className="rounded-full bg-[#2f241f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {product.badge}
                  </span>
                ) : null}
                {product.brand ? <span className="text-sm font-medium text-slate-500">{product.brand}</span> : null}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                {discount > 0 ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">-{discount}%</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{product.category}</span>
                <span>{product.rating ? `${product.rating.toFixed(1)} ★` : "New"}</span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</p>
                  {original > product.price ? <p className="text-sm text-slate-400 line-through">{formatPrice(original)}</p> : null}
                </div>
                <Link
                  href={`/shop/${product.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:bg-[#f5ece2]"
                >
                  View details
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
