# Manual end-to-end test plan

> **Owner:** you (human)  
> **When:** after major merges, before a live season, or when BOARD Phase 0 says so  
> **Scope:** all shipped product paths on `main` (see `docs/brain/FEATURES.md`)  
> **Style:** manual browser QA. Mark each row Pass / Fail / Skip.

---

## How to use this plan

1. Copy the **Results log** section into a note (or edit this file in a branch).
2. Run **Setup** once per environment.
3. Run sections **A → L** in order when possible. You may skip AI-heavy rows with **Skip** if cost is a concern; note why.
4. One browser profile for **Guest**. A second window/profile for **Signed-in** (or sign out/in carefully).
5. Failures: record route, steps, expected vs actual, console/network errors. Do not “fix later” without a note.

### Pass criteria

| Level | Meaning |
| --- | --- |
| **Ship green** | All **P0** rows Pass. No P0 Fail. |
| **Season ready** | Ship green + all **Campaign** P0 + live season + freeze sample. |
| **Full audit** | All P0 + P1 Pass. P2 optional. |

---

## Setup (once)

### Environment

| # | Check | Pass? |
| --- | --- | --- |
| S1 | `.env.local` has `XAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | |
| S2 | `SUPABASE_SERVICE_ROLE_KEY` set for seed + Campaign server APIs | |
| S3 | Supabase migrations applied (progress + campaign season tables) | |
| S4 | `npm run dev` starts without crash | |
| S5 | Open `http://localhost:3000` — hub loads | |

### Optional clean slate

| # | Action | When |
| --- | --- | --- |
| C1 | DevTools → Application → Local Storage → clear site keys starting with `sdl-` | Guest progress isolation |
| C2 | Sign out if a session remains | Guest path purity |

### Live season (required for section G–H)

Seed creates a **draft** only. You must **promote to live** in Supabase (SQL or Table Editor).

```bash
# Validate fixture
npm run seed:season -- --dry-run

# Upsert draft season + 20 prompts (service role required)
npm run seed:season
```

Then in Supabase SQL (adjust times):

```sql
-- Make draft season live for ~3 days (effective status uses starts_at / ends_at)
UPDATE campaign_seasons
SET
  status = 'live',
  starts_at = now() - interval '1 hour',
  ends_at   = now() + interval '3 days'
WHERE slug = 'season-v1-draft';
```

| # | Check | Pass? |
| --- | --- | --- |
| S6 | `GET /api/campaign/seasons/current` returns a season (browser or curl while signed out) | |
| S7 | Signed-in `/campaign` shows live hub (timer, prompt list), not empty draft pitch only | |

### Freeze / ref-reveal sample (section H)

Use a **second** short season or temporarily shorten `ends_at`:

```sql
-- End the season now (timestamp effective status → ended)
UPDATE campaign_seasons
SET ends_at = now() - interval '1 minute'
WHERE slug = 'season-v1-draft';
```

Restore a live window after H tests if you still need play testing.

---

## Identity matrix

Use these personas across the plan.

| Persona | How | Use for |
| --- | --- | --- |
| **G Guest** | No Google session | Training, Practice, Solo, public LB, guest Campaign pitch |
| **A Auth** | Google via app chrome | Campaign play/submit, progress merge, `/me` stats |
| **A2 Second account** | Other Google user (optional) | Leaderboard multi-player |

---

## A. Hub, nav, chrome (P0)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| A1 | G | Open `/` | Four mode cards: Training, Solo, Campaign, Practice | P0 | |
| A2 | G | Click each card | Lands on `/training`, `/solo`, `/campaign`, `/practice` | P0 | |
| A3 | G | Use top nav tabs on those pages | Same four destinations; active state correct | P0 | |
| A4 | G | Open `/practice` → any problem → canvas | Nav **hidden** on `/design/*` | P0 | |
| A5 | G | Use back / mode link from canvas | Practice → `/practice`; Solo → `/solo`; season → `/campaign` | P0 | |

---

