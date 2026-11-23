"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";
import { ProductPrice } from "@/app/components/product-price";

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
    <section className="overflow-hidden border-y border-[#e8e2d8] bg-[#f8f6f1]" aria-label="Featured product slideshow">
      <div className="relative grid gap-8 py-8 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <div className="relative overflow-hidden bg-[#eae3d8]">
          <ProductThumb
            product={product}
            className="aspect-[4/3] w-full transition-all"
            emojiClassName="text-8xl"
            sizes="(max-width: 1024px) 90vw, 40vw"
          />
          {products.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous product"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center border border-[#e8e2d8] bg-[#f8f6f1]/90 p-2 text-[#111111] transition hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next product"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center border border-[#e8e2d8] bg-[#f8f6f1]/90 p-2 text-[#111111] transition hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#777168]">A closer look</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#777168]">{product.brand ?? "Zhurie & Co"} · {product.category}</p>
          <h2 className="mt-2 text-3xl text-[#111111] sm:text-4xl">{product.name}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#68645e]">{product.shortDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProductPrice product={product} className="text-xl font-medium text-[#111111]" originalClassName="text-sm text-[#777168]" />
            {product.badge ? <span className="border border-[#e8e2d8] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#424242]">{product.badge}</span> : null}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/shop/${product.slug}`} className="inline-flex min-h-11 items-center border border-[#111111] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#111111] transition hover:bg-[#111111] hover:text-white">
              Discover this piece
            </Link>
            <div className="flex items-center gap-2" role="group" aria-label="Choose featured product">
              {products.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show ${item.name}`}
                  aria-current={index === activeIndex}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[#111111]" : "w-2 bg-[#d6c3a5] hover:bg-[#777168]"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
