# Auth + progress sync setup (Supabase + Google)

This app uses **Supabase Auth** (`@supabase/ssr`) with **Google OAuth only** for v1. Progress APIs and UI soft prompts depend on a configured project.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy **Project URL** and **publishable** (or legacy **anon**) key into `.env.local` (see `.env.example`).
3. Do **not** put the **service role** key in `NEXT_PUBLIC_*` or the browser.

## 2. Enable Google provider

1. Supabase Dashboard → **Authentication → Providers → Google** → enable.
2. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/):
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000` (+ production origin)
   - Authorized redirect URIs: **only** the Supabase callback:
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. Paste Google **Client ID** and **Client Secret** into the Supabase Google provider form (secrets stay on Supabase — never in this repo).
4. Supabase **Authentication → URL configuration**:
   - **Site URL**: `http://localhost:3000` (or production)
   - **Redirect URLs** allowlist: `http://localhost:3000/**`, production `https://yourdomain.com/**`
5. App callback route is `/auth/callback` (PKCE exchange already implemented).

## 3. Progress tables (SQL)

Run the migration in the Supabase **SQL Editor** (or CLI):

```text
supabase/migrations/20260327120000_progress_tables.sql
```

Creates `campaign_progress` and `training_progress` with **RLS** (authenticated users select/insert/update **own** rows only).

## 4. Local env

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Missing Supabase env: pages still load; auth chrome is hidden; localStorage progress works offline.

## 5. Smoke test

1. Open app → **Continue with Google** (top-right).
2. After consent, land on `next` path (default campaign).
3. Complete a training lesson or campaign level while signed out → soft banner.
4. Sign in with local progress present → merge toast; map/lessons show unioned progress.
5. Sign out → session cleared; local cache remains.

## Out of scope

- Rate-limiting AI routes by `userId` (P3)
- Billing / Stripe (P4)
- Email/password or other OAuth providers
