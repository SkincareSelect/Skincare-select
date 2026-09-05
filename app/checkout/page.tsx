"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Landmark, RadioTower, Smartphone } from "lucide-react";
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
import { upsertOrderToSupabase, upsertPaymentToSupabase } from "@/app/lib/supabase/data-client";
import type { Order, Payment, PaymentMethod } from "@/app/lib/types";

const paymentMethods: PaymentMethod[] = ["Airtel Money", "MTN Mobile Money", "Zamtel Money", "Bank Transfer"];

const paymentMethodBadges: Record<PaymentMethod, { icon: React.ComponentType<{ size?: number; className?: string }>; tint: string; label: string }> = {
  "Airtel Money": { icon: RadioTower, tint: "bg-red-100 text-red-700", label: "Airtel" },
  "MTN Mobile Money": { icon: Smartphone, tint: "bg-yellow-100 text-yellow-800", label: "MTN" },
  "Zamtel Money": { icon: Building2, tint: "bg-green-100 text-green-700", label: "Zamtel" },
  "Bank Transfer": { icon: Landmark, tint: "bg-blue-100 text-blue-700", label: "Bank" },
  "Cash on Delivery": { icon: Landmark, tint: "bg-slate-100 text-slate-700", label: "Cash" },
};

function formatPrice(value: number) {
  return `K${value.toFixed(2)}`;
}

function getPaymentInstructions(method: PaymentMethod, settings: ReturnType<typeof getSettings>) {
  const details: Record<PaymentMethod, string> = {
    "MTN Mobile Money": `Send payment to ${settings.mtnNumber}.`,
    "Airtel Money": `Send payment to ${settings.airtelNumber}.`,
    "Zamtel Money": `Send payment to ${settings.zamtelNumber}.`,
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
  const router = useRouter();
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN Mobile Money");
  const [status, setStatus] = useState("Ready to place order");
  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{ number: string; total: number } | null>(null);

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
    let paymentStatus: Payment["status"] = "pending";
    let paymentMessage = `Order ${orderNumber} placed.`;
    let paymentUrl: string | undefined;
    if (result.order_id && result.payment_id) {
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentMethod === "Bank Transfer"
          ? { action: "bank_confirm", payment_id: result.payment_id, reference: result.payment_reference }
          : { action: "initiate", order_id: result.order_id, payment_method: paymentMethod, phone, reference: result.payment_reference }),
      });
      const paymentResult = await paymentResponse.json() as { status?: Payment["status"]; message?: string; paymentUrl?: string };
      paymentStatus = paymentResult.status ?? "pending";
      paymentMessage = paymentResult.message ?? (paymentMethod === "Bank Transfer" ? "Payment awaiting bank verification." : "Payment pending provider confirmation.");
      paymentUrl = paymentResult.paymentUrl;
    }
    const payment: Payment = {
      id: `payment-${orderNumber}`,
      orderId: order.id,
      paymentMethod,
      reference: result.payment_reference ?? "",
      amount: total,
      status: paymentStatus,
      createdAt,
      updatedAt: createdAt,
    };
    const savedOrder: Order = paymentStatus === "paid"
      ? { ...order, status: "Payment Confirmed", paymentStatus: "paid" }
      : order;

    const nextOrders = [savedOrder, ...getOrders()];
    saveOrders(nextOrders);

    const nextPayments = [payment, ...getPayments()];
    savePayments(nextPayments);

    void upsertOrderToSupabase(savedOrder);
    void upsertPaymentToSupabase(payment);

    clearCart();
    setLoading(false);
    if (paymentUrl) {
      // DPO hosted checkout: send the customer to DPO's secure payment page.
      // The webhook/return route will mark the order paid once DPO confirms.
      window.location.assign(paymentUrl);
      return;
    }
    if (paymentStatus === "paid") {
      setConfirmedOrder({ number: result.order_number ?? orderNumber, total });
      return;
    }
    setStatus(`${paymentMessage} Order ${orderNumber}.`);
    router.push("/account");
  };

  if (confirmedOrder) {
    return (
      <main className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[#eadfce] bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-900">Thank You for Shopping with Zhurie &amp; Co.</h1>
        <p className="mt-4 text-slate-600">Your order has been successfully placed and your payment has been confirmed.</p>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-[#8d6e63]">Order number</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">#{confirmedOrder.number}</p>
        <p className="mt-4 text-2xl font-bold text-emerald-700">{formatPrice(confirmedOrder.total)} Paid</p>
        <p className="mt-6 text-slate-600">We&apos;re getting your order ready. You&apos;ll receive an update when your order is ready for delivery.</p>
        <p className="mt-6 text-slate-700">🎁 <strong>Look out for rewards and exclusive discounts!</strong></p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Keep shopping with Zhurie &amp; Co. to earn rewards and enjoy special discounts, promotions and exclusive offers.</p>
        <button type="button" onClick={() => router.push("/account")} className="mt-8 rounded-full bg-[#2f241f] px-6 py-3 font-semibold text-white transition hover:bg-[#1f1713]">Continue</button>
      </main>
    );
  }

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
          <p className="mt-2 rounded-2xl bg-[#fbf7f2] px-4 py-3 text-sm text-slate-600">{getPaymentInstructions(paymentMethod, settings)}</p>
          <div className="mt-4 rounded-2xl border border-[#eadfce] bg-white px-4 py-4">
             <p className="text-sm font-medium text-slate-500">Amount to pay</p>
             <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPrice(total)}</p>
          </div>
          {paymentMethod === "Bank Transfer" ? (
             <div className="mt-4 rounded-2xl bg-[#fbf7f2] px-4 py-4 text-sm text-slate-600">
               <p><strong>Bank:</strong> {settings.bankName}</p>
               <p><strong>Account name:</strong> {settings.bankAccountName}</p>
               <p><strong>Account number:</strong> {settings.bankAccountNumber}</p>
               <p><strong>Branch:</strong> {settings.bankBranch}</p>
               <p><strong>Reference:</strong> Generated automatically after order placement</p>
             </div>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Additional instructions</label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-2xl border border-[#eadfce] px-4 py-3" />
        </div>

        <button type="submit" disabled={loading} className="mt-8 rounded-full bg-[#2f241f] px-6 py-3 font-semibold text-white disabled:opacity-70">
          {loading ? "Placing order..." : "Place order"}
        </button>
        <p className="mt-4 text-sm text-slate-500">{status}</p>
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
