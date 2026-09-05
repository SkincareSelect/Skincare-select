"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function updateOrder(formData:FormData){
 const s=await createClient();
 const { data: { user } } = await s.auth.getUser();
 if (!user) throw new Error("Authentication required.");
 const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
 if (profile?.role !== "admin") throw new Error("Administrator access required.");
 const id=String(formData.get("id"));const status=String(formData.get("status"));
 const courierName=String(formData.get("courier_name")||"")||null;
 const { data: currentOrder, error: currentOrderError } = await s.from("orders").select("courier_assigned_at,picked_up_at,dispatched_at,delivered_at").eq("id",id).single();
 if (currentOrderError) throw currentOrderError;
 const now = new Date().toISOString();
 const timestamps = {
   courier_assigned_at: currentOrder.courier_assigned_at ?? (courierName ? now : null),
   picked_up_at: currentOrder.picked_up_at ?? (status === "Dispatched" || status === "Delivered" ? now : null),
   dispatched_at: currentOrder.dispatched_at ?? (status === "Dispatched" || status === "Delivered" ? now : null),
   delivered_at: currentOrder.delivered_at ?? (status === "Delivered" ? now : null),
 };
 const {error}=await s.from("orders").update({status,courier_name:courierName,tracking_number:String(formData.get("tracking_number")||"")||null,payment_reference:String(formData.get("payment_reference")||"")||null,...timestamps}).eq("id",id);
 if(error)throw error;revalidatePath("/admin/orders");
}
