# Spec: Supabase Auth (Google OAuth)

**Status:** Draft (reviewed against Supabase SSR + Next.js 16 docs)  
**Owner:** Full-stack  
**Auth provider:** Supabase Auth (Google OAuth primary; magic link optional stretch)  
**App:** System Design Lab (Next.js App Router + TypeScript)  
**Supersedes (provider choice):** `docs/specs/google-auth.md` — that draft recommended Auth.js/Clerk + Google only. **This spec is the source of truth for auth stack.**  
**Depends on (later):** [save-game-progress.md](./save-game-progress.md)  
**Related:** localStorage keys `sdl-campaign-progress-v1`, `sdl-training-progress-v1`

> **Note:** There is no Supabase MCP connected in this workspace. Review used official Supabase docs + this repo’s Next.js 16 docs under `node_modules/next/dist/docs/`.

---

## 0. Review findings (docs-aligned corrections)

Compared to the first draft, the following **must** be true for implementation on this stack:

| Topic | Old draft | Correct (current docs) |
|-------|-----------|------------------------|
| Next.js edge file | `middleware.ts` + `export function middleware` | **`proxy.ts` + `export function proxy`** — Next.js 16 deprecated the middleware file convention (rename only; same role). Supabase Next.js guides now say **Proxy**. |
| Session refresh call | `supabase.auth.getUser()` only | Prefer **`supabase.auth.getClaims()`** in Proxy to refresh/validate the session. Use **`getUser()`** when you need a fresh user row from Auth. **Never trust `getSession()` alone** for authorization on the server. |
| Cookie `setAll` | One-arg cookie setter | `setAll(cookiesToSet, headers)` — **apply cache headers** (`Cache-Control`, `Expires`, `Pragma`) on the Proxy response so CDNs don’t leak sessions. |
| App user table | `public.profiles` | **`public.user`** — auto-created on Google (and any) signup via `auth.users` trigger. |
| Env key name | only `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prefer **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (current Supabase docs). Keep `ANON_KEY` as alias during migration if needed. |
| OAuth callback | simple `origin` redirect | Production should honor **`x-forwarded-host`** behind Vercel/load balancers (official Google OAuth Next.js sample). |
| `prompt: "consent"` always | Forced in sketch | **Do not** force `prompt: consent` every login unless you need Google refresh tokens for Gmail/Drive APIs. Default Google sign-in only needs identity. |

---

## 1. Problem

Campaign and training progress are **localStorage-only**:

| Key | Module |
|-----|--------|
| `sdl-campaign-progress-v1` | `src/lib/campaign.ts` |
| `sdl-training-progress-v1` | `src/lib/training-lessons.ts` |

Limits:

1. **Device-bound** — clear browser data or switch laptop → progress gone.
2. **No durable identity** — cannot personalize, bill, or rate-limit AI (`/api/evaluate`, `/api/wrench`) per user.
3. **No multi-device sync** — core learning product promise is incomplete.
4. **No server-side ownership** — designs, progress, and future subscriptions need a stable `user_id`.

We need **authenticated identity** with low friction for engineers (Google one-click), SSR-friendly sessions on Next.js App Router, and a clear path to attach progress sync later.

---

## 2. Goals

| Goal | Success signal |
|------|----------------|
| One-click **Continue with Google** | Consent → session cookie → header shows user |
| SSR-safe session | **Proxy** refreshes cookies; Server Components can read claims/user |
| Anonymous still works | Free practice / campaign / training without forced login |
| App user row per signup | **`public.user` created automatically** on first Google (or any) signup |
| Secure by default | RLS, no service-role in client, HTTP-only cookies, no CDN session cache leak |
| Progress-ready identity | `auth.users.id` / `public.user.id` ready for save-progress spec |

### Non-goals (v1)

- Email/password forms
- Full organization / team SSO / SAML
- Full RBAC beyond a stub `role` on `public.user`
- Self-serve account deletion UI (support path OK)
- Implementing cloud progress tables/APIs end-to-end (see save-progress)
- Replacing localStorage as offline cache in this auth-only milestone
- Magic link as required path (optional stretch only)
- Google One Tap / FedCM (optional later)

---

## 3. User stories

1. **As a new user**, I click **Continue with Google**, grant consent, and land back on the app with an `auth.users` session **and** a `public.user` row created automatically.
2. **As a returning user**, I open the app and my session is restored without re-auth (cookie still valid / refreshed by Proxy).
3. **As a signed-out user**, I can still use campaign, training, and free practice via localStorage, and see a soft prompt to save progress across devices.
4. **As a signed-in user**, I can **Sign out** from the header; session cookies clear.
5. **As the product**, later AI and progress APIs can key rate limits and rows on `user.id` from Supabase Auth.
6. **As an engineer**, I can call `createClient()` on browser, Server Components, Route Handlers, and Proxy with one consistent `@supabase/ssr` pattern.

---

## 4. Recommended stack

| Piece | Choice | Why |
|-------|--------|-----|
| Auth | **Supabase Auth** | Hosted users, OAuth, RLS-ready Postgres |
| Client libs | **`@supabase/ssr` + `@supabase/supabase-js`** | Official cookie session pattern for App Router |
| Primary method | **Google OAuth (PKCE)** | Lowest friction; SSR-safe with code exchange |
| Stretch method | Magic link (email OTP) | Optional |
| Session | **Cookie-based** (not localStorage JWT) | Server Components + Proxy can refresh |
| Request interceptor | **Next.js 16 `proxy.ts`** | Replaces deprecated `middleware.ts` file convention |
| Hosting | Vercel (existing) | Align redirect URLs with preview + prod |
| Progress DB | Same Supabase Postgres (later) | One project for auth + app data |

**Package install:**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Why not Auth.js/Clerk for v1:** Supabase gives auth + Postgres + RLS in one project for progress sync and designs.

---

## 5. Supabase project setup

### 5.1 Dashboard

1. Create project at [https://supabase.com](https://supabase.com).
2. Note **Project URL** and **publishable / anon key** from Project Settings → API (or Connect dialog).
3. Keep **service_role** server-only; never ship to browser or `NEXT_PUBLIC_*`.
4. Enable Google provider; Email only if shipping magic-link stretch.

### 5.2 Google provider (Supabase + Google Cloud)

**Google Cloud / Google Auth Platform**

1. Create/select GCP project.
2. Configure **OAuth consent** (External; app name “System Design Lab”; support email; privacy/terms for production).
3. **Scopes:** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (Supabase defaults + openid).
4. Create **OAuth 2.0 Client ID** type **Web application**.
5. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - Production origin e.g. `https://yourdomain.com`
6. **Authorized redirect URIs** — Supabase callback (**not** the Next app path first):

   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   Local Supabase CLI (if used): `http://127.0.0.1:54321/auth/v1/callback`

