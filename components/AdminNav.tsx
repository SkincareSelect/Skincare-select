"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth-provider";

export default function AdminNav(){
 const path=usePathname(); const router=useRouter(); const { user, signOut } = useAuth();
 if (path === "/admin/login") return null;
 async function logout(){await signOut();router.push("/admin/login");router.refresh()}
 const linkClass = (active: boolean) => `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
   active ? "bg-[#2f241f] text-white shadow-sm" : "text-slate-600 hover:bg-[#f7f2eb] hover:text-[#2f241f]"
 }`;
 return (
  <aside className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm lg:sticky lg:top-6">
   <Link className="flex items-center gap-3 px-2 py-2" href="/">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f241f] font-serif text-lg italic text-white">ZC</span>
    <span className="font-serif text-lg font-semibold text-[#2f241f]">Zhurie <i>&amp; Co</i></span>
   </Link>
   <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Main menu</p>
   <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
    {user?.role === "admin" ? <Link className={linkClass(path==="/admin")} href="/admin">Overview</Link> : null}
    {user?.role === "admin" ? <Link className={`${linkClass(path === "/admin/beauty-finder")} bg-violet-50 text-violet-800 hover:bg-violet-100 hover:text-violet-900`} href="/admin/beauty-finder">AI Beauty Finder</Link> : null}
    {user?.role === "admin" ? <Link className={linkClass(path.includes("/admin/products"))} href="/admin/products">Products</Link> : null}
    {user?.role === "admin" ? <Link className={linkClass(path.includes("/admin/price-cuts"))} href="/admin/price-cuts">Price Cuts / Discounts</Link> : null}
    <Link className={linkClass(path.includes("/admin/orders"))} href="/admin/orders">Orders</Link>
    <Link className={linkClass(path.includes("/admin/payments"))} href="/admin/payments">Payments</Link>
   </nav>
   {user?.role === "admin" ? <div className="mt-5 border-t border-slate-100 pt-4">
    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Configuration</p>
    <nav><Link className={linkClass(path.includes("/admin/settings"))} href="/admin/settings">Store settings</Link></nav>
   </div> : null}
   <button className="mt-5 w-full rounded-xl border border-[#eadfce] px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#f7f2eb]" onClick={logout}>Log out</button>
  </aside>
 )
}
