import { updateOrder } from "./actions";
import { requireAdmin } from "@/lib/supabase/require-admin";

type OrderItem = {
  product_name: string;
  quantity: number;
};

type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string | null;
  address: string;
  city: string | null;
  province: string | null;
  landmark: string | null;
  total: number;
  status: string;
  payment_reference: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  courier_assigned_at: string | null;
  picked_up_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[] | null;
};

function formatTimestamp(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
}

export default async function Orders(){
 const s=await requireAdmin(["admin", "orders_admin"]);const {data=[]}=await s.from("orders").select("*,order_items(*)").order("created_at",{ascending:false});
 return <><div className="admin-head"><div><p className="eyebrow">FULFILMENT</p><h1>Orders</h1></div></div><div style={{display:"grid",gap:14}}>
 {(data||[]).length===0&&<div className="panel">No orders yet.</div>}
 {(data||[]).map((o: AdminOrder)=><article className="panel" key={o.id}><div style={{display:"flex",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}><div><h2 style={{margin:0}}>{o.order_number}</h2><p>Placed: {formatTimestamp(o.created_at)}<br/>{o.customer_name} • {o.phone}<br/>{o.address}, {o.city}, {o.province}<br/>Landmark: {o.landmark||"—"}</p></div><strong style={{fontSize:22}}>K{Number(o.total).toFixed(2)}</strong></div><p>{o.order_items?.map((i: OrderItem)=>`${i.product_name} × ${i.quantity}`).join(" • ")}</p><div style={{display:"grid",gap:8,gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",margin:"16px 0",fontSize:13}}><div><strong>Courier assigned</strong><br/>{formatTimestamp(o.courier_assigned_at)}</div><div><strong>Picked up</strong><br/>{formatTimestamp(o.picked_up_at)}</div><div><strong>Dispatched</strong><br/>{formatTimestamp(o.dispatched_at)}</div><div><strong>Delivered</strong><br/>{formatTimestamp(o.delivered_at)}</div></div><form action={updateOrder} className="form-grid"><input type="hidden" name="id" value={o.id}/><label>Status<select name="status" defaultValue={o.status}>{["Pending payment","Paid","Address confirmed","Ready for dispatch","Dispatched","Delivered","Cancelled"].map(x=><option key={x}>{x}</option>)}</select></label><label>Payment reference<input name="payment_reference" defaultValue={o.payment_reference ?? ""}/></label><label>Courier<input name="courier_name" defaultValue={o.courier_name ?? ""}/></label><label>Tracking number<input name="tracking_number" defaultValue={o.tracking_number ?? ""}/></label><button className="btn btn-primary">Save order & timestamp</button></form></article>)}
 </div></>
}
