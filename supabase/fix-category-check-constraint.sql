-- Run this after the previous scripts. The products table has a check constraint
-- restricting which "category" values are allowed, which doesn't include all the
-- categories the Zhurie & Co app actually uses (Arabic Perfumes, Korean Skincare, etc).
-- This drops that old constraint and replaces it with one that allows every
-- category defined in app/lib/types.ts (ProductCategory).

alter table public.products drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in (
    'Face Care',
    'Body Care',
    'Hair Care',
    'Men''s Grooming',
    'Makeup',
    'Fragrances',
    'Arabic Perfumes',
    'Korean Skincare',
    'Accessories',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
