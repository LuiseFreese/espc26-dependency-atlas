# Dependency Atlas — ESPC26 keynote demo

A Power Apps **Code App** (React + TypeScript + Vite + React Flow) on **Dataverse** that renders an IT landscape as a
dependency graph, simulates the outage of any asset ("what breaks if this goes down?") and lets you fix the data live
(assign a business owner, add a dependency).

## Environment & identifiers

| Item | Value |
| --- | --- |
| Environment | **DEV-princess** · `33ba429d-d577-e7e1-8134-11e72dc99c51` |
| Dataverse URL | `https://org4caa9250.crm4.dynamics.com` |
| Tenant | `b469e370-d6a6-45b5-928e-856ae0307a6d` (hscluise.onmicrosoft.com) |
| Published app | https://apps.powerapps.com/play/e/33ba429d-d577-e7e1-8134-11e72dc99c51/app/23b555ed-86ef-4539-bc1a-976e11974af6?tenantId=b469e370-d6a6-45b5-928e-856ae0307a6d |
| App ID | `23b555ed-86ef-4539-bc1a-976e11974af6` |
| Publisher | `espc26` (prefix `espc26`) · `0712f3d7-dcdc-f111-84e8-6045bd93ffe1` |
| Solution | `DependencyAtlas` ("Dependency Atlas", unmanaged) · `1412f3d7-dcdc-f111-84e8-6045bd93ffe1` |
| Table `espc26_asset` | MetadataId `bf85b5d3-2497-4173-bee7-7e183ef9b481` · ObjectTypeCode `10944` · entity set `espc26_assets` |
| Table `espc26_dependency` | MetadataId `fab9db15-4f4e-4246-aadb-fff9bf674b23` · ObjectTypeCode `10945` · entity set `espc26_dependencies` |

### Schema

**Asset (`espc26_asset`)** — organization-owned

| Column | Logical name | Type | Required |
| --- | --- | --- | --- |
| Asset Name | `espc26_name` | primary name (200) | yes |
| Type | `espc26_type` | choice: Application 100000000 · API 100000001 · Database 100000002 · External Service 100000003 | yes |
| Criticality | `espc26_criticality` | choice: Low 100000000 · Medium 100000001 · High 100000002 | yes |
| Business Owner Reference | `espc26_businessowner` (nav `espc26_BusinessOwner`) | lookup → `systemuser` | no |
| Description | `espc26_description` | multiline text | no |
| Seed Key | `espc26_seedkey` | text (100), alternate key `espc26_asset_seedkey` | no — only set on demo rows |

**Dependency (`espc26_dependency`)** — "Dependent Asset *requires* Required Asset to operate"

| Column | Logical name | Type | Required |
| --- | --- | --- | --- |
| Dependency Name | `espc26_name` | primary name | yes |
| Dependent Asset Reference | `espc26_dependentasset` (nav `espc26_DependentAsset`) | lookup → Asset, cascade delete | yes |
| Required Asset Reference | `espc26_requiredasset` (nav `espc26_RequiredAsset`) | lookup → Asset, restrict delete | yes |
| Description | `espc26_description` | multiline text | no |
| Seed Key | `espc26_seedkey` | text (100), alternate key `espc26_dependency_seedkey` | no — only set on demo rows |

*Business Owner Reference* is business accountability and is deliberately separate from Dataverse record ownership
(`ownerid`); the tables are organization-owned so there is no competing "Owner" column.

## Prerequisites

- Node.js LTS, Git, Azure CLI (`az`) signed in as a user with System Customizer rights in the environment
- Power Apps CLI: `npm install -g @microsoft/power-apps-cli` and `pa auth login`
- `npm install`
- Copy `.env.example` to `.env` (it only contains URLs/names; no secrets are stored anywhere in the repo)

## Commands