7. Copy Client ID + Client Secret into **Supabase Dashboard → Authentication → Providers → Google**.

**Supabase → Authentication → URL Configuration**

| Setting | Dev | Prod |
|---------|-----|------|
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Redirect URLs allowlist | `http://localhost:3000/**` | `https://yourdomain.com/**`, preview if used |

App PKCE callback (after Supabase returns to the app):

```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 5.3 Auth settings (recommended)

| Setting | Value |
|---------|--------|
| JWT expiry | Default OK (Proxy refresh handles continuity) |
| Confirm email | Off for Google-only |
| Leaked password protection | N/A for Google-only |

---

## 6. Environment variables

```bash
# Public (safe in browser; RLS still required)
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co

# Prefer publishable key (current Supabase docs). Anon key still works if that is what the project shows.
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
# Alias for older tutorials / existing envs:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-or-legacy-anon-key>

# Server-only — never NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

In code, resolve key once:

```ts
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

Local: `.env.local` (gitignored). Vercel: Preview + Production.

---

## 7. File / layout proposal (`src/`)

```
src/
  lib/
    supabase/
      client.ts     # browser createBrowserClient
      server.ts     # server createServerClient (cookies from next/headers)
      proxy.ts      # updateSession helper used by root proxy.ts
  proxy.ts          # Next.js 16 Proxy: session refresh only (no force-login)
  app/
    auth/
      callback/
        route.ts    # OAuth PKCE code exchange → session cookies
  components/
    auth/
      AuthButton.tsx
      SoftAuthPrompt.tsx
