"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth-provider";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (!result.ok) {
      setError(result.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    // Verify this account actually has admin privileges before letting it in.
    // Regular customer accounts should never reach the admin dashboard, even
    // with correct credentials.
    try {
      const response = await fetch("/api/auth/admin-status", { cache: "no-store" });
      const data = response.ok ? await response.json() : null;

      if (!data || data.role !== "admin") {
        await signOut();
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
        setError("This account does not have administrator access.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("ADMIN STATUS CHECK ERROR:", err);
      await signOut();
      setError("Unable to verify administrator access. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f7f5f2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            <span style={{ fontStyle: "italic", transform: "translate(-5px, -3px)" }}>Z</span>
            <span style={{ transform: "translate(5px, 3px)" }}>C</span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Zhurie <em style={{ color: "#8d6e63", fontWeight: 400 }}>&amp; Co</em>
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#666",
            }}
          >
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Admin Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <div
              style={{
                background: "#fff1f2",
                color: "#be123c",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background: "#111827",
              color: "white",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in to Admin"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "13px",
            color: "#888",
          }}
        >
          Zhurie &amp; Co • Beauty curated by you
        </p>
      </div>
    </main>
  );
}