## B. Training — lessons (P0 sample + P1 full)

**Lesson IDs (16):**  
`add-cache`, `add-cdn`, `add-load-balancer`, `add-read-replicas`, `add-sharding`, `add-rate-limiter`, `add-multi-az-lb`, `add-replica-failover`, `add-queue`, `add-worker`, `add-dlq`, `add-rag`, `add-hybrid-rag-hint`, `add-web-search`, `add-tool-loop`, `add-evals`

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| B1 | G | Open `/training` | Lesson list loads (16) | P0 | |
| B2 | G | Open `add-cache` | Lesson workspace loads; complete lesson flow | P0 | |
| B3 | G | Complete 1 more classic lesson (e.g. `add-cdn`) | Progress updates; localStorage `sdl-training-progress-v1` updates | P0 | |
| B4 | G | Open one agentic lesson (e.g. `add-rag`) | Loads and completable | P0 | |
| B5 | G | Spot-check remaining lessons (open only) | No blank/crash pages | P1 | |
| B6 | G | Hard refresh `/training` | Progress persists from localStorage | P0 | |

---

## C. Training — guided builds (P0 sample)

**Build IDs (5):**  
`url-shortener-core`, `async-email-pipeline`, `read-heavy-scale`, `rag-support-bot`, `ha-multi-az`

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| C1 | G | From training hub open guided list / `url-shortener-core` | Guided workspace loads | P0 | |
| C2 | G | Step through build; use **Show me how** / data-flow if present | Steps advance; flow animation works when offered | P0 | |
| C3 | G | Open `rag-support-bot` | Agentic guided build works | P0 | |
| C4 | G | Open remaining builds once each | No crash | P1 | |

---

## D. Practice (P0 + sample evaluate)

**Classic (10):**  
`url-shortener`, `distributed-kv`, `rate-limiter-service`, `chat-system`, `news-feed`, `global-id-generator`, `ride-sharing`, `video-streaming`, `payment-system`, `multi-tenant-saas-db`

**Agentic (6):**  
`rag-support-agent`, `research-agent-web`, `parallel-research-team`, `coding-agent-pr`, `enterprise-agent-platform`, `eval-driven-agent-improvement`

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| D1 | G | Open `/practice` | 16 problems; classic/agentic filter if present | P0 | |
| D2 | G | Open `url-shortener` | Canvas + palette; problem statement visible | P0 | |
| D3 | G | Drag ≥3 components; connect ≥2 edges | Graph edits persist until refresh (session) | P0 | |
| D4 | G | **Evaluate** (needs `XAI_API_KEY`) | Score + feedback panel; no uncaught error | P0 | |
| D5 | G | Answer or dismiss follow-up if shown | UI recovers; history updates if applicable | P1 | |
| D6 | G | Open one agentic problem (e.g. `rag-support-agent`); evaluate once | Works; agent catalog components available | P0 | |
| D7 | G | Spot-open all 16 problem routes | No 404 | P1 | |
| D8 | G | Invalid id `/design/not-a-real-problem` | 404 / not found | P1 | |

---

## E. Solo Mode (P0)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| E1 | G | Open `/solo` | L1 Foundations open; L2 locked | P0 | |
| E2 | G | Start first L1 problem (`url-shortener?solo=solo-l1`) | Canvas Solo mode; **no wrench / Deploy chaos** UI | P0 | |
| E3 | G | Build minimal design; evaluate | Score returns; if score ≥ passScore (55), pass + stars | P0 | |
| E4 | G | Confirm duration / bestScore in hub or progress | Progress for that problem stored; `sdl-solo-progress-v1` | P0 | |
| E5 | G | Re-evaluate worse design | Best score does not regress (or product rule documented) | P1 | |
| E6 | G | Open wrong pairing e.g. agentic problem with `?solo=solo-l1` if possible | Treated as non-Solo or invalid (no fake Solo pass) | P1 | |
| E7 | G | Complete **all** L1 problems to passScore (long) | L2 unlocks | P1 | |
| E8 | G | Short path: if you cannot finish all L1, inject progress in localStorage for unlock test **only in dev** | L2 unlock UI works when L1 complete | P1 | |
| E9 | G | Play one L2 problem | Evaluate works; no wrenches | P1 | |
| E10 | G | Back link from Solo canvas | Returns to `/solo` | P0 | |