```

> **Next.js 16:** `middleware.js` is **deprecated and renamed to `proxy.js`**. Export `proxy` (or default), not `middleware`. Codemod: `npx @next/codemod@canary middleware-to-proxy .`

### 7.1 Browser client — `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 7.2 Server client — `src/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component cannot always write cookies.
            // Proxy is responsible for refreshing the session.
          }
        },
      },
    }
  );
}

/** Claims for lightweight auth checks (JWT validated). */
export async function getOptionalClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

/** Fresh user record from Auth server when needed. */
export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getOptionalUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
```

**Auth method cheat sheet (Supabase docs):**

| Method | Use |
|--------|-----|
| `getClaims()` | Protect pages / verify identity (JWT signature / JWKS). Preferred in Proxy for refresh. |
| `getUser()` | Need up-to-date user record from Auth API (network). |
| `getSession()` | Need access/refresh tokens only — **do not** trust embedded user for authz. |

### 7.3 Proxy session refresh (critical)

Server Components **cannot write cookies**. Proxy must refresh expired tokens and write cookies on the response before pages render.

**`src/lib/supabase/proxy.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Always create a new client per request (do not put in a global).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          // Required: prevent CDN/cache from serving another user's session.
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  // Do not run logic between createServerClient and getClaims().
  // Removing getClaims() can randomly log users out under SSR.
  await supabase.auth.getClaims();

  // IMPORTANT: return this response object (cookies already attached).
  // If you construct a new NextResponse, copy cookies from supabaseResponse.
  return supabaseResponse;
}
```

**`src/proxy.ts`** (project root under `src/` since app lives in `src/app`)

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Refresh session on app routes; skip static assets.
     * Do NOT force-login; only keep cookies fresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Policy:** Proxy **refreshes** sessions only. It does **not** redirect anonymous users away from `/`, `/campaign`, `/training`, `/design/*`. Protect only future account-only routes if added.

**Next.js note:** Proxy is for optimistic checks / cookie refresh — not slow data fetching or full authorization. Always re-check with `getClaims()` / `getUser()` in Server Components, Server Actions, and Route Handlers that touch private data.

### 7.4 Auth callback — `src/app/auth/callback/route.ts`

PKCE: after Google → Supabase → app with `?code=`, exchange code for session cookies.

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/campaign";
  // Prevent open redirects — relative path only
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/campaign";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Vercel / reverse proxy: prefer forwarded host in production
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
```

On successful first-time Google signup:

1. Supabase inserts into **`auth.users`**.
2. Trigger **`on_auth_user_created`** inserts into **`public.user`** (see §8).
3. Session cookies are set; Proxy keeps them fresh thereafter.

### 7.5 Sign-in / sign-out (client)

```ts
"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(nextPath = "/campaign") {
  const supabase = createClient();
  const origin = window.location.origin;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      scopes: "openid email profile",
      // Only add offline + prompt:consent if you need Google API refresh tokens
      // for Drive/Gmail — not required for identity-only login.
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.assign("/");
}
```

### 7.6 Optional AuthProvider

Pass user from RSC layout into a thin client header for v1, **or** use `onAuthStateChange` if many client islands need live state.

### 7.7 Optional magic link (stretch)

```ts
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${origin}/auth/callback?next=/campaign`,
  },
});
```

---

## 8. Data model: `public.user` + RLS

Supabase manages **`auth.users`**. App code never writes that table from the client.

### 8.1 Requirement: auto-create app user on Google signup

**Acceptance rule:** Every successful Google signup (and any other auth method) **must** create a matching row in **`public.user`** with `id = auth.users.id`, without an extra client round-trip.

Preferred mechanism: **Postgres trigger on `auth.users` AFTER INSERT** (`security definer`). This covers Google OAuth, magic link, and future providers equally. Do not rely only on a client-side insert after OAuth (racey, can fail if RLS blocks, easy to forget).

### 8.2 Table `public.user`

> PostgreSQL reserves `USER`; create the table as **`public."user"`** (quoted). Supabase/PostgREST exposes it as schema table `user` → `.from("user")`.

```sql
-- App-facing user profile (1:1 with auth.users)
create table public."user" (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_email_idx on public."user" (email);

alter table public."user" enable row level security;

create policy "user_select_own"
  on public."user" for select
  to authenticated
  using (auth.uid() = id);

create policy "user_update_own"
  on public."user" for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Optional safety net if trigger fails once; primary insert path is the trigger
create policy "user_insert_own"
  on public."user" for insert
  to authenticated
  with check (auth.uid() = id);
```

