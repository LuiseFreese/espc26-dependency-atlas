# Dependency Atlas — Keynote guide

*"The What-Could-Possibly-Go-Wrong Graph"*

> Working title for the segment: **The future of low code is code (apps).**

This guide has three parts: (1) what the app lets you teach, (2) a click-by-click demo flow for 8–10 minutes,
(3) the storyline that holds it together. Numbers below are the verified values for the seeded dataset after
`npm run reset`.

---

## 1. What you can teach with this app

### Concepts

Referenced throughout as **C1–C14**. IDs are stable; C8 stays listed so references don't shift, but is skipped on stage.
The *Explain it* column is written for someone who has only briefly met Power Platform and has never heard of code apps.

| # | Concept | Explain it (for a Power Platform newcomer) | Where it shows up | One-liner for stage |
| --- | --- | --- | --- | --- |
| **C1** ★ | **Code apps = pro-code UI on the Power Platform runtime** | Classic Power Apps are built in a browser designer with Power Fx formulas. A *code app* is a normal web app — React, TypeScript, any npm package — written in VS Code. Power Apps then *hosts* it: same sign-in, same sharing dialog, same data connections, same app list. The platform is the runtime; you bring the user interface. | React/Vite/TypeScript app, hosted by the Power Apps player, authenticated by the platform | "Same tenant, same auth, same governance — but it's *my* React. No formula bar was harmed." |
| **C2** ★ | **Dataverse as the system of record, not the UI** | Dataverse is the Power Platform's database: tables, columns, relationships, security roles — the same store Dynamics 365 uses. Our two tables (*Asset*, *Dependency*) live there. The React app is just one way to look at that data; a canvas app, a model-driven form, a flow or a Copilot agent could use the same tables tomorrow without changing anything. | Two custom tables in the `DependencyAtlas` solution; the app is one head on the data | "The data outlives the app. That's the whole point of a platform." |
| **C3** | **Generated, typed data access** | Normally a web app talks to a database by hand-writing HTTP calls and *guessing* field names. Here one CLI command (`pa app add data-source`) reads the table definition from Dataverse and *generates* TypeScript for you: a **model** (what an Asset looks like — exact column names, choice values) and a **service** (create / read / update / delete). You call `Espc26_assetsService.getAll()`; a typo becomes a compile error instead of a runtime bug, and sign-in/tokens are handled by the platform. | `src/generated/models/*` and `src/generated/services/*` | "I didn't write a single `fetch`. The CLI read the table metadata and gave me TypeScript." |
| **C4** | **Lookups are relationships, not strings** | A *lookup* is Dataverse's foreign key: a column that points at a row in another table. *Business Owner* points at a real user record; *Dependent Asset* and *Required Asset* point at Asset rows. The screen shows a name, the database stores an ID — so renaming a person or system updates everywhere, and you never end up with "Grady Archie" and "G. Archie" as two different owners. In code you set a lookup with `@odata.bind` ("point this column at that row"). | `espc26_BusinessOwner@odata.bind`; two lookups from Dependency to Asset | "Business owner is a *reference* to a real person — not a free-text field someone misspells in 2027." |
| **C5** | **Business ownership ≠ record ownership** | Every Dataverse row can have a technical *owner* — the user or team that controls the record, used for permissions. That is **not** the same as who is accountable for the Identity API in the business. We model accountability as its own explicit lookup (*Business Owner Reference*) and make the tables organization-owned, so the two ideas never get confused. Rule of thumb: *record owner* = who may edit the row; *business owner* = who you call at 3 a.m. | `espc26_businessowner` vs Dataverse `ownerid`; tables are organization-owned | "Who's accountable for the Identity API and who created the row are two different questions." |
| **C6** | **Graphs are the right model for dependencies** | A list of systems answers "what do we have?". A graph — boxes connected by arrows — answers "what depends on what?". Every arrow here means *A requires B*. The moment you store dependencies as rows pointing at other rows (C4), you have a graph, and questions like "what breaks?" become computable instead of tribal knowledge. | Directed edges rendered with React Flow | "A table tells you *what* you have. A graph tells you *what hurts*." |
| **C7** | **Deterministic graph traversal** | The simulation is a *graph walk*: start at the asset that went down, find everything that requires it, then everything that requires *those*, and keep going. *Deterministic* means the same input always gives the same answer. A *visited set* is simply a list of boxes already seen — so a box reachable by two routes is counted once, and a loop stops instead of running forever. It is a textbook algorithm (breadth-first search), about 40 lines, with unit tests. | `computeImpact` in `src/graph/impact.ts`; `impact.test.ts` | "Cycles don't crash it, diamonds don't double count. That's a 40-line function with 9 unit tests." |
| **C8** ⏭ | *(skip on stage)* Direction matters | Covered implicitly by C6/C7: arrows mean *requires*, so an outage flows *against* the arrows. Keep the ID for reference; don't spend time on it. | — | — |
| **C9** | **Direct vs indirect blast radius** | *Direct* = systems that use the failed asset themselves (one hop). *Indirect* = systems that only break because something *in between* broke (two or more hops). The *blast radius* is the full, de-duplicated set. Why it matters: the Shipping API team never touched Identity, yet they are down — those are the people who find out last unless someone computes this. | Side panel stats: direct / indirect / affected total | "The thing that breaks is rarely the thing you touched." |
| **C10** | **Local what-if vs persisted state** | The app makes two very different kinds of change. *Simulate unavailable* is a thought experiment that lives only in the browser's memory — click *Reset* and nothing ever happened; Dataverse is untouched. *Change owner* and *Add dependency* are real writes that every other user sees immediately. Keeping the two visibly separate lets people explore freely without fear of breaking shared data. | Simulation = React state; edits go through the generated services | "Simulation is a thought experiment. Changing the owner is a commit." |
| **C11** ↺ | **Freedom means responsibility: you now own the UX** | Canvas and model-driven apps make many UX decisions *for* you (galleries, forms, responsive behaviour). In a code app, every one of those decisions is yours. Example here: the graph layout is computed once and never reshuffles when you click, search or simulate — because a picture that moves destroys trust. Pro-code power comes with pro-code duty; the platform no longer protects your users from your choices. | dagre layout runs once per asset set; selection/simulation never move nodes | "If the picture moves every time you click, nobody trusts the picture." |
| **C12** ♥ | **Idempotent infrastructure & data** | *Idempotent* = you can run it again and again and the result is the same — no duplicates, no errors. The scripts that create the tables check what already exists; the seed script upserts rows through a unique *seed key*; *reset* deletes only what the demo created and re-seeds. Why it matters: anyone can reproduce this environment in minutes, and nobody inherits a half-configured mess. It is ALM for schema *and* data. | `npm run provision` / `seed` / `reset`; alternate keys on `seedkey` | "I can nuke the demo and be back in 20 seconds. Repeatability is a feature." |
| **C13** ♥ | **Accessible by design** | Impact states are shown with a text label *and* an icon (⛔ Unavailable, ⚠ Direct impact, ◔ Indirect impact) plus dimming — never colour alone. Roughly 1 in 12 men can't reliably tell red from green, and conference projectors wash colours out anyway. The legend repeats the same icons. Nothing about this is hard; it just has to be decided. | `AssetNode` badges, legend, side-panel stats | "Red/green is not a legend. ⚠ Direct impact is." |
| **C14** ♥ | **Governance still applies** | A code app is still a Power App. It lives in an environment, must be *enabled by an admin* (we hit that switch today), is added to a solution for ALM, is shared like any other app, obeys DLP policies, and reads Dataverse with the *user's* permissions — not a service account. Developers get freedom; the organisation keeps the keys. | Environment feature flag; `pa app push --solution-id`; sharing | "Admins keep the keys. Developers get a better car." |

