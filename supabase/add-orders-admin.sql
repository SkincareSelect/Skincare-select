-- Run after the customer profiles table exists. The account must already exist in Supabase Auth.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'admin', 'orders_admin'));

create or replace function public.is_orders_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'orders_admin')
  );
$$;

drop policy if exists "Orders admins view orders" on public.orders;
create policy "Orders admins view orders"
  on public.orders for select
  to authenticated
  using (public.is_orders_admin() or user_id = auth.uid());

drop policy if exists "Orders admins update orders" on public.orders;
create policy "Orders admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_orders_admin())
  with check (public.is_orders_admin());

drop policy if exists "Orders admins view order items" on public.order_items;
create policy "Orders admins view order items"
  on public.order_items for select
  to authenticated
  using (
    public.is_orders_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Orders admins view payments" on public.payments;
create policy "Orders admins view payments"
  on public.payments for select
  to authenticated
  using (public.is_orders_admin());

drop policy if exists "Orders admins update payments" on public.payments;
create policy "Orders admins update payments"
  on public.payments for update
  to authenticated
  using (public.is_orders_admin())
  with check (public.is_orders_admin());

update public.profiles
set role = 'orders_admin'
where id = (
  select id
  from auth.users
  where lower(email) = 'zhurieandco.offers@gmail.com'
  limit 1
);