### 8.3 Auto-create on signup (Google included)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."user" (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Fires for Google OAuth first signup and every other auth method
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Google metadata fields** commonly present: `full_name` / `name`, `avatar_url` / `picture`, `email`.

**Backfill** (existing auth users without app row):

```sql
insert into public."user" (id, email, display_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
on conflict (id) do nothing;
```

### 8.4 TypeScript shape

```ts
export type AppUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

// supabase.from("user").select("*").eq("id", userId).single()
```

### 8.5 Progress tables (out of scope detail)

Owned by [save-game-progress.md](./save-game-progress.md). Auth guarantees stable `user_id` = `auth.uid()` = `public.user.id`. Progress FKs may reference `auth.users(id)` or `public."user"(id)` — pick one and stay consistent (recommend `auth.users` for cascade with auth deletion, or `public."user"` if you want app-layer ownership).

---

## 9. Auth identity ↔ future progress sync

| Layer | Responsibility |
|-------|----------------|
| **This spec** | Identity, Proxy cookie refresh, `public.user`, UI sign-in/out |
| **save-progress** | Server tables, merge of localStorage → cloud, autosave graphs |

**Contract:**

1. **User key:** `auth.users.id` UUID = `public.user.id`.
2. Local keys remain until save-progress: `sdl-campaign-progress-v1`, `sdl-training-progress-v1`.
3. First login after save-progress ships: merge local → cloud (union completions, max stars).
4. Until then: localStorage remains SoT even when signed in; auth still valuable for rate limits.
5. Do not block shipping Google login on full progress sync.

---

## 10. UI placement

### 10.1 Global header

| State | UI |
|-------|-----|
| Signed out | **Continue with Google** |
| Signed in | Avatar + name; menu → **Sign out** |
| Loading | Skeleton / disabled button |

Copy:

- Button: **Continue with Google**
- Error `?auth_error=1`: “Sign-in failed. Try again.”
- Soft prompt: “Sign in to save progress across devices.”

### 10.2 Soft prompts (not hard gates)

Campaign map, training hub, home secondary CTA. Never block `/`, `/campaign`, `/training`, `/design/*`.

### 10.3 Proxy vs UI vs Route Handlers

- Proxy: refresh cookies only.
- UI: opt-in CTAs.
- API routes: later gate evaluate/wrench by session + quota.

---

## 11. Security

| Requirement | Detail |
|-------------|--------|
| RLS | Enable on `public.user` and all app tables; policies use `auth.uid()` |
| Service role | Never in client bundle or `NEXT_PUBLIC_*` |
| Anon/publishable key | Public by design; security is RLS + Auth |
| CDN / cache | Apply `setAll` **headers** in Proxy; avoid caching authenticated HTML with `Set-Cookie` |
| Cookies | Managed by `@supabase/ssr`; production Secure + HttpOnly + SameSite=Lax |
| CSRF | SameSite + OAuth state/PKCE; mutations check `getClaims`/`getUser` |
| Open redirect | Validate `next` on `/auth/callback` (relative path only) |
| Scopes | Google: openid email profile only |
| Tokens | Never log access/refresh tokens |
| XSS | Session in cookies only, not localStorage |
| Admin role | Stub; never trust client-sent role for authz |

---

## 12. Testing checklist

| Case | Expected |
|------|----------|
| New Google user | `auth.users` + **`public.user`** row; header shows identity |
| Returning user | Session restored after full page reload |
| Proxy refresh | Stale access token refreshed; user still signed in |
| Sign out | Cookies cleared; Continue with Google shown |
| Callback without code | `auth_error` redirect |
| Open redirect attempt | Safe fallback path |
| Anonymous browse | Campaign/training/design work; localStorage unchanged |
| Production behind Vercel | `x-forwarded-host` redirect correct |
| Safari + Chrome | First-party cookies work |
| No service role in browser | Bundle / network clean |
| Trigger failure simulation | Optional insert-own policy or ops alert; user not silently half-created |
| CDN safety | Responses that set auth cookies not publicly cached |

Manual: localhost Google OAuth + one production (or staging) deploy.

---

## 13. Rollout phases

