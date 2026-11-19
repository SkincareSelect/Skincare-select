-- Remove legacy category checks before renaming values so the new category
-- is not rejected by the old constraint.
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

update public.products
set category = 'Apparel and footwear'
where category = 'Footwear and Clothes';

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
