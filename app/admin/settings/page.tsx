import { saveSettings } from "./actions";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { CampaignImageUpload } from "./campaign-image-upload";
export default async function Settings(){
 const s=await requireAdmin();const {data}=await s.from("store_settings").select("*").limit(1).maybeSingle();
 return (
   <>
     <div className="admin-head">
       <div>
         <p className="eyebrow">STORE CONFIGURATION</p>
         <h1>Payments & settings</h1>
       </div>
     </div>
     <form action={saveSettings} className="admin-form">
       <label>WhatsApp business number<input name="whatsapp" defaultValue={data?.whatsapp} placeholder="260971234567" required /></label>
       <div className="form-grid">
         <label>MTN MoMo<input name="mtn_number" defaultValue={data?.mtn_number} required /></label>
         <label>Airtel Money<input name="airtel_number" defaultValue={data?.airtel_number} required /></label>
         <label>Zamtel Kwacha<input name="zamtel_number" defaultValue={data?.zamtel_number} required /></label>
         <label>Bank name<input name="bank_name" defaultValue={data?.bank_name} /></label>
         <label>Bank account name<input name="bank_account_name" defaultValue={data?.bank_account_name} /></label>
         <label>Bank account number<input name="bank_account_number" defaultValue={data?.bank_account_number} /></label>
         <label>Bank branch<input name="bank_branch" defaultValue={data?.bank_branch} /></label>
       </div>
       <h2>Featured campaign</h2>
       <p>Choose what you are promoting, add the picture, then save and publish.</p>
       <label>Campaign type<select name="campaign_type" defaultValue={data?.campaign_type || "Promotion"}><option>Promotion</option><option>Awareness day</option><option>Seasonal theme</option><option>Announcement</option></select></label>
       <label><input type="checkbox" name="campaign_active" defaultChecked={data?.campaign_active !== false} /> Show this campaign on the homepage</label>
       <label>Eyebrow<input name="campaign_eyebrow" defaultValue={data?.campaign_eyebrow || "Featured campaign"} /></label>
       <label>Title<input name="campaign_title" defaultValue={data?.campaign_title || "Soft glow essentials"} required /></label>
       <label>Description<textarea name="campaign_description" defaultValue={data?.campaign_description} rows={3} /></label>
       <div className="form-grid">
         <label>Visual emoji<input name="campaign_visual" defaultValue={data?.campaign_visual || "✨"} /></label>
         <label>Offer text<input name="campaign_offer" defaultValue={data?.campaign_offer} /></label>
       </div>
       <CampaignImageUpload defaultValue={data?.campaign_image_url || ""} />
       <label>Footer text<input name="campaign_footer" defaultValue={data?.campaign_footer} /></label>
       <button className="btn btn-primary">Save settings</button>
     </form>
   </>
 );
}
