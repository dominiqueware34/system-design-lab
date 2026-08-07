# System Design Lab — Instagram + X Campaign Plan

**Budget:** ≤ $200 Instagram + ≤ $200 X ($400 total paid)  
**Goal:** Early users, waitlist signups, qualified traffic (engineers prepping system design interviews)  
**Style:** Organic-first, tiny paid boost, gameplay-forward creative  
**Product:** Browser game for system design (classic distributed systems + agentic AI) — Zelda-style `/campaign` map with flavored world/level names, drag-and-drop canvas, AI “wrench” incidents in campaign flow, free practice with Agentic/Classic track filter, `/training` hub (guided builds + lessons). Auth (Supabase) is scaffolding only — do not advertise “login with Google” as live until verified.  
**Video production answer:** see §0 and companion [`gameplay-video-brief.md`](./gameplay-video-brief.md)

---

## 0. Can we create videos of in-game footage?

**Yes.** Two paths:

| Path | What it is | Best for |
|------|------------|----------|
| **A. Screen-record real product (recommended)** | Record from `npm run dev` (`/campaign` map → design → **Deploy — throw wrench** → fix) | Ads, Reels, authenticity, trust |
| **B. Stylized AI trailer clips** | Mockups + tools like Imagine / `image_to_video` | Teasers, hype, placeholders while product UI iterates |

**Use A for paid IG ads that “show gameplay.”** UGC-style screen capture + captions outperforms polished brand film for learning tools. Use B only as optional cutaways or pre-launch atmosphere.

**How to record (founder, 45–90 min total):**
1. `npm run dev` → full-screen browser, hide bookmarks bar.
2. macOS: QuickTime / OBS / CleanShot; 1080×1920 vertical crop OR record 16:9 then crop for Reels.
3. Capture 5–8 raw clips (see shot list in video brief).
4. Edit in CapCut/Descript: hook text 0–1s, captions always on, CTA last 2s.
5. Export H.264, vertical 9:16 for IG Reels; 16:9 or 1:1 OK for X.

Full shot list, hooks, and export specs → [`gameplay-video-brief.md`](./gameplay-video-brief.md).

---

## 1. Positioning

**One-liner:**  
> System Design Lab is a Zelda-style browser game — worlds like The Threshold and Agentic Frontier, a design canvas, AI production wrenches, and training that shows you how — without another dry whiteboard PDF.

**3 hooks (reuse on posts + ads):**
1. **Interview anxiety:** “Whiteboard system design still makes you freeze? Play it instead.”
2. **Gameplay reveal:** “Drag a load balancer. Get hit by a wrench. Fix the outage. That’s the interview.”
3. **Career ROI:** “Bootcamp → senior SWE interview practice that feels like a game, not leetcode guilt.”

**Do / don’t claims**
| Do | Don’t |
|----|--------|
| “Practice system design like a game” | “Guaranteed to pass FAANG interviews” |
| “Build architectures + fix incidents” | “Replace your entire interview prep” |
| “Made for engineers prepping design rounds” | Fake testimonials / invented pass rates |

---

## 2. Audience personas

| Persona | Who | Pain | Message angle | Best platform |
|---------|-----|------|---------------|---------------|
| **Bootcamp / junior** | 0–2 YOE, career switchers in programs | Whiteboard terror, no real systems exposure | Fun + structured practice without imposter spiral | IG Reels, X tech comedy |
| **Mid-level SWE** | 2–6 YOE, first design rounds | Knows services, freezes on scale/tradeoffs | Incident wrench + canvas = muscle memory | X tech Twitter, IG carousel deep-dives |
| **Career switcher** | From non-CS or adjacent roles | Needs portfolio of *thinking*, not just code | Game = visible practice habit | IG Stories + waitlist CTA |

**Geo / targeting notes (paid):** US, Canada, UK, India (metros with eng density), age 21–40. Interests: software engineering, coding interviews, LeetCode-adjacent, CS education, developer tools. On Meta, prefer **broad + Advantage+ with age/geo/language** for cold Reels; layer interests only if CPC is wasteful. On X: keywords + follows (system design accounts, interview prep, bootcamp brands).

