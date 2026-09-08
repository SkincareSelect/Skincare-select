-- Move the former makeup catalog into Accessories and replace Makeup
-- with the new Apparel and footwear category.

update public.products
set
  category = 'Accessories',
  subcategory = case
    when lower(coalesce(subcategory, '')) like '%eye%' then 'Eye'
    when lower(coalesce(subcategory, '')) like '%base%' then 'Base'
    else subcategory
  end
where category = 'Makeup';

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
