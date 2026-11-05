"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import { matchesProductSearch } from "@/app/lib/product-search";
import type { Product } from "@/app/lib/types";
import { ProductPrice } from "@/app/components/product-price";

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchProductsFromSupabase().then((result) => {
      if (cancelled) return;
      setProducts(result.products);
      setCatalogueError(result.error);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error("SEARCH PRODUCT LOAD ERROR:", error);
      setProducts([]);
      setCatalogueError("The product catalogue is temporarily unavailable. Please try again later.");
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    return products.filter((product) => matchesProductSearch(product, query));
  }, [products, query]);

  return (
    <div className="space-y-6 rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Search</p>
      <h1 className="text-3xl font-semibold text-slate-900">Find a product</h1>
      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Search products"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cleanser, perfume, beard oil, baby lotion..."
          className="w-full rounded-full border border-[#eadfce] bg-[#fbf7f2] px-10 py-3 outline-none focus:border-[#8d6e63] focus:bg-white"
        />
      </div>
      {catalogueError ? <p className="text-sm text-amber-800" role="alert">{catalogueError}</p> : null}
      {!catalogueError && !isLoading ? (
        <p className="text-sm text-slate-500" aria-live="polite">
          {results.length} product{results.length === 1 ? "" : "s"} found.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((product) => (
          <Link href={`/shop/${product.slug}`} key={product.id} className="rounded-[1.5rem] bg-[#fbf7f2] p-4">
            <p className="text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
            <p className="mt-1 font-semibold text-slate-900">{product.name}</p>
            <p className="mt-1 text-sm text-slate-600">{product.category}</p>
            <ProductPrice product={product} className="mt-2 font-semibold text-slate-900" showSavings />
          </Link>
        ))}
      </div>
      {isLoading && !catalogueError ? (
        <p className="text-sm text-slate-600" role="status">Loading products...</p>
      ) : null}
      {!isLoading && !catalogueError && results.length === 0 ? (
        <p className="text-sm text-slate-600">No matching products found.</p>
      ) : null}
    </div>
  );
}
