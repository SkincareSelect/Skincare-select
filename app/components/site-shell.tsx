"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/app/components/auth-provider";
import { useCart } from "@/app/components/cart-provider";
import { getSettings, recordVisitAnalytics } from "@/app/lib/store-data";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#categories", label: "Categories" },
  { href: "/shop", label: "Shop" },
  { href: "/deals", label: "Deals" },
  { href: "/#new-arrivals", label: "New Arrivals" },
  { href: "/#best-sellers", label: "Best Sellers" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [consultancyOpen, setConsultancyOpen] = useState(false);
  const store = useMemo(() => getSettings(), []);

  useEffect(() => {
    void recordVisitAnalytics();
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      if (!window.location.hash) {
        return;
      }

      const targetId = window.location.hash.slice(1);
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      window.setTimeout(() => {
        window.scrollTo({
          top: Math.max(target.getBoundingClientRect().top + window.scrollY - 112, 0),
          behavior: "smooth",
        });
      }, 100);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

  useEffect(() => {
    if (!consultancyOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConsultancyOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [consultancyOpen]);

  const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/#")) {
      setMenuOpen(false);
      return;
    }

    const target = document.getElementById(href.slice(2));
    if (!target) {
      setMenuOpen(false);
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", href);
    window.scrollTo({
      top: Math.max(target.getBoundingClientRect().top + window.scrollY - 112, 0),
      behavior: "smooth",
    });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdfb_0%,#fbf7f2_45%,#f7f1ea_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-[#eadfce] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2f241f,#8d6e63)] font-serif text-white shadow-sm">
              <span className="absolute -translate-x-1.5 -translate-y-1 text-lg font-bold italic">Z</span>
              <span className="absolute translate-x-1.5 translate-y-1 text-lg font-bold">C</span>
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold tracking-wide text-[#2f241f]">Zhurie <span className="font-normal italic text-[#8d6e63]">&amp; Co</span></p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#8d6e63]">Beauty curated by you &middot; Est. 2026</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavigation(event, link.href)}
                className={`text-sm font-medium transition ${
                  pathname === link.href ? "text-[#8d6e63]" : "text-slate-600 hover:text-[#8d6e63]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="hidden items-center gap-2 rounded-full border border-[#eadfce] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:text-[#2f241f] sm:inline-flex"
            >
              <Search size={16} />
              Search
            </Link>
            <Link
              href="/account"
              className="hidden rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:text-[#2f241f] md:inline-flex"
            >
              {user ? "Account" : "Login"}
            </Link>
            <Link
              href="/wishlist"
              className="hidden rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#d8c1b1] hover:text-[#2f241f] md:inline-flex"
            >
              Wishlist
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-[#d9b8a7] bg-[#f7e9e2] px-4 py-2 text-sm font-semibold text-[#5c4034] transition hover:border-[#c99d89] hover:bg-[#f1ddd3]"
            >
              <ShoppingBag size={16} />
              Cart
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-[#5c4034]">{itemCount}</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white text-slate-700 lg:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-[#eadfce] bg-white lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavigation(event, link.href)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#fbf7f2] hover:text-[#2f241f]"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/shop" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#fbf7f2] hover:text-[#2f241f]">
                Search
              </Link>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#fbf7f2] hover:text-[#2f241f]">
                {user ? "Account" : "Login"}
              </Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#fbf7f2] hover:text-[#2f241f]">
                Wishlist
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#eadfce] bg-white/95 px-5 py-4 shadow-lg backdrop-blur sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15 text-[#128c4a]">
              <MessageCircle size={21} fill="currentColor" />
              </div>
              <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Need help?</p>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Get personalised product advice from our beauty consultants.
              </p>
              </div>
            </div>
            <div className="relative">
              <button
              type="button"
              onClick={() => setConsultancyOpen((current) => !current)}
              aria-expanded={consultancyOpen}
              aria-controls="consultancy-options"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#128c4a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d713b] sm:w-auto"
              >
              <MessageCircle size={18} fill="currentColor" />
              WhatsApp consultancy
              <ChevronUp size={16} className={`transition-transform ${consultancyOpen ? "" : "rotate-180"}`} />
              </button>
              {consultancyOpen ? (
              <div id="consultancy-options" role="dialog" aria-label="Choose a WhatsApp consultant" className="absolute bottom-full right-0 mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[#eadfce] bg-white p-3 shadow-xl">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6e63]">
                  Choose a consultant
                </p>
                {[
                  { label: "Beauty consultant", number: store.whatsappNumber },
                  { label: "Customer care", number: store.phoneNumber },
                ].map((consultant) => {
                  const number = consultant.number.replace(/[^0-9]/g, "");
                  const href = `https://wa.me/${number}?text=${encodeURIComponent("Hi Zhurie & Co, I would like skincare consultancy advice.")}`;

                    return (
                      <a
                        key={`${consultant.label}-${number}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setConsultancyOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#f0fff6] hover:text-[#128c4a]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15 text-[#128c4a]">
                          <MessageCircle size={16} fill="currentColor" />
                        </span>
                        <span>
                          <span className="block">{consultant.label}</span>
                          <span className="mt-1 block text-xs font-normal text-slate-500">{consultant.number}</span>
                        </span>
                      </a>
                    );
                  })}
                  {![store.whatsappNumber, store.phoneNumber].some((number) => number.replace(/[^0-9]/g, "").length >= 7) ? (
                    <p className="px-3 py-2 text-sm text-rose-600">WhatsApp contact numbers are not configured yet.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#eadfce] bg-white/80 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{store.storeName} <span className="font-normal text-slate-500">&middot; Est. 2026</span></p>
            <p className="mt-2 max-w-sm">Premium skincare, beauty, grooming and family care products for Zambia.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Customer service</p>
            <div className="mt-2 grid gap-1">
              <Link href="/contact" className="hover:text-[#8d6e63]">Contact Us</Link>
              <Link href="/faq" className="hover:text-[#8d6e63]">FAQs</Link>
              <Link href="/returns" className="hover:text-[#8d6e63]">Returns Policy</Link>
              <Link href="/privacy" className="hover:text-[#8d6e63]">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Account</p>
            <div className="mt-2 grid gap-1">
              <Link href="/account" className="hover:text-[#8d6e63]">My Account</Link>
              <Link href="/cart" className="hover:text-[#8d6e63]">Cart</Link>
              <Link href="/checkout" className="hover:text-[#8d6e63]">Checkout</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
