"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/components/cart-provider";
import { categories } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import type { Product, ProductCategory } from "@/app/lib/types";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [query, setQuery] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    void fetchProductsFromSupabase().then((nextProducts) => {
      setProducts(nextProducts);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Curated essentials</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Discover skincare that fits your routine.</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Search by need, browse categories, and build a routine that feels luxurious and simple.</p>
            <p className="mt-4 text-sm text-slate-500">Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} across {category === "All" ? "all categories" : category}.</p>
          </div>
          <div className="w-full max-w-md">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search products</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search botanicals, serums, and more"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={() => setCategory("All")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${category === "All" ? "border-violet-600 bg-violet-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-slate-50"}`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.label}
            onClick={() => setCategory(item.label)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${category === item.label ? "border-violet-600 bg-violet-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-slate-50"}`}
          >
            {item.label}
          </button>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <article key={product.id} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-100 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-pink-600">{product.tag}</span>
                <span className="text-sm font-medium text-slate-500">{product.category}</span>
              </div>
              <div className="mt-6 flex h-20 items-center justify-center rounded-2xl bg-slate-50 text-5xl">{product.image}</div>
              <h2 className="mt-6 text-xl font-semibold text-slate-900">{product.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                {product.benefits.slice(0, 2).map((benefit) => (
                  <span key={benefit} className="rounded-full bg-slate-100 px-3 py-1">
                    {benefit}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">K{product.price}</p>
                  {product.originalPrice ? <p className="text-sm text-slate-400 line-through">K{product.originalPrice}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => addItem(product)}
                    className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            No products match your search. Try another keyword or category.
          </div>
        )}
      </div>
    </div>
  );
}
