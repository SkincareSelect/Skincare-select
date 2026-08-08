"use client";

import Link from "next/link";
import { useCart } from "@/app/components/cart-provider";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Your basket</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Cart summary</h1>
          </div>
          <Link href="/shop" className="text-sm font-medium text-violet-600">Continue shopping</Link>
        </div>

        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-slate-600">Your cart is empty. Add a few favourites to get started.</div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl">{item.product.image}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.product.name}</p>
                    <p className="text-sm text-slate-500">K{item.product.price} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                    className="rounded-full border border-slate-200 px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((count) => (
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

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Order total</p>
        <div className="mt-6 flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <span>K{subtotal}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-slate-600">
          <span>Delivery</span>
          <span>Free</span>
        </div>
        <div className="mt-6 border-t border-slate-200 pt-6 text-lg font-semibold text-slate-900">
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span>K{subtotal}</span>
          </div>
        </div>
        <Link href="/checkout" className="mt-8 flex w-full justify-center rounded-full bg-violet-600 px-4 py-3 font-semibold text-white">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
