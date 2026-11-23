import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/app/lib/store-data";
import { fetchFeaturedCampaignPosts, fetchProductsFromSupabase } from "@/app/lib/supabase/data-server";
import { fetchCampaignFromSupabase } from "@/app/lib/supabase/data-server";
import { ProductSection } from "@/app/components/product-section";
import { ProductCarousel } from "@/app/components/product-carousel";
import { ProductThumb } from "@/app/components/product-thumb";
import { ProductPrice } from "@/app/components/product-price";
import { FeaturedCampaign } from "@/app/components/featured-campaign";
import { SectionLink } from "@/app/components/section-link";
import { NewsletterSignup } from "@/app/components/newsletter-signup";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { products: catalogue, error: catalogueError } = await fetchProductsFromSupabase();
  const featuredPosts = await fetchFeaturedCampaignPosts();
  const legacyCampaign = featuredPosts === null ? await fetchCampaignFromSupabase() : null;
  const campaignPosts =
    featuredPosts ??
    (legacyCampaign
      ? [
          {
            id: "legacy-featured-campaign",
            eyebrow: legacyCampaign.campaignEyebrow,
            type: legacyCampaign.campaignType,
            active: legacyCampaign.campaignActive,
            title: legacyCampaign.campaignTitle,
            description: legacyCampaign.campaignDescription,
            visual: legacyCampaign.campaignVisual,
            imageUrl: legacyCampaign.campaignImageUrl ?? "",
            footer: legacyCampaign.campaignFooter,
            offer: legacyCampaign.campaignOffer,
            link: "",
            position: 0,
          },
        ]
      : []);
  const featuredProducts = catalogue.filter((product) => product.featured).slice(0, 6);
  const newArrivals = catalogue.filter((product) => product.newArrival).slice(0, 4);
  const bestSellers = catalogue.filter((product) => product.bestSeller).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden bg-[#424242] sm:min-h-[40rem] lg:min-h-[42rem]">
        <Image
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2400&q=85"
          alt="A calm, thoughtfully furnished modern living space"
          fill
          priority
          unoptimized
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="absolute inset-0 -z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111111]/80 via-[#111111]/48 to-[#111111]/5" />
        <div className="max-w-3xl px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16 lg:py-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/80 sm:text-xs">
            Zhurie &amp; Co · Beauty curated by you
          </p>
          <h1 className="mt-6 max-w-2xl text-5xl leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            The Art of
            <br />
            <em className="font-normal">Living Well.</em>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            Thoughtfully selected. Beautifully presented. Made for modern living.
          </p>
          <Link
            href="/shop"
            className="mt-9 inline-flex min-h-12 items-center justify-center border border-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-[#111111]"
          >
            Explore the collection
          </Link>
        </div>
        <span className="absolute bottom-8 right-8 hidden text-[10px] uppercase tracking-[0.2em] text-white/75 sm:block">
          Considered living · Est. 2026
        </span>
      </section>

      {catalogueError ? (
        <p className="border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900" role="alert">
          {catalogueError}
        </p>
      ) : null}

      <section className="space-y-7" id="categories">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">The collection</p>
            <h2 className="mt-3 text-3xl text-[#111111] sm:text-4xl">Discover your own way of living</h2>
          </div>
          <Link href="/shop" className="text-sm text-[#424242] underline decoration-[#d6c3a5] underline-offset-4 transition hover:text-[#111111]">
            View all collections
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={`/shop?category=${encodeURIComponent(category.label)}#products`}
              className="group relative isolate aspect-[4/5] overflow-hidden bg-[#eae3d8]"
            >
              <Image
                src={category.image}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw"
                className="absolute inset-0 -z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#111111]/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
                <h3 className="text-lg leading-tight sm:text-2xl">{category.label}</h3>
                <span className="mt-2 inline-block text-[9px] uppercase tracking-[0.18em] text-white/80 sm:text-[10px]">
                  Explore collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {campaignPosts.length > 0 ? (
        <section aria-label="Featured collection">
          <FeaturedCampaign campaigns={campaignPosts} />
        </section>
      ) : null}

      <section id="featured">
        <ProductCarousel products={catalogue.slice(0, 6)} />
      </section>

      <section id="featured-products">
        <ProductSection
          products={featuredProducts}
          title="A considered selection"
          subtitle="Thoughtful finds for everyday living."
        />
      </section>

      {newArrivals.length > 0 ? (
        <section id="new-arrivals" className="space-y-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">Just arrived</p>
              <h2 className="mt-3 text-3xl text-[#111111] sm:text-4xl">New to the collection</h2>
            </div>
            <SectionLink href="/shop" className="text-sm text-[#424242] underline decoration-[#d6c3a5] underline-offset-4 hover:text-[#111111]">
              Discover more
            </SectionLink>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <article key={product.id} className="group min-w-0">
                <Link href={`/shop/${product.slug}`} className="block overflow-hidden bg-white">
                  <div className="aspect-[4/5] bg-[#eeeae2]">
                    <ProductThumb product={product} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" />
                  </div>
                </Link>
                <div className="pt-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#777168]">{product.brand ?? product.category}</p>
                  <h3 className="mt-1 text-lg leading-snug text-[#111111]">
                    <Link href={`/shop/${product.slug}`} className="transition hover:text-[#68645e]">{product.name}</Link>
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <ProductPrice product={product} className="text-sm font-medium text-[#111111]" originalClassName="text-xs text-[#777168]" />
                    <Link href={`/shop/${product.slug}`} className="text-xs text-[#424242] underline decoration-[#d6c3a5] underline-offset-4">Discover</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {bestSellers.length > 0 ? (
        <section id="best-sellers" className="space-y-7">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">Loved by you</p>
            <h2 className="mt-3 text-3xl text-[#111111] sm:text-4xl">The enduring favourites</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <article key={product.id} className="group min-w-0">
                <Link href={`/shop/${product.slug}`} className="block overflow-hidden bg-white">
                  <div className="aspect-[4/5] bg-[#eeeae2]">
                    <ProductThumb product={product} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" />
                  </div>
                </Link>
                <div className="pt-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#777168]">{product.brand ?? product.category}</p>
                  <h3 className="mt-1 text-lg leading-snug text-[#111111]">
                    <Link href={`/shop/${product.slug}`} className="transition hover:text-[#68645e]">{product.name}</Link>
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <ProductPrice product={product} className="text-sm font-medium text-[#111111]" originalClassName="text-xs text-[#777168]" />
                    <Link href={`/shop/${product.slug}`} className="text-xs text-[#424242] underline decoration-[#d6c3a5] underline-offset-4">Discover</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 border-y border-[#e1dbd1] py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16" id="about">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#777168]">Our point of view</p>
          <h2 className="mt-4 max-w-md text-4xl leading-tight text-[#111111] sm:text-5xl">A life, well curated.</h2>
          <Link href="/about" className="mt-7 inline-flex border-b border-[#d6c3a5] pb-1 text-xs uppercase tracking-[0.16em] text-[#111111] transition hover:border-[#111111]">
            About Zhurie &amp; Co
          </Link>
        </div>
        <div className="max-w-2xl space-y-4 text-sm leading-7 text-[#55514b] sm:text-base sm:leading-8">
          <p className="font-serif text-xl leading-8 text-[#111111] sm:text-2xl sm:leading-9">
            At Zhurie &amp; Co, we believe that the art of living well lies in the details.
          </p>
          <p>
            We are a lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices. Our collections bring together carefully selected pieces that complement modern living, offering a considered balance of style, quality and everyday sophistication.
          </p>
          <p>We believe that the things we choose should reflect who we are and how we wish to live.</p>
          <p className="font-serif text-xl leading-8 text-[#111111] sm:text-2xl sm:leading-9">
            Every detail matters. Every choice tells a story.
          </p>
          <p className="pt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#777168]">ZHURIE &amp; CO — A LIFE, WELL CURATED.</p>
        </div>
      </section>

      <section className="grid gap-8 bg-[#111111] px-6 py-10 text-white sm:px-10 sm:py-12 lg:grid-cols-2 lg:items-center" id="newsletter">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#d6c3a5]">A note from us</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Considered things, occasionally.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
            Discover new collections, thoughtful finds and stories for modern living.
          </p>
        </div>
        <NewsletterSignup />
      </section>
    </div>
  );
}
