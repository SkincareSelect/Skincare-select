-- Add editable homepage campaign content to store settings.
alter table public.store_settings add column if not exists campaign_eyebrow text not null default 'Featured campaign';
alter table public.store_settings add column if not exists campaign_type text not null default 'Promotion';
alter table public.store_settings add column if not exists campaign_active boolean not null default true;
alter table public.store_settings add column if not exists campaign_title text not null default 'Soft glow essentials';
alter table public.store_settings add column if not exists campaign_description text not null default 'Cleanser, serum and body care picks designed to keep your routine simple, elegant and effective.';
alter table public.store_settings add column if not exists campaign_visual text not null default '✨';
alter table public.store_settings add column if not exists campaign_footer text not null default 'New customer savings available';
alter table public.store_settings add column if not exists campaign_offer text not null default 'From K185';