**L1 pass scores (reference):** 55–65 depending on problem (`src/lib/solo-levels.ts`).

---

## F. Auth + progress merge (P0)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| F1 | G | With local training + solo progress, click **Continue with Google** | OAuth completes; land on safe `next` path | P0 | |
| F2 | A | After login | Merge runs; toast or silent hydrate; progress not wiped | P0 | |
| F3 | A | Complete one training lesson while signed in | Remote + local update (`/api/progress/training`) | P0 | |
| F4 | A | Complete/pass one Solo problem while signed in | Solo remote progress updates | P0 | |
| F5 | A | Sign out | Session cleared; localStorage still has progress | P0 | |
| F6 | A | Sign in again on same browser | Progress still present (local ∪ remote) | P0 | |
| F7 | A | (Optional) Second browser: sign in only | Cloud progress hydrates where implemented | P1 | |

---

## G. Competitive Campaign — live season (P0)

**Requires S6–S7 (live season).**

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| G1 | G | Open `/campaign` signed out | Guest pitch + Google CTA; no full play | P0 | |
| G2 | G | Open `/campaign/leaderboard` | Public LB loads (may be empty); **no time columns** | P0 | |
| G3 | G | Try direct `/campaign/play/<promptId>` | Auth gate / redirect to sign-in | P0 | |
| G4 | A | Open `/campaign` signed in | Hub: season title, sticky timer, N/20, prompt list | P0 | |
| G5 | A | Start first prompt | Session start succeeds; canvas `mode: campaign` | P0 | |
| G6 | A | Confirm **no wrenches** on season canvas | Submit/evaluate is Campaign submit only | P0 | |
| G7 | A | Submit a design (`POST /api/campaign/submit`) | Stars + season score update; attempts 1/3 | P0 | |
| G8 | A | Submit again (attempt 2) | Allowed; attempts update | P0 | |
| G9 | A | Exhaust 3 attempts | Fourth submit blocked | P0 | |
| G10 | A | Open `/campaign/stats` or My stats | Private durations visible to you | P0 | |
| G11 | A | Open public leaderboard | Your row: name, season_score, stars, prompts — **no duration** | P0 | |
| G12 | A | Sticky timer: refresh mid-prompt | Timer / `started_at` consistent (does not reset unfairly) | P0 | |
| G13 | A | While season live, inspect prompts API / UI for **reference design** | Reference **hidden** while live | P0 | |
| G14 | A | Play 2–3 different prompts | Coverage N increases; score formula feels sane | P1 | |
| G15 | A2 | Second user submits | LB ranks both players | P1 | |

### Campaign API smoke (optional curl / Network tab)

| ID | Auth | Call | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| G16 | none | `GET /api/campaign/seasons/current` | 200 + season payload | P1 | |
| G17 | none | `GET /api/campaign/seasons/:id/leaderboard` | 200; no times | P1 | |
| G18 | cookie | `GET /api/campaign/seasons/:id/prompts` | 200; no `referenceDesign` while live | P0 | |
| G19 | cookie | `POST /api/campaign/prompts/:promptId/start` | 200 sticky start | P0 | |
| G20 | cookie | `POST /api/campaign/submit` | 200 + score fields | P0 | |
| G21 | cookie | `GET /api/campaign/seasons/:id/me` | private durations | P1 | |
| G22 | none | start or submit without auth | 401 | P0 | |

---

## H. Campaign freeze + reference reveal (P0)

