import { createClient } from "@/lib/supabase/server";
import { saveSettings } from "./actions";
import { requireAdmin } from "@/lib/supabase/require-admin";
export default async function Settings(){
 const s=await requireAdmin();const {data}=await s.from("store_settings").select("*").limit(1).maybeSingle();
 return <><div className="admin-head"><div><p className="eyebrow">STORE CONFIGURATION</p><h1>Payments & settings</h1></div></div><form action={saveSettings} className="admin-form"><label>WhatsApp business number<input name="whatsapp" defaultValue={data?.whatsapp} placeholder="260971234567" required/></label><div className="form-grid"><label>MTN MoMo<input name="mtn_number" defaultValue={data?.mtn_number} required/></label><label>Airtel Money<input name="airtel_number" defaultValue={data?.airtel_number} required/></label><label>Zamtel Kwacha<input name="zamtel_number" defaultValue={data?.zamtel_number} required/></label><label>Bank name<input name="bank_name" defaultValue={data?.bank_name}/></label><label>Bank account name<input name="bank_account_name" defaultValue={data?.bank_account_name}/></label><label>Bank account number<input name="bank_account_number" defaultValue={data?.bank_account_number}/></label><label>Bank branch<input name="bank_branch" defaultValue={data?.bank_branch}/></label></div><button className="btn btn-primary">Save settings</button></form></>
}