★ = lead with these · ♥ = the "built the right way" trio · ↺ = reframed for a Power Platform audience · ⏭ = skip

### Insights (the "aha" moments)

Referenced as **I1–I5**.

| # | Insight | Explain it | Evidence in the data |
| --- | --- | --- | --- |
| **I1** | **Criticality labels lie; graphs don't.** | *Criticality* is an opinion someone typed into a field, judged by what the system itself does. *Dependents* is a fact derived from structure. A geocoding service is "low" on its own — but Shipping needs it, Orders needs Shipping, Checkout and both portals need Orders. Risk should be *computed* from how things connect, not *declared*. | Top ownership gap is *Maps Provider* — tagged *Low*, owned by nobody, **7** systems depend on it. |
| **I2** | **Shared services are quiet single points of failure.** | Identity, configuration, central databases accumulate dependents one integration at a time; each team only sees its own arrow. Nobody sees the *aggregate* until the service is down. A graph makes the aggregate visible before the incident instead of in the post-mortem. | Identity API: **8** direct dependents, 9 affected in total. |
| **I3** | **Cycles exist in real estates.** | Real systems depend on each other mutually: sync jobs, bidirectional integrations, "temporary" workarounds from 2019. Any tool or script that assumes a neat tree will loop forever or crash on the first cycle. Design for cycles from day one — here the visited set makes it a non-event. | Legacy CRM ⇄ CRM Sync Job; simulating Customer Database still terminates with **16** affected. |
| **I4** | **Diamond paths are everywhere.** | When a system can be reached by more than one route, naïvely "counting every path" overstates impact — the Customer Portal would be counted twice. The visited set guarantees each system is counted once. This matters because executives see *one number*, and it has to be right. | Customer Portal reaches Identity API via Checkout *and* Orders; counted once in the **9**. |
| **I5** | **"No business owner" is a data quality problem with an operational cost.** | An empty owner field looks cosmetic. During an outage it is the person you *cannot* call. Ranking unowned assets by how many systems depend on them turns a vague data-quality backlog into a prioritised to-do list. Data quality *is* operational readiness. | 11 unowned assets; the ranking puts Maps Provider (7), Shipping API (6), ETL Pipeline (4) on top. |

