# Artifact 1 / #16 — App nav + route shells

**Branch:** `feat/app-nav-mode-shells`  
**PR:** https://github.com/dominiqueware34/system-design-lab/pull/19  
**Closes:** #16  
**Commit:** `7a6b3cc`

## What shipped

| Surface | Route | Behavior |
| --- | --- | --- |
| Primary nav | all main pages | **Training \| Solo Mode \| Campaign \| Practice** (`AppNav`; hidden on `/design/*`) |
| Hub | `/` | Four mode cards + short CTAs (not the practice list) |
| Solo Mode | `/solo` | Legacy 15-level map (`CampaignMap`), personal progression labels |
| Campaign | `/campaign` | Guest: pitch + Google CTA; signed-in: season placeholder |
| Practice | `/practice` | Free practice problem picker (moved from `/`) |
| Design deep links | `/design/[id]?solo=` | Prefer `?solo=`; accept legacy `?campaign=` as Solo alias |
| Back links | canvas chrome | Solo map → `/solo`; free practice → `/practice` |

## Files changed

**New**
- `src/components/nav/AppNav.tsx`
- `src/components/practice/ProblemPicker.tsx`
- `src/app/solo/page.tsx`
- `src/app/practice/page.tsx`

**Updated**
- `src/app/layout.tsx` — mount `AppNav`
- `src/app/page.tsx` — mode hub
- `src/app/campaign/page.tsx` — competitive shell (not map)
- `src/app/design/[problemId]/page.tsx` — `solo` + legacy `campaign` params
- `src/components/canvas/DesignWorkspace.tsx` — back/continue → `/solo` or `/practice`
- `src/components/campaign/CampaignMap.tsx` — Solo Mode copy
- `src/lib/campaign.ts` — `campaignHref` → `?solo=` + `/solo`; `soloHref` alias
- `src/lib/auth-client.ts`, auth callback, `AuthHeader`, `SignInPrompt` — safer post-auth defaults
- `src/app/training/page.tsx` — footer links; drop redundant Home bar
- `docs/brain/FEATURES.md` — nav/routes inventory

## How to test

```bash
npm install
npm run dev
# open http://localhost:3000
```

1. **Hub `/`** — four cards (Training, Solo Mode, Campaign, Practice); top nav has four tabs.
2. **Practice** — click Practice tab or card → problem list; open a problem → canvas; **Problems** back → `/practice`.
3. **Solo** — `/solo` shows Architecture Trail; open unlocked level → URL contains `?solo=<levelId>`; **Map** back → `/solo`.
4. **Legacy alias** — visit e.g. `/design/url-shortener?campaign=w1-l1` (valid level/problem pair) → Solo wrench flow still works.
5. **Campaign** — `/campaign` is **not** the map. Guest: pitch + Continue with Google. Signed-in: placeholder + links to Solo/Practice.
6. **Training** — still loads lessons/guided; nav can switch modes.

## Risks / notes

- Progress storage keys remain `sdl-campaign-progress-v1` / API path `/api/progress/campaign` (legacy naming); Solo multi-problem (#11) can rename later.
- Internal prop still named `campaignLevelId` in `DesignWorkspace` to avoid churning wrench/progress code; user-facing labels say Solo.
- Competitive seasons still not runtime — only shell/CTA.
- After merge: clear #16 from BOARD/STATUS on **main** (claim hygiene).

## Acceptance checklist

- [x] Four nav tabs on main surfaces  
- [x] Practice list at `/practice`  
- [x] Solo map playable at `/solo`  
- [x] `/campaign` is not the old solo map labeled as competitive campaign  
- [x] Guests on `/campaign` get sign-in CTA  
- [x] FEATURES.md updated for nav/routes  
- [x] Commits on `feat/app-nav-mode-shells`  
- [x] PR to main linking #16  
