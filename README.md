# System Design Lab

Practice system design interviews on a drag-and-drop canvas. Build architectures with databases, queues, load balancers, CDNs, and more — then submit the design JSON to **SpaceXAI (Grok)** for scoring and Socratic follow-up questions (latency, redundancy, scale).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **React Flow** (`@xyflow/react`) for the design canvas
- **Vercel AI SDK** + `@ai-sdk/xai` → SpaceXAI (`grok-4.5`)
- Env: `XAI_API_KEY` (server-side only)

## Setup

```bash
cd system-design-lab
npm install
cp .env.example .env.local
# Add your key from https://console.x.ai
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. Pick a problem by difficulty (easy / medium / hard).
2. Drag components from the palette onto the canvas.
3. Select a node to edit attributes (e.g. NoSQL model, multi-AZ, cache TTL, device type).
4. Connect components to show data flow.
5. **Submit design** → design graph is serialized as JSON and evaluated by Grok.
6. If gaps exist (e.g. no redundancy), the interviewer asks a failure-mode question.
7. Fix the canvas and **Submit fix** until the design is complete.

## Project layout

```
src/
  app/
    page.tsx                 # Problem picker
    design/[problemId]/     # Canvas workspace
    api/evaluate/            # SpaceXAI evaluation endpoint
  components/canvas/         # Palette, attributes, React Flow, evaluation UI
  lib/
    component-catalog.ts     # All drag-drop building blocks + attributes
    problems.ts              # Interview prompts by difficulty
    ai.ts                    # SpaceXAI model + system prompt
    evaluation-schema.ts     # Zod schema for structured scores
```

## API key

1. Sign up at [accounts.x.ai](https://accounts.x.ai)
2. Create a key at [console.x.ai](https://console.x.ai)
3. Put `XAI_API_KEY=...` in `.env.local` (git-ignored)

Never ship the key to the browser; evaluation runs only in `app/api/evaluate`.
