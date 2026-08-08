create extension if not exists "uuid-ossp";

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  category text not null,
  price numeric not null,
  original_price numeric,
  description text not null,
  short_description text not null,
  benefits jsonb not null default '[]'::jsonb,
  tag text not null,
  stock integer not null default 0,
  image text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null,
  status text not null,
  payment_method text not null,
  shipping_address text not null,
  referral_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null,
  reference text,
  status text not null default 'Pending' check (status in ('Pending','Completed','Failed','Refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default uuid_generate_v4(),
  store_name text not null default 'Lueur & Co',
  store_logo text,
  whatsapp_number text,
  payment_numbers jsonb not null default '{}'::jsonb,
  bank_details jsonb not null default '{}'::jsonb,
  support_email text not null default 'hello@lueurco.co.zm',
  support_phone text not null default '+260977000000',
  delivery_fee numeric(10,2) not null default 20,
  business_hours text not null default 'Mon-Sat 8:00 AM - 8:00 PM',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;

create policy if not exists "Allow public read products" on public.products for select using (true);
create policy if not exists "Allow public read settings" on public.store_settings for select using (true);
create policy if not exists "Allow authenticated insert orders" on public.orders for insert to authenticated with check (true);
create policy if not exists "Allow authenticated select orders" on public.orders for select to authenticated using (true);
create policy if not exists "Allow authenticated manage payments" on public.payments for all to authenticated using (true) with check (true);
create policy if not exists "Allow authenticated admin manage products" on public.products for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy if not exists "Allow authenticated admin manage settings" on public.store_settings for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy if not exists "Allow authenticated read profile" on public.profiles for select to authenticated using (auth.uid() = id);
