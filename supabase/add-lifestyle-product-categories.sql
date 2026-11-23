-- Add lifestyle categories without changing or removing existing product categories.
do $$
declare
  category_constraint text;
begin
  for category_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%category%'
  loop
    execute format('alter table public.products drop constraint %I', category_constraint);
  end loop;
end
$$;

alter table public.products
  add constraint products_category_check
  check (category in (
    'Fashion',
    'Footwear',
    'Fragrances',
    'Beauty & Personal Care',
    'Accessories',
    'Home & Living',
    'Lifestyle Essentials',
    'Face Care',
    'Body Care',
    'Hair Care',
    'Men''s Grooming',
    'Apparel and footwear',
    'Baby Care'
  ));

notify pgrst, 'reload schema';
