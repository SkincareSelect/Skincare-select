import Link from "next/link";
import type { Product } from "@/app/lib/types";

export function ProductSection({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-slate-600">No products are available yet. Check back soon.</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Featured products</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">A few favourites for your routine</h2>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Curated picks to elevate your daily self-care with clean formulas and effortless results.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          See all products
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-100 hover:shadow-md">
            <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-slate-100 text-5xl">
              {product.image}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
              {product.tag ? (
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                  {product.tag}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">K{product.price}</p>
                {product.originalPrice ? (
                  <p className="text-sm text-slate-500 line-through">K{product.originalPrice}</p>
                ) : null}
              </div>
              <Link
                href={`/shop/${product.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                View details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
