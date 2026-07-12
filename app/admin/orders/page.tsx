import { createClient } from "@/lib/supabase/server";
import { updateOrder } from "./actions";
export default async function Orders(){
 const s=await createClient();const {data=[]}=await s.from("orders").select("*,order_items(*)").order("created_at",{ascending:false});
 return <><div className="admin-head"><div><p className="eyebrow">FULFILMENT</p><h1>Orders</h1></div></div><div style={{display:"grid",gap:14}}>
 {(data||[]).length===0&&<div className="panel">No orders yet.</div>}
 {(data||[]).map((o:any)=><article className="panel" key={o.id}><div style={{display:"flex",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}><div><h2 style={{margin:0}}>{o.order_number}</h2><p>{o.customer_name} • {o.phone}<br/>{o.address}, {o.city}, {o.province}<br/>Landmark: {o.landmark||"—"}</p></div><strong style={{fontSize:22}}>K{Number(o.total).toFixed(2)}</strong></div><p>{o.order_items?.map((i:any)=>`${i.product_name} × ${i.quantity}`).join(" • ")}</p><form action={updateOrder} className="form-grid"><input type="hidden" name="id" value={o.id}/><label>Status<select name="status" defaultValue={o.status}>{["Pending payment","Paid","Address confirmed","Ready for dispatch","Dispatched","Delivered","Cancelled"].map(x=><option key={x}>{x}</option>)}</select></label><label>Payment reference<input name="payment_reference" defaultValue={o.payment_reference}/></label><label>Courier<input name="courier_name" defaultValue={o.courier_name}/></label><label>Tracking number<input name="tracking_number" defaultValue={o.tracking_number}/></label><button className="btn btn-primary">Update order</button></form></article>)}
 </div></>
}
