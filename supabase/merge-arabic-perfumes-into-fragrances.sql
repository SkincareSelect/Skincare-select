-- Merges the "Arabic Perfumes" category into "Fragrances" (Arabic perfumes
-- become a subcategory within Fragrances instead of their own top-level
-- category). Run this in the Supabase SQL Editor after the products have
-- already been migrated once via scripts/sync-products.ts (or run this first
-- and then re-run the sync script -- either order works).

-- 1) Reclassify any existing rows still tagged "Arabic Perfumes".
update public.products
set category = 'Fragrances',
    subcategory = case
      when subcategory is null or subcategory = '' then 'Arabic'
      else 'Arabic - ' || subcategory
    end
where category = 'Arabic Perfumes';

-- 2) Tighten the category check constraint back down now that "Arabic Perfumes"
-- is no longer a valid top-level category.
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
    'Korean Skincare',
    'Accessories',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
