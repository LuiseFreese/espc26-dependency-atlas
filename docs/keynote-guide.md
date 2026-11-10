# Dependency Atlas — Keynote guide

*"The What-Could-Possibly-Go-Wrong Graph"*

> Working title for the segment: **The future of low code is code (apps).**

This guide has three parts: (1) what the app lets you teach, (2) a click-by-click demo flow for 8–10 minutes,
(3) the storyline that holds it together. Numbers below are the verified values for the seeded dataset after
`npm run reset`.

---

## 1. What you can teach with this app

### Concepts

| Concept | Where it shows up | One-liner for stage |
| --- | --- | --- |
| **Code apps = pro-code UI on the Power Platform runtime** | React/Vite/TypeScript app, hosted by the Power Apps player, authenticated by the platform | "Same tenant, same auth, same governance — but it's *my* React. No formula bar was harmed." |
| **Dataverse as the system of record, not the UI** | Two custom tables; the app is just one head on the data | "The data outlives the app. That's the whole point of a platform." |
| **Generated, typed data access** | `pa app add data-source` → `src/generated/` models & services | "I didn't write a single `fetch`. The CLI read the table metadata and gave me TypeScript." |
| **Lookups are relationships, not strings** | `espc26_BusinessOwner@odata.bind`, two lookups to the same table | "Business owner is a *reference* to a real person — not a free-text field someone misspells in 2027." |
| **Business ownership ≠ record ownership** | `espc26_businessowner` vs Dataverse `ownerid`, tables are org-owned | "Who's accountable for the Identity API and who created the row are two different questions." |
| **Graphs are the right model for dependencies** | Directed edges, "A requires B" | "A table tells you *what* you have. A graph tells you *what hurts*." |
| **Deterministic graph traversal** | `computeImpact`: BFS over reverse edges with a visited set | "Cycles don't crash it, diamonds don't double count. That's a 40-line function with 9 unit tests." |
| **Direction matters** | If A requires B, simulating B affects A | "Follow the arrows *backwards* — outage flows against dependency." |
| **Direct vs indirect blast radius** | Depth 1 = direct, deeper = indirect | "The thing that breaks is rarely the thing you touched." |
| **Local what-if vs persisted state** | Simulation is React state only; owner/dependency edits are real writes | "Simulation is a thought experiment. Changing the owner is a commit." |
| **Stable layout as a UX principle** | dagre runs once per asset set; selection/simulation never moves nodes | "If the picture moves every time you click, nobody trusts the picture." |
| **Idempotent infrastructure & data** | `provision` / `seed` / `reset` via alternate keys | "I can nuke the demo and be back in 20 seconds. Repeatability is a feature." |
| **Accessible by design** | Impact states use labels + icons, not colour alone | "Red/green is not a legend. ⚠ Direct impact is." |
| **Governance still applies** | Code apps are an environment feature; solution-aware; shareable like any app | "Admins keep the keys. Developers get a better car." |

### Insights (the "aha" moments)

1. **Criticality labels lie; graphs don't.** The highest-ranked ownership gap is *Maps Provider* — tagged *Low* criticality, owned by nobody, 7 systems depend on it.
2. **Shared services are quiet single points of failure.** Identity API has 8 direct dependents; nobody draws that diagram until it's down.
3. **Cycles exist in real estates** (Legacy CRM ⇄ CRM Sync Job). Your tooling has to survive them.
4. **Diamond paths are everywhere** (Customer Portal reaches Identity API through both Checkout and Orders). Naïve counting double-counts; the visited set is the fix.
5. **"No business owner" is a data quality problem with an operational cost.** The live-coding moment makes that cost a number.

### Approaches you can advocate

- **CLI-first platform development**: `pa app init` → `pa app add data-source` → `npm run dev` → `pa app push`.
- **Schema as code**: metadata created through the Web API from a script, checked into git, re-runnable.
- **Test the algorithm, not the UI**: the traversal is pure TypeScript with Vitest; the UI is thin.
- **AI pair programming with a rehearsed prompt**: you know the shape of the answer, the model does the typing.
- **Branch for the stunt**: `main` is what's deployed; `rehearsal/ownership-gaps` is proof the live prompt works.

---

## 2. Demo flow (8–10 minutes)

**Setup before going on stage**

- [ ] `npm run reset` (restores 32 assets / 50 dependencies, clears any live edits)
- [ ] Published app open in a browser tab, hard-refreshed, signed in as the hscluise account, zoomed to fit
- [ ] VS Code open on `main`, with `src/graph/impact.ts` and a terminal visible; Copilot chat panel ready
- [ ] make.powerapps.com → Tables → *Asset* open in a second tab (for the "it's just Dataverse" beat)
- [ ] PowerPoint on the title slide; presenter view showing this flow
- [ ] Browser zoom ~125 % so node labels are readable from the back row

Timings are cumulative.