---

## 3. Organic content calendar (2 weeks)

**Cadence:** 3–5 posts/week per platform (~4/week). Reuse the same raw gameplay clips; rewrite captions per platform.

### Week 1 — Hook & prove the loop

| Day | Instagram | X / Twitter |
|-----|-----------|-------------|
| **Mon** | **Reel (15s):** `/campaign` map pan → select flavored node (e.g. **Tiny Links** in *The Threshold*). Hook: “System design as a game map.” CTA: link in bio / waitlist. | **Post + 15s video:** Same clip. Text: “What if system design interviews were a campaign map instead of a blank whiteboard?” |
| **Tue** | **Carousel (5 slides):** Problem → drag palette → connect → submit → score. Caption: “How a round works in 5 frames.” | **Thread (4 tweets):** Same 5-step loop. End with waitlist link. |
| **Wed** | **Reel (12s):** Campaign canvas → **Deploy — throw wrench** → incident panel. Hook: “POV: production just broke your happy path.” | **Post:** Screen of failure mode question from AI. “This is the part textbooks skip.” |
| **Thu** | **Story series:** Poll “Hardest design topic?” + sticker link. | **Reply/engage hour:** 20 min on #systemdesign / interview posts; no spam links. |
| **Fri** | **Reel (20s):** Full micro-loop: drag LB + cache → wrench → fix → green. CTA waitlist. | **Quote-style post:** “Studying system design ≠ watching 3h videos. It’s reps.” + clip. |

### Week 2 — Social proof, depth, conversion

| Day | Instagram | X / Twitter |
|-----|-----------|-------------|
| **Mon** | **Reel:** Side-by-side “whiteboard panic vs. canvas play” (text overlay). | **Post:** “We’re building an interview game, not another course. Early access: [link]” |
| **Tue** | **Carousel:** 3 tradeoffs (cache vs DB, queue vs sync) as in-game choices. | **Thread:** One problem (e.g. chat system) broken into game decisions. |
| **Wed** | **Reel UGC-style:** Founder face cam 3s + gameplay 12s. “Why I built this.” | **Post:** Shipping update / bug that taught a design lesson. |
| **Thu** | **Story or short Reel:** `/training` guided build — one node appears with “why it’s there.” Soft CTA. | **Engage:** Quote interesting system-design takes; soft mention product once. Optional: “Show me how” training clip. |
| **Fri** | **Reel (best performer remixed)** + strong waitlist CTA. Boost this if organic saves/shares look good. | **Promote best organic post** with $ from X budget (see §4). |

**Organic tips (2025–26):**
- First **1–3 seconds** = text hook on screen; sound-off captions required.
- Authentic, low-polish gameplay beats glossy trailers for this audience.
- IG: Reels for reach; carousels for saves; Stories for waitlist taps.
- X: native video + short text; threads for depth; engage *before* you sell.

---

## 4. Paid plan — $200 IG + $200 X

### Reality check on $200
- Meta “learning phase” wants ~50 optimization events per ad set; **$200 will not fully exit learning on conversions.** Optimize for **Traffic / Landing page views** or **Video views → traffic**, not Purchase.
- Platform floors: Meta often works from ~$5/day for traffic; practical tests work at **$10–20/day**. X self-serve has **no hard daily minimum**; meaningful tests often **$15–30/day**.
- 2025–26 ballparks (broad; tech/edu varies):
  - **IG:** CPC often ~$0.40–$1.80; Reels CPM often **~$4–$7** (cheaper than Feed ~$10–$15).
  - **X:** CPC often ~$0.50–$2.00 (some medians lower); CPM often low-single to mid digits vs Meta.

Treat paid as **creative + audience smoke test**, not a growth engine.

### Instagram — $200

