import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

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
  title: "Zhurie & Co | A Life, Well Curated",
  description:
    "A lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices.",
  icons: {
    icon: [
      { url: "/zhurie-co-avatar.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: [{ url: "/zhurie-co-avatar.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/zhurie-co-avatar.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    type: "website",
    siteName: "Zhurie & Co",
    title: "Zhurie & Co | A Life, Well Curated",
    description:
      "A lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices.",
    images: [{ url: "/zhurie-co-avatar.png", width: 512, height: 512, alt: "Zhurie & Co logo" }],
    url: "https://zhurieandco.shop/",
    locale: "en_ZM",
  },
  twitter: {
    card: "summary",
    title: "Zhurie & Co | A Life, Well Curated",
    description:
      "A lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices.",
    images: ["/zhurie-co-avatar.png"],
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