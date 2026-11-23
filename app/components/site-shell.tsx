"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp, Menu, MessageCircle, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useAuth } from "@/app/components/auth-provider";
import { useCart } from "@/app/components/cart-provider";
import { getSettings, recordVisitAnalytics } from "@/app/lib/store-data";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Collections" },
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

  if (pathname === "/admin/beauty-finder") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] text-[#111111]">
      <div className="bg-[#111111] px-4 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-white/85 sm:text-xs">
        Thoughtfully selected for modern living · Delivery throughout Zambia
      </div>
      <header className="sticky top-0 z-50 border-b border-[#e8e2d8] bg-[#f8f6f1]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="min-w-0">
            <p className="font-serif text-lg tracking-[0.12em] text-[#111111] sm:text-xl">ZHURIE <span className="font-normal">&amp; CO</span></p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#68645e] sm:text-[10px]">A life, well curated</p>
          </Link>

          <nav className="hidden items-center gap-8 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavigation(event, link.href)}
                className={`text-sm font-medium transition ${
                  pathname === link.href ? "text-[#111111]" : "text-[#5b5853] hover:text-[#111111]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]"
            >
              <Search size={16} />
            </Link>
            <Link
              href="/account"
              aria-label={user ? "Account" : "Log in"}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111] sm:inline-flex"
            >
              <UserRound size={17} />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${itemCount} items`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] px-3 text-sm font-medium text-white transition hover:bg-[#424242] sm:px-4"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Bag</span>
              <span className="text-xs text-white/75">{itemCount}</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9d3ca] bg-transparent text-[#111111] transition hover:bg-[#eae3d8] xl:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-[#e8e2d8] bg-[#f8f6f1] xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavigation(event, link.href)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/deals" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]">
                Offers
              </Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]">
                Wishlist
              </Link>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]">
                {user ? "My account" : "Log in"}
              </Link>
              <Link href="/search" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#eae3d8] hover:text-[#111111]">
                Search
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="border border-[#e8e2d8] bg-[#f8f6f1] px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eae3d8] text-[#111111]">
              <MessageCircle size={21} fill="currentColor" />
              </div>
              <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#424242]">Need help?</p>
              <p className="mt-1 max-w-2xl text-sm text-[#68645e]">
                Contact us about a product, an order or anything else.
              </p>
              </div>
            </div>
            <div className="relative">
              <button
              type="button"
              onClick={() => setConsultancyOpen((current) => !current)}
              aria-expanded={consultancyOpen}
              aria-controls="consultancy-options"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#111111] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#424242] sm:w-auto"
              >
              <MessageCircle size={18} fill="currentColor" />
              WhatsApp help
              <ChevronUp size={16} className={`transition-transform ${consultancyOpen ? "" : "rotate-180"}`} />
              </button>
              {consultancyOpen ? (
              <div id="consultancy-options" role="dialog" aria-label="Choose a WhatsApp contact" className="absolute bottom-full right-0 mb-3 w-[min(20rem,calc(100vw-2rem))] border border-[#e8e2d8] bg-white p-3 shadow-lg">
                <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#777168]">
                  Choose a contact
                </p>
                {[
                  { label: "Product enquiries", number: store.whatsappNumber },
                  { label: "Customer care", number: store.phoneNumber },
                ].map((consultant) => {
                  const number = consultant.number.replace(/[^0-9]/g, "");
                  const href = `https://wa.me/${number}?text=${encodeURIComponent("Hi Zhurie & Co, I would like help with a product or order.")}`;

                    return (
                      <a
                        key={`${consultant.label}-${number}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setConsultancyOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#424242] transition hover:bg-[#f8f6f1] hover:text-[#111111]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eae3d8] text-[#111111]">
                          <MessageCircle size={16} fill="currentColor" />
                        </span>
                        <span>
                          <span className="block">{consultant.label}</span>
                          <span className="mt-1 block text-xs font-normal text-[#777168]">{consultant.number}</span>
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

      <footer className="mt-8 border-t border-[#383838] bg-[#111111] px-4 py-12 text-sm text-white/70 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-lg tracking-[0.12em] text-white">{store.storeName.toUpperCase()}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d6c3a5]">A life, well curated</p>
            <p className="mt-5 max-w-sm leading-7">
              A lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {[
                ["Instagram", store.socialLinks.instagram],
                ["Facebook", store.socialLinks.facebook],
                ["TikTok", store.socialLinks.tiktok],
              ].filter(([, href]) => Boolean(href)).map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white">Shop collections</p>
            <div className="mt-4 grid gap-3">
              <Link href="/about" className="transition hover:text-white">About Zhurie &amp; Co</Link>
              <Link href="/shop" className="transition hover:text-white">All collections</Link>
              <Link href="/deals" className="transition hover:text-white">Offers</Link>
              <Link href="/wishlist" className="transition hover:text-white">Wishlist</Link>
              <Link href="/#newsletter" className="transition hover:text-white">Newsletter</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white">Customer support</p>
            <div className="mt-4 grid gap-3">
              <Link href="/contact" className="transition hover:text-white">Contact information</Link>
              <Link href="/faq" className="transition hover:text-white">Delivery information</Link>
              <Link href="/returns" className="transition hover:text-white">Returns policy</Link>
              <Link href="/faq" className="transition hover:text-white">Frequently asked questions</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacy policy</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white">Your account</p>
            <div className="mt-4 grid gap-3">
              <Link href="/account" className="transition hover:text-white">{user ? "My account" : "Sign in"}</Link>
              <Link href="/cart" className="transition hover:text-white">Shopping bag</Link>
              <Link href="/checkout" className="transition hover:text-white">Secure checkout</Link>
              <a href={`mailto:${store.supportEmail || store.storeEmail}`} className="transition hover:text-white">Email us</a>
            </div>
          </div>
          <div className="border-t border-white/15 pt-5 text-xs sm:col-span-2 lg:col-span-4">
            <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
