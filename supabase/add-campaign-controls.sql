ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'Promotion';

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS campaign_active BOOLEAN NOT NULL DEFAULT TRUE;
