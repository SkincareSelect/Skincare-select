"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});setLoading(false);if(error){setError(error.message);return}router.push("/admin");router.refresh()}
  return <main className="login"><div className="login-card"><div className="brand"><span className="brandmark" style={{fontFamily:"Georgia,serif",fontStyle:"italic"}}>Z<span style={{fontStyle:"normal",marginLeft:-2}}>C</span></span><b>Zhurie &amp; Co</b></div><p className="eyebrow" style={{marginTop:30}}>SECURE ADMIN</p><h1>Welcome back</h1><p>Sign in with the administrator account created in Supabase.</p><form onSubmit={submit}><input type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="btn btn-primary" style={{width:"100%"}} disabled={loading}>{loading?"Signing in...":"Sign in"}</button>{error&&<p style={{color:"var(--danger)"}}>{error}</p>}</form></div></main>
}
