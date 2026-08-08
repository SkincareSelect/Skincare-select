"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(v:string){return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
export async function saveProduct(formData:FormData){
 const s=await createClient(); const id=String(formData.get("id")||"");
 const payload={name:String(formData.get("name")),slug:slugify(String(formData.get("name"))),description:String(formData.get("description")||""),category:String(formData.get("category")),price:Number(formData.get("price")),compare_at_price:formData.get("compare_at_price")?Number(formData.get("compare_at_price")):null,stock:Number(formData.get("stock")),badge:String(formData.get("badge")||"")||null,image_url:String(formData.get("image_url")||"")||null,is_active:formData.get("is_active")==="on"};
 const result=id?await s.from("products").update(payload).eq("id",id):await s.from("products").insert(payload);
 if(result.error) throw result.error; revalidatePath("/");revalidatePath("/admin/products");
}
export async function deleteProduct(formData:FormData){
 const s=await createClient(); const {error}=await s.from("products").delete().eq("id",String(formData.get("id")));if(error)throw error;revalidatePath("/");revalidatePath("/admin/products");
}
