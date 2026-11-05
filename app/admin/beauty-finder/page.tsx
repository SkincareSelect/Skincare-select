import type { Metadata } from "next";
import { BeautyFinder } from "@/app/components/beauty-finder";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const metadata: Metadata = {
  title: "AI Beauty Finder | Zhurie & Co Admin",
  description: "Admin-only product recommendations from the Zhurie & Co catalogue.",
};

export default async function AdminBeautyFinderPage() {
  await requireAdmin();
  return <BeautyFinder />;
}
