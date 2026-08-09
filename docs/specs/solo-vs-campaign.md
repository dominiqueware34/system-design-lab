# Solo Mode vs Competitive Campaign

> **Artifact 0** · Issue **#13** · Branch `docs/solo-campaign-modes`  
> Docs only — no product runtime in this artifact.  
> Product brain summary: `docs/brain/PRODUCT.md`. Shipped inventory: `docs/brain/FEATURES.md`.

## Purpose

Lock vocabulary and product rules so agents and humans do **not** confuse:

1. **Solo Mode** — personal multi-problem levels (`/solo`)
2. **Campaign** — competitive **3-day seasons** + leaderboard (`/campaign`)
3. **Practice** — free problems without map/season pressure
4. **Training** — learn building blocks (already shipped)

Also records **scoring formula id `v1_correct_diff_cover`**, attempt limits, auth, and the **Artifacts 0–7** implementation map.

---

## Vocabulary (locked)

| Term | Meaning | Do not call it… |
| --- | --- | --- |
| **Solo Mode** | Personal progression through multi-problem levels | “Campaign”, “season”, “ranked” |
| **Campaign** | Competitive multiplayer season (3 days, shared prompts, LB) | The only “play” mode; personal level grind |
| **Practice** | Free design problems + AI evaluate; no Solo unlocks / season rules | Solo; Campaign |
| **Training** | Lessons + guided builds | Practice; Solo |
| **Legacy campaign map** | Shipped `/campaign` 15-level map + wrenches (pre mode-split) | The competitive season product |

When Solo + seasons ship, **Campaign** means seasons/leaderboard. Until then, FEATURES still documents the legacy map under “Campaign map” — agents must read PRODUCT + this spec for target meaning.

---

## Routes & nav (target)

| Surface | Route | Notes |
| --- | --- | --- |
| Hub | `/` | Marketing / mode entry; not the practice list long-term |
| Training | `/training`, `/training/[lessonId]`, `/training/guided/[buildId]` | Shipped |
| Solo Mode | `/solo` (+ level routes TBD in Artifact 2) | Not shipped |
| Campaign | `/campaign` (+ season / prompt / LB subroutes TBD) | Competitive UX not shipped; path reused |
| Practice | `/practice` → `/design/[problemId]` | Picker today still on `/` (Artifact 1 moves it) |

**Primary nav (target):** `Training | Solo Mode | Campaign | Practice`

---

## Mode comparison

| Dimension | Training | Practice | Solo Mode | Campaign (season) |
| --- | --- | --- | --- | --- |
| Goal | Learn blocks | Rehearse full problems | Personal multi-problem levels | Rank on season leaderboard |
| Route | `/training…` | `/practice` (target) | `/solo` | `/campaign` |
| Content v1 | 16 lessons + 5 guided | 16 catalog problems | **2** multi-problem levels | **20** pre-gen season prompts |
| Auth | Optional | Optional | Optional (sync when signed in) | **Required (Google)** to play/submit |
| Public ranking | No | No | No | **Yes** (season LB) |
| Timer | N/A | N/A | Solo duration UX | **Sticky**; time **private** (not public LB) |
| Attempts | Lesson UX | Unlimited evaluate (product default) | Solo rules (Artifact 2) | **Max 3 attempts / prompt** |
| Wrenches v1 | No | No | **No** | **No** |
| References | Teaching content OK | Problem statement as today | As designed for levels | **Hidden until season ends** |
| Score | Lesson progress | AI stars / feedback | Stars / level completion | **`v1_correct_diff_cover`** |

---

## Locked product decisions

1. **Two play modes:** Solo Mode (personal) and Campaign (competitive seasons). Practice and Training are separate pillars.
2. **Hub at `/`; Practice at `/practice`** (migration in Artifact 1).
3. **Nav order:** Training | Solo Mode | Campaign | Practice.
4. **Solo v1 content:** **2** multi-problem levels.
5. **Campaign v1 content:** **20** pre-generated prompts per season (catalog/AI gen in Artifact 3).
6. **Content APIs over hard-coded constants** for Solo/Campaign content paths (prefer APIs as those artifacts land).
7. **Campaign requires Google sign-in** for play and leaderboard identity.
8. **Max 3 attempts per campaign prompt.**
9. **Sticky timer** on Campaign; **elapsed time is private** — not a public leaderboard column and **not** a term in the point formula.
10. **References hidden until the season ends** (anti-spoiler / fairness).
11. **No wrenches in Solo Mode or Campaign v1.** Legacy wrench API stays for the pre-split map only until that surface is retired or re-scoped.
12. **Plan B (constraint engine) is PARKED.** Do not design or implement it in this epic.
13. **Scoring formula id:** `v1_correct_diff_cover` (definition below). Changing math requires a new formula id.

---

## Campaign scoring — `v1_correct_diff_cover`

> Used for **competitive Campaign seasons only**. Solo Mode may use stars / level completion separately (Artifact 2). **Time is not in points.**

### Inputs

| Symbol | Source | Notes |
| --- | --- | --- |
| `ai_score` | AI evaluate | Integer **stars 1–5** (best counting attempt per product rules in submit API) |
| `diff_mult` | Prompt difficulty | `easy` **1.0** · `medium` **1.35** · `hard` **1.75** |
| `N` | Count of prompts the player scored (≥1 star / counted attempt) | Coverage over the season set of **20** |
| `prompt_points` | Per prompt | See formula |
| `coverage_mult` | Season | Rewards breadth without zeroing low coverage |
| `season_score` | Leaderboard sort key | Higher is better |

