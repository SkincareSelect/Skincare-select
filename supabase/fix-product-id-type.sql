-- Run this once in the Supabase SQL Editor after add-missing-product-columns.sql.
-- The products table's "id" column was created as uuid, but the Zhurie & Co app
-- uses simple string IDs like "prod-1", "prod-20", etc. This converts id to text
-- so those IDs can be inserted/upserted directly.

alter table public.products
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

notify pgrst, 'reload schema';
