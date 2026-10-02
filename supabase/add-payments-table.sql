create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null,
  reference text,
  provider_transaction_id text,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'awaiting_bank_verification', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_transaction_id_key
  on public.payments (provider_transaction_id)
  where provider_transaction_id is not null;

alter table public.payments enable row level security;

drop policy if exists "Admins can read payments" on public.payments;
create policy "Admins can read payments"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'orders_admin')
    )
  );

grant select on public.payments to authenticated;
grant all on public.payments to service_role;

notify pgrst, 'reload schema';
