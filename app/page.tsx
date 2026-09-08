import Image from "next/image";
import Link from "next/link";
import { categories, initialProducts } from "@/app/lib/store-data";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-server";
import { fetchCampaignFromSupabase } from "@/app/lib/supabase/data-server";
import { ProductSection } from "@/app/components/product-section";
import { ProductCarousel } from "@/app/components/product-carousel";
import { ProductThumb } from "@/app/components/product-thumb";
import { FeaturedCampaign } from "@/app/components/featured-campaign";
import { SectionLink } from "@/app/components/section-link";

export default async function HomePage() {
  const products = await fetchProductsFromSupabase();
  const campaign = await fetchCampaignFromSupabase();
  const catalogue = products.length > 0 ? products : initialProducts;
  const featuredProducts = catalogue.filter((product) => product.featured).slice(0, 6);
  const newArrivals = catalogue.filter((product) => product.newArrival).slice(0, 4);
  const bestSellers = catalogue.filter((product) => product.bestSeller).slice(0, 4);

  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-[2.5rem] border border-[#eadfce] bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#8d6e63]">Zhurie &amp; Co</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              YOUR SKIN. YOUR BEAUTY. YOUR SELECT.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Discover carefully selected skincare, beauty and personal-care products for every member of the family.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full border border-[#eadfce] bg-[#fbf7f2] px-6 py-3 text-sm font-semibold text-[#2f241f] shadow-sm transition hover:border-[#d8c1b1] hover:bg-[#f5ece2]">
                SHOP NOW
              </Link>
              <SectionLink href="/#categories" className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d8c1b1] hover:text-[#2f241f]">
                EXPLORE COLLECTION
              </SectionLink>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Carefully selected", "Products chosen for quality and trust."],
                ["Secure shopping", "Simple checkout with local payment options."],
                ["Zambia delivery", "Lusaka and countrywide deliveries are available for a fee. Charges vary by destination."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[1.5rem] border border-[#eadfce] bg-[#fbf7f2] p-4">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.25rem] bg-[radial-gradient(circle_at_top,_#f7ece5,_#fff_70%)] p-6 sm:p-8">
            <FeaturedCampaign initialCampaign={campaign} />
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 space-y-6" id="categories">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Shop by category</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Browse the full beauty collection</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={`/shop?category=${encodeURIComponent(category.label)}#products`}
              className="group rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#d8c1b1] hover:shadow-md"
            >
              <div className="relative h-32 overflow-hidden rounded-[1.5rem]">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  unoptimized
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-900">{category.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700 group-hover:bg-[#f5ece2]">
                Shop category
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="featured">
        <ProductCarousel products={catalogue.slice(0, 6)} />
      </section>

      <section id="featured-products">
        <ProductSection
          products={featuredProducts}
          title="Featured products"
          subtitle="Premium favourites for skin, hair, body and grooming."
        />
      </section>

      <section id="new-arrivals" className="scroll-mt-28 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">New arrivals</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Recently added products</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {newArrivals.map((product) => (
            <article key={product.id} className="rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-sm">
              <div className="flex h-24 items-center justify-center rounded-[1.5rem] bg-[#fbf7f2] text-4xl">
                <ProductThumb product={product} className="h-full w-full" emojiClassName="text-4xl" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">K{product.price.toFixed(2)}</span>
                <Link href={`/shop/${product.slug}`} className="text-sm font-medium text-[#8d6e63]">
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="best-sellers" className="scroll-mt-28 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Best sellers</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Most loved products</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {bestSellers.map((product) => (
            <article key={product.id} className="rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-sm">
              <div className="flex h-24 items-center justify-center rounded-[1.5rem] bg-[#fbf7f2] text-4xl">
                <ProductThumb product={product} className="h-full w-full" emojiClassName="text-4xl" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{product.brand ?? "Zhurie & Co"}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">K{product.price.toFixed(2)}</span>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Top pick</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-[2.5rem] border border-[#eadfce] bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Why shop with us</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">A better way to shop beauty online</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Carefully selected products",
              "Quality products",
              "Convenient shopping",
              "Secure payments",
              "Reliable delivery",
              "Customer support",
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] bg-[#fbf7f2] p-4 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#f7ece5,#fff)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Limited-time offer</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">New customer welcome savings</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Launch promotions, seasonal discounts and product launches can be swapped in from the admin dashboard later.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-[#2f241f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1713]"
          >
            Browse offers
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Customer reviews</p>
          <div className="mt-5 space-y-4">
            {[
              ["A very polished store and the products arrived quickly.", "M. Phiri"],
              ["I love how simple the checkout is on mobile.", "N. Banda"],
              ["The selection feels premium and trustworthy.", "K. Mulenga"],
            ].map(([quote, name]) => (
              <div key={name} className="rounded-[1.5rem] bg-[#fbf7f2] p-4">
                <p className="text-sm leading-6 text-slate-700">“{quote}”</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Newsletter</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Get promotions and beauty tips</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Subscribe for new arrivals, special offers and self-care inspiration.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-3 text-sm outline-none transition focus:border-[#8d6e63] focus:bg-white"
            />
            <button className="rounded-full bg-[#2f241f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1713]">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
