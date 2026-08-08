# System Design Lab

Practice **classic distributed systems** and **agentic AI workflows** on a drag-and-drop canvas. Submit your architecture as JSON to **SpaceXAI (Grok)** for scoring and Socratic follow-ups — including failure modes, scale, and **where evals should improve the system**.

**Modes:** campaign map (`/campaign`), free practice (`/`), training (`/training`), guided builds — plus Google sign-in and cloud progress sync via Supabase when configured.

**For coding agents:** start at [`AGENTS.md`](./AGENTS.md) and the application brain under [`docs/brain/`](./docs/brain/) (product intent, shipped features, where left off).

## Tracks

| Track | Focus |
| --- | --- |
| **Agentic AI** | Model selection, RAG, web search, multi-agent parallelization, multi-step tool→LLM loops, span & e2e evals |
| **Classic systems** | Hashing, sharding, global scale, DBs, caches, queues, multi-region |

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **React Flow** (`@xyflow/react`) canvas
- **Vercel AI SDK** + `@ai-sdk/xai` → SpaceXAI (`grok-4.5`)
- **Supabase** auth + progress sync (optional for local guest play)
- Env: `XAI_API_KEY` (server-side only); `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for auth/progress

## Setup

```bash
cd system-design-lab
npm install
cp .env.example .env.local
# Add XAI key from https://console.x.ai
# Optional: Supabase URL + publishable key — see docs/setup-auth.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Campaign mode (primary)

1. Open **`/campaign`** — a Zelda-style map of connected levels.
2. Enter an unlocked node → design on the canvas.
3. **Deploy — throw wrench** → SpaceXAI inspects your graph and invents a production incident (latency, security, capacity, DB overflow, agent failure, missing evals, …).
4. Fix the canvas for **that** incident → submit fix.
5. Survive all wrenches for the level (1–2) → path unlocks the next node. Progress is stored in `localStorage` (and Supabase when signed in).

## Training

Open **`/training`** for lessons (cache, CDN, queues, RAG, tool loops, evals, …) or **guided builds** under `/training/guided/[buildId]`.

## Free practice

1. Filter problems by **Agentic** or **Classic** on the home page.
2. Drag components onto the canvas, tune attributes, wire edges.
3. **Submit** → Grok scores and asks Socratic follow-ups (no map unlock).

## Agentic catalog (highlights)

- **Agents & models** — LLM (pick model), Agent (ReAct / plan-execute), multi-agent team  
- **Tools** — web search, RAG retriever, code exec, API tools, browser  
- **Memory & RAG** — vector DB, embeddings, indexer, knowledge base, agent memory  
- **Orchestration** — workflow graph, router, parallel fan-out, guardrails, human review  
- **Evals** — span eval, e2e eval, trace collector, prompt registry  

## Project layout

```
src/
  app/
    page.tsx                 # Problem picker (track filter)
    campaign/                # Campaign map
    design/[problemId]/     # Canvas workspace
    training/                # Lessons + guided builds
    auth/callback/           # Supabase OAuth callback
    api/evaluate/            # SpaceXAI evaluation
    api/wrench/              # Campaign incidents
    api/progress/            # Campaign/training/merge sync
  components/canvas|campaign|training|flow|auth/
  lib/
    component-catalog.ts
    problems.ts              # classic + agentic problems
    campaign.ts
    training-lessons.ts
    guided-builds.ts
    progress-*.ts
    supabase/
    ai.ts
docs/brain/                  # Agent product brain (start here for LLMs)
```
