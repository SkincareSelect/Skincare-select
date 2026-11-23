create table if not exists public.newsletter_subscribers (
  email text primary key check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
revoke all on table public.newsletter_subscribers from public, anon, authenticated;
grant all on table public.newsletter_subscribers to service_role;
