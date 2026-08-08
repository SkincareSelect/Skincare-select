"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/components/cart-provider";
import { useAuth } from "@/app/components/auth-provider";
import { getOrders, getPayments, getReferralReward, saveOrders, savePayments, normalizeReferralCode } from "@/app/lib/store-data";
import { upsertOrderToSupabase, upsertPaymentToSupabase } from "@/app/lib/supabase/data-client";
import type { Payment, PaymentMethod } from "@/app/lib/types";

const paymentMethods: PaymentMethod[] = ["MTN Mobile Money", "Airtel Money", "Zamtel Money", "Bank Transfer"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN Mobile Money");
  const [status, setStatus] = useState("Ready to place order");

  const normalizedReferralCode = normalizeReferralCode(referralCode);
  const referralReward = getReferralReward(normalizedReferralCode);
  const discountAmount = referralReward ? subtotal * (referralReward.discountPercent / 100) : 0;
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0) {
      setStatus("Add an item to your cart before checkout.");
      return;
    }

    if (referralCode && !referralReward) {
      setStatus("That referral code is not valid. Please check the code and try again.");
      return;
    }

    const order = {
      id: `order-${Date.now()}`,
      customerName: name,
      customerEmail: email,
      items,
      total,
      status: "Pending Payment" as const,
      paymentMethod,
      shippingAddress: address,
      referralCode: normalizedReferralCode || undefined,
      createdAt: new Date().toISOString(),
    };

    const payment: Payment = {
      id: `payment-${Date.now()}`,
      orderId: order.id,
      paymentMethod,
      reference: "",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextOrders = [order, ...getOrders()];
    saveOrders(nextOrders);

    const nextPayments = [payment, ...getPayments()];
    savePayments(nextPayments);

    void upsertOrderToSupabase(order);
    void upsertPaymentToSupabase(payment);
    clearCart();
    setStatus(`Order placed successfully. We will confirm your ${paymentMethod} payment.`);
    router.push("/account");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Checkout</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complete your order</h1>
        <p className="mt-2 text-slate-600">Secure payments are handled with the method of your choice.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Shipping address</label>
          <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Referral code</label>
          <input
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="Enter referral code (optional)"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
          <p className="mt-2 text-sm text-slate-500">
            {referralReward ? `Reward active: ${referralReward.discountPercent}% off` : "Try LUEUR10, LUEUR15, or GLOWUP for a valid reward code."}
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="mt-8 rounded-full bg-violet-600 px-6 py-3 font-semibold text-white">
          Place order
        </button>
        <p className="mt-4 text-sm text-slate-500">{status}</p>
      </form>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Order preview</p>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>{item.product.name}</span>
              <span className="font-semibold">{item.quantity} × K{item.product.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-6 text-lg font-semibold text-slate-900">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>K{subtotal}</span>
          </div>
          {referralReward ? (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Referral discount ({referralReward.discountPercent}%)</span>
              <span>-K{discountAmount.toFixed(0)}</span>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between text-xl text-slate-900">
            <span>Total</span>
            <span>K{total}</span>
          </div>
          {normalizedReferralCode ? (
            <p className="mt-3 text-sm text-slate-500">Referral code applied: <span className="font-semibold text-slate-900">{normalizedReferralCode}</span></p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
