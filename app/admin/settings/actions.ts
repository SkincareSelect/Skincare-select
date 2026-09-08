"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function saveSettings(formData:FormData){
 const s=await createClient();
 const { data: { user } } = await s.auth.getUser();
 if (!user) throw new Error("Authentication required.");
 const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
 if (profile?.role !== "admin") throw new Error("Administrator access required.");
 const payload={whatsapp:String(formData.get("whatsapp")),mtn_number:String(formData.get("mtn_number")),airtel_number:String(formData.get("airtel_number")),zamtel_number:String(formData.get("zamtel_number")),bank_name:String(formData.get("bank_name")),bank_account_name:String(formData.get("bank_account_name")),bank_account_number:String(formData.get("bank_account_number")),bank_branch:String(formData.get("bank_branch")),campaign_eyebrow:String(formData.get("campaign_eyebrow")||"Featured campaign"),campaign_type:String(formData.get("campaign_type")||"Promotion"),campaign_active:formData.get("campaign_active")==="on",campaign_title:String(formData.get("campaign_title")||"Soft glow essentials"),campaign_description:String(formData.get("campaign_description")||""),campaign_visual:String(formData.get("campaign_visual")||"✨"),campaign_image_url:String(formData.get("campaign_image_url")||""),campaign_footer:String(formData.get("campaign_footer")||""),campaign_offer:String(formData.get("campaign_offer")||"")};
 const {data}=await s.from("store_settings").select("id").limit(1).maybeSingle();
 const result=data?await s.from("store_settings").update(payload).eq("id",data.id):await s.from("store_settings").insert(payload);
 if(result.error)throw result.error;revalidatePath("/");revalidatePath("/admin/settings");
}