### Approaches you can advocate

Referenced as **A1–A5**.

| # | Approach | Explain it | In this project |
| --- | --- | --- | --- |
| **A1** | **CLI-first platform development** | Everything from creating the app to publishing it happens in the terminal with the Power Apps CLI (`pa`). No clicking through wizards. That makes it scriptable, repeatable, CI/CD-friendly — and it is exactly where AI coding assistants are most useful, because they live in the terminal too. | `pa app init` → `pa app add data-source` → `npm run dev` → `pa app push --solution-id …` |
| **A2** | **Schema as code** | Tables, columns, lookups and keys are created by a script that calls the Dataverse Web API, and that script is checked into git. It is *infrastructure as code* for your data model: environments stay identical, changes are reviewable, nobody clicks through the maker portal forty times. | `scripts/provision.mjs` + `scripts/schema.mjs` |
| **A3** | **Test the algorithm, not the UI** | The UI is a thin shell over pure functions. Test the functions — they are fast, deterministic and cover the edge cases (cycles, diamonds, direction). Click-test the UI by hand. You get confidence where bugs are expensive, without a brittle UI test suite. | 11 Vitest tests run in under a second; `impact.test.ts`, `ownershipGaps.test.ts` |
| **A4** | **AI pair programming with a rehearsed prompt** | AI writes good code when you can describe the exact shape of the answer and name the function it should reuse. Rehearse the prompt, know the expected output, keep the change small. Live coding then becomes a *demonstration*, not a gamble. | The "Ownership gaps" prompt reuses `computeImpact`; expected result: Maps Provider on top |
| **A5** | **Branch for the stunt** | The deployed baseline lives on `main`. The live-coding result is committed on a separate branch. If the model misbehaves on stage, `git checkout` the branch and the audience sees the identical result — and a lesson about rehearsing. | `main` (deployed) vs `rehearsal/ownership-gaps` |

### The empathy thread — building the right thing, *the right way*

The keynote motto is **empathy**. Dependency Atlas builds the right thing (answer "what breaks?") — but the ♥ concepts
are about building it *the right way*, and each one is empathy for a specific person. The point to make: with AI
assistants and the new platform capabilities, doing it right is no longer the expensive option.

| Empathy for… | Concept(s) | What it looks like here |
| --- | --- | --- |
| **The person on call at 3 a.m.** | C9, I2, I5 | Direct vs indirect tiers; owners to notify; the unowned list. The app tells them *who* and *what*, not just *that*. |
| **Users who can't see colour / the back row of the hall** | C13 | Labels and icons, not red/green. Large node text. |
| **Users under pressure** | C11, C10 | The picture never moves under them; what-if is safe to play with. |
| **Admins and IT governance** | C14 | Enabled per environment, solution-aware, user-level permissions. Freedom without a shadow IT bypass. |
| **Colleagues and future-you** | C12, A2, A5 | Reproducible schema and data; a reset button; rehearsed branches. Nobody inherits a mess. |
| **The business** | C5, I1 | Accountability modelled explicitly; risk computed, not declared. |

### Coverage map — where each ID lands in the demo

| Demo beat | Teaches |
| --- | --- |
| Slides: hook + thesis | C1, C6 |
| Graph tour + legend | C6, C13 |
| Search → Identity API panel | C4, C5 |
| Simulation 1 (Identity API) | C7, C9, C10, C11, I2, I4 |
| Simulation 2 (Customer Database) | C7, C9, I3 |
| Owner edit + maker portal proof | C2, C3, C4, C5, C10 |
| VS Code: generated services, `computeImpact`, tests | C3, C7, A1, A3 |
| Live coding | C7, I1, I5, A4, A5 |
| Close | C1, C12, C13, C14, A2 — the empathy thread |

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

