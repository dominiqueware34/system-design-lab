# Spec: User Logins (Google OAuth)

**Status:** P0–P2 implemented (Supabase) — see `docs/setup-auth.md`  
**Owner:** Product / Full-stack  
**Auth provider:** Google only (v1) via **Supabase Auth** (not Auth.js/Clerk)  
**App:** System Design Lab (Next.js App Router)

> **Implementation note (2026):** Shipped on `@supabase/ssr` + `/auth/callback` PKCE.
> Progress tables: `supabase/migrations/20260327120000_progress_tables.sql`.
> APIs: `/api/progress/campaign|training|merge`. UI: `AuthHeader`, soft prompts.
> P3 (rate-limit AI by userId) remains out of scope.

---

## 1. Problem

Progress (campaign stars, training completion, later: saved designs) is **localStorage-only**. Users lose progress across devices; we cannot personalize, limit abuse of AI endpoints, or charge subscriptions.

We need **Google Sign-In** as the only auth method for v1 (lowest friction for engineers).

---

## 2. Goals

| Goal | Notes |
|------|--------|
| One-click Google login | No email/password forms v1 |
| Persist identity server-side | Session cookie |
| Gate premium / AI later | Auth is prerequisite for billing |
| Sync progress | Campaign + training (and optional designs) |
| Secure by default | HTTP-only cookies, CSRF for mutations |

### Non-goals (v1)

- Email/password, magic link, GitHub, Apple  
- Organization / team SSO  
- Full RBAC (admin vs user beyond `role` field stub)  
- Account deletion self-serve UI (support path OK)

---

## 3. User stories

1. **As a new user**, I click **Continue with Google**, grant consent, land on campaign or last page with an account created.
2. **As a returning user**, I sign in and see my **campaign progress** and **training completions**.
3. **As a signed-out user**, I can still use free practice with localStorage, but see a soft prompt to save progress.
4. **As a signed-in user**, I can **Sign out** from the header.
5. **As the product**, AI evaluate/wrench routes can later require auth + rate limits per `userId`.

---

## 4. Recommended stack

Aligned with current Next.js app:

| Piece | Choice | Why |
|-------|--------|-----|
| Auth library | **Auth.js (NextAuth v5)** *or* **Clerk** | Auth.js = flexible/self-host; Clerk = faster UI |
| Provider | Google OAuth 2.0 | Spec requirement |
| Session | JWT session cookie (Auth.js) or Clerk session | Stateless edge-friendly |
| User DB | **Postgres** (Neon/Supabase) or start with **Auth.js adapter + Prisma** | Need durable users |
| Progress store | Same DB tables | Replace localStorage as source of truth when logged in |

**Recommendation for speed:** **Auth.js v5 + Google + Prisma + Postgres**.  
**Recommendation for minimum code:** **Clerk Google social** + sync progress via webhook/`userId`.

This spec is written **provider-agnostically** with Auth.js as the default concrete path.

---

## 5. Google Cloud setup