### 0:00 — Slide: *"What could possibly go wrong?"* (PowerPoint, 45 s)

**Show:** A slide with just that sentence. Then a second slide: a messy architecture diagram (any one you like) with
the caption *"Every org has one of these. Nobody knows what happens when the box in the middle dies."*

**Say:** "Every estate has a diagram like this. It's on a wiki page last updated by someone who left. Tonight we're
going to replace it with something that can answer the only question that matters at 3 a.m.: *what breaks?*"

### 0:45 — Slide: *"The future of low code is code (apps)."* (PowerPoint, 30 s)

**Say:** "Power Apps grew up. Code apps let me bring React, TypeScript, and any npm package I want — and still run
inside the Power Apps player with the tenant's identity, the environment's governance, and Dataverse underneath.
Let me show you what that buys you."

### 1:15 — Switch to the **published app** (browser, 90 s)

**Click:** Nothing yet. Let the graph load — point at the counter *"32 assets · 50 dependencies"*.

**Say:** "This is the What-Could-Possibly-Go-Wrong Graph. Every box is a system in a fictional web shop. Every arrow
says *A requires B*. Dark theme, because incidents happen at night."

**Click:** Legend (bottom) — point at *"A → B means A requires B"* and *⚠ No business owner*.
**Click:** Scroll-zoom into the top row (Customer Portal, Mobile App). Pan down to Identity API.

**Say:** "Notice the ⚠ on some boxes — nobody owns them. Hold that thought."

### 2:45 — Search & select (browser, 45 s)

**Click:** Search box → type `Identity` → Enter. The graph centres on Identity API, side panel opens.

**Say:** "Identity API. Single sign-on for every channel. High criticality, owned by Grady. *Required by 8* —
read that list: both portals, the mobile app, checkout, orders, inventory, reporting, admin."

### 3:30 — **Simulate unavailable** (browser, 90 s) — the money shot

**Click:** *⛔ Simulate unavailable*.

**Let it breathe for 2 seconds.** The graph dims; 8 boxes turn orange (direct), one turns yellow (indirect), paths
light up magenta.

**Say:** "**8 direct, 1 indirect, 9 affected.** The whole customer-facing surface is gone. And look at *Owners to
notify*: seven people — and two systems where the answer is *nobody*."

**Point:** Shipping API in yellow. "Shipping doesn't even talk to Identity. It needs Inventory, Inventory needs
Identity. That's the indirect tier — the thing that breaks is rarely the thing you touched."

**Point:** Customer Portal. "The portal reaches Identity through Checkout *and* through Orders. Two paths, counted
once. That's a visited set doing its job."

**Click:** *↺ Reset simulation*.

### 5:00 — Second simulation: the cycle (browser, 45 s)

**Click:** Search `Customer Database` → Enter → *Simulate unavailable*.

**Say:** "**4 direct, 12 indirect, 16 affected.** Watch the bottom left: Legacy CRM and CRM Sync Job depend on
*each other*. Real estates have cycles. Naïve code loops forever; this one terminates and still counts them
once. The HR cluster and the Intranet Wiki stay dim — unaffected, as they should be."

**Click:** *↺ Reset simulation*. Close the panel (✕).

### 5:45 — It's real Dataverse: make an edit (browser, 60 s)

**Click:** Search `Admin Console` → Enter. Panel shows *⚠ No business owner assigned*.
**Click:** *✎ Change owner* → choose **Grady Archie** → *Save owner*. Green message: *Business owner saved to Dataverse.*
The ⚠ on the node becomes 👤 Grady Archie.

**Click:** Switch to the **make.powerapps.com** tab → Tables → Asset → data view → find *Admin Console*. Owner is set.

**Say:** "That wasn't a fake. That went through a generated, typed Dataverse service, set a lookup to a real
`systemuser`, and the row updated. Same table a canvas app or a model-driven form would use. The data is the
platform; this is just a very good front end."

*(Optional 20 s if time allows: back in the app, *Add dependency* → Admin Console requires Feature Flag Service →
Save → edge appears; try to save it again → red "already requires". "Validation, because demos have audiences.")*

### 6:45 — Switch to **VS Code**: how this was built (90 s)

