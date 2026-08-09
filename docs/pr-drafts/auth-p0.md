# feat(auth): Supabase SSR clients, proxy session refresh, OAuth callback (P0)

**Branch:** `feat/auth-supabase-p0` → `main`  
**Compare:** https://github.com/dominiqueware34/system-design-lab/compare/main...feat/auth-supabase-p0?expand=1

## Summary

Auth **P0** only: wire Supabase cookie-based SSR so Google OAuth can land in a later PR without rewriting the session layer.

- Install `@supabase/supabase-js` + `@supabase/ssr`
- Browser + server clients (`src/lib/supabase/*`)
- Next.js 16 **`src/proxy.ts`** session refresh via `getClaims()` (not deprecated middleware)
- PKCE callback at `/auth/callback` with safe `next` + `x-forwarded-host`
- Document env vars in `.env.example`

**Out of scope (follow-up PRs):** header “Continue with Google” UI, `public.user` table/trigger, soft prompts, progress sync.

## Files (9)

| File | Role |
|------|------|
| `package.json` / lock | Supabase deps |
| `.env.example` | URL + publishable/anon key placeholders |
| `.gitignore` | allow committing `.env.example` |
| `src/lib/supabase/client.ts` | browser client |
| `src/lib/supabase/server.ts` | server client + helpers |
| `src/lib/supabase/proxy.ts` | `updateSession` |
| `src/proxy.ts` | Next proxy entry |
| `src/app/auth/callback/route.ts` | code exchange |

## Test plan

### Setup (required for live OAuth)

- [ ] Create a Supabase project
- [ ] Enable **Google** provider; set Google redirect to `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Supabase Auth URL config: Site URL `http://localhost:3000`, allowlist `http://localhost:3000/**`
- [ ] Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` + publishable/anon key
- [ ] `npm install` && `npm run dev`

### Automated / static

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds (or only fails on unrelated pre-existing issues)
- [ ] Confirm no `SUPABASE_SERVICE_ROLE_KEY` under `NEXT_PUBLIC_*`
- [ ] Confirm `src/proxy.ts` exports `proxy` (not `middleware`)

### Session plumbing (without full UI)

- [ ] Dev server starts with env present (no crash on `/`)
- [ ] Temporary smoke:
  ```ts
  const supabase = createClient() // from @/lib/supabase/client
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${location.origin}/auth/callback?next=/` },
  })
  ```
- [ ] After Google consent, session cookies set
- [ ] Hard refresh → still signed in
- [ ] `signOut()` clears session
- [ ] Bad `next` (`//evil.com`) rejected; missing `code` → error redirect