| Item | Allocation |
|------|------------|
| **Objective** | Traffic → waitlist / landing URL |
| **Placement** | **Reels only** (or Advantage+ with Reels preferred). Skip pure Feed for this budget. |
| **Duration** | 10 days active testing + 4 days hold/kill buffer |
| **Daily cap** | **$15/day × 10 days = $150** core test; **$50** reserve to boost winner 3–4 more days |
| **Structure** | 1 campaign → 1 ad set → **3 creatives** (A/B/C below). Do **not** split into 3 ad sets at $200. |
| **Audience** | Geo: US + CA + UK (+ optional IN). Age 22–38. Advantage+ / broad; optional interests: software development, coding, computer science, online education. |
| **Creative test** | 3 Reels concepts, equal delivery first 5 days, then kill losers. |
| **Kill criteria** | After **≥ $40 spend** on a creative: CTR (link) **&lt; 0.6%** or CPC **&gt; $2.50** → pause. Winner: CTR **≥ 1%** or CPC **≤ $1.50** → shift remaining budget. |
| **Retarget** | Only if pixel has volume; optional $0 this round. Capture emails on-site. |

### X / Twitter — $200

| Item | Allocation |
|------|------------|
| **Objective** | Website clicks / conversions (waitlist) if pixel ready; else engagement → profile/site clicks |
| **Format** | **Promoted posts with native video** (best 15–30s gameplay). 1–2 text-only promoted posts as control. |
| **Duration** | **$20/day × 7 days = $140** test; **$60** to re-boost best post days 8–12 |
| **Structure** | Promote **3 posts** sequentially or with small concurrent budgets ($10–15/day each max 2 at a time). |
| **Targeting** | Keywords: system design, system design interview, distributed systems, coding interview, software engineer. Follower lookalikes / interests around eng education if available. Geo same as IG. |
| **Kill criteria** | After **≥ $30** on a post: link CPC **&gt; $2.00** or CTR **&lt; 0.5%** → stop. Winner gets remaining $60. |
| **Note** | Prefer **boosting organic posts that already got replies** — social proof lowers CPA. |

### Budget timeline (combined)

```
Days 1–2   Organic only + pixel/UTM + 3 creatives final cut
Days 3–12  IG $15/day live (3 creatives)
Days 3–9   X $20/day promote best-ready posts
Days 10–14 Kill losers; IG + X residual on winners only
Day 14     Write one-page learnings; decide next $400 or pause
```

---

## 5. Exact ad creative briefs

### Instagram Reels (3 concepts) — all 9:16, 10–20s, captions burned in

#### IG-R1 — “Wrench drop” (primary gameplay ad)
| Field | Spec |
|-------|------|
| **Length** | 12–15s |
| **Hook (0–2s)** | Big text: “Your design just got a production incident.” Cut to wrench hitting the canvas. |
| **Body** | 6s frantic fix: drag queue / replica / cache; connect edges; submit. |
| **Payoff** | Green score / “incident resolved” beat. |
| **CTA (last 2s)** | “Play system design. Free early access.” + URL or “Link in bio” |
| **Audio** | Trending subtle tech beat OR original UI SFX only. |
| **Primary text** | Practice system design like a game — canvas + real failure modes. Waitlist → |
| **Why it works** | Conflict in second 1; shows unique “wrench” mechanic competitors don’t have. |

#### IG-R2 — “Map not PDF”
| Field | Spec |
|-------|------|
| **Length** | 10–12s |
| **Hook** | “Stop grinding another 40-page system design PDF.” |
| **Body** | Pan Zelda-style `/campaign` map (world labels visible) → select **Tiny Links** (*The Threshold*) → canvas opens. |
| **Payoff** | Palette of components sliding in; satisfying drop of load balancer. |
| **CTA** | “Learn by building. Join waitlist.” |
| **Primary text** | System Design Lab: interview practice that feels like a campaign, not homework. |

#### IG-R3 — “POV: design round tomorrow”
| Field | Spec |
|-------|------|
| **Length** | 15–18s |
| **Hook** | Face or text POV: “Design round in 48 hours and you’ve only watched videos.” |
| **Body** | Fast montage: home track filter (Agentic / Classic) → 2–3 problems by difficulty → drag, connect, AI question popup. |
| **Payoff** | Text: “Reps > passive watching.” |
| **CTA** | Waitlist / try the lab. |
| **Primary text** | Built for bootcamp grads, mid-level SWEs, and switchers prepping design interviews. |