**Show:** Explorer — point at `src/generated/` (don't open).
**Say:** "`pa app add data-source --connector dataverse --table espc26_asset`. That's it. Models and CRUD services
generated from table metadata. No handwritten REST."

**Open:** `src/graph/impact.ts`. Scroll to `computeImpact`.
**Say:** "The whole simulation is this: a breadth-first walk *against* the arrows, with a visited set. Depth one is
direct, deeper is indirect, the source is never counted. Forty lines."

**Open:** `src/graph/impact.test.ts` → terminal → `npm test` → *11 passed* (9 on main).
**Say:** "Direction, diamonds, cycles, independent nodes — tested where it matters: the algorithm, not the pixels."

### 8:15 — **Live coding** with Copilot (90–120 s)

**Open:** Copilot chat. Paste the rehearsed prompt:

> In Dependency Atlas, add an "Ownership gaps" panel: find every asset with no business owner, compute how many
> unique assets depend on it directly or indirectly by reusing `computeImpact` from `src/graph/impact.ts`, and rank
> them by that count (highest first). Show it as a toggleable panel in the top bar with the asset name, type and
> dependent count; clicking a row selects and centres that asset on the graph.

**While it generates, say:** "I'm not asking it to invent an algorithm. I'm asking it to *reuse* the one we just
tested. That's the skill: knowing what the answer should look like."

**When done:** `npm run dev` is already running → switch to the Local Play tab → click *⚠ Ownership gaps (11)*.

**Punchline:** "Number one: **Maps Provider. Low criticality. No owner. Seven systems depend on it.** The label
said 'low'. The graph said 'you have a problem'. Criticality labels lie. Graphs don't."

**Fallback if the model misbehaves:** `git checkout rehearsal/ownership-gaps` in the terminal, reload. Say
"…and this is why we rehearse. Same code, same result."

### 9:45 — Close (PowerPoint, 30 s)

**Slide:** *"The future of low code is code (apps)."* with three bullets:
- Bring your own stack — keep the platform's identity, data, governance
- Model the estate as a graph; answer *what breaks* before it breaks
- Repeatable scripts, typed services, tested logic — Power Platform, professionally

**Say:** "Low code got us the data. Code apps get us the UI we actually want on top of it. Go find your Maps
Provider."

### Time budget

| Segment | Minutes |
| --- | --- |
| Slides: hook + thesis | 1:15 |
| Graph tour + search | 2:15 |
| Simulation ×2 | 2:15 |
| Real edit + Dataverse proof | 1:00 |
| VS Code: how it's built | 1:30 |
| Live coding + punchline | 1:30–2:00 |
| Close | 0:30 |
| **Total** | **~10:00** (cut the second simulation to land at 8:30) |

---

## 3. Storyline

**Arc:** *Fear → Sight → Agency → Craft → Punchline.*

1. **Fear (the hook).** "What could possibly go wrong?" Everyone laughs because everyone has the wiki diagram.
   The joke is that nobody actually knows.

2. **Sight (the graph).** Show the estate as a living, dark, slightly sci-fi graph. Name it. *The
   What-Could-Possibly-Go-Wrong Graph.* Establish the one rule: arrows mean *requires*. Plant the ⚠ seed.

3. **Agency (simulation).** Kill Identity API. Now the audience *sees* the blast radius, the tiers, the owners to
   call. Second simulation shows the tool is honest about hard cases (cycles, diamonds, unaffected islands). This
   is where the technical crowd nods: *this isn't a toy*.

4. **Trust (it's real).** One edit, round-tripped to the Dataverse table in the maker portal. The message:
   this is Power Platform data with a pro-code face, not a demo with a JSON file.

5. **Craft (how).** Pull back the curtain: generated services, a 40-line traversal, tests. Tone: *this is
   approachable*. The future of low code is code — and the code is smaller than you think.

6. **Punchline (live coding).** Ask the AI to reuse the traversal to rank ownership gaps. The answer surprises:
   the "low criticality" external map service is the biggest unowned risk. Land the two taglines back to back:
   *Criticality labels lie, graphs don't.* / *The future of low code is code (apps).*

### Recurring bits you can reuse

- "Dark theme, because incidents happen at night."
- "Follow the arrows backwards — outages flow against dependency."
- "The thing that breaks is rarely the thing you touched."
- "Simulation is a thought experiment. Changing the owner is a commit."
- "Admins keep the keys. Developers get a better car."
- "Go find your Maps Provider." (closing call to action)

### What *not* to do

- Don't re-layout or drag nodes during simulation — the stable picture is part of the argument.
- Don't open `src/generated/` files — they're long and the point is you *didn't write them*.
- Don't explain OData bind syntax on stage; say "it set a lookup" and move on.
- Don't run the live prompt without `npm run dev` already up; the compile/HMR wait is the awkward silence.

### Cheat sheet (presenter view)

| Beat | Action | Expected |
| --- | --- | --- |
| Tour | Load app | 32 assets · 50 dependencies |
| Sim 1 | Identity API → Simulate | 8 / 1 / 9 · 7 owners + 2 unowned |
| Sim 2 | Customer Database → Simulate | 4 / 12 / 16 · HR + Wiki dim |
| Edit | Admin Console → owner Grady Archie | green toast, 👤 on node |
| Tests | `npm test` | 9 passed (main) / 11 (rehearsal) |
| Live | Ownership gaps | #1 Maps Provider — 7 · #2 Shipping API — 6 · #3 ETL Pipeline — 4 |
| Panic | `git checkout rehearsal/ownership-gaps` | same result |
| After | `npm run reset` | back to 32 / 50, Admin Console unowned |
