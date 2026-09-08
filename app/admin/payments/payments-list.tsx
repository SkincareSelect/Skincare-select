"use client";

import { useState } from "react";
import type { AdminPayment } from "./page";

const statuses = ["pending", "processing", "paid", "failed", "cancelled", "awaiting_bank_verification", "refunded"];

export default function PaymentsList({ payments: initialPayments }: { payments: AdminPayment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [message, setMessage] = useState("");

  async function updateStatus(paymentId: string, status: string) {
    const response = await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId, status }),
    });

    if (!response.ok) {
      setMessage("Payment could not be updated.");
      return;
    }

    setPayments((current) => current.map((payment) => payment.id === paymentId ? { ...payment, status } : payment));
    setMessage("Payment updated.");
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {message ? <p className="panel">{message}</p> : null}
      {payments.length === 0 ? <div className="panel">No payments yet.</div> : null}
      {payments.map((payment) => (
        <article className="panel" key={payment.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>{payment.payment_method}</h2>
              <p>Order: {payment.order_id}<br />Reference: {payment.reference || "Not available"}<br />Created: {new Date(payment.created_at).toLocaleString()}</p>
            </div>
            <strong style={{ fontSize: 22 }}>K{Number(payment.amount ?? 0).toFixed(2)}</strong>
          </div>
          <select value={payment.status} onChange={(event) => void updateStatus(payment.id, event.target.value)}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </article>
      ))}
    </div>
  );
}
