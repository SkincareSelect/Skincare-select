"use client";

import Link from "next/link";
import { useCart } from "@/app/components/cart-provider";
import { getSettings } from "@/app/lib/store-data";
import { ProductThumb } from "@/app/components/product-thumb";

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const settings = getSettings();
  const deliveryFee = items.length > 0 ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Your bag</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Cart summary</h1>
          </div>
          <Link href="/shop" className="text-sm font-medium text-[#8d6e63]">
            Continue shopping
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[1.5rem] bg-[#fbf7f2] p-6 text-slate-600">Your cart is empty. Add a few favourites to get started.</div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-[#eadfce] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#fbf7f2] text-3xl">
                    <ProductThumb product={item.product} className="h-full w-full" emojiClassName="text-3xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.product.name}</p>
                    <p className="text-sm text-slate-500">{formatPrice(item.product.price)} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                    className="rounded-full border border-[#eadfce] bg-white px-3 py-2 text-sm"
                  >
                    {Array.from({ length: Math.min(5, item.product.stock) }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(item.product.id)} className="text-sm font-medium text-rose-600">
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Order summary</p>
        <div className="mt-6 flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-slate-600">
          <span>Delivery fee</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Lusaka and countrywide deliveries are available. Fees vary by destination and are confirmed with your delivery details.
        </p>
        <div className="mt-6 border-t border-[#eadfce] pt-6 text-lg font-semibold text-slate-900">
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <Link href="/checkout" className="mt-8 flex w-full justify-center rounded-full bg-[#d9b8a7] px-4 py-3 font-semibold text-[#2f241f] transition hover:bg-[#c99d89]">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
