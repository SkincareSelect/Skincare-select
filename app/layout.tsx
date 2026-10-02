import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/app/components/auth-provider";
import { CartProvider } from "@/app/components/cart-provider";
import { SiteShell } from "@/app/components/site-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zhurieandco.shop"),
  title: "Zhurie & Co | Beauty, skincare and personal care in Zambia",
  description:
    "Premium skincare, beauty, grooming, fragrance and personal-care products for women, men and families across Zambia.",
  openGraph: {
    type: "website",
    siteName: "Zhurie & Co",
    title: "Zhurie & Co | Beauty, skincare and personal care in Zambia",
    description:
      "Discover carefully selected skincare, beauty and personal-care products for every member of the family.",
    url: "https://zhurieandco.shop/",
    locale: "en_ZM",
  },
  twitter: {
    card: "summary",
    title: "Zhurie & Co | Beauty, skincare and personal care in Zambia",
    description:
      "Discover carefully selected skincare, beauty and personal-care products for every member of the family.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <AuthProvider>
          <CartProvider>
            <SiteShell>{children}</SiteShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}