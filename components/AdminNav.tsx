"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminNav(){
 const path=usePathname(); const router=useRouter();
 if (path === "/admin/login") return null;
 async function logout(){await createClient().auth.signOut();router.push("/admin/login");router.refresh()}
 return <aside className="sidebar"><Link className="brand" href="/"><span className="brandmark" style={{fontFamily:"Georgia, serif",fontStyle:"italic"}}>Z<span style={{fontStyle:"normal",marginLeft:-2}}>C</span></span><b style={{fontFamily:"Georgia, serif"}}>Zhurie <i>&amp; Co</i></b></Link><nav>
  <Link className={path==="/admin"?"active":""} href="/admin">Overview</Link>
  <Link className={path.includes("/admin/products")?"active":""} href="/admin/products">Products</Link>
  <Link className={path.includes("/admin/orders")?"active":""} href="/admin/orders">Orders</Link>
  <Link className={path.includes("/admin/settings")?"active":""} href="/admin/settings">Settings</Link>
 </nav><button className="btn btn-secondary" style={{marginTop:30,width:"100%"}} onClick={logout}>Log out</button></aside>
}
