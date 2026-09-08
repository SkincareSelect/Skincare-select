"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ShoppingBag, Search, X } from "lucide-react";
import type { CartItem, Product, StoreSettings } from "@/lib/types";

const fallbackProducts: Product[] = [
  {id:"1",name:"Gentle Daily Cleanser",slug:"gentle-daily-cleanser",description:"A mild everyday face wash.",category:"Face",price:185,compare_at_price:null,stock:12,badge:"BESTSELLER",image_url:null,is_active:true,created_at:""},
  {id:"2",name:"Vitamin C Glow Serum",slug:"vitamin-c-glow-serum",description:"Brightening serum for a radiant look.",category:"Face",price:265,compare_at_price:null,stock:8,badge:"GLOW PICK",image_url:null,is_active:true,created_at:""},
  {id:"3",name:"Shea Body Butter",slug:"shea-body-butter",description:"Rich moisture for dry skin.",category:"Body",price:210,compare_at_price:null,stock:10,badge:null,image_url:null,is_active:true,created_at:""},
  {id:"4",name:"Beard Growth Oil",slug:"beard-growth-oil",description:"Nourishing beard and skin oil.",category:"Men",price:190,compare_at_price:null,stock:6,badge:"MEN'S PICK",image_url:null,is_active:true,created_at:""},
  {id:"5",name:"Rosemary Scalp Oil",slug:"rosemary-scalp-oil",description:"Lightweight scalp and hair oil.",category:"Hair",price:185,compare_at_price:null,stock:9,badge:null,image_url:null,is_active:true,created_at:""}
];

const fallbackSettings: StoreSettings = {
  whatsapp:"260000000000",mtn_number:"096 XXX XXXX",airtel_number:"097 XXX XXXX",
  zamtel_number:"095 XXX XXXX",bank_name:"YOUR BANK",bank_account_name:"Zhurie & Co",
  bank_account_number:"XXXXXXXXXX",bank_branch:"YOUR BRANCH"
};