**Requires season effectively ended** (see Setup freeze SQL).

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| H1 | A | Open hub after end | Season shows ended (or not live play) | P0 | |
| H2 | A | Try start new prompt | **Blocked** (freeze) | P0 | |
| H3 | A | Try submit | **Blocked** | P0 | |
| H4 | A | `GET …/prompts` or UI reveal | `referenceDesign` **present** only when ended | P0 | |
| H5 | G | Public LB still readable | Scores frozen for viewing | P1 | |

Restore live season if more G tests remain.

---

## I. Legacy map + wrenches (P1 — deep link only)

`/campaign` is **competitive seasons**, not the old map. Legacy path is still via design query.

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| I1 | G | Open `/design/url-shortener?campaign=w1-l1` | Canvas in **legacy** mode (wrenches available) | P1 | |
| I2 | G | Deploy / throw wrench (if labeled) | `POST /api/wrench` returns incident; fix flow works | P1 | |
| I3 | G | Pass level if UI records legacy progress | `sdl-campaign-progress-v1` may update | P2 | |
| I4 | G | Confirm Solo hub still uses multi-problem levels, not map | No confusion between legacy and Solo | P1 | |

---

## J. Content APIs (P1)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| J1 | G | `GET /api/solo/levels` | 2 levels JSON | P1 | |
| J2 | G | `GET /api/problems` | 16 problems | P1 | |
| J3 | G | `GET /api/problems?track=classic` | Classic only | P1 | |
| J4 | G | `GET /api/problems/url-shortener` | Problem detail | P1 | |
| J5 | G | `GET /api/problems/missing-id` | 404 | P2 | |

---

## K. Data-flow playback (P1)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| K1 | G | Guided build with flow scenario | Playback starts/stops; no freeze of whole page | P1 | |
| K2 | G | Practice design with flow control if exposed | Same | P2 | |

---

## L. Negative / resilience (P1)

| ID | Persona | Steps | Expected | P | Result |
| --- | --- | --- | --- | --- | --- |
| L1 | G | Evaluate with empty graph | Graceful error message, not crash | P1 | |
| L2 | G | Temporarily break `XAI_API_KEY` (or offline) and evaluate | User-visible error | P1 | |
| L3 | A | Campaign submit with empty design | Rejected with clear error | P1 | |
| L4 | G | Rapid double-click Evaluate | No double-charge UI lockup (or second call no-ops) | P2 | |
| L5 | G | Mobile width ~390px on hub + one canvas | Usable; no total layout break | P1 | |

---

## Results log

| Field | Value |
| --- | --- |
| Date | |
| Git SHA | |
| Environment | local / staging / prod |
| Tester | |
| Live season slug | |
| Ship green? | Yes / No |
| Season ready? | Yes / No |

### Failures

| ID | Severity | Notes | Screenshot / console |
| --- | --- | --- | --- |
| | | | |

### Time / cost notes

| Note | Detail |
| --- | --- |
| AI evaluates run | count ≈ |
| Approx duration | |

---

## Suggested session order (timeboxed)

| Session | Duration | Sections |
| --- | --- | --- |
| **1 — Smoke** | 45–60 min | Setup, A, B1–B4, C1–C2, D1–D6, E1–E4, E10 |
| **2 — Auth + Solo depth** | 45 min | F, E5–E9 if needed |
| **3 — Campaign live** | 60–90 min | G (full P0), G16–G22 optional |
| **4 — Freeze + legacy + edge** | 45 min | H, I, J, K, L |

**Minimum before users:** Session 1 + Session 3 P0 + H if you will run a real season end.

---

## Out of scope (do not block ship green)

- Plan B constraint engine (parked)
- Rate limits #25 / next-season seed #26 (not shipped)
- Full 16× evaluate quality scoring audit (subjective)
- Marketing site / IG ads
- Payment / Pro tiers

---

## Links

| Doc | Path |
| --- | --- |
| Shipped inventory | `docs/brain/FEATURES.md` |
| Mode rules | `docs/specs/solo-vs-campaign.md` |
| Board priority | `docs/brain/BOARD.md` |
| Auth setup | `docs/setup-auth.md` |
| Seed script | `scripts/seed-season.ts` |
