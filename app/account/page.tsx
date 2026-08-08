"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import { getOrders, getReferralCodeShareLink, getReferralReward, getReferralSummary, validReferralCodes } from "@/app/lib/store-data";

export default function AccountPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>(validReferralCodes[0].code);
  const [copiedLink, setCopiedLink] = useState(false);

  const orderSummary = useMemo(() => {
    const orders = getOrders();
    const validCodes = orders.filter((order) => order.referralCode && getReferralReward(order.referralCode));
    const totalSavings = validCodes.reduce((sum, order) => {
      const reward = getReferralReward(order.referralCode);
      return sum + (reward ? order.total * (reward.discountPercent / 100) : 0);
    }, 0);

    return { validCodes, totalSavings };
  }, []);

  const referralLeaderboard = useMemo(() => getReferralSummary(getOrders()), []);
  const shareLink = useMemo(() => getReferralCodeShareLink(selectedCode), [selectedCode]);

  const copyShareLink = async () => {
    try {
      if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(shareLink);
      }
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "signup") {
      const result = await signUp(email, password, { name });
      setMessage(result.message);
      return;
    }

    if (mode === "reset") {
      const result = await resetPassword(email);
      setMessage(result.message);
      return;
    }

    const result = await signIn(email, password);
    setMessage(result.message);
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">Loading account...</div>;
  }

  if (user) {
    return (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{user.name}</h1>
          <p className="mt-2 text-slate-600">{user.email}</p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Role</p>
            <p className="mt-1 capitalize">{user.role}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Referral dashboard</p>
            <p className="mt-2">Used referrals: {orderSummary.validCodes.length}</p>
            <p className="mt-1">Estimated reward value: K{orderSummary.totalSavings.toFixed(0)}</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">Share code</label>
              <select
                value={selectedCode}
                onChange={(event) => setSelectedCode(event.target.value)}
                className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-2 text-sm"
              >
                {validReferralCodes.map((entry) => (
                  <option key={entry.code} value={entry.code}>{entry.code} — {entry.label}</option>
                ))}
              </select>
              <button onClick={copyShareLink} className="w-full rounded-full bg-violet-600 px-4 py-3 font-semibold text-white">
                {copiedLink ? "Link copied" : "Copy referral link"}
              </button>
              <p className="break-all text-xs text-slate-500">{shareLink}</p>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Referral leaderboard</p>
            <div className="mt-4 space-y-3">
              {referralLeaderboard.length === 0 ? (
                <p className="text-sm text-slate-600">No referral activity yet. Share your link to get started.</p>
              ) : (
                referralLeaderboard.map((entry, index) => (
                  <div key={entry.code} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">#{index + 1} {entry.code}</p>
                      <p className="text-xs text-slate-500">{entry.reward?.label ?? "Referral code"}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{entry.count} uses</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {user.role === "admin" ? (
            <Link href="/admin" className="mt-6 flex w-full justify-center rounded-full bg-violet-600 px-4 py-3 font-semibold text-white">
              Open admin dashboard
            </Link>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Your orders</p>
          <div className="mt-6 space-y-3">
            {getOrders().length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">No orders yet. Start shopping and your recent orders will appear here.</div>
            ) : (
              getOrders().slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{order.id}</p>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{order.paymentMethod}</p>
                  {order.referralCode ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Referral code: <span className="font-semibold text-slate-900">{order.referralCode}</span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-slate-900">K{order.total}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Customer account</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in or create your account</h1>
      <div className="mt-6 flex gap-3">
        <button onClick={() => setMode("login")} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
          Login
        </button>
        <button onClick={() => setMode("signup")} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
          Sign up
        </button>
        <button onClick={() => setMode("reset")} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "reset" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </div>
        ) : null}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
        </div>
        {mode !== "reset" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </div>
        ) : null}
        <button className="w-full rounded-full bg-violet-600 px-4 py-3 font-semibold text-white">
          {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset instructions"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
