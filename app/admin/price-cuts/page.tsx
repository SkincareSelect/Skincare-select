import { PriceCutsDashboard } from "./dashboard";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function PriceCutsPage() {
  await requireAdmin(["admin"]);
  return <PriceCutsDashboard />;
}