| Phase | Scope | Est. |
|-------|--------|------|
| **P0** | Supabase project, Google provider, env vars, `lib/supabase/*`, **`proxy.ts`**, `/auth/callback` | 0.5–1 d |
| **P1** | **`public.user` + trigger + RLS**; header Continue with Google / Sign out | 0.5–1 d |
| **P2** | Soft prompts on campaign (+ training) | 0.5 d |
| **P3** | Optional magic link | 0.5 d |
| **P4** | save-progress integration — separate spec | 1–2 d |
| **P5** | Rate-limit AI by `user.id` | 0.5 d |

### Implementation checklist

Work phases in order. Check boxes as you complete them. Do not start **P1 UI** before **P0 callback** works on localhost.

#### P0 — Project + SSR clients + OAuth round-trip

**Supabase / Google console**

- [ ] Create Supabase project; note region
- [ ] Copy Project URL + publishable/anon key
- [ ] Create Google OAuth Web client (GCP / Google Auth Platform)
- [ ] Set Google authorized redirect URI to `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Enable Google provider in Supabase; paste Client ID + Secret
- [ ] Set Site URL = `http://localhost:3000`
- [ ] Add redirect allowlist: `http://localhost:3000/**` and `/auth/callback`

**App env + packages**

- [ ] `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Add `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `ANON_KEY`)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` server-only if needed later (not required for pure OAuth UI)
- [ ] Document keys in `.env.example` (no secrets)
- [ ] Confirm service role is **not** prefixed `NEXT_PUBLIC_`

**Clients + Proxy**

- [ ] Create `src/lib/supabase/client.ts` (`createBrowserClient`)
- [ ] Create `src/lib/supabase/server.ts` (`createServerClient` + `cookies()`; `getOptionalUser` / `getOptionalClaims`)
- [ ] Create `src/lib/supabase/proxy.ts` (`updateSession` with `getClaims()` + `setAll` cache headers)
- [ ] Create `src/proxy.ts` calling `updateSession`; matcher skips static assets
- [ ] Create `src/app/auth/callback/route.ts` with `exchangeCodeForSession`, safe `next`, `x-forwarded-host`
- [ ] Smoke: `npm run dev` boots with no env/runtime errors on `/`

**OAuth smoke (still no header UI required)**

- [ ] Temporary button or console path: `signInWithOAuth({ provider: "google", redirectTo: …/auth/callback })`
- [ ] Complete Google consent → land on app with session cookies set
- [ ] Hard refresh → still signed in (`getClaims` / `getUser` returns user)
- [ ] Sign out path clears session

**P0 exit:** OAuth login + session persist + sign out work on localhost without `public.user` yet.

#### P1 — `public.user` + header auth chrome

**SQL**

- [ ] Run migration: `create table public."user" (…)` + indexes
- [ ] Enable RLS + select/update/(optional insert) own-row policies
- [ ] Create `handle_new_user()` security definer + `on_auth_user_created` trigger on `auth.users`
- [ ] Backfill existing `auth.users` into `public."user"` if any test users exist
- [ ] Verify: new Google signup creates row in Table Editor (`public.user`)

**UI**

- [ ] `components/auth/AuthButton.tsx` — Continue with Google / avatar + Sign out
- [ ] Wire button into shared header or home + campaign + training shells
- [ ] Loading state avoids wrong CTA flash
- [ ] Handle `?auth_error=1` message on home or layout
- [ ] Optional: RSC passes user into header to avoid global provider

**P1 exit:** Every new Google user has `public.user`; header shows identity; sign out works.

#### P2 — Soft prompts (no hard gates)

- [ ] `SoftAuthPrompt.tsx` (dismissible sessionStorage or localStorage flag)
- [ ] Campaign map: show when signed out (after progress or first level)
- [ ] Training hub: show after first lesson complete
- [ ] Home: secondary “Sign in to save progress” near Play campaign
- [ ] Confirm anonymous flows still fully playable

**P2 exit:** Soft CTAs only; no forced login on free tier routes.

#### P3 — Magic link (optional)

- [ ] Enable Email provider in Supabase
- [ ] Configure email templates / SMTP if needed
- [ ] UI: email field + “Send magic link”
- [ ] Same `/auth/callback` path; confirm `public.user` still auto-created
- [ ] Skip if shipping Google-only

#### P4 — Hand off to save-progress

- [ ] Confirm auth session available to client (`createClient`) and server (`createClient` server)
- [ ] Follow [save-game-progress.md](./save-game-progress.md) implementation checklist (starts at Progress P1)
- [ ] Optional post-login hook point reserved for merge (do not implement merge in auth PR)

#### P5 — AI rate limits by user

- [ ] In `/api/evaluate` and `/api/wrench`: `getUser()` / `getClaims()`; attach `user.id`
- [ ] Per-user rate limit (in-memory, Upstash, or Supabase table)
- [ ] Decide product: soft limit vs hard require-auth (open question)
- [ ] Anonymous path policy documented and implemented

#### Production cutover (any phase once ready)

- [ ] Vercel env vars for Production (+ Preview if used)
- [ ] Supabase Site URL + redirect allowlist production domain
- [ ] Google OAuth origins + production Supabase callback still correct
- [ ] Privacy/terms URLs for Google consent if required
- [ ] Manual smoke: Chrome + Safari login/logout on prod URL

---

## 14. Acceptance criteria

1. User can sign in with **Google** on localhost and production.
2. Session **persists** across refresh (Proxy + cookies + `getClaims`).
3. **Sign out** clears session and updates header.
4. **Every new Google signup** creates **`public.user`** with `id = auth.users.id` automatically (trigger), no client-only insert required.
5. Anonymous users retain full free-tier UX with localStorage keys unchanged.
6. No Google client secret or service role in the browser bundle.
7. OAuth callback uses PKCE code exchange via `/auth/callback`.
8. Soft prompt visible on campaign when signed out (dismissible).
9. Implementation uses **`src/proxy.ts`**, not deprecated middleware export name.
10. This document remains the provider source of truth.

---

## 15. Open questions

1. Force auth on AI routes (`/api/evaluate`, `/api/wrench`) in the same milestone or only after quotas?
2. Vercel preview URLs — allowlist wildcards vs disable Google login on previews?
3. Magic link in v1 launch or post-GA?
4. Legal — privacy policy + terms for Google OAuth consent production?
5. Display name source — Google `full_name` vs email local-part fallback? (spec defaults to coalesce chain)
6. Admin role — first admin via SQL only vs env allowlist?
7. Table name: keep quoted `"user"` vs rename to `app_user` for SQL ergonomics? **Product decision locked to `public.user` unless we revisit.**

---

## 16. References

### External (authoritative for this review)

- [Supabase Auth Server-Side Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — Proxy, `getClaims`, cookie `setAll` headers
- [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) — PKCE callback sample with `x-forwarded-host`
- [Advanced SSR / CDN caching](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Next.js 16 in this repo: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` (deprecated → proxy), `.../proxy.md`, `01-getting-started/16-proxy.md`

