create table if not exists public.featured_campaigns (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Featured campaign',
  campaign_type text not null default 'Announcement',
  is_active boolean not null default true,
  title text not null,
  description text not null default '',
  visual text not null default '✨',
  image_url text not null default '',
  footer text not null default '',
  offer text not null default '',
  link text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.featured_campaigns enable row level security;

drop policy if exists "Public can view active featured campaigns" on public.featured_campaigns;
create policy "Public can view active featured campaigns"
  on public.featured_campaigns for select
  using (is_active);

drop policy if exists "Admins manage featured campaigns" on public.featured_campaigns;
create policy "Admins manage featured campaigns"
  on public.featured_campaigns for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

insert into public.featured_campaigns (
  eyebrow,
  campaign_type,
  is_active,
  title,
  description,
  visual,
  image_url,
  footer,
  offer,
  position
)
select
  campaign_eyebrow,
  campaign_type,
  campaign_active,
  campaign_title,
  campaign_description,
  campaign_visual,
  campaign_image_url,
  campaign_footer,
  campaign_offer,
  0
from public.store_settings
where nullif(trim(campaign_title), '') is not null
  and not exists (select 1 from public.featured_campaigns);

notify pgrst, 'reload schema';
