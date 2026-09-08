"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/components/auth-provider";

export default function AdminNav(){
 const path=usePathname(); const router=useRouter(); const { user } = useAuth();
 if (path === "/admin/login") return null;
 async function logout(){await createClient().auth.signOut();router.push("/admin/login");router.refresh()}
 return <aside className="sidebar"><Link className="brand" href="/"><span className="brandmark" style={{fontFamily:"Georgia, serif",fontStyle:"italic"}}>Z<span style={{fontStyle:"normal",marginLeft:-2}}>C</span></span><b style={{fontFamily:"Georgia, serif"}}>Zhurie <i>&amp; Co</i></b></Link><p className="eyebrow" style={{marginTop:32}}>MAIN MENU</p><nav>
  {user?.role === "admin" ? <Link className={path==="/admin"?"active":""} href="/admin">Overview</Link> : null}
  {user?.role === "admin" ? <Link className={path.includes("/admin/products")?"active":""} href="/admin/products">Products</Link> : null}
  <Link className={path.includes("/admin/orders")?"active":""} href="/admin/orders">Orders</Link>
  <Link className={path.includes("/admin/payments")?"active":""} href="/admin/payments">Payments</Link>
 </nav>{user?.role === "admin" ? <><p className="eyebrow" style={{marginTop:28}}>CONFIGURATION</p><nav>
  <Link className={path.includes("/admin/settings")?"active":""} href="/admin/settings">Store settings</Link>
 </nav></> : null}<button className="btn btn-secondary" style={{marginTop:30,width:"100%"}} onClick={logout}>Log out</button></aside>
}
