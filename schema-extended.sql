-- Zhurie & Co Ecommerce Database Schema
-- Compatible with Supabase PostgreSQL
-- Run this in the Supabase SQL editor.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================
-- 1. Core auth/profile tables
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  full_name text not null,
  phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  province text,
  postal_code text,
  country text not null default 'Zambia',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 2. Catalog tables
-- =========================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  category text not null,
  brand text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  description text not null,
  short_description text not null,
  benefits jsonb not null default '[]'::jsonb,
  tag text not null default 'New',
  stock integer not null default 0,
  image text not null,
  images jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  hidden boolean not null default false,
  skin_type text,
  hair_type text,
  product_type text,
  discount numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now(),
  unique(product_id)
);

create table if not exists public.featured_products (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique(product_id)
);

create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  image_url text,
  link text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  percent_off numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 3. Commerce tables
-- =========================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'Pending Payment' check (status in (
    'Pending Payment','Paid','Confirmed','Processing','Ready for Dispatch','Dispatched','Delivered','Cancelled'
  )),
  payment_method text not null default 'MTN Mobile Money' check (payment_method in (
    'MTN Mobile Money','Airtel Money','Zamtel Money','Bank Transfer','Cash on Delivery'
  )),
  shipping_address text not null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  quantity integer not null default 1,
  price numeric(10,2) not null,
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

