"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Building2, RadioTower } from "lucide-react";
import { useCart } from "@/app/components/cart-provider";
import { useAuth } from "@/app/components/auth-provider";
import type { DeliveryLocation } from "@/app/components/delivery-location-picker";
import {
  getReferralReward,
  getSettings,
  normalizeReferralCode,
} from "@/app/lib/store-data";
import type { PaymentMethod } from "@/app/lib/types";

const DeliveryLocationPicker = dynamic(
  () => import("@/app/components/delivery-location-picker").then((module) => module.DeliveryLocationPicker),
  {
    ssr: false,
    loading: () => <div className="mt-5 h-72 animate-pulse rounded-2xl bg-[#f7f2eb]" aria-label="Loading delivery map" />,
  },
);

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

type OrderConfirmation = {
  orderNumber: string;
  paymentMethod: AvailablePaymentMethod;
  paymentReference: string;
  deliveryLocation: DeliveryLocation;
  items: Array<{ product_id: string; product_name: string; quantity: number; price: number; selected_size?: string; size_system?: "EU" | "US" | "UK" }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

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
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AvailablePaymentMethod | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

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

    if (!deliveryLocation) {
      setStatus("Pin your exact delivery location on the map before submitting your order.");
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

    try {
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
          delivery_latitude: deliveryLocation.latitude,
          delivery_longitude: deliveryLocation.longitude,
          delivery_method: "Standard delivery",
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim(),
          subtotal,
          total,
          referral_code: normalizedReferralCode || null,
          items: items.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            selected_size: item.selectedSize,
            size_system: item.sizeSystem,
          })),
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(result?.error ?? "We could not save your order. Please try again.");
        return;
      }

      const result = await response.json() as {
        order_number: string;
        payment_reference: string;
        delivery_latitude: number;
        delivery_longitude: number;
        items: OrderConfirmation["items"];
        subtotal: number;
        delivery_fee: number;
        discount: number;
        total: number;
      };

      setConfirmation({
        orderNumber: result.order_number,
        paymentMethod,
        paymentReference: result.payment_reference,
        deliveryLocation: {
          latitude: result.delivery_latitude,
          longitude: result.delivery_longitude,
        },
        items: result.items,
        subtotal: result.subtotal,
        deliveryFee: result.delivery_fee,
        discount: result.discount,
        total: result.total,
      });
      clearCart();
    } catch (error) {
      console.error("CHECKOUT SUBMISSION ERROR:", error);
      setStatus("We could not reach the order service. Your cart is still saved; please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmation) {
    return (
      <section className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Order received</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Thank you for your order!</h1>
          <p className="mt-3 text-slate-600">
            Your payment reference has been submitted for verification. This does not mean payment has been received or verified.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fbf7f2] p-5 text-sm text-slate-700">
          <p><span className="font-semibold">Order number:</span> {confirmation.orderNumber}</p>
          <p className="mt-2"><span className="font-semibold">Payment method:</span> {confirmation.paymentMethod}</p>
          <p className="mt-2"><span className="font-semibold">Reference:</span> {confirmation.paymentReference}</p>
          <p className="mt-2">
            <span className="font-semibold">Delivery pin:</span>{" "}
            <a
              href={`https://www.google.com/maps?q=${confirmation.deliveryLocation.latitude},${confirmation.deliveryLocation.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open selected location in Google Maps
            </a>
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          {confirmation.items.map((item) => (
            <div key={`${item.product_id}-${item.size_system ?? ""}-${item.selected_size ?? ""}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfce] px-4 py-3 text-sm">
              <span>{item.product_name}{item.selected_size ? ` (${item.size_system ? `${item.size_system} ` : ""}${item.selected_size})` : ""} × {item.quantity}</span>
              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="space-y-2 border-t border-[#eadfce] pt-4 text-sm text-slate-600">
            <p className="flex justify-between"><span>Subtotal</span><span>{formatPrice(confirmation.subtotal)}</span></p>
            <p className="flex justify-between"><span>Delivery</span><span>{formatPrice(confirmation.deliveryFee)}</span></p>
            {confirmation.discount > 0 ? (
              <p className="flex justify-between"><span>Referral discount</span><span>-{formatPrice(confirmation.discount)}</span></p>
            ) : null}
            <p className="flex justify-between text-lg font-semibold text-slate-900"><span>Total</span><span>{formatPrice(confirmation.total)}</span></p>
          </div>
        </div>

        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          We will contact you using the details provided about delivery and payment verification. Look out for rewards and discounts from Zhurie &amp; Co.
        </p>
      </section>
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

        <DeliveryLocationPicker location={deliveryLocation} onChange={setDeliveryLocation} />

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

        <button type="submit" disabled={loading || !paymentMethod || !deliveryLocation} className="mt-8 rounded-full bg-[#2f241f] px-6 py-3 font-semibold text-white disabled:opacity-70">
          {loading ? "Submitting payment..." : "Submit payment"}
        </button>
        {status ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{status}</p> : null}
      </form>

      <aside className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Order summary</p>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.sizeSystem ?? ""}-${item.selectedSize ?? ""}`} className="flex items-center justify-between rounded-2xl bg-[#fbf7f2] px-4 py-3">
              <span>{item.product.name}{item.selectedSize ? ` (${item.sizeSystem ? `${item.sizeSystem} ` : ""}${item.selectedSize})` : ""} × {item.quantity}</span>
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