| Task | Command | Notes |
| --- | --- | --- |
| Provision schema | `npm run provision` | Idempotent. Creates publisher, solution, tables, columns, lookups, alternate keys; publishes. Safe to re-run. |
| Seed demo data | `npm run seed` | Idempotent upsert via the `seedkey` alternate key — never duplicates. 32 assets, 50 dependencies. |
| Reset demo data | `npm run reset` | Deletes only seeded rows (and any dependency touching a seeded asset, e.g. ones created live on stage) and re-seeds. Non-seeded rows are untouched. |
| Local development | `npm run dev` | Prints a **Local Play** URL; open it in the browser profile that is signed in to the tenant. |
| Type check | `npm run typecheck` | `tsc -b` |
| Unit tests | `npm test` | Vitest — impact-analysis traversal (direction, direct/indirect, independent nodes, cycles, diamonds, source exclusion, determinism). |
| Lint | `npm run lint` | |
| Production build | `npm run build` | |
| Deploy | `npm run build && pa app push --solution-id 1412f3d7-dcdc-f111-84e8-6045bd93ffe1` | Requires the *Power Apps code apps* feature to be enabled for the environment in the Power Platform admin center. |
| Regenerate models | `pa app add data-source --connector dataverse --table <logical name> --org-url https://org4caa9250.crm4.dynamics.com` | or `pa app refresh data-source --name <assets\|dependencies\|users>` |

Scripts authenticate with `az account get-access-token --resource <Dataverse URL>`; nothing is cached in the repo.

## Demo data design (`scripts/seed-data.mjs`)

- **Identity API** — the shared service: 8 direct dependents, more indirect ones.
- **Diamond**: Customer Portal → Checkout Service → Identity API and Customer Portal → Orders API → Identity API
  (plus Checkout Service → Orders API). The portal is counted once.
- **Cycle**: Legacy CRM ⇄ CRM Sync Job; CRM Sync Job also requires Customer Database.
- **Independent**: Intranet Wiki (no edges), HR Portal → HR Database (separate island).
- **Unowned** assets: Admin Console, Pricing API, Shipping API, Recommendation Engine, Analytics Warehouse,
  ETL Pipeline, SMS Gateway, Maps Provider, Intranet Wiki, Legacy CRM, CRM Sync Job.
- Business owners are real, enabled users of the tenant (matched by UPN prefix, deterministic fallback otherwise).

Good things to simulate on stage: **Identity API** (wide direct blast radius) and **Customer Database**
(4 direct, 12 indirect, including the cycle and the analytics chain).

## Architecture

```
src/
  App.tsx                     state: selection, simulation, search, layout overrides
  types.ts                    Asset / Dependency / Owner domain types
  data/atlasRepository.ts     generated-service wrapper: paging, mapping, owner update, dependency create
  data/useAtlasData.ts        load/reload, validation (self-link, duplicate), post-save state updates
  graph/impact.ts             BFS over reverse edges with a visited set (direct / indirect / paths / owners)
  graph/impact.test.ts        Vitest coverage of the traversal rules
  graph/layout.ts             dagre layered layout, computed only when the asset set changes
  components/                 AtlasGraph (React Flow), AssetNode, SidePanel, Toolbar, Legend, StateViews
  generated/                  models + services generated by `pa app add data-source` (do not edit)
scripts/
  dataverse.mjs               Web API helper (az token, paging, OData helpers)
  schema.mjs                  logical names shared by provision/seed/reset
  provision.mjs · seed.mjs · reset.mjs · seed-data.mjs
```

Impact rule: **if A requires B, simulating B affects A.** Traversal is breadth-first against the edge direction with a
visited set, so cycles terminate and diamonds are counted once; depth 1 = direct, deeper = indirect; the simulated asset
is never counted. Simulation state is local to the browser — nothing is written to Dataverse.

Layout stability: dagre runs once per asset set; selecting, searching, simulating and adding dependencies never move
nodes. Manual drags are kept as overrides.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Baseline demo (deployed) |
| `rehearsal/ownership-gaps` | Rehearsed live-coding enhancement — **not** part of the baseline |

### Live-coding enhancement (rehearsal only)

Prompt to use on stage:

> In Dependency Atlas, add an "Ownership gaps" panel: find every asset with no business owner, compute how many
> unique assets depend on it directly or indirectly by reusing `computeImpact` from `src/graph/impact.ts`, and rank
> them by that count (highest first). Show it as a toggleable panel in the top bar with the asset name, type and
> dependent count; clicking a row selects and centres that asset on the graph.

See `docs/live-coding.md` for the rehearsed result and talking points.

## Verification status

See `docs/verification.md` for the detailed log (checks performed, results, what could not be automated).
