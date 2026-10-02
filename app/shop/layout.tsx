import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop curated beauty and skincare",
  description:
    "Shop carefully selected skincare, beauty, fragrance and personal-care products from Zhurie & Co in Zambia.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
