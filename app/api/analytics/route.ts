import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsEntry } from "@/app/lib/types";

const periods = new Set(["day", "week", "month"]);

function isAnalyticsEntry(value: unknown): value is AnalyticsEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<AnalyticsEntry>;
  const visitCount = entry.visitCount;
  return (
    typeof entry.id === "string" &&
    entry.id.length <= 120 &&
    typeof entry.period === "string" &&
    periods.has(entry.period) &&
    typeof entry.periodKey === "string" &&
    entry.periodKey.length <= 40 &&
    typeof visitCount === "number" &&
    Number.isInteger(visitCount) &&
    visitCount >= 0 &&
    visitCount <= 1000000000 &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics request." }, { status: 400 });
  }

  const entries = Array.isArray(body) ? body : null;
  if (!entries || entries.length > 3 || !entries.every(isAnalyticsEntry)) {
    return NextResponse.json({ error: "Invalid analytics entries." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("analytics_visits").upsert(entries, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: "Unable to save analytics." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
