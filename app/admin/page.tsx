import { createClient } from "@/lib/supabase/server";
export default async function Admin(){
 const s=await createClient();
 const [{count:products},{count:orders},{count:pending},{count:low}]=await Promise.all([
  s.from("products").select("*",{count:"exact",head:true}),
  s.from("orders").select("*",{count:"exact",head:true}),
  s.from("orders").select("*",{count:"exact",head:true}).eq("status","Pending payment"),
  s.from("products").select("*",{count:"exact",head:true}).lte("stock",5)
 ]);
 return <><div className="admin-head"><div><p className="eyebrow">STORE ADMINISTRATION</p><h1>Dashboard</h1></div></div><div className="stats">
  <div className="stat"><small>Products</small><strong>{products||0}</strong></div>
  <div className="stat"><small>Orders</small><strong>{orders||0}</strong></div>
  <div className="stat"><small>Pending payment</small><strong>{pending||0}</strong></div>
  <div className="stat"><small>Low stock</small><strong>{low||0}</strong></div>
 </div><div className="panel" style={{marginTop:20}}><h2>Shipping workflow</h2><p>Update orders in this order: Pending payment → Paid → Address confirmed → Ready for dispatch → Dispatched → Delivered. Add courier and tracking details when dispatching.</p></div></>
}
