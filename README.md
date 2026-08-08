# Lueur & Co

A modern beauty ecommerce experience built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

## Features
- Beautiful storefront homepage with hero banner
- Product categories and search/filtering
- Product details, cart, checkout and account flows
- Admin dashboard for products, orders and store settings
- Supabase-ready schema and environment configuration

## Run locally
1. Install dependencies with `npm install`
2. Create a `.env.local` file with:
   - `NEXT_PUBLIC_SUPABASE_URL=your-project-url`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
3. Start the dev server with `npm run dev`

## Supabase setup
Apply the SQL from [app/lib/supabase/schema.sql](app/lib/supabase/schema.sql) in your Supabase SQL editor.
