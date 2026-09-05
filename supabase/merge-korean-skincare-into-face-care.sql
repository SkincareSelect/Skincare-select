-- Merges the "Korean Skincare" category into "Face Care" (Korean/K-beauty
-- products become a subcategory within Face Care instead of their own
-- top-level category). Run this in the Supabase SQL Editor.

-- 1) Reclassify any existing rows still tagged "Korean Skincare".
update public.products
set category = 'Face Care',
    subcategory = case
      when subcategory is null or subcategory = '' then 'Korean'
      else 'Korean - ' || subcategory
    end
where category = 'Korean Skincare';

-- 2) Tighten the category check constraint back down now that "Korean
-- Skincare" is no longer a valid top-level category.
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
    'Accessories',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
