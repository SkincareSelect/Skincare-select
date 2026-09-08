-- Rename the existing catalog category without changing its public URL slug.
update public.products
set category = 'Apparel and footwear'
where category = 'Footwear and Clothes';

alter table public.products drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in (
    'Face Care',
    'Body Care',
    'Hair Care',
    'Men''s Grooming',
    'Apparel and footwear',
    'Fragrances',
    'Accessories',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
