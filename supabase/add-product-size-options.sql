alter table public.products
  add column if not exists size_options jsonb;

alter table public.order_items
  add column if not exists selected_size text,
  add column if not exists size_system text;