**A/B note:** Same CTA + landing; only creative differs. Winner = lowest CPC to waitlist with CTR ≥ 1%.

### X posts (3 promoted concepts)

#### X-1 — Video + short copy (boost this first)
> Your system design just got wrenched in prod.  
> Drag. Fix. Re-submit.  
> That’s the interview skill nobody practices.  
> System Design Lab (browser game) → [utm link]  
> *[Attach 15s wrench clip]*

#### X-2 — Opinion hook (text or light video)
> Watching a 3-hour system design video ≠ being ready for the whiteboard.  
> We’re building a game where you place the boxes, get hit by failure modes, and fix them.  
> Early access: [utm link]

#### X-3 — Specific problem demo
> Challenge: Design a URL shortener (map node: **Tiny Links**).  
> In System Design Lab you drop the components, wire the path, then **Deploy — throw wrench** for a live incident — or free-practice with Agentic/Classic tracks on home.  
> Clip ↓ + waitlist [utm link]  
> *[Attach 20–30s Tiny Links / URL shortener build]*

---

## 6. Tracking (no vanity)

### UTMs (required on every link)
```
https://YOURDOMAIN/?utm_source=instagram&utm_medium=paid&utm_campaign=sdl_launch_w1&utm_content=ig_r1_wrench
https://YOURDOMAIN/?utm_source=twitter&utm_medium=paid&utm_campaign=sdl_launch_w1&utm_content=x1_wrench
https://YOURDOMAIN/?utm_source=instagram&utm_medium=organic&utm_campaign=sdl_launch_w1&utm_content=reel_map
```

Use `utm_content` = creative ID (`ig_r1`, `ig_r2`, `x1`, …).

### Pixels / tags
- Meta Pixel (PageView + Lead/CompleteRegistration on waitlist success).
- X Pixel / conversion event on same thank-you.
- Fallback: unique waitlist codes or Form field “How did you hear?”

### North-star metrics (check every 48h)

| Metric | Definition | Target at $200/platform |
|--------|------------|-------------------------|
| **CTR (link)** | Clicks / impressions | IG ≥ 0.8–1.5%; X ≥ 0.5–1.2% |
| **CPC** | Spend / link clicks | IG ≤ $1.50–2.00; X ≤ $1.00–2.00 |
| **LP → signup** | Signups / landing sessions | ≥ 15–30% if page is focused waitlist |
| **CPS (cost per signup)** | Spend / signups | Stretch: **$5–25**; acceptable test: **$25–60** |
| **Video view rate** | 3s / thruplay | Diagnostic only — not success |

**Ignore for decisions:** follower count, likes without clicks, vanity reach.

**Simple sheet columns:** Date | Platform | Creative | Spend | Impr | Clicks | CTR | CPC | Signups | CPS | Decision (scale/kill).

---

## 7. Risks & compliance

| Risk | Mitigation |
|------|------------|
| **App Store N/A** | Web app only — never claim “Download on App Store.” CTAs = play in browser / join waitlist. |
| **“Pass your interview” claims** | FTC/ad policy risk + trust damage. Use **practice / prepare / get reps**. No guaranteed outcomes. |
| **Before/after salary claims** | Avoid entirely. |
| **Small budget + learning phase** | Optimize traffic not conversions; 1 ad set; kill fast on CPC. |
| **India/geo CPC variance** | Segment if one geo eats budget with zero signups. |
| **Copyrighted music** | Use platform audio library or SFX only for ads. |
| **UI still changing** | Record weekly; don’t over-invest in one polished trailer. |
| **X brand safety / reply spam** | Moderate replies; don’t buy fake engagement. |
| **Meta restricted education claims** | Don’t imply accredited degree or job placement. |

---

## 8. First 7-day launch checklist

