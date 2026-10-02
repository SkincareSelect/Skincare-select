import { requireAdmin } from "@/lib/supabase/require-admin";
import PaymentsList from "./payments-list";

export type AdminPayment = {
  id: string;
  order_id: string;
  payment_method: string;
  reference: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};

export default async function PaymentsPage() {
  const supabase = await requireAdmin(["admin", "orders_admin"]);
  const { data, error } = await supabase
    .from("payments")
    .select("id, order_id, payment_method, reference, amount, status, created_at")
    .order("created_at", { ascending: false });
  if (error && error.code !== "PGRST205") {
    console.error("ADMIN PAYMENTS LOAD ERROR:", error);
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">FINANCE</p>
          <h1>Payments</h1>
        </div>
      </div>
      {error ? (
        <p className="panel" role="alert">
          {error.code === "PGRST205"
            ? "Payment records are not set up yet. Run supabase/add-payments-table.sql in the Supabase SQL editor."
            : "Payment records could not be loaded. Please try again later."}
        </p>
      ) : (
        <PaymentsList payments={(data ?? []) as AdminPayment[]} />
      )}
    </>
  );
}
