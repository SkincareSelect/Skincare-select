-- Update customer care and mobile money contacts.
update public.store_settings
set
  whatsapp_number = '+260973970079',
  support_phone = '+260954035093',
  payment_numbers = coalesce(payment_numbers, '{}'::jsonb) || jsonb_build_object(
    'Airtel Money', '+260973970079',
    'Zamtel Money', '+260954035093'
  );

notify pgrst, 'reload schema';
