# Gameplay video brief — System Design Lab

Companion to [`instagram-twitter-campaign.md`](./instagram-twitter-campaign.md).  
**Purpose:** Produce authentic in-game clips for Instagram Reels ads + X promoted posts.

---

## Answer: can we create marketing videos from the game?

**Yes.**

| Method | Recommendation |
|--------|----------------|
| **Screen-record live product** (`npm run dev`) | **Primary.** Best trust for engineers; required for “ads that show gameplay.” |
| **AI stylized trailers** (mockups → Imagine / `image_to_video`) | Optional B-roll / hype only. Not a substitute for real UI. |

**Do not** ship ads that only show AI-generated “fake UI” if the product already runs in browser — eng audiences notice.

---

## Record environment

```bash
npm run dev
# Open app full-screen; hide bookmark bar; use dark/default product theme consistently
```

| Setting | Spec |
|---------|------|
| Tool | OBS, QuickTime, CleanShot, or Loom (export file, don’t share link as ad) |
| Resolution | 1920×1080 source; crop to **1080×1920 (9:16)** for Reels |
| FPS | 30 or 60 |
| Cursor | Visible, slightly enlarged if possible |
| Audio | Optional UI clicks; voiceover recorded separately |
| Length raw | Overshoot: record 30–60s takes, cut to 10–20s |

**Privacy:** No real API keys, emails, or personal data on screen.

---

## Shot list (5–8 clips)

Record each as a separate take. Prefer **one clear action per clip**.

| # | Clip name | Duration target | On-screen action | Hook text overlay | Use |
|---|-----------|-----------------|------------------|-------------------|-----|
| **1** | **Campaign map pan** | 8–12s raw → 6–10s cut | Zelda-style map; pan; hover/select a node (e.g. URL Shortener) | “System design as a campaign map” | IG-R2, organic Mon W1 |
| **2** | **Drag-drop architecture** | 15–25s raw → 10–15s | Open canvas; drag Load Balancer, Cache, DB; connect edges | “Drag the boxes. Wire the system.” | IG-R2/R3, X-3 |
| **3** | **Wrench incident** | 12–20s | Mid-design: wrench/incident hits; failure-mode UI; scramble fix | “Prod just broke your design” | **IG-R1 hero**, X-1 |
| **4** | **Fix + resubmit** | 10–15s | Add redundancy/queue; Submit fix; improved score / resolved state | “Fix it. Re-submit. Learn.” | IG-R1 end, organic Fri |
| **5** | **AI interviewer beat** | 10–15s | Evaluation panel / Socratic question appears (latency, scale) | “Not multiple choice — real tradeoffs” | Organic Wed, X-2 support |
| **6** | **Problem picker** | 8–12s | Easy / medium / hard list; pick Chat or Rate Limiter | “Pick your boss fight” | IG-R3 montage |
| **7** | **Satisfying component drop** | 5–8s | Single crisp drop of a key component + connect | (SFX-forward, minimal text) | Transitions, Stories |
| **8** *(optional)* | **Founder + game** | 15–20s | 3s face cam “I built a game for system design interviews” → gameplay | Same as spoken | Organic W2, trust |

**Minimum viable set for launch ads:** clips **1, 2, 3, 4** (map → build → wrench → fix).

---

## Edit recipes (platform-ready)

### IG-R1 “Wrench drop” (12–15s)
1. 0.0–1.5s — Clip 3 cold open (wrench impact) + text.  
2. 1.5–8s — Panic fix from clips 3–4.  
3. 8–12s — Green / resolved.  
4. 12–15s — End card: logo + “Early access” + URL/bio.

### IG-R2 “Map not PDF” (10–12s)
1. Clip 1 map → smash cut clip 2 first component drop.  
2. End card waitlist.

### IG-R3 “POV design round” (15–18s)
1. Text hook 2s.  
2. Montage: clip 6 → 2 → 5 → 4 (fast cuts 2–3s each).  
3. CTA.

### X-1 / X-3
- Prefer **15–30s**, slightly slower than Reels; first frame must read as gameplay even without sound.  
- Captions still on (mute-autoplay).

---

## Captions & safe language

**On-screen / VO — use:**
- Practice system design  
- Interview-style failure modes  
- Build architectures in-browser  
- Early access / waitlist  

**Avoid:**
- “Guaranteed to pass FAANG / Meta / Google”  
- Salary or offer guarantees  
- “Accredited course” / job placement  

---

## Export checklist

- [ ] 9:16 H.264 MP4 for IG Reels ads  
- [ ] 16:9 or 1:1 alternate for X if needed  
- [ ] Burned-in captions (large, high contrast)  
- [ ] Safe margins: keep text inside center 80%  
- [ ] No copyrighted music on **paid** ads (library audio or mute + SFX)  
- [ ] Filename convention: `sdl_clip03_wrench_v2.mp4`, `sdl_ad_ig_r1_v1.mp4`  
- [ ] Store masters + exports in one folder; never re-export lossy twice  

---

## Time budget (founder)

| Task | Time |
|------|------|
| Setup + 8 raw takes | 45–60 min |
| Select best takes | 15 min |
| CapCut edit 3 ads + 2 organic | 60–90 min |
| **Total first batch** | **~2–3 hours** |

Re-record after major UI changes; do not over-polish v1.

---

## Optional AI trailer (secondary)

If you want a non-UI hype bumper:
1. Export 1–2 still mockups (map + canvas).  
2. Generate short stylized motion (Imagine / `image_to_video`).  
3. Use **only** as 1–2s intro before real gameplay — never as the whole ad.

---

*After first paid week: keep the highest-retention clip as the default cold open for all new ads.*