-- =========================
-- 4. Customer interaction tables
-- =========================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.cart (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- =========================
-- 5. Store settings
-- =========================
create table if not exists public.store_settings (
  id uuid primary key default uuid_generate_v4(),
  store_name text not null default 'Zhurie & Co',
  store_logo text,
  whatsapp_number text,
  payment_numbers jsonb not null default '{}'::jsonb,
  bank_details jsonb not null default '{}'::jsonb,
  support_email text not null default 'hello@lueurco.co.zm',
  support_phone text not null default '+260977000000',
  delivery_fee numeric(10,2) not null default 20,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 6. Indexes
-- =========================
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_featured on public.products(featured);
create index if not exists idx_products_hidden on public.products(hidden);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_wishlist_user_id on public.wishlist(user_id);
create index if not exists idx_cart_user_id on public.cart(user_id);
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_inventory_product_id on public.inventory(product_id);
create index if not exists idx_banners_active on public.banners(active);

-- =========================
-- 7. Triggers for updated_at
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace trigger trg_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create or replace trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create or replace trigger trg_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create or replace trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace trigger trg_inventory_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

create or replace trigger trg_banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

create or replace trigger trg_discounts_updated_at
before update on public.discounts
for each row execute function public.set_updated_at();

create or replace trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create or replace trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create or replace trigger trg_cart_updated_at
before update on public.cart
for each row execute function public.set_updated_at();

create or replace trigger trg_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

-- =========================
-- 8. Row Level Security (RLS)
-- =========================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.featured_products enable row level security;
alter table public.banners enable row level security;
alter table public.discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart enable row level security;
alter table public.store_settings enable row level security;

-- Public read access for catalog and storefront content
drop policy if exists "public_read_profiles" on public.profiles;
drop policy if exists "public_read_categories" on public.categories;
drop policy if exists "public_read_brands" on public.brands;
drop policy if exists "public_read_products" on public.products;
drop policy if exists "public_read_inventory" on public.inventory;
drop policy if exists "public_read_featured_products" on public.featured_products;
drop policy if exists "public_read_banners" on public.banners;
drop policy if exists "public_read_discounts" on public.discounts;
drop policy if exists "public_read_reviews" on public.reviews;
drop policy if exists "public_read_store_settings" on public.store_settings;

create policy "public_read_profiles" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());
create policy "public_read_categories" on public.categories for select using (true);
create policy "public_read_brands" on public.brands for select using (true);
create policy "public_read_products" on public.products for select using (true);
create policy "public_read_inventory" on public.inventory for select using (true);
create policy "public_read_featured_products" on public.featured_products for select using (true);
create policy "public_read_banners" on public.banners for select using (true);
create policy "public_read_discounts" on public.discounts for select using (true);
create policy "public_read_reviews" on public.reviews for select using (true);
create policy "public_read_store_settings" on public.store_settings for select using (true);

-- Customers can manage their own addresses, carts, wishlists, and profile
drop policy if exists "users_manage_own_profile" on public.profiles;
drop policy if exists "users_manage_own_addresses" on public.addresses;
drop policy if exists "users_manage_own_wishlist" on public.wishlist;
drop policy if exists "users_manage_own_cart" on public.cart;

create policy "users_manage_own_profile" on public.profiles
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users_manage_own_addresses" on public.addresses
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users_manage_own_wishlist" on public.wishlist
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users_manage_own_cart" on public.cart
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Customers create orders through the server API. Admins manage orders and payments.
drop policy if exists "authenticated_manage_orders" on public.orders;
drop policy if exists "authenticated_manage_order_items" on public.order_items;
drop policy if exists "authenticated_manage_payments" on public.payments;

create policy "admins_manage_orders" on public.orders
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_order_items" on public.order_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_payments" on public.payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin policies for management operations
drop policy if exists "admins_manage_categories" on public.categories;
drop policy if exists "admins_manage_brands" on public.brands;
drop policy if exists "admins_manage_products" on public.products;
drop policy if exists "admins_manage_inventory" on public.inventory;
drop policy if exists "admins_manage_store_settings" on public.store_settings;
drop policy if exists "admins_manage_banners" on public.banners;
drop policy if exists "admins_manage_discounts" on public.discounts;

create policy "admins_manage_categories" on public.categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_brands" on public.brands
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_products" on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_inventory" on public.inventory
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_store_settings" on public.store_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_banners" on public.banners
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_manage_discounts" on public.discounts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- 9. Storage bucket setup helpers
-- =========================
-- Note: this SQL creates policies for a storage bucket named 'product-images'
-- in Supabase Storage. Create the bucket first in the UI, then run these policies.

drop policy if exists "public_read_product_images" on storage.objects;
drop policy if exists "authenticated_upload_product_images" on storage.objects;
drop policy if exists "authenticated_update_product_images" on storage.objects;
drop policy if exists "authenticated_delete_product_images" on storage.objects;

create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "authenticated_upload_product_images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated_update_product_images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "authenticated_delete_product_images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- =========================
-- 10. Seed example data
-- =========================
insert into public.categories (name, slug, description) values
  ('Face Care','face-care','Radiance and skin health essentials'),
  ('Body Care','body-care','Hydrating and renewing body formulas'),
  ('Hair Care','hair-care','Strengthening and nourishing products'),
  ('Men''s Grooming','mens-grooming','Confident grooming essentials'),
  ('Apparel and footwear','footwear-and-clothes','Everyday apparel and footwear essentials'),
  ('Fragrances','fragrances','Signature scents and perfumes'),
  ('Accessories','accessories','Beauty tools and accessories')
on conflict (slug) do nothing;

insert into public.brands (name, slug, description) values
  ('Glow Atelier','glow-atelier','Luxury skincare created for luminous skin'),
  ('Sage & Skin','sage-skin',' Botanical skincare with a modern edge'),
  ('Noble Groom','noble-groom','Elevated grooming for men')
on conflict (slug) do nothing;

insert into public.store_settings (
  store_name,
  store_logo,
  whatsapp_number,
  payment_numbers,
  bank_details,
  support_email,
  support_phone,
  delivery_fee,
  business_hours,
  social_links
) values (
  'Zhurie & Co',
  '',
  '+260973970079',
  '{"MTN Mobile Money":"+260770000001","Airtel Money":"+260973970079","Zamtel Money":"+260950000001","Bank Transfer":"0101234567","Cash on Delivery":""}',
  '{"accountName":"Zhurie & Co Zambia","accountNumber":"0101234567","bankName":"Zanaco","branch":"Lusaka","swiftCode":"ZANAZMLU"}',
  'hello@lueurco.co.zm',
  '+260977000000',
  20,
  'Mon-Sat 8:00 AM - 8:00 PM',
  '{"instagram":"https://instagram.com/lueurco","facebook":"https://facebook.com/lueurco","tiktok":"https://tiktok.com/@lueurco"}'
) on conflict do nothing;
