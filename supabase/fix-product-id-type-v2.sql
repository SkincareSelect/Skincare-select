-- Run this INSTEAD of the previous id-type script (it supersedes it).
-- Converts products.id from uuid to text, and also converts every foreign key
-- column that references products.id, dropping and recreating those constraints
-- so the type change doesn't break them.

begin;

alter table if exists public.order_items drop constraint if exists order_items_product_id_fkey;
alter table if exists public.reviews drop constraint if exists reviews_product_id_fkey;
alter table if exists public.wishlist drop constraint if exists wishlist_product_id_fkey;
alter table if exists public.cart drop constraint if exists cart_product_id_fkey;
alter table if exists public.inventory drop constraint if exists inventory_product_id_fkey;
alter table if exists public.featured_products drop constraint if exists featured_products_product_id_fkey;

alter table public.products
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table if exists public.order_items alter column product_id type text using product_id::text;
alter table if exists public.reviews alter column product_id type text using product_id::text;
alter table if exists public.wishlist alter column product_id type text using product_id::text;
alter table if exists public.cart alter column product_id type text using product_id::text;
alter table if exists public.inventory alter column product_id type text using product_id::text;
alter table if exists public.featured_products alter column product_id type text using product_id::text;

alter table if exists public.order_items
  add constraint order_items_product_id_fkey foreign key (product_id) references public.products(id) on delete set null;
alter table if exists public.reviews
  add constraint reviews_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table if exists public.wishlist
  add constraint wishlist_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table if exists public.cart
  add constraint cart_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table if exists public.inventory
  add constraint inventory_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table if exists public.featured_products
  add constraint featured_products_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;

commit;

notify pgrst, 'reload schema';
