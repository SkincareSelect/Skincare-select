"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getReferralCodeShareLink, validReferralCodes } from "@/app/lib/store-data";

export default function ReferralsPage() {
  const [selectedCode, setSelectedCode] = useState<string>(validReferralCodes[0].code);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      window.setTimeout(() => setSelectedCode(ref.toUpperCase()), 0);
    }
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1400);
    } catch {
      setCopiedCode("copy-failed");
      window.setTimeout(() => setCopiedCode(null), 1400);
    }
  };

  const shareLink = getReferralCodeShareLink(selectedCode);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Refer a friend</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Share the glow and earn rewards.</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Invite someone to try Zhurie & Co and unlock savings for both of you when they use a valid referral code.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
              Shop the collection
            </Link>
            <Link href="/checkout" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-slate-50">
              Redeem code
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Selected reward</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{selectedCode}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => void handleCopy(selectedCode)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              {copiedCode === selectedCode ? "Copied" : "Copy code"}
            </button>
            <button
              onClick={() => void navigator.clipboard.writeText(shareLink)}
              className="rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Copy share link
            </button>
          </div>
        </div>
        <p className="mt-4 break-all text-sm text-slate-500">{shareLink}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {validReferralCodes.map((entry) => (
          <div key={entry.code} className={`rounded-3xl border p-6 shadow-sm ${selectedCode === entry.code ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">Reward</p>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{entry.discountPercent}%</span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-slate-900">{entry.code}</h2>
            <p className="mt-2 text-sm text-slate-600">{entry.label}</p>

            <Link
              href={`/referrals?ref=${encodeURIComponent(entry.code)}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Select code
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">How it works</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">1. Share your code</p>
                <p className="mt-2 text-sm text-slate-600">Send your referral code to a friend using WhatsApp, SMS, or social.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">2. They redeem it at checkout</p>
                <p className="mt-2 text-sm text-slate-600">When they place an order, they enter the code and unlock a discount automatically.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">3. Rewards are tracked</p>
                <p className="mt-2 text-sm text-slate-600">Every valid referral contributes to your account reward summary and admin reporting.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top,_#f5e8ff,_#fff_65%)] p-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">Current offers</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Your friends get savings.</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li>• Share the Zhurie & Co referral code</li>
                <li>• Enjoy instant savings on qualifying orders</li>
                <li>• Build reward momentum with each successful referral</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
