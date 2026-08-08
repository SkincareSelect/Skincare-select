"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/components/auth-provider";
import { useCart } from "@/app/components/cart-provider";
import { initialSettings, recordVisitAnalytics } from "@/app/lib/store-data";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/referrals", label: "Referrals" },
  { href: "/checkout", label: "Checkout" },
  { href: "/admin", label: "Admin" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    void recordVisitAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fdf2f8,_#f8fafc_55%,_#eef2ff)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-lg font-semibold text-white">
              L
            </div>
            <div>
              <p className="text-lg font-semibold">Lueur & Co</p>
              <p className="text-sm text-slate-500">Modern care, delivered</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${pathname === link.href ? "text-violet-700" : "text-slate-600 hover:text-violet-700"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Cart
              <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">{itemCount}</span>
            </Link>
            {user ? (
              <button onClick={signOut} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Sign out
              </button>
            ) : (
              <Link href="/account" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white">
                Account
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <div className="sticky bottom-0 z-40 mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-violet-100 bg-white/95 px-6 py-5 shadow-lg backdrop-blur transition hover:shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Consultancy</p>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Need expert skin or grooming advice? Chat with our consultant on WhatsApp anytime.
              </p>
            </div>
            <a
              href={`https://wa.me/${initialSettings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Lueur & Co, I would like consultation on skincare.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white/80 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Lueur & Co. Crafted for modern wellness routines.</p>
          <div className="flex gap-4">
            <Link href="/shop" className="hover:text-violet-700">Shop</Link>
            <Link href="/referrals" className="hover:text-violet-700">Referrals</Link>
            <Link href="/account" className="hover:text-violet-700">Account</Link>
            <Link href="/admin" className="hover:text-violet-700">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
