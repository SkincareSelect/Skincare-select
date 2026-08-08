"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/app/components/cart-provider";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import type { Product } from "@/app/lib/types";

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    void fetchProductsFromSupabase().then((products) => {
      setProduct(products.find((candidate) => candidate.slug === params.slug) ?? null);
    });
  }, [params.slug]);

  if (!product) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
        Loading product...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-pink-600">{product.tag}</span>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">{product.category}</span>
            </div>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-violet-600 transition hover:text-violet-700">
            Back to shop
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-52 items-center justify-center rounded-[2rem] bg-slate-50 text-8xl">{product.image}</div>
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-lg font-semibold text-slate-900">Product details</p>
              <p className="mt-3 text-slate-600">{product.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-violet-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Skin benefit</p>
                <p className="mt-2 text-sm text-slate-700">{product.benefits.slice(0, 1).join(", ")}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Stock status</p>
                <p className="mt-2 text-sm text-slate-700">{product.stock > 0 ? `${product.stock} units available` : "Out of stock"}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.benefits.map((benefit) => (
                <span key={benefit} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Price</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">K{product.price}</p>
            {product.originalPrice ? <p className="mt-2 text-sm text-slate-400 line-through">K{product.originalPrice}</p> : null}
            <p className="mt-4 text-sm text-slate-500">Free delivery on orders above K200.</p>
            <button
              onClick={() => addItem(product)}
              className="mt-8 w-full rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Add to cart
            </button>
            <Link
              href="/checkout"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-slate-50"
            >
              Checkout now
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">How to use</p>
            <p className="mt-3">Apply a small amount to clean skin, morning or night, and follow with your favorite moisturizer for balanced results.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
