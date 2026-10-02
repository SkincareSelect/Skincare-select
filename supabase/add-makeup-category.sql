alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in (
    'Face Care',
    'Body Care',
    'Hair Care',
    'Men''s Grooming',
    'Apparel and footwear',
    'Fragrances',
    'Makeup',
    'Accessories',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
