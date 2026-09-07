-- Update Zamtel Mobile Money and WhatsApp customer care.
-- Run this once in the Supabase SQL Editor.

update public.store_settings
set
  zamtel_number = '0954035093',
  whatsapp = '0954035093',
  updated_at = now();
