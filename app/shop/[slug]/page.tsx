"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/components/cart-provider";
import { initialProducts } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    void fetchProductsFromSupabase().then((products) => {
      void params.then(({ slug: resolvedSlug }) => {
        if (cancelled) {
          return;
        }
        const catalogue = products.length > 0 ? products : initialProducts;
        setProduct(catalogue.find((candidate) => candidate.slug === resolvedSlug) ?? null);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    return initialProducts.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <div className="rounded-[2rem] border border-[#eadfce] bg-white p-8 text-slate-600 shadow-sm">
        Loading product...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="rounded-full bg-[#fbf7f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#8d6e63]">
              {product.badge ?? product.productType ?? "Select"}
            </span>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
              <span className="rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700">
                {product.category}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-[#8d6e63] transition hover:text-[#75584f]">
            Back to shop
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
          <div className="flex h-64 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#fff5ef,#f7efe7)] text-8xl">
            <ProductThumb product={product} className="h-full w-full" emojiClassName="text-8xl" sizes="(max-width: 1024px) 90vw, 45vw" />
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-lg font-semibold text-slate-900">Product details</p>
              <p className="mt-3 text-slate-600">{product.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-[#8d6e63]">Rating</p>
                <p className="mt-2 text-sm text-slate-700">{product.rating ? `${product.rating.toFixed(1)} / 5` : "No rating yet"}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-[#8d6e63]">Stock status</p>
                <p className="mt-2 text-sm text-slate-700">{product.stock > 0 ? `${product.stock} units available` : "Out of stock"}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.benefits.map((benefit) => (
                <span key={benefit} className="rounded-[1.25rem] border border-[#eadfce] bg-white px-4 py-3 text-sm text-slate-700">
                  {benefit}
                </span>
              ))}
            </div>
            {product.ingredients ? (
              <div className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
                <p className="font-semibold text-slate-900">Ingredients</p>
                <p className="mt-2 text-sm text-slate-600">{product.ingredients.join(", ")}</p>
              </div>
            ) : null}
            {product.instructions ? (
              <div className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
                <p className="font-semibold text-slate-900">How to use</p>
                <p className="mt-2 text-sm text-slate-600">{product.instructions}</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Price</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
            {product.originalPrice ? <p className="mt-2 text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</p> : null}
            <p className="mt-4 text-sm text-slate-500">Secure checkout with Zambia-friendly payment methods.</p>
            <button
              onClick={() => addItem(product)}
              className="mt-8 w-full rounded-full bg-[#d9b8a7] px-4 py-3 text-sm font-semibold text-[#2f241f] transition hover:bg-[#c99d89]"
            >
              Add to bag
            </button>
            <Link
              href="/checkout"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d8c1b1] hover:bg-[#fbf7f2]"
            >
              Buy now
            </Link>
          </div>

          <div className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-900">Product info</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              {product.size ? <p>Size: {product.size}</p> : null}
              {product.weight ? <p>Weight: {product.weight}</p> : null}
              {product.suitableFor ? <p>Suitable for: {product.suitableFor.join(", ")}</p> : null}
              {product.sku ? <p>SKU: {product.sku}</p> : null}
            </div>
          </div>
        </aside>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Related products</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">You may also like</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <article key={item.id} className="rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-sm">
                <div className="flex h-24 items-center justify-center rounded-[1.5rem] bg-[#fbf7f2] text-4xl">
                  <ProductThumb product={item} className="h-full w-full" emojiClassName="text-4xl" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{item.brand ?? "Zhurie & Co"}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">{formatPrice(item.price)}</span>
                  <Link href={`/shop/${item.slug}`} className="text-sm font-medium text-[#8d6e63]">
                    View
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
