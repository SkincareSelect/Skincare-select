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

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    void fetchProductsFromSupabase().then((nextProducts) => {
      if (cancelled) return;
      setProducts(nextProducts.length > 0 ? nextProducts : initialProducts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const deals = useMemo(() => {
    return products
      .filter((product) => !product.hidden && product.originalPrice && product.originalPrice > product.price)
      .sort((a, b) => {
        const discountA = ((a.originalPrice ?? a.price) - a.price) / (a.originalPrice ?? a.price);
        const discountB = ((b.originalPrice ?? b.price) - b.price) / (b.originalPrice ?? b.price);
        return discountB - discountA;
      });
  }, [products]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#eadfce] bg-gradient-to-br from-[#fff5ef] to-[#f7efe7] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Deals &amp; offers</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Save on your favourite products</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Every product below is currently discounted. Deals change regularly, and we email registered customers
          whenever new discounts go live.
        </p>
        <p className="mt-4 text-sm font-medium text-slate-500">
          {deals.length > 0 ? `${deals.length} product${deals.length === 1 ? "" : "s"} on sale right now.` : ""}
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-[2rem] border border-[#eadfce] bg-white p-10 text-center text-slate-600 shadow-sm">
          No discounts are running right now — check back soon, or{" "}
          <Link href="/shop" className="font-semibold text-[#8d6e63]">
            browse the full catalogue
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {deals.map((product) => {
            const originalPrice = product.originalPrice ?? product.price;
            const percentOff = Math.round(((originalPrice - product.price) / originalPrice) * 100);

            return (
              <article key={product.id} className="flex flex-col rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-sm">
                <div className="relative flex h-40 items-center justify-center rounded-[1.5rem] bg-[#fbf7f2] text-5xl">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-[#c2410c] px-3 py-1 text-xs font-bold text-white">
                    -{percentOff}%
                  </span>
                  <ProductThumb product={product} className="h-full w-full" emojiClassName="text-5xl" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">{formatPrice(product.price)}</span>
                  <span className="text-sm text-slate-400 line-through">{formatPrice(originalPrice)}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => addItem(product)}
                    className="flex-1 rounded-full bg-[#d9b8a7] px-4 py-2 text-sm font-semibold text-[#2f241f] transition hover:bg-[#c99d89]"
                  >
                    Add to bag
                  </button>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:bg-[#f5ece2]"
                  >
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
