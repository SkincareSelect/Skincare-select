import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | Zhurie & Co",
  description:
    "Explore carefully selected pieces for modern living, from personal care and fragrance to apparel and footwear.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
