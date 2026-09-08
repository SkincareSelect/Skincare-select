create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin','orders_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  category text not null check (category in ('Face','Body','Men','Hair')),
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  badge text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  whatsapp text not null,
  mtn_number text not null,
  airtel_number text not null,
  zamtel_number text not null,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  province text not null,
  city text not null,
  address text not null,
  landmark text,
  delivery_method text not null,
  delivery_fee numeric(12,2) not null default 0,
  payment_method text not null,
  payment_reference text,
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  status text not null default 'Pending payment'
    check (status in ('Pending payment','Paid','Address confirmed','Ready for dispatch','Dispatched','Delivered','Cancelled')),
  tracking_number text,
  courier_name text,
  courier_assigned_at timestamptz,
  picked_up_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists courier_assigned_at timestamptz;
alter table public.orders add column if not exists picked_up_at timestamptz;
alter table public.orders add column if not exists dispatched_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null,
  reference text,
  amount numeric(12,2),
  provider_transaction_id text,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','awaiting_bank_verification','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
create policy "Admins view payments" on public.payments for select using (
  public.is_admin()
  or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
);
create policy "Admins update payments" on public.payments for update
  using (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  )
  with check (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  );

alter table public.payments add column if not exists provider_transaction_id text;
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (status in ('pending','processing','paid','failed','cancelled','awaiting_bank_verification','refunded'));

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(product_id,user_id)
);

create table if not exists public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,product_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_order numeric(12,2) not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create policy "Users can view own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());

create policy "Public can view active products" on public.products for select using (is_active or public.is_admin());
create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "Public can view settings" on public.store_settings for select using (true);
create policy "Admins manage settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins view orders" on public.orders for select using (
  public.is_admin()
  or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  or user_id=auth.uid()
);
create policy "Admins update orders" on public.orders for update
  using (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  )
  with check (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  );
create policy "Admins view order items" on public.order_items for select using (
  public.is_admin()
  or exists(select 1 from public.profiles where id = auth.uid() and role = 'orders_admin')
  or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid())
);
create policy "Approved reviews are public" on public.reviews for select using (is_approved or user_id=auth.uid() or public.is_admin());
create policy "Users create own reviews" on public.reviews for insert with check (user_id=auth.uid());
create policy "Users manage own wishlist" on public.wishlists for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Active coupons readable" on public.coupons for select using (is_active or public.is_admin());
create policy "Admins manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public=true;

create policy "Public product images" on storage.objects for select using (bucket_id='product-images');
create policy "Admins upload product images" on storage.objects for insert with check (bucket_id='product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects for update using (bucket_id='product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects for delete using (bucket_id='product-images' and public.is_admin());

insert into public.store_settings (whatsapp,mtn_number,airtel_number,zamtel_number,bank_name,bank_account_name,bank_account_number,bank_branch)
select '260000000000','096 XXX XXXX','097 XXX XXXX','095 XXX XXXX','YOUR BANK','Zhurie & Co Zambia','XXXXXXXXXX','YOUR BRANCH'
where not exists (select 1 from public.store_settings);

-- After creating your first user in Supabase Authentication, make that user an admin:
-- insert into public.profiles (id, full_name, role)
-- values ('PASTE_AUTH_USER_UUID_HERE', 'Store Administrator', 'admin')
-- on conflict (id) do update set role='admin';
