import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-server";
import { ProductDetails } from "./product-details";

const getCatalogue = cache(fetchProductsFromSupabase);

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  const result = await getCatalogue();
  return {
    ...result,
    product: result.products.find((item) => item.slug === slug && !item.hidden),
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product, error } = await getProduct(slug);

  if (error || !product) {
    return { title: "Product not found | Zhurie & Co", robots: { index: false, follow: false } };
  }

  const description = product.shortDescription || product.description;
  const image = product.image.startsWith("http") || product.image.startsWith("/")
    ? product.image
    : undefined;

  return {
    title: `${product.name} | Zhurie & Co`,
    description,
    alternates: { canonical: `/shop/${encodeURIComponent(product.slug)}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Zhurie & Co`,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${product.name} | Zhurie & Co`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { products: catalogue, error, product } = await getProduct(slug);
  if (error) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900" role="alert">
        {error}
      </p>
    );
  }
  if (!product) notFound();

  const productUrl = `https://zhurieandco.shop/shop/${encodeURIComponent(product.slug)}`;
  const image = product.image.startsWith("http")
    ? product.image
    : product.image.startsWith("/")
      ? `https://zhurieandco.shop${product.image}`
      : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: image ? [image] : undefined,
    brand: { "@type": "Brand", name: product.brand || "Zhurie & Co" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "ZMW",
      price: product.price.toFixed(2),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetails product={product} catalogue={catalogue} />
    </>
  );
}
