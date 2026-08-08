"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function saveSettings(formData:FormData){
 const s=await createClient();const payload={whatsapp:String(formData.get("whatsapp")),mtn_number:String(formData.get("mtn_number")),airtel_number:String(formData.get("airtel_number")),zamtel_number:String(formData.get("zamtel_number")),bank_name:String(formData.get("bank_name")),bank_account_name:String(formData.get("bank_account_name")),bank_account_number:String(formData.get("bank_account_number")),bank_branch:String(formData.get("bank_branch"))};
 const {data}=await s.from("store_settings").select("id").limit(1).maybeSingle();
 const result=data?await s.from("store_settings").update(payload).eq("id",data.id):await s.from("store_settings").insert(payload);
 if(result.error)throw result.error;revalidatePath("/");revalidatePath("/admin/settings");
}
