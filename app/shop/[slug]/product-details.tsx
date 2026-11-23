"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/components/cart-provider";
import type { Product } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";
import { ProductReviews } from "@/app/components/product-reviews";
import { ProductPrice } from "@/app/components/product-price";
import { formatShoeSize, shoeSizeSystemLabel } from "@/app/lib/shoe-size";

export function ProductDetails({
  product,
  catalogue,
}: {
  product: Product;
  catalogue: Product[];
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("");
  const sizeOptions = product.sizeOptions;
  const selectedSystem = sizeOptions?.type === "footwear" ? sizeOptions.system : undefined;
  const addAndCheckout = () => {
    if (sizeOptions && !selectedSize) return;
    addItem(product, sizeOptions ? selectedSize : undefined, selectedSystem);
    router.push("/checkout");
  };

  const relatedProducts = useMemo(() => {
    return catalogue
      .filter((item) => !item.hidden && item.category === product.category && item.slug !== product.slug)
      .slice(0, 4);
  }, [catalogue, product]);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#e8e2d8] pb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777168]">
              {product.badge ?? product.productType ?? "Select"}
            </span>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-3xl text-[#111111] sm:text-4xl">{product.name}</h1>
              <span className="border border-[#e8e2d8] px-3 py-1.5 text-xs text-[#424242]">
                {product.category}
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#777168]">{product.brand ?? "Zhurie & Co"}</p>
          </div>
          <Link href="/shop" className="text-xs uppercase tracking-[0.12em] text-[#424242] transition hover:text-[#111111]">
            Back to shop
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="bg-white">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#eae3d8] text-8xl">
            <ProductThumb product={product} className="h-full w-full" emojiClassName="text-8xl" sizes="(max-width: 1024px) 90vw, 45vw" />
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-xl text-[#111111]">Product details</p>
              <p className="mt-3 text-sm leading-7 text-[#68645e]">{product.description}</p>
            </div>
            <div className="grid gap-4">
              <div className="border-y border-[#e8e2d8] py-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#777168]">Stock status</p>
                <p className="mt-2 text-sm text-[#424242]">{product.stock > 0 ? `${product.stock} units available` : "Out of stock"}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.benefits.map((benefit) => (
                <span key={benefit} className="border border-[#e8e2d8] bg-white px-4 py-3 text-sm text-[#424242]">
                  {benefit}
                </span>
              ))}
            </div>
            {product.ingredients ? (
              <div className="bg-[#f8f6f1] p-5">
                <p className="font-medium text-[#111111]">Ingredients</p>
                <p className="mt-2 text-sm leading-6 text-[#68645e]">{product.ingredients.join(", ")}</p>
              </div>
            ) : null}
            {product.instructions ? (
              <div className="bg-[#f8f6f1] p-5">
                <p className="font-medium text-[#111111]">How to use</p>
                <p className="mt-2 text-sm leading-6 text-[#68645e]">{product.instructions}</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="border border-[#e8e2d8] bg-white p-6 sm:p-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777168]">Price</p>
            <ProductPrice product={product} className="mt-3 text-3xl text-[#111111]" originalClassName="text-sm text-[#777168]" />
            <p className="mt-4 text-sm leading-6 text-[#68645e]">Secure checkout with Zambia-friendly payment methods.</p>
            {sizeOptions ? (
              <div className="mt-5">
                <label htmlFor="product-size" className="mb-2 block text-sm font-semibold text-slate-700">
                  {sizeOptions.type === "footwear"
                    ? `Shoe size (${shoeSizeSystemLabel(sizeOptions.system) ?? "system not set"})`
                    : "Apparel size"}
                </label>
                <select
                  id="product-size"
                  value={selectedSize}
                  onChange={(event) => setSelectedSize(event.target.value)}
                  className="w-full border border-[#d9d3ca] bg-white px-4 py-3 text-sm"
                  required
                >
                  <option value="">Choose a size</option>
                  {sizeOptions.available.map((size) => (
                    <option key={size} value={size}>
                      {sizeOptions.type === "footwear" ? formatShoeSize(size, sizeOptions.system) : size}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[#777168]">Only sizes currently marked available can be selected.</p>
              </div>
            ) : null}
            <button
              onClick={() => addItem(product, sizeOptions ? selectedSize : undefined, selectedSystem)}
              disabled={product.stock < 1 || (Boolean(sizeOptions) && !selectedSize)}
              className="mt-8 min-h-12 w-full bg-[#111111] px-4 py-3 text-xs font-medium uppercase tracking-[0.13em] text-white transition hover:bg-[#424242] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {product.stock < 1 ? "Out of stock" : sizeOptions && !selectedSize ? "Choose a size" : "Add to bag"}
            </button>
            {product.stock > 0 ? (
              <button
                type="button"
                onClick={addAndCheckout}
                disabled={Boolean(sizeOptions) && !selectedSize}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center border border-[#d9d3ca] bg-white px-4 py-3 text-xs font-medium uppercase tracking-[0.13em] text-[#111111] transition hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Buy now
              </button>
            ) : null}
          </div>

          <div className="border border-[#e8e2d8] bg-white p-6">
            <p className="text-lg text-[#111111]">Product information</p>
            <div className="mt-4 grid gap-3 text-sm text-[#68645e]">
              {product.size ? <p>Size: {product.size}</p> : null}
              {sizeOptions ? (
                <p>
                  Available{" "}
                  {sizeOptions.type === "footwear"
                    ? `shoe sizes (${shoeSizeSystemLabel(sizeOptions.system) ?? "system not set"})`
                    : "apparel sizes"}
                  : {sizeOptions.available.join(", ")}
                </p>
              ) : null}
              {product.weight ? <p>Weight: {product.weight}</p> : null}
              {product.suitableFor ? <p>Suitable for: {product.suitableFor.join(", ")}</p> : null}
              {product.sku ? <p>SKU: {product.sku}</p> : null}
            </div>
          </div>
        </aside>
      </div>

      <ProductReviews productId={product.id} />

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777168]">More to discover</p>
            <h2 className="mt-3 text-3xl text-[#111111]">You may also like</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <article key={item.id} className="group min-w-0">
                <div className="aspect-[4/5] overflow-hidden bg-[#eae3d8]">
                  <ProductThumb product={item} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" emojiClassName="text-4xl" />
                </div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#777168]">{item.brand ?? item.category}</p>
                <h3 className="mt-1 text-lg text-[#111111]">{item.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <ProductPrice product={item} className="text-sm font-medium text-[#111111]" originalClassName="text-xs text-[#777168]" />
                  <Link href={`/shop/${item.slug}`} className="text-xs text-[#424242] underline decoration-[#d6c3a5] underline-offset-4">
                    Discover
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
