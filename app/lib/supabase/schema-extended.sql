create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin','orders_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  category text not null,
  brand text,
  price numeric not null,
  original_price numeric,
  description text not null,
  short_description text not null,
  benefits jsonb not null default '[]'::jsonb,
  tag text not null,
  stock integer not null default 0,
  image text not null,
  images jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  hidden boolean not null default false,
  skin_type text,
  hair_type text,
  product_type text,
  discount numeric,
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

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  quantity integer not null default 1,
  price numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null default 5,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cart (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  label text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default uuid_generate_v4(),
  store_name text not null default 'Zhurie & Co',
  store_logo text,
  whatsapp_number text,
  payment_numbers jsonb not null default '{}'::jsonb,
  bank_details jsonb not null default '{}'::jsonb,
  support_email text not null default 'hello@lueurco.co.zm',
  support_phone text not null default '+260977000000',
  delivery_fee numeric not null default 20,
  business_hours text not null default 'Mon-Sat 8:00 AM - 8:00 PM',
  campaign_eyebrow text not null default 'Featured campaign',
  campaign_type text not null default 'Promotion',
  campaign_active boolean not null default true,
  campaign_title text not null default 'Soft glow essentials',
  campaign_description text not null default 'Cleanser, serum and body care picks designed to keep your routine simple, elegant and effective.',
  campaign_visual text not null default '✨',
  campaign_image_url text not null default '',
  campaign_footer text not null default 'New customer savings available',
  campaign_offer text not null default 'From K185',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_method text not null,
  reference text,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists public.featured_products (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  percent_off numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  image_url text,
  link text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart enable row level security;
alter table public.addresses enable row level security;
alter table public.store_settings enable row level security;
alter table public.payments enable row level security;
alter table public.inventory enable row level security;
alter table public.featured_products enable row level security;
alter table public.discounts enable row level security;
alter table public.banners enable row level security;

create policy if not exists "read all products" on public.products for select using (true);
create policy if not exists "read all categories" on public.categories for select using (true);
create policy if not exists "read all brands" on public.brands for select using (true);
create policy if not exists "read all banners" on public.banners for select using (true);
create policy if not exists "read all store settings" on public.store_settings for select using (true);
create policy if not exists "authenticated can manage own data" on public.orders for all to authenticated using (true) with check (true);
create policy if not exists "authenticated can manage own cart" on public.cart for all to authenticated using (true) with check (true);
create policy if not exists "authenticated can manage own wishlist" on public.wishlist for all to authenticated using (true) with check (true);
create policy if not exists "authenticated can manage own addresses" on public.addresses for all to authenticated using (true) with check (true);
create policy if not exists "authenticated can manage own profile" on public.profiles for select to authenticated using (auth.uid() = id);
