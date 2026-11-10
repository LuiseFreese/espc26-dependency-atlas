# Verification log — Dependency Atlas baseline

Environment: DEV-princess (`33ba429d-d577-e7e1-8134-11e72dc99c51`), tenant hscluise.onmicrosoft.com.
Tooling verified against installed versions: Power Apps CLI `pa` 1.4.1 (`@microsoft/power-apps-cli`), `@microsoft/power-apps` 1.6.0,
`@microsoft/power-apps-vite` 1.0.13, pac CLI 2.14.1 (used for environment discovery only), Node 26, Vite 7.3, React 19.3, `@xyflow/react` 12.12.

## Static checks

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npm run typecheck` (`tsc -b`) | ✅ clean |
| Lint | `npm run lint` | ✅ clean (incl. React Compiler `set-state-in-effect` rules) |
| Unit tests | `npm test` | ✅ 9/9 (baseline) — see below |
| Production build | `npm run build` | ✅ `dist/` built (~538 kB JS, 27 kB CSS) |

### Impact-analysis tests (`src/graph/impact.test.ts`)

| Rule | Test |
| --- | --- |
| Dependency direction (A requires B ⇒ simulating B affects A, not vice versa) | ✅ |
| Direct vs indirect classification | ✅ |
| Independent nodes unaffected | ✅ |
| Cycles terminate; source never counted | ✅ (2 tests) |
| Diamond paths counted once (incl. path-edge marking) | ✅ |
| Only edges leading to the source are highlighted | ✅ |
| Deterministic regardless of input order | ✅ |
| Owner aggregation + unowned count | ✅ |

## Dataverse

| Check | Result |
| --- | --- |
| Publisher `espc26`, solution `DependencyAtlas` created; both tables are solution components | ✅ (verified via `solutioncomponents`) |
| `espc26_asset`: type/criticality choices required, owner lookup optional, description memo | ✅ (verified via `EntityDefinitions`) |
| `espc26_dependency`: both asset lookups `ApplicationRequired` | ✅ |
| Provisioning idempotent (second run reports "exists" everywhere) | ✅ |
| Seed idempotent: run 1 → 32/50 created; run 2 → 0 created, 32/50 updated | ✅ |
| Business owners resolve to real enabled tenant users (Adele Vance, Grady Archie, …) | ✅ |
| Reset: removed 51 dependencies (incl. 1 created live), 32 assets, re-seeded 32/50; Admin Console owner back to null | ✅ |
| Clearing a lookup via `"espc26_BusinessOwner@odata.bind": null` | ✅ confirmed against the Web API |

## Runtime (Power Apps host, local play via `npm run dev`, then the published app)

| Check | Result |
| --- | --- |
| App loads real records: "32 assets · 50 dependencies", 32 nodes rendered | ✅ |
| Loading / error / empty states | ✅ loading state observed; error & empty states implemented (`StateViews.tsx`), not triggered on stage data |
| Fit to view keeps the graph clear of toolbar/legend | ✅ (after fixing controlled-node `measured` + px padding) |
| Search → pick → centre + side panel | ✅ |
| Show blast radius of **Identity API**: 8 direct, 1 indirect (Shipping API), 9 affected, 6 owners + 2 unowned, 22 dimmed | ✅ matches hand count; diamond (Customer Portal) counted once |
| Show blast radius of **Customer Database**: 4 direct, 12 indirect incl. Legacy CRM via cycle, 16 affected; HR cluster + Intranet Wiki unaffected | ✅ |
| Clear blast radius (reset simulation) | ✅ |
| Change owner (Admin Console → Grady Archie) saved through `Espc26_assetsService.update` | ✅ UI updated after confirmation; verified via Web API |
| Add dependency (Admin Console → Feature Flag Service) via `Espc26_dependenciesService.create` with `@odata.bind` | ✅ edge appeared, count 51; verified via Web API |
| Duplicate dependency rejected ("already requires") | ✅ |
| Self-link | prevented by UI (asset excluded from picker) + validated in `validateNewDependency` |
| Edits survive full page reload | ✅ (51 dependencies, owner shown, edge present) |
| Published app (`pa app push --solution-id …`) loads with live data | ✅ |

## Not fully automated / caveats

- **Pointer interaction in the embedded browser**: the VS Code browser's device emulation broke Playwright mouse clicks
  inside the Power Apps iframe, so UI actions were driven with dispatched DOM click events and keyboard. Real
  mouse drag/pan/zoom was not exercised by automation — please do one manual pass (pan, zoom, drag a node).
- **Visual check at keynote resolution**: inspected at ~1066×600 CSS px (toolbar wraps to two rows there). At
  1920×1080 everything fits on one row; worth a glance on the stage machine.
- **Code apps feature flag**: had to be enabled manually in the Power Platform admin center (Settings → Product →
  Features → Power Apps code apps). `pac`/`pa` cannot toggle it.
- **Sharing**: the app is currently visible to the publisher only. Share with the demo account(s) via
  `pa app share` or make.powerapps.com if a different account presents.
- **Legacy pac `code` commands** are deprecated in favour of the npm `pa` CLI; this project uses `pa` only.
