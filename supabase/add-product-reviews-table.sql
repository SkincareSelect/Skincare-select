-- Product reviews & ratings
-- Safe to run on its own; does not touch existing tables except reading auth.users/products.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  verified_purchase boolean not null default false,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);
create index if not exists product_reviews_status_idx on public.product_reviews (status);

-- Prevent the same signed-in user from leaving more than one review per product
create unique index if not exists product_reviews_user_product_unique
  on public.product_reviews (product_id, user_id)
  where user_id is not null;

alter table public.product_reviews enable row level security;

drop policy if exists "Anyone can read approved reviews" on public.product_reviews;
create policy "Anyone can read approved reviews"
  on public.product_reviews for select
  using (status = 'approved');

drop policy if exists "Signed in users can submit reviews" on public.product_reviews;
create policy "Signed in users can submit reviews"
  on public.product_reviews for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their own review" on public.product_reviews;
create policy "Users can update their own review"
  on public.product_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all reviews" on public.product_reviews;
create policy "Admins manage all reviews"
  on public.product_reviews for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Keep products.rating / products.review_count in sync automatically
create or replace function public.refresh_product_rating() returns trigger as $$
declare
  target_product_id text;
  avg_rating numeric;
  total_reviews integer;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  select coalesce(avg(rating), 0), count(*)
    into avg_rating, total_reviews
    from public.product_reviews
    where product_id = target_product_id and status = 'approved';

  update public.products
    set rating = round(avg_rating, 2),
        "reviewCount" = total_reviews
    where id = target_product_id;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists product_reviews_refresh_rating on public.product_reviews;
create trigger product_reviews_refresh_rating
  after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_rating();
