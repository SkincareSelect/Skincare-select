"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCart } from "@/app/components/cart-provider";
import { categories, initialProducts } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import type { Product, ProductCategory } from "@/app/lib/types";
import { ProductThumb } from "@/app/components/product-thumb";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

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
  const [category, setCategory] = useState<ProductCategory | "All">(() => {
    if (typeof window === "undefined") {
      return "All";
    }
    return normalizeCategory(new URLSearchParams(window.location.search).get("category"));
  });
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    void fetchProductsFromSupabase().then((nextProducts) => {
      setProducts(nextProducts.length > 0 ? nextProducts : initialProducts);
    });
  }, []);

  const toggleFilter = (filter: string) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "All" || normalizeCategory(product.category) === category;
      const searchText = `${product.name} ${product.brand ?? ""} ${product.description} ${product.productType ?? ""}`.toLowerCase();
      const matchesQuery = searchText.includes(query.toLowerCase());
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
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Shop</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Shop</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Search by name, brand, category or product type to find the right skincare, beauty or grooming essential.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="w-full max-w-md">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search products</label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try cleanser, perfume, beard oil or baby lotion"
                className="w-full rounded-full border border-[#eadfce] bg-[#fbf7f2] px-10 py-3 text-slate-900 outline-none transition focus:border-[#8d6e63] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3" id="categories">
        <button
          onClick={() => setCategory("All")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            category === "All"
              ? "border-[#2f241f] bg-[#2f241f] text-white shadow-sm"
              : "border-[#eadfce] bg-white text-slate-700 hover:border-[#d8c1b1] hover:bg-[#fbf7f2]"
          }`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.label}
            onClick={() => setCategory(item.label)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              category === item.label
                ? "border-[#2f241f] bg-[#2f241f] text-white shadow-sm"
                : "border-[#eadfce] bg-white text-slate-700 hover:border-[#d8c1b1] hover:bg-[#fbf7f2]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </section>

      {category === "Fragrances" ? (
        <section className="flex flex-wrap gap-2 rounded-[2rem] border border-[#eadfce] bg-white p-4 shadow-sm" id="arabic-perfume-filters">
          <span className="mr-2 self-center text-sm font-semibold uppercase tracking-[0.2em] text-[#8d6e63]">Filter Arabic Perfumes</span>
          {arabicPerfumeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#2f241f] bg-[#2f241f] text-white shadow-sm"
                  : "border-[#eadfce] bg-[#fbf7f2] text-slate-700 hover:border-[#d8c1b1] hover:bg-white"
              }`}
            >
              {filter}
            </button>
          ))}
          {activeFilters.length > 0 ? (
            <button
              onClick={() => setActiveFilters([])}
              className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[#8d6e63] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      ) : null}

      {category === "Face Care" ? (
        <section className="flex flex-wrap gap-2 rounded-[2rem] border border-[#eadfce] bg-white p-4 shadow-sm" id="korean-skincare-filters">
          <span className="mr-2 self-center text-sm font-semibold uppercase tracking-[0.2em] text-[#8d6e63]">Skin type</span>
          {koreanSkinTypeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#2f241f] bg-[#2f241f] text-white shadow-sm"
                  : "border-[#eadfce] bg-[#fbf7f2] text-slate-700 hover:border-[#d8c1b1] hover:bg-white"
              }`}
            >
              {filter}
            </button>
          ))}
          <span className="mr-2 ml-4 self-center text-sm font-semibold uppercase tracking-[0.2em] text-[#8d6e63]">Skin concern</span>
          {koreanSkinConcernFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? "border-[#2f241f] bg-[#2f241f] text-white shadow-sm"
                  : "border-[#eadfce] bg-[#fbf7f2] text-slate-700 hover:border-[#d8c1b1] hover:bg-white"
              }`}
            >
              {filter}
            </button>
          ))}
          {activeFilters.length > 0 ? (
            <button
              onClick={() => setActiveFilters([])}
              className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[#8d6e63] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      ) : null}

      <div id="products" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#d8c1b1] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#fbf7f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#8d6e63]">
                  {product.badge ?? product.productType ?? "Select"}
                </span>
                <span className="text-sm font-medium text-slate-500">{product.category}</span>
              </div>
              <div className="mt-6 flex h-24 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#fff5ef,#f7efe7)] text-5xl">
                <ProductThumb product={product} className="h-full w-full" emojiClassName="text-5xl" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{product.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                {product.benefits.slice(0, 2).map((benefit) => (
                  <span key={benefit} className="rounded-full bg-[#fbf7f2] px-3 py-1">
                    {benefit}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{product.rating ? `${product.rating.toFixed(1)} ★` : "New"}</span>
                <span>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</p>
                  {product.originalPrice ? <p className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:bg-[#f5ece2]"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => addItem(product)}
                    className="rounded-full bg-[#d9b8a7] px-4 py-2 text-sm font-medium text-[#2f241f] transition hover:bg-[#c99d89]"
                    disabled={product.stock < 1}
                  >
                    {product.stock < 1 ? "Out of stock" : "Add to bag"}
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-[#eadfce] bg-white p-10 text-center text-slate-600 shadow-sm">
            No products match your search. Try another keyword or category.
          </div>
        )}
      </div>
    </div>
  );
}