### Internal

- Historical Auth.js/Clerk draft: `docs/specs/google-auth.md`
- Campaign progress: `src/lib/campaign.ts`
- Training progress: `src/lib/training-lessons.ts`
- Save progress: `.vscode/specs/save-game-progress.md`

---

## Appendix A: Env checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `ANON_KEY`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server secrets only)
- [ ] Google OAuth Client ID/Secret in Supabase dashboard
- [ ] Site URL + redirect allowlist include `/auth/callback`
- [ ] Google Cloud redirect = `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] SQL: `public."user"` + `handle_new_user` trigger deployed

## Appendix B: Sequence (happy path)

```
User clicks Continue with Google
  → signInWithOAuth({ provider: "google", redirectTo: /auth/callback?next=... })
  → Google consent
  → Supabase /auth/v1/callback
  → App /auth/callback?code=...
  → exchangeCodeForSession(code) → set cookies
  → auth.users INSERT (new user)
  → trigger handle_new_user → INSERT public."user"
  → redirect to /campaign (or next)
  → proxy.ts getClaims() keeps session cookies fresh
```

## Appendix C: Review delta summary

| Area | Action |
|------|--------|
| Middleware naming | **Changed** → Proxy (`src/proxy.ts`) |
| `getUser` in edge refresh | **Changed** → `getClaims()` in Proxy |
| Cache headers on cookie write | **Added** |
| App table | **Changed** → `public.user` with auto-create trigger |
| Callback production host | **Added** `x-forwarded-host` |
| Forced Google consent | **Removed** for identity-only login |
| Progress FKs | Unchanged ownership by save-progress; align with `public.user.id` |
