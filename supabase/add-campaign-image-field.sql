ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS campaign_image_url TEXT NOT NULL DEFAULT '';