### 0:00 — Slide: *"What could possibly go wrong?"* (PowerPoint, 45 s) — C6

**Show:** A slide with just that sentence. Then a second slide: a messy architecture diagram (any one you like) with
the caption *"Every org has one of these. Nobody knows what happens when the box in the middle dies."*

**Say:** "Every estate has a diagram like this. It's on a wiki page last updated by someone who left. Tonight we're
going to replace it with something that can answer the only question that matters at 3 a.m.: *what breaks?*"

### 0:45 — Slide: *"The future of low code is code (apps)."* (PowerPoint, 30 s) — C1

**Say:** "Power Apps grew up. Code apps let me bring React, TypeScript, and any npm package I want — and still run
inside the Power Apps player with the tenant's identity, the environment's governance, and Dataverse underneath.
Let me show you what that buys you."

### 1:15 — Switch to the **published app** (browser, 90 s) — C6, C13

**Click:** Nothing yet. Let the graph load — point at the counter *"32 assets · 50 dependencies"*.

**Say:** "This is the What-Could-Possibly-Go-Wrong Graph. Every box is a system in a fictional web shop. Every arrow
says *A requires B*. Dark theme, because incidents happen at night."

**Click:** Legend (bottom) — point at *"A → B means A requires B"* and *⚠ No business owner*.
**Click:** Scroll-zoom into the top row (Customer Portal, Mobile App). Pan down to Identity API.

**Say:** "Notice the ⚠ on some boxes — nobody owns them. Hold that thought."

### 2:45 — Search & select (browser, 45 s) — C4, C5

**Click:** Search box → type `Identity` → Enter. The graph centres on Identity API, side panel opens.

**Say:** "Identity API. Single sign-on for every channel. High criticality, owned by Grady. *Required by 8* —
read that list: both portals, the mobile app, checkout, orders, inventory, reporting, admin."

### 3:30 — **Simulate unavailable** (browser, 90 s) — the money shot — C7, C9, C10, C11, I2, I4

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

### 5:00 — Second simulation: the cycle (browser, 45 s) — C7, C9, I3

**Click:** Search `Customer Database` → Enter → *Simulate unavailable*.

**Say:** "**4 direct, 12 indirect, 16 affected.** Watch the bottom left: Legacy CRM and CRM Sync Job depend on
*each other*. Real estates have cycles. Naïve code loops forever; this one terminates and still counts them
once. The HR cluster and the Intranet Wiki stay dim — unaffected, as they should be."

**Click:** *↺ Reset simulation*. Close the panel (✕).

### 5:45 — It's real Dataverse: make an edit (browser, 60 s) — C2, C3, C4, C5, C10

**Click:** Search `Admin Console` → Enter. Panel shows *⚠ No business owner assigned*.
**Click:** *✎ Change owner* → choose **Grady Archie** → *Save owner*. Green message: *Business owner saved to Dataverse.*
The ⚠ on the node becomes 👤 Grady Archie.

**Click:** Switch to the **make.powerapps.com** tab → Tables → Asset → data view → find *Admin Console*. Owner is set.

**Say:** "That wasn't a fake. That went through a generated, typed Dataverse service, set a lookup to a real
`systemuser`, and the row updated. Same table a canvas app or a model-driven form would use. The data is the
platform; this is just a very good front end."

*(Optional 20 s if time allows: back in the app, *Add dependency* → Admin Console requires Feature Flag Service →
Save → edge appears; try to save it again → red "already requires". "Validation, because demos have audiences.")*

### 6:45 — Switch to **VS Code**: how this was built (90 s) — C3, C7, A1, A3

