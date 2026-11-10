# Live-coding enhancement: Ownership gaps

This branch (`rehearsal/ownership-gaps`) holds the rehearsed result of the keynote's live-coding moment.
The baseline (`main`) does **not** contain it.

## The prompt to use on stage

```
In Dependency Atlas, add an "Ownership gaps" panel: find every asset with no business owner,
compute how many unique assets depend on it directly or indirectly by reusing computeImpact
from src/graph/impact.ts, and rank them by that count (highest first). Show it as a toggleable
panel in the top bar with the asset name, type and dependent count; clicking a row selects and
centres that asset on the graph.
```

## What the change touches (≈ 120 lines)

| File | Change |
| --- | --- |
| `src/graph/ownershipGaps.ts` | `rankOwnershipGaps(assets, dependencies)` — filters unowned assets, runs `computeImpact` for each (shared reverse index), sorts by `affected.size` desc, then name. |
| `src/graph/ownershipGaps.test.ts` | 2 tests: ranking + diamond dedupe, cycle excludes self. |
| `src/components/OwnershipGapsPanel.tsx` | Ranked list: rank, type icon, name, direct/indirect, big dependent count. Row click → `focusAsset`. |
| `src/components/Toolbar.tsx` | "⚠ Ownership gaps (N)" toggle button. |
| `src/App.tsx` | `gapsOpen` state, `useMemo(rankOwnershipGaps)`, renders the panel. |
| `src/index.css` | `.gaps-panel` / `.gaps-list` styles. |

## Expected result with the seeded data

| # | Asset | Direct | Indirect | Dependents |
| --- | --- | --- | --- | --- |
| 1 | Maps Provider | 1 | 6 | **7** |
| 2 | Shipping API | 1 | 5 | **6** |
| 3 | ETL Pipeline | 1 | 3 | **4** |
| 4 | Analytics Warehouse | 2 | 1 | **3** |
| 5 | Pricing API | 1 | 2 | **3** |
| 6 | SMS Gateway | 1 | 1 | **2** |
| 7 | CRM Sync Job | 1 | 0 | **1** |
| 8 | Legacy CRM | 1 | 0 | **1** |
| 9 | Recommendation Engine | 1 | 0 | **1** |
| 10 | Admin Console | 0 | 0 | 0 |
| 11 | Intranet Wiki | 0 | 0 | 0 |

(Rows 7–9 and 10–11 are ties, ordered by name.)

## Talking points

- The traversal is **reused**, not re-implemented — the ranking inherits cycle safety and diamond de-duplication for free.
- A low-criticality external **Maps Provider** nobody owns is the biggest ownership risk — criticality labels lie, graphs don't.
- Click the top row → select → "Simulate unavailable" to show the same number as a blast radius on the canvas.
- Close the loop live: "Change owner" on Maps Provider → saved to Dataverse → it drops out of the list.

## Rehearsal checklist

```
git checkout rehearsal/ownership-gaps
npm run typecheck && npm test && npm run lint && npm run build
npm run dev   # open Local Play URL, click "Ownership gaps"
git checkout main
```
