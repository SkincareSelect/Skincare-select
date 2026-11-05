"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductPrice } from "@/app/components/product-price";
import { ProductThumb } from "@/app/components/product-thumb";
import { recommendBeautyProducts, type BeautyRecommendation } from "@/app/lib/beauty-recommendations";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";
import type { Product } from "@/app/lib/types";

const exampleDescriptions = [
  "I have dry, dull skin and want more hydration",
  "I need something for oily skin and blemishes",
  "I am looking for a warm vanilla perfume",
];

export function BeautyFinder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState<BeautyRecommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetchProductsFromSupabase()
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
        setCatalogueError(result.error);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("BEAUTY FINDER CATALOGUE ERROR:", error);
        setCatalogueError("The product catalogue could not be loaded. Please try again later.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const findProducts = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = description.trim();
    if (!query) {
      setValidationMessage("Describe what you are looking for so we can match products for you.");
      setRecommendations(null);
      return;
    }

    setValidationMessage("");
    setRecommendations(recommendBeautyProducts(query, products));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-10">
        <div className="flex items-center gap-3 text-[#8d6e63]">
          <Sparkles size={20} aria-hidden="true" />
          <p className="text-sm font-semibold uppercase tracking-[0.3em]">Zhurie &amp; Co</p>
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">AI Beauty Finder</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Tell us what you need, what you like, or what you want help with. We’ll match your description to available products in our catalogue.
        </p>

        <form onSubmit={findProducts} className="mt-7 space-y-4">
          <label htmlFor="beauty-description" className="block text-sm font-medium text-slate-700">
            What are you looking for?
          </label>
          <textarea
            id="beauty-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setValidationMessage("");
            }}
            maxLength={500}
            rows={4}
            placeholder="For example: I have sensitive, dry skin and want a gentle product that keeps it hydrated."
            className="w-full rounded-2xl border border-[#eadfce] px-4 py-3 leading-6 outline-none focus:border-[#8d6e63]"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">{description.length}/500 characters</p>
            <button
              type="submit"
              disabled={loading || Boolean(catalogueError)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f241f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1713] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={16} aria-hidden="true" />
              Find my products
            </button>
          </div>
          {validationMessage ? <p className="text-sm text-rose-700" role="alert">{validationMessage}</p> : null}
        </form>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Try an example</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {exampleDescriptions.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setDescription(example);
                  setValidationMessage("");
                  setRecommendations(null);
                }}
                className="rounded-full border border-[#eadfce] bg-[#fbf7f2] px-3 py-2 text-left text-xs text-slate-700 transition hover:border-[#d8c1b1]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      {catalogueError ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900" role="alert">{catalogueError}</p>
      ) : null}
      {loading ? <p className="text-sm text-slate-600" role="status">Loading available products...</p> : null}

      {recommendations ? (
        <section className="space-y-5" aria-live="polite">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Your matches</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {recommendations.length > 0 ? "Products selected for your needs" : "No close matches found"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {recommendations.length > 0
                ? "Recommendations are matched against product names, details, benefits, and catalogue tags."
                : "Try describing a concern, product type, ingredient, scent, or benefit in a different way."}
            </p>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map(({ product, reasons }) => (
                <article key={product.id} className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-white p-5 shadow-sm">
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-[#fbf7f2]">
                    <ProductThumb product={product} className="h-full w-full" emojiClassName="text-5xl" />
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#8d6e63]">{product.category}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{product.shortDescription || product.description}</p>
                  {reasons.length > 0 ? (
                    <p className="mt-3 rounded-xl bg-[#fbf7f2] px-3 py-2 text-xs text-slate-700">
                      Matched: {reasons.join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <ProductPrice product={product} className="font-semibold text-slate-900" showSavings />
                    <Link
                      href={`/shop/${product.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#eadfce] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#fbf7f2]"
                    >
                      View product <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