1. Create project in [Google Cloud Console](https://console.cloud.google.com/).
2. Configure OAuth consent screen (External, app name “System Design Lab”).
3. Create **OAuth 2.0 Client ID** (Web application).
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - production origin e.g. `https://yourdomain.com`
5. Authorized redirect URIs:
   - Auth.js: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Store secrets in env (never client):

```bash
AUTH_SECRET=           # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_URL=http://localhost:3000   # or production URL
DATABASE_URL=                    # if using DB adapter
```

---

## 6. Data model

### 6.1 Auth tables (Auth.js Prisma adapter)

- `User` — id, name, email, emailVerified, image  
- `Account` — provider, providerAccountId, tokens  
- `Session` — if database sessions (optional if JWT)  
- `VerificationToken` — unused for Google-only but standard  

### 6.2 App tables

```sql
-- Campaign progress (replaces sdl-campaign-progress-v1)
CREATE TABLE campaign_progress (
  user_id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  completed_level_ids TEXT[] NOT NULL DEFAULT '{}',
  stars JSONB NOT NULL DEFAULT '{}',
  wrenches_survived INT NOT NULL DEFAULT 0,
  last_played_level_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training progress
CREATE TABLE training_progress (
  user_id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  last_lesson_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: saved designs
CREATE TABLE saved_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_id TEXT,
  graph JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.3 Migration from localStorage

On first successful login client-side:

1. Read `sdl-campaign-progress-v1` and `sdl-training-progress-v1`.
2. `POST /api/progress/merge` with payloads.
3. Server **union-merges** completed ids and max(stars); never deletes remote progress blindly.
4. Clear or keep local as offline cache (prefer keep as write-through cache).

---

## 7. API / routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/[...nextauth]` | * | — | Auth.js handlers |
| `/api/progress/campaign` | GET | required | Load campaign progress |
| `/api/progress/campaign` | PUT | required | Save campaign progress |
| `/api/progress/training` | GET/PUT | required | Training progress |
| `/api/progress/merge` | POST | required | Merge local → server |

Session helper:

```ts
// lib/auth.ts
export async function requireUser() // throws/redirects if anonymous
export async function getOptionalUser()
```

---

## 8. UI

### 8.1 Header (global)

- Signed out: **Continue with Google** button (Google brand guidelines).
- Signed in: avatar + name dropdown → Sign out.
- Optional: email string truncated.

### 8.2 Where to place CTA

- Home hero (secondary to Play campaign).
- Campaign map: “Sign in to save progress across devices”.
- Soft modal after first lesson complete / first level clear (dismissible).

### 8.3 Middleware (optional v1)

Protect only account pages if added; **do not** force auth on `/`, `/training`, `/campaign` free tiers.

Future: protect `/api/evaluate` and `/api/wrench` behind auth + quota.

---

## 9. Security requirements

| Requirement | Detail |
|-------------|--------|
| Secrets | Server-only env; never `NEXT_PUBLIC_` for client secret |
| Cookies | `Secure`, `HttpOnly`, `SameSite=Lax` in production |
| CSRF | Auth.js handles OAuth; mutate APIs check session |
| Scopes | Google: `openid email profile` only |
| Rate limit | Per IP on auth callback; per userId on AI routes later |
| Data | Don’t log OAuth tokens |

---

## 10. UX copy

- Button: **Continue with Google**  
- Merge banner: “We found progress on this device. Merged into your account.”  
- Sign out: “Sign out”  

---

## 11. Testing

| Case | Expected |
|------|----------|
| New Google user | User row created; empty progress |
| Returning user | Session restored; progress loaded |
| Merge local + remote | Union of completions; higher stars win |
| Sign out | Cookie cleared; local cache optional |
| Invalid/revoked Google | Error page + retry |
| Production redirect URI mismatch | Fail closed with clear log |

Manual checklist: Chrome + Safari; localhost + preview deploy.

---

## 12. Rollout plan

| Phase | Work | Est. |
|-------|------|------|
| **P0** | Auth.js + Google + session in header | 0.5–1 d |
| **P1** | Postgres + progress tables + merge | 1–2 d |
| **P2** | Soft prompts on campaign/training save | 0.5 d |
| **P3** | Rate-limit AI by userId | 0.5 d |
| **P4** | Stripe customer link by userId (billing, separate spec) | — |

---

## 13. Acceptance criteria

1. User can sign in with Google on local and production.
2. Session persists across refresh.
3. Sign out works.
4. Campaign + training progress for signed-in users round-trip via API.
5. First login merges prior localStorage without data loss.
6. No Google client secret in browser bundle.
7. Anonymous users still use free practice without forced login.

---

## 14. Open questions

- Clerk vs Auth.js for v1 speed vs lock-in?  
- Require login before AI wrench/evaluate (cost control) — when?  
- Legal: privacy policy + terms URLs required for Google consent screen in production.

---

## 15. References

- [Google OAuth web](https://developers.google.com/identity/protocols/oauth2)  
- [Auth.js Google provider](https://authjs.dev/getting-started/providers/google)  
- Current client progress: `src/lib/campaign.ts`, `src/lib/training-lessons.ts` (`localStorage`)
