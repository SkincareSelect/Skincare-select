"use client";

import { useState } from "react";
import { Building2, RadioTower } from "lucide-react";
import { useCart } from "@/app/components/cart-provider";
import { useAuth } from "@/app/components/auth-provider";
import {
  getOrders,
  getPayments,
  getReferralReward,
  getSettings,
  normalizeReferralCode,
  saveOrders,
  savePayments,
} from "@/app/lib/store-data";
import type { Order, Payment, PaymentMethod } from "@/app/lib/types";

type AvailablePaymentMethod = "Airtel Money" | "Zamtel Money";
const paymentMethods: AvailablePaymentMethod[] = ["Airtel Money", "Zamtel Money"];

const paymentMethodBadges: Record<"Airtel Money" | "Zamtel Money", { icon: React.ComponentType<{ size?: number; className?: string }>; tint: string; label: string }> = {
  "Airtel Money": { icon: RadioTower, tint: "bg-red-100 text-red-700", label: "Airtel" },
  "Zamtel Money": { icon: Building2, tint: "bg-green-100 text-green-700", label: "Zamtel" },
};

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

function getPaymentInstructions(method: PaymentMethod, settings: ReturnType<typeof getSettings>) {
  const details: Record<PaymentMethod, string> = {
    "MTN Mobile Money": `Send payment to ${settings.mtnNumber}.`,
    "Airtel Money": "Send payment to +260 973 970 079.",
    "Zamtel Money": "Send payment to +260 954 035 093.",
    "Bank Transfer": `Transfer to ${settings.bankName}, ${settings.bankAccountName}, account ${settings.bankAccountNumber}, ${settings.bankBranch}.`,
    "Cash on Delivery": "Pay the courier in cash when your order arrives.",
  };
  return details[method];
}

function buildOrderNumber(existingCount: number) {
  const sequence = String(existingCount + 1).padStart(6, "0");
  return `ZC-2026-${sequence}`;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const settings = getSettings();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AvailablePaymentMethod | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [status, setStatus] = useState("Ready to place order");
  const [loading, setLoading] = useState(false);

  const normalizedReferralCode = normalizeReferralCode(referralCode);
  const referralReward = getReferralReward(normalizedReferralCode);
  const discountAmount = referralReward ? subtotal * (referralReward.discountPercent / 100) : 0;
  const deliveryFee = items.length > 0 ? settings.deliveryFee : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (items.length === 0) {
      setStatus("Add an item to your cart before checkout.");
      return;
    }

    if (referralCode && !referralReward) {
      setStatus("That referral code is not valid. Please check the code and try again.");
      return;
    }

    if (!paymentMethod) {
      setStatus("Please choose a payment method.");
      return;
    }

    if (!paymentReference.trim()) {
      setStatus("Enter the payment confirmation reference before submitting.");
      return;
    }

    setLoading(true);

    const orderNumber = buildOrderNumber(getOrders().length);
    const createdAt = new Date().toISOString();
    const order: Order = {
      id: `order-${orderNumber}`,
      orderNumber,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      items,
      subtotal,
      deliveryFee,
      discount: discountAmount,
      total,
      status: "Payment Pending" as const,
      paymentMethod,
      paymentStatus: "pending" as const,
      shippingAddress: address,
      area,
      city,
      referralCode: normalizedReferralCode || undefined,
      notes: notes || undefined,
      createdAt,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        province: area || city,
        city,
        address,
        delivery_method: "Standard delivery",
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        subtotal,
        total,
        referral_code: normalizedReferralCode || null,
        notes: notes || null,
        items: items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setLoading(false);
      setStatus(result?.error ?? "We could not save your order. Please try again.");
      return;
    }

    const result = await response.json() as { order_id?: string; payment_id?: string; payment_reference?: string; order_number?: string };
    const payment: Payment = {
      id: `payment-${orderNumber}`,
      orderId: order.id,
      paymentMethod,
      reference: paymentReference.trim(),
      amount: total,
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    };
    const nextOrders = [order, ...getOrders()];
    saveOrders(nextOrders);

    const nextPayments = [payment, ...getPayments()];
    savePayments(nextPayments);

    clearCart();
    setLoading(false);
    setStatus(`Payment reference submitted for verification. Order ${result.order_number ?? orderNumber}.`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Checkout as guest</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complete your order</h1>
        <p className="mt-2 text-slate-600">Guest checkout is supported. You can create an account after ordering.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
            <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Delivery address</label>
          <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-24 w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Area / location</label>
          <input value={area} onChange={(event) => setArea(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Referral code</label>
          <input
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="Enter referral code (optional)"
            className="w-full rounded-2xl border border-[#eadfce] px-4 py-3"
          />
          <p className="mt-2 text-sm text-slate-500">
            {referralReward ? `Reward active: ${referralReward.discountPercent}% off` : "Try SELECT10, SELECT15, or GLOWUP for a valid reward code."}
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => (
               <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${paymentMethod === method ? "border-[#8d6e63] bg-[#fbf7f2]" : "border-[#eadfce] bg-white"}`}>
                 <input type="radio" name="payment_method" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                 <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${paymentMethodBadges[method].tint}`}>
                   {(() => {
                     const Icon = paymentMethodBadges[method].icon;
                     return <Icon size={13} />;
                   })()}
                   {paymentMethodBadges[method].label}
                 </span>
                 <span>{method}</span>
               </label>
             ))}
          </div>

          {!paymentMethod ? (
            <p className="mt-2 rounded-2xl bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">Choose a payment method to see the amount, payment instructions and to submit a confirmation reference.</p>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-[#eadfce] bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">Amount to pay</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPrice(total)}</p>
              </div>

              <p className="mt-2 rounded-2xl bg-[#fbf7f2] px-4 py-3 text-sm text-slate-600">{getPaymentInstructions(paymentMethod, settings)}</p>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment confirmation / reference</label>
                <input placeholder="Enter transaction reference (e.g. 123456)" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full rounded-2xl border border-[#eadfce] px-4 py-3" required />
                <p className="mt-2 text-sm text-slate-500">After sending the payment to the provider number, enter the transaction reference here and submit to confirm your payment.</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Additional instructions</label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-2xl border border-[#eadfce] px-4 py-3" />
        </div>

        <button type="submit" disabled={loading || !paymentMethod} className="mt-8 rounded-full bg-[#2f241f] px-6 py-3 font-semibold text-white disabled:opacity-70">
          {loading ? "Submitting payment..." : "Submit payment"}
        </button>
        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status.startsWith("Payment reference submitted") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} role="status">{status}</p>
      </form>

      <aside className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Order summary</p>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between rounded-2xl bg-[#fbf7f2] px-4 py-3">
              <span>{item.product.name} × {item.quantity}</span>
              <span className="font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-[#eadfce] pt-6 text-lg font-semibold text-slate-900">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Delivery fee</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Lusaka and countrywide deliveries are available. Fees vary by destination and are confirmed with your delivery details.
          </p>
          {referralReward ? (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Referral discount ({referralReward.discountPercent}%)</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between text-xl text-slate-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <div className="mt-6 rounded-[1.5rem] bg-[#fbf7f2] p-4 text-sm text-slate-600">
          Payment details and WhatsApp follow-up will be shown after the order is saved.
        </div>
      </aside>
    </div>
  );
}