### Formulas

```text
prompt_points  = ai_score × diff_mult

coverage_mult  = 0.55 + 0.45 × (N / 20)

season_score   = (Σ prompt_points) × coverage_mult
```

### Explicit non-inputs

| Factor | In `season_score`? |
| --- | --- |
| Wall-clock / sticky timer duration | **No** (private UX only) |
| Number of attempts used (1–3) | **No** (attempts are a **limit**, not a multiplier in v1) |
| Wrenches survived | **No** (wrenches not in Campaign v1) |
| Social / referrals | **No** |

### Worked example

Player finishes 10 of 20 prompts: five medium at 4★, five hard at 3★.

```text
prompt_points = 5×(4×1.35) + 5×(3×1.75)
              = 5×5.4 + 5×5.25
              = 27 + 26.25
              = 53.25

coverage_mult = 0.55 + 0.45×(10/20) = 0.55 + 0.225 = 0.775

season_score  = 53.25 × 0.775 ≈ 41.27
```

### Implementation notes (for later artifacts — not Artifact 0)

- Persist `formula_id = 'v1_correct_diff_cover'` with submissions/season rows for auditability.
- Server-side recompute of `season_score` on submit (Artifact 5); do not trust client totals.
- Leaderboard displays `season_score` (and maybe N / stars breakdown); **not** raw time.
- Tie-break policy: define in Artifact 5/6 (e.g. earlier last-improving submit); not locked here beyond score primary key.

---

## Auth, fairness, limits (Campaign)

| Rule | Detail |
| --- | --- |
| Sign-in | Google via Supabase **required** to enter/play season |
| Attempts | Max **3** evaluate/submit attempts per prompt per player per season |
| Timer | Sticky across sessions; shown to player; **not** public LB |
| References | Hidden until season **ends** (reveal in Artifact 7) |
| Season length | **~3 days** wall clock |
| Anti-cheat | Server validation of scores (Artifacts 5 + 7); identity = signed-in user |

## Solo Mode (summary for later artifacts)

| Rule | Detail |
| --- | --- |
| Route | `/solo` |
| v1 content | **2** multi-problem levels |
| Ranking | None |
| Wrenches | None in v1 |
| Auth | Guest-friendly; progress dual model when applicable |
| Scoring | Stars / completion — **not** `v1_correct_diff_cover` season aggregate |

---

## Artifact map (0–7)

| # | Artifact | Issue | Depends on | Branch pattern | Outcome |
| --- | --- | --- | --- | --- | --- |
| **0** | Product docs + vocabulary | **#13** | — | `docs/solo-campaign-modes` | This spec + PRODUCT/BOARD/STATUS/AGENTS |
| **1** | App nav + route shells | **#16** | #13 | `feat/…` | `/solo`, `/campaign` shells, `/practice`, nav labels |
| **2** | Solo multi-problem levels + progress + duration | **#11** | #16 | `feat/…` | Solo playable path |
| **3** | Catalog schema + AI generate 20 campaign prompts | **#15** | #13 (∥ #11) | `feat/…` | Season prompt pack |
| **4** | Campaign seasons DB schema + RLS | **#14** | #13 (seed after #15) | `feat/…` | Seasons tables + policies |
| **5** | Campaign submit API + scoring | **#17** | #15, #14 | `feat/…` | `v1_correct_diff_cover` server-side |
| **6** | Campaign season UI + leaderboard | **#12** | #17 | `feat/…` | Play UI + public LB |
| **7** | Campaign hardening (limits, end, reveal) | **#10** | #12 | `feat/…` | Attempts, season end, reference reveal |

**Parked:** Plan B constraint engine — **do not start**.

Suggested parallelization after Artifact 0: **#16** (nav) and **#15** (prompt gen) can proceed in parallel; Solo **#11** follows nav; Campaign data/API/UI chain **#14 → #17 → #12 → #10** with seed after **#15**.

---

## Legacy vs target (agent guardrails)

| Shipped today (FEATURES) | Target product language |
| --- | --- |
| Free practice picker on `/` | Practice (route `/practice` after Artifact 1) |
| “Campaign map” 15 levels + wrenches | **Legacy solo-progress game** on `/campaign` until replaced/re-scoped |
| `POST /api/wrench` | Not part of Solo or Campaign **season** v1 |
| Future “3-day seasons” blurbs in old PRODUCT | **Campaign** mode — this spec is SSOT |

**Never:**

- Reimplement Training / evaluate / auth / data-flow as part of this epic unless an artifact explicitly requires a touch
- Claim seasons or Solo Mode in `FEATURES.md` before runtime ships
- Implement Plan B
- Put time into `season_score` for `v1_correct_diff_cover`

---

## Acceptance (Artifact 0)

- [x] `PRODUCT.md` has Solo vs Campaign modes table
- [x] This file documents `v1_correct_diff_cover`
- [x] `BOARD.md` lists artifacts 0–7
- [ ] Docs PR opened (checklist completes when PR exists)

## Related files

| File | Role |
| --- | --- |
| `docs/brain/PRODUCT.md` | Stable mode table + one-liner |
| `docs/brain/BOARD.md` | Artifacts 0–7 rows |
| `docs/brain/STATUS.md` | Active workstream handoff |
| `docs/brain/FEATURES.md` | Shipped only — do not invent seasons |
| `AGENTS.md` | Quick facts for agents |