**Show:** Explorer — point at `src/generated/` (don't open).
**Say:** "`pa app add data-source --connector dataverse --table espc26_asset`. That's it. Models and CRUD services
generated from table metadata. No handwritten REST."

**Open:** `src/graph/impact.ts`. Scroll to `computeImpact`.
**Say:** "The whole simulation is this: a breadth-first walk *against* the arrows, with a visited set. Depth one is
direct, deeper is indirect, the source is never counted. Forty lines."

**Open:** `src/graph/impact.test.ts` → terminal → `npm test` → *11 passed* (9 on main).
**Say:** "Direction, diamonds, cycles, independent nodes — tested where it matters: the algorithm, not the pixels."

### 8:15 — **Live coding** with Copilot (90–120 s) — C7, I1, I5, A4, A5

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

### 9:45 — Close (PowerPoint, 30 s) — C1, C12, C13, C14, A2 (empathy thread)

**Slide:** *"The future of low code is code (apps)."* with three bullets:
- Bring your own stack — keep the platform's identity, data, governance (C1, C14)
- Model the estate as a graph; answer *what breaks* before it breaks (C6, C9)
- Build it right, not just build the right thing: repeatable, accessible, governed (C12, C13, C14)

**Say:** "We built the right thing — it answers *what breaks*. But look at *how*: the scripts run twice without
breaking, the colours aren't the only signal, the admin flipped the switch and kept the keys. None of that was
extra effort tonight — AI wrote half of it and the platform did the rest. That's what empathy looks like in code:
for the person on call, for the colleague who inherits this, for the admin who has to trust it. Low code got us the
data. Code apps get us the UI we actually want on top of it. Go find your Maps Provider."

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

**Arc:** *Fear → Sight → Agency → Trust → Craft → Punchline → Empathy.*

Underneath the arc runs the keynote motto: **empathy**. Steps 1–3 are empathy for the person on call (they get
*who* and *what*, not just *that*). Steps 4–5 are empathy for admins and colleagues (governed, reproducible,
tested). Step 6 is empathy for the business (risk computed, not declared). Say the word once, at the close — let the
demo earn it first.

1. **Fear (the hook) — C6.** "What could possibly go wrong?" Everyone laughs because everyone has the wiki diagram.
   The joke is that nobody actually knows.

2. **Sight (the graph) — C6, C13.** Show the estate as a living, dark, slightly sci-fi graph. Name it. *The
   What-Could-Possibly-Go-Wrong Graph.* Establish the one rule: arrows mean *requires*. Plant the ⚠ seed.

3. **Agency (simulation) — C7, C9, C10, C11, I2, I3, I4.** Kill Identity API. Now the audience *sees* the blast radius, the tiers, the owners to
   call. Second simulation shows the tool is honest about hard cases (cycles, diamonds, unaffected islands). This
   is where the technical crowd nods: *this isn't a toy*.

4. **Trust (it's real) — C2, C3, C4, C5.** One edit, round-tripped to the Dataverse table in the maker portal. The message:
   this is Power Platform data with a pro-code face, not a demo with a JSON file.

5. **Craft (how) — C1, C3, C7, A1, A3.** Pull back the curtain: generated services, a 40-line traversal, tests. Tone: *this is
   approachable*. The future of low code is code — and the code is smaller than you think.

6. **Punchline (live coding) — I1, I5, A4, A5.** Ask the AI to reuse the traversal to rank ownership gaps. The answer surprises:
   the "low criticality" external map service is the biggest unowned risk. Land the two taglines back to back:
   *Criticality labels lie, graphs don't.* / *The future of low code is code (apps).*

7. **Empathy (the close) — C12, C13, C14.** Step back from the feature to the *way* it was built: idempotent
   scripts, labels not colours, admin-enabled and governed. Name the people each one is for. Then: "Doing it right
   used to be the expensive option. It isn't anymore."

### Recurring bits you can reuse

- "Dark theme, because incidents happen at night."
- "The thing that breaks is rarely the thing you touched."
- "Simulation is a thought experiment. Changing the owner is a commit."
- "Admins keep the keys. Developers get a better car."
- "Criticality labels lie. Graphs don't."
- "Build the right thing — and build it the right way. Those used to be two budgets."
- "Go find your Maps Provider." (closing call to action)

### What *not* to do

- Don't re-layout or drag nodes during simulation — the stable picture is part of the argument.
- Don't open `src/generated/` files — they're long and the point is you *didn't write them*.
- Don't explain OData bind syntax on stage; say "it set a lookup" and move on.
- Don't run the live prompt without `npm run dev` already up; the compile/HMR wait is the awkward silence.

### Cheat sheet (presenter view)

| Beat | Action | Expected | IDs |
| --- | --- | --- | --- |
| Tour | Load app | 32 assets · 50 dependencies | C6, C13 |
| Sim 1 | Identity API → Simulate | 8 / 1 / 9 · 7 owners + 2 unowned | C7–C11, I2, I4 |
| Sim 2 | Customer Database → Simulate | 4 / 12 / 16 · HR + Wiki dim | C7, C9, I3 |
| Edit | Admin Console → owner Grady Archie | green toast, 👤 on node | C2–C5, C10 |
| Tests | `npm test` | 9 passed (main) / 11 (rehearsal) | C7, A3 |
| Live | Ownership gaps | #1 Maps Provider — 7 · #2 Shipping API — 6 · #3 ETL Pipeline — 4 | I1, I5, A4 |
| Panic | `git checkout rehearsal/ownership-gaps` | same result | A5 |
| After | `npm run reset` | back to 32 / 50, Admin Console unowned | C12 |
