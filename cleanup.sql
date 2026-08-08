-- Cleanup script for Lueur & Co Supabase schema
-- Run this before schema-extended.sql if you want a clean rebuild.
-- This removes the tables, policies, triggers, and functions created by schema-extended.sql.

-- 1. Drop storage and RLS policies first

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

drop policy if exists "users_manage_own_profile" on public.profiles;
drop policy if exists "users_manage_own_addresses" on public.addresses;
drop policy if exists "users_manage_own_wishlist" on public.wishlist;
drop policy if exists "users_manage_own_cart" on public.cart;

drop policy if exists "authenticated_manage_orders" on public.orders;
drop policy if exists "authenticated_manage_order_items" on public.order_items;
drop policy if exists "authenticated_manage_payments" on public.payments;

drop policy if exists "admins_manage_categories" on public.categories;
drop policy if exists "admins_manage_brands" on public.brands;
drop policy if exists "admins_manage_products" on public.products;
drop policy if exists "admins_manage_inventory" on public.inventory;
drop policy if exists "admins_manage_store_settings" on public.store_settings;
drop policy if exists "admins_manage_banners" on public.banners;
drop policy if exists "admins_manage_discounts" on public.discounts;

drop policy if exists "public_read_product_images" on storage.objects;
drop policy if exists "authenticated_upload_product_images" on storage.objects;
drop policy if exists "authenticated_update_product_images" on storage.objects;
drop policy if exists "authenticated_delete_product_images" on storage.objects;

-- 2. Drop triggers

drop trigger if exists trg_profiles_updated_at on public.profiles;
drop trigger if exists trg_addresses_updated_at on public.addresses;
drop trigger if exists trg_categories_updated_at on public.categories;
drop trigger if exists trg_brands_updated_at on public.brands;
drop trigger if exists trg_products_updated_at on public.products;
drop trigger if exists trg_inventory_updated_at on public.inventory;
drop trigger if exists trg_banners_updated_at on public.banners;
drop trigger if exists trg_discounts_updated_at on public.discounts;
drop trigger if exists trg_orders_updated_at on public.orders;
drop trigger if exists trg_payments_updated_at on public.payments;
drop trigger if exists trg_reviews_updated_at on public.reviews;
drop trigger if exists trg_cart_updated_at on public.cart;
drop trigger if exists trg_store_settings_updated_at on public.store_settings;

-- 3. Drop functions

drop function if exists public.set_updated_at() cascade;

-- 3.1. Drop extensions created by schema-extended.sql

drop extension if exists "uuid-ossp";
drop extension if exists "pgcrypto";

-- 4. Drop tables in dependency order
-- (Use cascade so dependent objects are removed safely.)
drop table if exists public.cart cascade;
drop table if exists public.wishlist cascade;
drop table if exists public.reviews cascade;
drop table if exists public.order_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;
drop table if exists public.store_settings cascade;
drop table if exists public.inventory cascade;
drop table if exists public.featured_products cascade;
drop table if exists public.discounts cascade;
drop table if exists public.banners cascade;
drop table if exists public.products cascade;
drop table if exists public.brands cascade;
drop table if exists public.categories cascade;
drop table if exists public.addresses cascade;
drop table if exists public.profiles cascade;

-- 5. Drop views if they ever exist (none are created by schema-extended.sql)
drop view if exists public.some_view cascade;
