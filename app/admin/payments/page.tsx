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
  const { data = [] } = await supabase
    .from("payments")
    .select("id, order_id, payment_method, reference, amount, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">FINANCE</p>
          <h1>Payments</h1>
        </div>
      </div>
      <PaymentsList payments={data as AdminPayment[]} />
    </>
  );
}
