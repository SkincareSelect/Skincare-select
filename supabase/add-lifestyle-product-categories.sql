-- Keep existing category labels and add only distinct lifestyle categories.
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
    'Face Care',
    'Body Care',
    'Hair Care',
    'Men''s Grooming',
    'Apparel and footwear',
    'Fragrances',
    'Accessories',
    'Baby Care',
    'Home & Living'
  ));

notify pgrst, 'reload schema';
