-- Keep the Supabase product category constraint aligned with ProductCategory.
-- Remove older category check constraints before normalizing legacy values.
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

update public.products set category = 'Face Care' where category = 'Face';
update public.products set category = 'Body Care' where category = 'Body';
update public.products set category = 'Men''s Grooming' where category = 'Men';
update public.products set category = 'Hair Care' where category = 'Hair';
update public.products set category = 'Accessories' where category = 'Makeup';
update public.products set category = 'Fragrances' where category = 'Arabic Perfumes';
update public.products set category = 'Face Care' where category = 'Korean Skincare';
update public.products set category = 'Apparel and footwear' where category = 'Footwear and Clothes';

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
