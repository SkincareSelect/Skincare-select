"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/app/components/cart-provider";
import { categories } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import { matchesProductSearch } from "@/app/lib/product-search";
import type { Product, ProductCategory } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";
import { ProductPrice } from "@/app/components/product-price";
import { shoeSizeSystemLabel } from "@/app/lib/shoe-size";

const arabicPerfumeFilters = [
  "Men",
  "Women",
  "Unisex",
  "Sweet",
  "Vanilla",
  "Fruity",
  "Floral",
  "Oud",
  "Woody",
  "Fresh",
  "Spicy",
  "Gourmand",
] as const;

const genderFilters: string[] = ["Men", "Women", "Unisex"];

function normalizeCategory(value: string | null): ProductCategory | "All" {
  if (!value) {
    return "All";
  }

  const match = categories.find((item) => item.label.toLowerCase() === value.trim().toLowerCase());
  if (match) {
    return match.label;
  }

  return value.trim().toLowerCase() === "fragrance" ? "Fragrances" : "All";
}

function scrollToProducts() {
  const products = document.getElementById("products");
  if (!products) {
    return;
  }

  const top = Math.max(0, products.getBoundingClientRect().top + window.scrollY - 112);
  window.scrollTo({ top, behavior: "instant" });
}

const koreanSkinConcernFilters = [
  "Dark Spots",
  "Acne & Blemishes",
  "Oily Skin",
  "Dry Skin",
  "Sensitive Skin",
  "Dull Skin",
  "Uneven Skin Tone",
  "Dehydrated Skin",
  "Large/Clogged Pores",
  "Uneven Texture",
  "Sun Protection",
  "Skin Barrier Support",
  "Anti-Ageing",
] as const;

