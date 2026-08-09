# feat(campaign): P0 map flavor — world renames, place labels, lore

**Branch:** `feat/map-flavor-p0` → `main`  
**Compare:** https://github.com/dominiqueware34/system-design-lab/compare/main...feat/map-flavor-p0?expand=1

## Summary

Campaign map **P0** (content only): make stops feel like places without schema or progress changes.

- Rename worlds (Scale Out → **Scaling Frontier**, Endgame → **Endgame Spire**, etc.)
- Punchier `mapLabel`s (Live Wire, Feed Frenzy, RAG Ruins, Agent Swarm, …)
- Short `flavor` lore on every level
- **Unchanged:** `id`, `problemId`, `unlocksAfter`, `x`/`y`, `wrenchCount`, `passScore`

**Out of scope:** multi-system levels, new problems, auth, cloud progress.

## Files (1)

| File | Role |
|------|------|
| `src/lib/campaign.ts` | labels, world names, flavor only |

## Test plan

### Static

- [ ] Diff only display fields (`mapLabel`, `worldName`, `flavor`)
- [ ] No id/problemId/unlock changes

### Manual

- [ ] `npm run dev` → `/campaign`
- [ ] World headers show new names (The Threshold, Scaling Frontier, Agentic Frontier, Endgame Spire)
- [ ] Node chips show updated labels
- [ ] Flavor/lore visible if panel shows `flavor`
- [ ] Enter level → same problem as before
- [ ] Existing `sdl-campaign-progress-v1` still unlocks correctly
- [ ] Free practice routes unaffected
