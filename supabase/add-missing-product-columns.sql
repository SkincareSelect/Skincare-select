-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).
-- Adds the columns the Zhurie & Co app actually writes to the "products" table,
-- so admin edits and the product sync script stop failing with
-- "Could not find the '...' column of 'products' in the schema cache".
--
-- Column names are double-quoted to match the exact camelCase keys the app sends
-- via the Supabase JS client (Postgres would otherwise fold unquoted names to lowercase).

alter table public.products
  add column if not exists "ageGroup" text,
  add column if not exists "subcategory" text,
  add column if not exists "brand" text,
  add column if not exists "sku" text,
  add column if not exists "productType" text,
  add column if not exists "gender" text,
  add column if not exists "shortDescription" text,
  add column if not exists "benefits" jsonb default '[]'::jsonb,
  add column if not exists "ingredients" jsonb,
  add column if not exists "instructions" text,
  add column if not exists "size" text,
  add column if not exists "weight" text,
  add column if not exists "suitableFor" jsonb,
  add column if not exists "tags" jsonb,
  add column if not exists "originalPrice" numeric,
  add column if not exists "discount" numeric,
  add column if not exists "stockStatus" text,
  add column if not exists "image" text,
  add column if not exists "images" jsonb,
  add column if not exists "rating" numeric,
  add column if not exists "reviewCount" integer,
  add column if not exists "featured" boolean default false,
  add column if not exists "newArrival" boolean default false,
  add column if not exists "bestSeller" boolean default false,
  add column if not exists "hidden" boolean default false,
  add column if not exists "badge" text,
  add column if not exists "createdAt" timestamptz default now();

-- Optional: backfill "image" from the legacy "image_url" column if you had
-- products saved under the old schema, and mark them visible.
update public.products
set "image" = image_url
where "image" is null and image_url is not null;

update public.products
set "featured" = coalesce("featured", false)
where "featured" is null;

notify pgrst, 'reload schema';