export default function Storefront({ initialProducts, settings }:{
  initialProducts:Product[]; settings:StoreSettings|null
}) {
  const products = initialProducts.length ? initialProducts : fallbackProducts;
  const store = settings || fallbackSettings;
  const [category,setCategory]=useState("All");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState<CartItem[]>([]);
  const [cartOpen,setCartOpen]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [toast,setToast]=useState("");

  useEffect(()=>{
    const saved=localStorage.getItem("ss_cart_pro");
    if(!saved) return;
    try {
      const parsed=JSON.parse(saved);
      if(Array.isArray(parsed)) window.setTimeout(() => setCart(parsed), 0);
    } catch {
      localStorage.removeItem("ss_cart_pro");
    }
  },[]);
  useEffect(()=>localStorage.setItem("ss_cart_pro",JSON.stringify(cart)),[cart]);

  const shown=useMemo(()=>products.filter(p=>
    p.is_active && (category==="All"||p.category===category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ),[products,category,search]);

  const subtotal=cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const count=cart.reduce((s,i)=>s+i.quantity,0);
  const notify=(m:string)=>{setToast(m);setTimeout(()=>setToast(""),2200)};

  function add(p:Product){
    if(p.stock<1)return;
    setCart(items=>{
      const found=items.find(i=>i.id===p.id);
      return found?items.map(i=>i.id===p.id?{...i,quantity:Math.min(i.quantity+1,p.stock)}:i):[...items,{...p,quantity:1}]
    });
    notify("Added to your bag");
  }
  function qty(id:string,n:number){
    setCart(items=>items.map(i=>i.id===id?{...i,quantity:i.quantity+n}:i).filter(i=>i.quantity>0));
  }

  return <>
    <div className="announcement">Lusaka and countrywide deliveries available for a fee • Charges vary by destination</div>
    <header className="header">
      <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <a className="brand" href="#"><span className="brandmark" style={{fontFamily:"Georgia,serif",fontStyle:"italic"}}>Z<span style={{fontStyle:"normal",marginLeft:-2}}>C</span></span><span><b>Zhurie</b> &amp; Co</span></a>
        <nav className="nav"><a href="#shop">Shop</a><a href="#shipping">Shipping</a><a href="#about">About</a></nav>
        <div className="header-actions">
          <button className="pill" onClick={()=>setCartOpen(true)}><ShoppingBag size={16}/> Bag ({count})</button>
        </div>
      </div>
    </header>

    <main>
      <section className="hero">
  <div className="hero-copy">
    <p className="eyebrow">PREMIUM BEAUTY FOR EVERYONE</p>
    <h1>
      Glow with confidence.
      <br />
      <em>Selected for you.</em>
    </h1>
    <p>
      Quality skincare, haircare and grooming products for women and men,
      delivered across Zambia.
    </p>
    <div>
      <a className="btn btn-primary" href="#shop">
        Shop now
      </a>
    </div>
  </div>

  <div className="hero-art">
    <div className="hero-orbit">
      <div className="hero-bottle">SELECT</div>
    </div>
  </div>
</section>

      <section className="section container" id="shop">
        <div className="section-head">
          <div><p className="eyebrow">OUR COLLECTION</p><h2 className="section-title">Popular picks</h2></div>
          <div style={{display:"grid",gap:10}}>
            <div className="filters">{["All","Face","Body","Men","Hair"].map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
            <div style={{position:"relative"}}><Search size={16} style={{position:"absolute",left:12,top:14}}/><input style={{paddingLeft:38}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products"/></div>
          </div>
        </div>
        <div className="grid">
          {shown.map(p=><article className="product-card" key={p.id}>
            <div className="product-image">
              {p.badge&&<span className="badge">{p.badge}</span>}
              {p.image_url?<Image src={p.image_url} alt={p.name} width={500} height={500} unoptimized/>:<div className="placeholder-product">SELECT</div>}
            </div>
            <div className="product-body">
              <span className="category">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p>
              <div className="product-bottom"><strong>K{p.price.toFixed(2)}</strong><small>{p.stock>0?`${p.stock} available`:"Out of stock"}</small></div>
              <button className="add" disabled={p.stock<1} onClick={()=>add(p)}>{p.stock<1?"Out of stock":"Add to bag"}</button>
            </div>
          </article>)}
        </div>
      </section>

      <section className="section container" id="shipping">
        <div className="shipping">
          <div><p className="eyebrow" style={{color:"#c4dbcf"}}>ZAMBIA SHIPPING</p><h2 className="section-title">Payment first.<br/>Address confirmed.<br/>Then we dispatch.</h2><p>Lusaka and countrywide deliveries are available for a fee. Charges vary by destination and are confirmed with your delivery details. Every parcel is prepared only after full payment is verified and the customer&apos;s phone number, town, province, address and nearest landmark have been confirmed.</p></div>
          <div className="steps">
            <div className="step"><span>1</span><div><b>Order submitted</b><br/><small>Customer chooses products and delivery method.</small></div></div>
            <div className="step"><span>2</span><div><b>Payment confirmed</b><br/><small>Mobile Money or bank payment is verified.</small></div></div>
            <div className="step"><span>3</span><div><b>Address confirmed</b><br/><small>We verify location and a reachable phone number.</small></div></div>
            <div className="step"><span>4</span><div><b>Parcel dispatched</b><br/><small>Courier and tracking details are sent by WhatsApp or SMS.</small></div></div>
          </div>
        </div>
      </section>

      <section className="section container" id="about">
        <p className="eyebrow">OUR PROMISE</p><h2 className="section-title">Simple, honest and inclusive beauty.</h2>
      </section>
    </main>

    <footer className="footer"><div className="container footer-grid">
      <div><div className="brand"><span className="brandmark" style={{fontFamily:"Georgia,serif",fontStyle:"italic"}}>Z<span style={{fontStyle:"normal",marginLeft:-2}}>C</span></span><span>Zhurie &amp; Co</span></div><p>Beauty and grooming essentials for everyone.</p></div>
      <div><b>Customer care</b><p>WhatsApp: {store.whatsapp}</p></div>
      <div><b>Payments</b><p>Airtel Money<br/>Zamtel Kwacha</p></div>
    </div></footer>

    {cartOpen&&<><div className="cart-backdrop" onClick={()=>setCartOpen(false)}/><aside className="cart">
      <div className="panel-head"><h2>Your bag</h2><button className="close" onClick={()=>setCartOpen(false)}><X/></button></div>
      <div className="cart-list">{cart.length===0?<p>Your bag is empty.</p>:cart.map(i=><div className="cart-item" key={i.id}>
        <div><b>{i.name}</b><br/><small>K{i.price.toFixed(2)}</small><div className="qty"><button onClick={()=>qty(i.id,-1)}>−</button><span>{i.quantity}</span><button onClick={()=>qty(i.id,1)}>+</button></div></div>
        <strong>K{(i.price*i.quantity).toFixed(2)}</strong>
      </div>)}</div>
      <div className="cart-total"><div className="line"><span>Subtotal</span><strong>K{subtotal.toFixed(2)}</strong></div><button className="btn btn-primary" style={{width:"100%"}} disabled={!cart.length} onClick={()=>{setCartOpen(false);setCheckoutOpen(true)}}>Proceed to checkout</button></div>
    </aside></>}

    {checkoutOpen&&<Checkout cart={cart} subtotal={subtotal} store={store} close={()=>setCheckoutOpen(false)} completed={()=>{setCart([]);setCheckoutOpen(false);notify("Order placed successfully")}}/>}
    <div className={`toast ${toast?"show":""}`}>{toast}</div>
  </>;
}

function Checkout({cart,subtotal,store,close,completed}:{cart:CartItem[];subtotal:number;store:StoreSettings;close:()=>void;completed:()=>void}) {
  const [delivery,setDelivery]=useState("Lusaka delivery");
  const [payment,setPayment]=useState("Airtel Money");
  const [loading,setLoading]=useState(false);
  const fee=delivery==="Pickup"?0:delivery==="Lusaka delivery"?50:100;
  const total=subtotal+fee;

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setLoading(true);
    const whatsappWindow = window.open("", "_blank", "noopener,noreferrer");
    const fd=new FormData(e.currentTarget);
    const payload={
      customer_name:fd.get("customer_name"),phone:fd.get("phone"),email:fd.get("email"),
      province:fd.get("province"),city:fd.get("city"),address:fd.get("address"),landmark:fd.get("landmark"),
      delivery_method:delivery,delivery_fee:fee,payment_method:payment,notes:fd.get("notes"),
      items:cart.map(i=>({product_id:i.id,name:i.name,price:i.price,quantity:i.quantity}))
    };
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();setLoading(false);
    if(!r.ok){
      if(whatsappWindow) whatsappWindow.close();
      alert(data.error||"Unable to place order.");
      return;
    }
    const number=payment==="MTN MoMo"?store.mtn_number:payment==="Airtel Money"?store.airtel_number:payment==="Zamtel Kwacha"?store.zamtel_number:"";
    const message=`Zhurie & Co order ${data.order_number}. Total K${total.toFixed(2)}. Payment method: ${payment}.`;
    alert(`${message}\n\n${number?`Send payment to ${number}. `:""}Your parcel will only be dispatched after payment and address confirmation.`);
    const waUrl=`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
    if(whatsappWindow){
      whatsappWindow.location.href=waUrl;
    } else {
      window.open(waUrl,"_blank");
    }
    completed();
  }
  return <><div className="modal-backdrop"/><section className="checkout">
    <div className="panel-head"><h2>Secure checkout</h2><button className="close" onClick={close}><X/></button></div>
    <form className="checkout-grid" onSubmit={submit}>
      <div className="form-area">
        <h3>Contact and delivery</h3>
        <div className="form-grid">
          <label>Full name<input name="customer_name" required/></label><label>Phone number<input name="phone" required/></label>
          <label className="wide">Email<input name="email" type="email"/></label>
          <label>Province<select name="province" required><option value="">Choose</option>{["Lusaka","Copperbelt","Central","Eastern","Luapula","Muchinga","Northern","North-Western","Southern","Western"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Town / city<input name="city" required/></label><label className="wide">Address<input name="address" required/></label>
          <label className="wide">Nearest landmark<input name="landmark" required/></label>
        </div>
        <h3>Delivery method</h3><div className="options">{["Lusaka delivery","Nationwide courier","Pickup"].map(x=><label className="option" key={x}><input name="delivery_method" type="radio" checked={delivery===x} onChange={()=>setDelivery(x)}/><span>{x}<br/><small>{x==="Pickup"?"Free":x==="Lusaka delivery"?"K50":"K100"}</small></span></label>)}</div>
        <h3>Payment method</h3><div className="options">{["Airtel Money","Zamtel Kwacha"].map(x=><label className="option" key={x}><input name="payment_method" type="radio" checked={payment===x} onChange={()=>setPayment(x)}/><span>{x}</span></label>)}</div>
        <label style={{display:"grid",gap:7,marginTop:18}}>Notes<textarea name="notes" rows={3}/></label>
      </div>
      <aside className="order-box"><h3>Order summary</h3>{cart.map(i=><div className="line" key={i.id}><span>{i.name} × {i.quantity}</span><b>K{(i.price*i.quantity).toFixed(2)}</b></div>)}<hr/><div className="line"><span>Subtotal</span><span>K{subtotal.toFixed(2)}</span></div><div className="line"><span>Delivery</span><span>K{fee.toFixed(2)}</span></div><div className="line"><strong>Total</strong><strong>K{total.toFixed(2)}</strong></div><p style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>Your parcel is sent only after payment and address confirmation.</p><button className="btn btn-primary" style={{width:"100%"}} disabled={loading}>{loading?"Placing order...":"Place order"}</button></aside>
    </form>
  </section></>;
}
