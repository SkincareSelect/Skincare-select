"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function updateOrder(formData:FormData){
 const s=await createClient();const id=String(formData.get("id"));const status=String(formData.get("status"));
 const {error}=await s.from("orders").update({status,courier_name:String(formData.get("courier_name")||"")||null,tracking_number:String(formData.get("tracking_number")||"")||null,payment_reference:String(formData.get("payment_reference")||"")||null}).eq("id",id);
 if(error)throw error;revalidatePath("/admin/orders");
}
