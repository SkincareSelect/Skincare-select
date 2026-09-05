-- Creates the analytics_visits table used by app/lib/store-data.ts to track
-- page-visit counts per period (day/week/month). Without this table the
-- browser client silently logs "Analytics sync failed" warnings and visit
-- counts never make it to Supabase (they still work locally via localStorage).
--
-- Column names are quoted camelCase because the Supabase JS client upserts
-- the AnalyticsEntry object as-is (id, period, periodKey, visitCount,
-- createdAt, updatedAt) -- same convention used by the products table.
--
-- Run this once in the Supabase SQL Editor.

create table if not exists public.analytics_visits (
  id text primary key,
  period text not null check (period in ('day','week','month')),
  "periodKey" text not null,
  "visitCount" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists analytics_visits_period_idx on public.analytics_visits (period, "periodKey");

alter table public.analytics_visits enable row level security;

-- Any visitor's browser writes a visit entry (anon key), so inserts/updates
-- must be public, but only admins should be able to read the aggregated data.
drop policy if exists "Admins view analytics" on public.analytics_visits;
create policy "Admins view analytics" on public.analytics_visits for select using (public.is_admin());

drop policy if exists "Public can log visits" on public.analytics_visits;
create policy "Public can log visits" on public.analytics_visits for insert with check (true);

drop policy if exists "Public can update visit counts" on public.analytics_visits;
create policy "Public can update visit counts" on public.analytics_visits for update using (true) with check (true);

notify pgrst, 'reload schema';
