"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

export function ProductCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (products.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) {
    return null;
  }

  const product = products[activeIndex % products.length];

  const goTo = (index: number) => {
    setActiveIndex(((index % products.length) + products.length) % products.length);
  };

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-[#eadfce] bg-white shadow-sm" aria-label="Featured product slideshow">
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:p-10">
        <div className="relative">
          <ProductThumb
            product={product}
            className="min-h-64 rounded-[2rem] bg-[radial-gradient(circle_at_top,_#f7ece5,_#fff_70%)] transition-all"
            emojiClassName="text-8xl"
            sizes="(max-width: 1024px) 90vw, 40vw"
          />
          {products.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous product"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfce] bg-white/90 p-2 text-[#2f241f] shadow-sm transition hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next product"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfce] bg-white/90 p-2 text-[#2f241f] shadow-sm transition hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Discover your next favourite</p>
          <p className="mt-4 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"} · {product.category}</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h2>
          <p className="mt-3 max-w-xl leading-7 text-slate-600">{product.shortDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</span>
            {product.badge ? <span className="rounded-full bg-[#f7e9e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#5c4034]">{product.badge}</span> : null}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/shop/${product.slug}`} className="rounded-full bg-[#d9b8a7] px-5 py-3 text-sm font-semibold text-[#2f241f] transition hover:bg-[#c99d89]">
              View product
            </Link>
            <div className="flex items-center gap-2" role="group" aria-label="Choose featured product">
              {products.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show ${item.name}`}
                  aria-current={index === activeIndex}
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[#8d6e63]" : "w-2.5 bg-[#d9b8a7] hover:bg-[#c99d89]"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