const koreanSkinTypeFilters = ["All Skin Types", "Oily", "Dry", "Combination", "Normal", "Sensitive", "Mature"] as const;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;

    void fetchProductsFromSupabase().then((nextProducts) => {
      if (cancelled) return;
      setProducts(nextProducts.products);
      setCatalogueError(nextProducts.error);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error("SHOP PRODUCT LOAD ERROR:", error);
      setProducts([]);
      setCatalogueError("The product catalogue is temporarily unavailable. Please try again later.");
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncCategoryFromUrl = () => {
      setCategory(normalizeCategory(new URLSearchParams(window.location.search).get("category")));
      setQuery("");
      setActiveFilters([]);
    };

    syncCategoryFromUrl();
    window.addEventListener("popstate", syncCategoryFromUrl);
    return () => window.removeEventListener("popstate", syncCategoryFromUrl);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#products" || category !== "All") {
      scrollToProducts();
    }
  }, [category, products.length]);

  const selectCategory = (nextCategory: ProductCategory | "All") => {
    setCategory(nextCategory);
    setQuery("");
    setActiveFilters([]);

    const url = new URL(window.location.href);
    if (nextCategory === "All") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", nextCategory);
    }
    url.hash = "products";
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    scrollToProducts();
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = normalizeCategory(product.category);
      const matchesCategory = category === "All" || productCategory === category;
      const matchesQuery = matchesProductSearch(product, query);
      const matchesFilters =
        activeFilters.length === 0 ||
        activeFilters.every((filter) =>
          genderFilters.includes(filter)
            ? product.gender === filter
            : (koreanSkinTypeFilters as readonly string[]).includes(filter)
              ? (product.suitableFor ?? []).includes(filter)
              : (product.tags ?? []).includes(filter),
        );
      return matchesCategory && matchesQuery && matchesFilters && !product.hidden;
    });
  }, [activeFilters, category, products, query]);

  return (
    <div className="space-y-10">
      <section className="border-b border-[#e8e2d8] pb-7 sm:pb-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">Zhurie &amp; Co</p>
            <h1 className="mt-3 text-4xl text-[#111111] sm:text-5xl">The collection</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68645e]">
              Considered pieces for personal style, everyday rituals and modern living.
            </p>
            <p className="mt-4 text-xs text-[#777168]" aria-live="polite">
              {isLoading
                ? "Loading products..."
                : `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <div className="w-full max-w-md">
            <label className="mb-2 block text-xs font-medium text-[#424242]">Find a piece</label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777168]" />
              <input
                type="search"
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, brand or category"
                className="w-full border border-[#d9d3ca] bg-white px-10 py-3 text-sm text-[#111111] outline-none transition placeholder:text-[#8a867f] focus:border-[#111111]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 flex gap-2 overflow-x-auto pb-2" id="categories" aria-label="Filter by collection">
        <button
          onClick={() => selectCategory("All")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            category === "All"
              ? "border-[#111111] bg-[#111111] text-white"
              : "border-[#d9d3ca] bg-transparent text-[#424242] hover:border-[#111111] hover:text-[#111111]"
          }`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.label}
            onClick={() => selectCategory(item.label)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              category === item.label
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#d9d3ca] bg-transparent text-[#424242] hover:border-[#111111] hover:text-[#111111]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </section>

      {category === "Fragrances" ? (
        <section className="flex flex-wrap gap-2 border-y border-[#e8e2d8] py-4" id="arabic-perfume-filters">
          <span className="mr-2 self-center text-xs font-medium uppercase tracking-[0.16em] text-[#68645e]">Filter fragrances</span>
          {arabicPerfumeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#d9d3ca] bg-transparent text-[#424242] hover:border-[#111111]"
              }`}
            >
              {filter}
            </button>
          ))}
          {activeFilters.length > 0 ? (
            <button
              onClick={() => setActiveFilters([])}
              className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[#424242] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      ) : null}

      {category === "Face Care" ? (
        <section className="flex flex-wrap gap-2 border-y border-[#e8e2d8] py-4" id="korean-skincare-filters">
          <span className="mr-2 self-center text-xs font-medium uppercase tracking-[0.16em] text-[#68645e]">Skin type</span>
          {koreanSkinTypeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#d9d3ca] bg-transparent text-[#424242] hover:border-[#111111]"
              }`}
            >
              {filter}
            </button>
          ))}
          <span className="mr-2 ml-4 self-center text-xs font-medium uppercase tracking-[0.16em] text-[#68645e]">Skin concern</span>
          {koreanSkinConcernFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#d9d3ca] bg-transparent text-[#424242] hover:border-[#111111]"
              }`}
            >
              {filter}
            </button>
          ))}
          {activeFilters.length > 0 ? (
            <button
              onClick={() => setActiveFilters([])}
              className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[#424242] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      ) : null}

      <div id="products" className="scroll-mt-28 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="border-y border-[#e8e2d8] p-10 text-center text-sm text-[#68645e]" role="status">
            Loading products...
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group flex min-w-0 flex-col"
            >
              <div className="relative overflow-hidden bg-[#eeeae2]">
                <div className="aspect-[4/5]">
                  <ProductThumb product={product} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" emojiClassName="text-5xl" />
                </div>
                {product.badge ? (
                  <span className="absolute left-3 top-3 border border-white/70 bg-[#f8f6f1]/90 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-[#111111]">
                    {product.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#777168]">{product.brand ?? product.category}</p>
              <h2 className="mt-1 text-xl leading-snug text-[#111111]">{product.name}</h2>
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
              <div className="mt-4 flex items-center justify-between gap-2">
                <ProductPrice product={product} className="text-sm font-medium text-[#111111]" originalClassName="text-xs text-[#777168]" />
                <span className="text-[10px] text-[#777168]">{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="inline-flex min-h-10 items-center justify-center border border-[#d9d3ca] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#111111] transition hover:border-[#111111]"
                  >
                    View details
                  </Link>
                  {product.sizeOptions ? (
                    <Link
                      href={`/shop/${product.slug}`}
                      className="min-h-10 border border-[#111111] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#111111] transition hover:bg-[#111111] hover:text-white"
                    >
                      Choose size
                    </Link>
                  ) : (
                    <button
                      onClick={() => addItem(product)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#111111] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-[#424242] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={product.stock < 1}
                    >
                      {product.stock < 1 ? (
                        "Out of stock"
                      ) : (
                        <>
                          <ShoppingBag size={14} aria-hidden="true" />
                          Add to bag
                        </>
                      )}
                    </button>
                  )}
              </div>
            </article>
          ))
        ) : (
          <div className="border-y border-[#e8e2d8] p-10 text-center text-sm text-[#68645e]" role={catalogueError ? "alert" : undefined}>
            {catalogueError ?? "No products match your search. Try another keyword or category."}
          </div>
        )}
      </div>
    </div>
  );
}
