"use client";

import { useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const result = await response.json().catch(() => null) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "We couldn't save your subscription. Please try again.",
        );
      }

      setEmail("");
      setState("success");
      setMessage("Thank you for subscribing. Look out for considered notes from Zhurie & Co.");
    } catch (error) {
      console.error("NEWSLETTER SUBSCRIPTION ERROR:", error);
      setState("error");
      setMessage(error instanceof Error ? error.message : "We couldn't save your subscription. Please try again.");
    }
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Your email address"
        autoComplete="email"
        maxLength={254}
        required
        className="min-h-12 min-w-0 flex-1 border border-white/30 bg-transparent px-4 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-white"
      />
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="newsletter-website">Leave this field empty</label>
        <input
          id="newsletter-website"
          name="website"
          type="text"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={state === "submitting"}
        className="min-h-12 border border-white bg-white px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] transition hover:bg-[#eae3d8] disabled:cursor-wait disabled:opacity-70"
      >
        {state === "submitting" ? "Subscribing..." : "Subscribe"}
      </button>
      {message ? (
        <p className="basis-full text-sm text-white/85" role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
