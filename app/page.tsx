import Link from "next/link";
import { categories } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-server";
import { ProductSection } from "@/app/components/product-section";

export default async function HomePage() {
  const products = await fetchProductsFromSupabase();
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Lueur & Co</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Beautiful essentials for your healthiest skin yet.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              From glow-boosting serums to body care and grooming staples, discover products that are easy to love and simple to shop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700">
                Shop now
              </Link>
              <Link href="/account" className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                Create account
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Clean formulas</p>
                <p className="mt-2 text-slate-600">Gentle ingredients for every skin type.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Free delivery</p>
                <p className="mt-2 text-slate-600">Orders above K200 ship at no extra cost.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Expert care</p>
                <p className="mt-2 text-slate-600">Products designed to support your daily routine.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top,_#f5e8ff,_#fff_65%)] p-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">This week</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Glow bundle</h2>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">New</div>
              </div>
              <div className="mt-6 flex items-center justify-center rounded-[1.5rem] bg-slate-50 py-10 text-7xl">🧴</div>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                <span>Free delivery on orders above K200</span>
                <span className="font-semibold text-slate-900">K120</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Discover</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Shop by category</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <div key={category.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md">
              <p className="text-lg font-semibold text-slate-900">{category.label}</p>
              <p className="mt-2 text-sm text-slate-600">{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductSection products={featuredProducts} />
    </div>
  );
}
