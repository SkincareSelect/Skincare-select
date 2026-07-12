# Skincare Select Pro

A production-ready foundation for a Zambia-focused skincare e-commerce store using Next.js and Supabase.

## Main features

- Premium responsive green, cream, sage and gold theme
- Product catalogue, search, categories and cart
- Checkout with Zambian provinces
- MTN MoMo, Airtel Money, Zamtel Kwacha and bank transfer instructions
- Parcels dispatched only after payment and address confirmation
- Courier name and tracking number support
- Secure Supabase administrator login
- Add, edit, hide and delete products
- Product image uploads to Supabase Storage
- Inventory and low-stock monitoring
- Order workflow: Pending payment → Paid → Address confirmed → Ready for dispatch → Dispatched → Delivered
- Database tables for customer profiles, wishlists, reviews and coupons

## 1. Create Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication, create the administrator user.
5. Copy the user's UUID.
6. Run:

```sql
insert into public.profiles (id, full_name, role)
values ('PASTE_AUTH_USER_UUID_HERE', 'Store Administrator', 'admin')
on conflict (id) do update set role='admin';
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and enter your Supabase details.

The service-role key is secret. Never expose it in client-side code or commit `.env.local`.

## 3. Run locally

Node.js 20.9 or newer is recommended.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Admin login: `http://localhost:3000/admin/login`

## 4. Deploy on Vercel

1. Create a GitHub repository.
2. Upload this project.
3. Import the repository into Vercel.
4. Add all environment variables from `.env.example`.
5. Deploy.
6. Set `NEXT_PUBLIC_SITE_URL` to your live domain.

## Important

I cannot create or access your Supabase, GitHub or Vercel accounts without you signing in and authorising those services. The source code and database setup are complete, but the live deployment requires your account credentials and project keys.
