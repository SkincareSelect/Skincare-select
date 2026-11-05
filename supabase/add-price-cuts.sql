create table if not exists public.price_cuts (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique references public.products(id) on delete cascade,
  original_price numeric(12, 2) not null check (original_price >= 0),
  discount_percentage numeric(5, 2) not null check (discount_percentage >= 0 and discount_percentage <= 100),
  discount_amount numeric(12, 2) not null check (discount_amount >= 0),
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_price_cut_requires_discount check (not is_active or discount_percentage > 0),
  constraint price_cut_amount_matches_percentage
    check (discount_amount = round(original_price * discount_percentage / 100, 2)),
  constraint price_cut_sale_matches_amount
    check (sale_price = original_price - discount_amount)
);

alter table public.order_items
  add column if not exists original_price numeric(12, 2),
  add column if not exists discount_percentage numeric(5, 2),
  add column if not exists discount_amount numeric(12, 2),
  add column if not exists price_cut_id uuid references public.price_cuts(id) on delete set null,
  add column if not exists size_system text check (size_system is null or size_system in ('EU', 'US', 'UK'));

alter table public.price_cuts enable row level security;
revoke all on public.price_cuts from public, anon, authenticated;
grant select on public.price_cuts to anon, authenticated;
grant all on public.price_cuts to service_role;

drop policy if exists "Public can view active price cuts" on public.price_cuts;
create policy "Public can view active price cuts"
  on public.price_cuts for select
  using (is_active);

drop policy if exists "Admins manage price cuts" on public.price_cuts;
create policy "Admins manage price cuts"
  on public.price_cuts for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

notify pgrst, 'reload schema';