### Day 0 (before anything goes live)
- [ ] Waitlist page live (one CTA, mobile-first, &lt;3s load).
- [ ] Meta Business Manager + IG professional account linked.
- [ ] X Ads account + payment method.
- [ ] Pixels installed; test events fire on signup.
- [ ] UTM spreadsheet + analytics (Plausible/GA4/Vercel).
- [ ] Record **minimum 5 gameplay clips** (see video brief).
- [ ] Edit IG-R1, IG-R2, IG-R3 + X-1 video.
- [ ] Profile bios: one-liner + waitlist link.

### Days 1–2 — Organic ignition
- [ ] Post map Reel (IG) + X video post.
- [ ] Post wrench Reel.
- [ ] 20 min/day genuine engagement on system-design / interview content.
- [ ] Stories poll + link sticker.

### Days 3–4 — Paid on
- [ ] Launch IG campaign $15/day, 3 creatives, traffic objective.
- [ ] Promote X-1 (or best organic) at ~$20/day.
- [ ] Verify UTMs show in analytics within 24h.

### Days 5–6 — Trim
- [ ] Pause creatives failing kill criteria.
- [ ] Reply to every comment/DM with human tone.
- [ ] Ship one “fix” carousel/thread from a real problem (URL shortener).

### Day 7 — Decision snapshot
- [ ] Fill metrics table; note best hook.
- [ ] Move residual budget to winner only.
- [ ] Schedule Week 2 organic; plan next recording session.

---

## 9. Estimated realistic outcomes ($200 / platform)

Order-of-magnitude only; edtech/dev tools are **not** DTC impulse buys. Ranges assume decent creative + clean waitlist page.

### Instagram (~$200, Reels traffic, 10–14 days)

| Funnel step | Low | Mid | High |
|-------------|-----|-----|------|
| Impressions | 15k–25k | 25k–45k | 50k+ (if CPM ~$4–6) |
| Link clicks | 80–150 | 150–300 | 350+ |
| CPC | $1.50–2.50 | $0.80–1.50 | $0.40–0.80 |
| Waitlist signups | **5–15** | **15–40** | **40–80** |
| CPS | $15–40 | $5–15 | $2.50–5 |

### X (~$200, promoted video/posts)

| Funnel step | Low | Mid | High |
|-------------|-----|-----|------|
| Impressions | 20k–40k | 40k–80k | 100k+ (cheap CPM env) |
| Link clicks | 100–200 | 200–400 | 500+ |
| CPC | $1.00–2.00 | $0.50–1.00 | $0.25–0.50 |
| Waitlist signups | **5–20** | **15–50** | **50–100** |
| CPS | $10–40 | $4–12 | $2–4 |

**Combined paid ($400):** rough **20–100 waitlist signups** is a sane planning band if creative is strong; **&lt;15 total** means fix landing + hooks before spending more.  
**Organic (2 weeks, consistent posting):** often **0–2× paid** in early indie phase — treat as compounding, not guaranteed. Goal is **signal** (which hook/persona converts), not scale.

**What “good” looks like at this budget:** clear winning creative, CPC in band, 1 persona that over-indexes, enough emails to message for beta — **not** hockey-stick DAU.

---

## 10. Budget split summary (print this)

| Bucket | Amount | Use |
|--------|--------|-----|
| IG creative test (10d @ $15) | $150 | 3 Reels, 1 ad set, traffic |
| IG winner boost | $50 | Scale only the winner 3–4 days |
| **IG total** | **$200** | |
| X promote test (7d @ $20) | $140 | Best native video + posts |
| X winner re-boost | $60 | Days 8–12 |
| **X total** | **$200** | |
| **Grand total paid** | **$400** | |
| Production | $0 cash | Founder time: record + CapCut |
| Organic | $0 | 3–5 posts/wk × 2 platforms × 2 wks |

---

## 11. Immediate next actions (priority order)

1. Ship waitlist URL + pixels.  
2. Record clips per [`gameplay-video-brief.md`](./gameplay-video-brief.md) (90 min).  
3. Cut IG-R1 first — that’s the paid hero.  
4. 48h organic only, then turn on $15/day IG + $20/day X.  
5. Kill losers on the criteria above; write a ½-page retro on day 14.

---

*Doc owner: growth / founder. Update after first $100 spent with real CPC/CPS.*
