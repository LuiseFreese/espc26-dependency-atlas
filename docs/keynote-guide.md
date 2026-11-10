# Dependency Atlas — Keynote guide

*"The What-Could-Possibly-Go-Wrong Graph"*

**Slot:** ESPC keynote, Thu 3 Dec 2026, 09:30–09:40, RAI Auditorium. Rehearsal Wed 17:45–18:45.
**Format:** Vesa asks → Luise shows. Five short exchanges. Then sit down.
**Keynote theme (Vesa):** the role of humans and empathy — tools help, human judgement and interaction stay.
**Your angle:** *The future of low code is code (apps).* Every exchange ends on a human.

All numbers are the verified values after `npm run reset`.

---

## 1. What you teach — on stage

Six things. Nothing else gets said on stage. IDs are stable (see backstage list for the rest).

| # | Concept | Explain it (newcomer) | Stage line | Where |
| --- | --- | --- | --- | --- |
| **C1** | **Code apps** | Power Apps used to mean a browser designer and formulas. A *code app* is a normal React/TypeScript web app, written in VS Code, that Power Apps hosts and runs — same sign-in, same sharing, same data, same app list. | "Same tenant, same login, same governance — but it's *my* React." | Q1 |
| **C6** | **The graph** | A list says what you have. A graph — boxes and arrows — says what depends on what. Every arrow here means *A requires B*. Once dependencies are rows pointing at rows, "what breaks?" becomes a computation instead of a memory. | "A table tells you what you have. A graph tells you what hurts." | Q1, Q2 |
| **C7** ↺ | **The computer walks the graph** | Start at the box that died, follow the arrows backwards, collect everything you reach, stop when you've seen it all. That's the whole simulation. The messy bits — two boxes needing each other, one box reachable two ways — are exactly what humans get wrong at 3 a.m. and computers get right every time. | "You know what Identity API *does*. Nobody can hold fifty arrows in their head. Let the computer walk — the human decides what to do with the answer." | Q2 |
| **C9** | **Direct vs indirect** | *Direct* = uses the dead thing itself. *Indirect* = only breaks because something in between broke. The indirect people are the ones who find out last. | "The thing that breaks is rarely the thing you touched." | Q2 |
| **C2** | **Dataverse underneath** | Dataverse is the Power Platform's database. The two tables live there; the React app is just one way to look at them. Edit here, it's changed for everyone and every other app. | "Simulation is a thought experiment. Changing the owner is a commit." | Q3 |
| **C12–14** ♥ | **Built the right way** | *Idempotent* scripts (run twice, same result, reset in 20 s). *Accessible* states (icons and words, not red/green). *Governed* (an admin enabled code apps for this environment; it sits in a solution; it runs with the user's permissions). | "Build the right thing — and build it the right way. Those used to be two budgets." | Q5 |

**One insight (I1):** *Criticality labels lie; graphs don't.* A field someone typed says "low". The structure says seven systems fall over. Risk should be computed, not declared — and then a human decides what to do about it.

**One approach (A4):** *A rehearsed prompt.* Know the shape of the answer, name the function to reuse, keep it small. Then AI on stage is a demonstration, not a gamble.

---

## 2. The ten minutes — Vesa asks, Luise shows

Pre-stage: `npm run reset` done · published app open, hard-refreshed, zoomed ~125 % · VS Code on `main`, `npm run dev` already running, Copilot chat open · make.powerapps.com → Tables → Asset data view in a second tab.

Cumulative timings. **Q3 is the one to drop** if you're over.

### 0:00 — Walk-on (30 s)

Vesa: intro, "Luise has been telling everyone the future of low code is code…"

### 0:30 — **Q1 · "So what do you mean by that?"** → the app (1:30) — C1, C6

**Show:** the published app. Let it load. Point at *32 assets · 50 dependencies*.

**Say:** "This is a Power App. It's React and TypeScript, written in VS Code, and Power Apps runs it — same login, same sharing button up there, same governance. That's a code app. And this is the *What-Could-Possibly-Go-Wrong Graph*: every box is a system in a web shop, every arrow says *A requires B*. Every company has this diagram on a wiki page. Nobody has it as something you can *ask*."

Zoom gently into the top row (portals, mobile app). Point at a ⚠ *No business owner*. "Hold that thought."

### 2:00 — **Q2 · "Okay — what can I ask it?"** → simulate Identity API (2:00) — C7, C9

**Click:** search `Identity` → Enter → **⛔ Simulate unavailable**. Let it breathe.

**Say:** "What breaks if single sign-on goes down. **Eight directly. One more indirectly. Nine systems.** Look at Shipping, the yellow one — Shipping doesn't even talk to Identity. It needs Inventory, Inventory needs Identity. Those are the people who find out last."

**Say (C7):** "You know what Identity API does. Nobody can hold fifty arrows in their head — especially not at three in the morning. The computer walks the graph: backwards along the arrows, collects what it reaches, stops when it's seen everything. It even survives the ugly parts — two systems that need each other, one system reachable two ways. That's its job. *Ours* is this list —" point at **Owners to notify** — "seven people to call. And two systems where the answer is *nobody*."

**Click:** ↺ Reset simulation.

### 4:00 — **Q3 · "Is that real data or a demo file?"** → change an owner (1:30) — C2

**Click:** search `Admin Console` → ✎ Change owner → **Grady Archie** → Save. Green: *saved to Dataverse*. ⚠ becomes 👤.
**Switch tab:** make.powerapps.com → Asset table → Admin Console row → owner is set.

**Say:** "Dataverse. Same table a canvas app or a model-driven form would use. Simulation was a thought experiment; this was a commit — a human just decided who is accountable, and every other app in the tenant now knows. That decision isn't going to be automated. It shouldn't be."

### 5:30 — **Q4 · "Where's the AI in this — and where's the human?"** → live coding (2:30) — I1, A4

**Switch:** VS Code, Copilot chat. Paste:

> In Dependency Atlas, add an "Ownership gaps" panel: find every asset with no business owner, compute how many unique assets depend on it directly or indirectly by reusing `computeImpact` from `src/graph/impact.ts`, and rank them by that count (highest first). Show it as a toggleable panel in the top bar with the asset name, type and dependent count; clicking a row selects and centres that asset on the graph.

**While it types, say:** "I'm not asking it to invent anything. I'm asking it to *reuse* the walk we just watched and rank the unowned systems by how much falls over. I know what the answer should look like — that's the part that stays human."

**Switch:** Local Play tab → **⚠ Ownership gaps (11)**.

**Punchline:** "Number one: **Maps Provider. Low criticality. Nobody owns it. Seven systems depend on it.** The label said *low* — a human typed that, once, years ago. The graph says *you have a problem*. Criticality labels lie; graphs don't. The AI did the ranking in ninety seconds. Deciding that this matters, and walking over to someone's desk to say *this one is yours now* — that's us."

**Fallback:** `git checkout rehearsal/ownership-gaps`, reload. "…and this is why we rehearse."

### 8:00 — **Q5 · "What did it take to get this into a real tenant?"** → built the right way (1:30) — C12, C13, C14

**Show** three quick things, no clicking around:
1. Terminal: `npm run reset` — it runs while you talk (~20 s). "Tables, data, back to zero, twice a day if I want. Idempotent. Nobody inherits my mess."
2. App legend: ⛔ ⚠ ◔ "Icons and words, not red and green. One in twelve men in this room can't tell those apart, and the projector can't either."
3. Say it, don't show it: "And an admin had to flip a switch — *Power Apps code apps* — for this environment before I could publish. It's in a solution, it runs with *your* permissions on Dataverse. Admins keep the keys. Developers get a better car."

**Close:** "Build the right thing — and build it the right way. Those used to be two budgets. With AI doing the typing and the platform doing the plumbing, they're not anymore. That's what empathy looks like in code: for the person on call, for the admin who has to trust it, for whoever inherits it. Go find your Maps Provider."

### 9:30 — Vesa wraps, you sit.

### Time budget

| Exchange | Teaches | Minutes |
| --- | --- | --- |
| Walk-on | — | 0:30 |
| Q1 What do you mean | C1, C6 | 1:30 |
| Q2 What can I ask it | C7, C9 | 2:00 |
| Q3 Is it real *(drop if over)* | C2 | 1:30 |
| Q4 AI vs human | I1, A4 | 2:30 |
| Q5 Into a real tenant | C12–14 | 1:30 |
| Wrap | — | 0:30 |
| | | **10:00** (8:30 without Q3) |

### Suggested questions to give Vesa

1. "You keep saying the future of low code is code. What do you mean?"
2. "Okay — what can I actually ask it?"
3. "Is that real data or a demo file?"
4. "Where's the AI in this — and where's the human?"
5. "What did it take to get this into a real tenant?"

---

## 3. Storyline

**Arc:** *A graph you can ask → the computer walks, the human decides → it's real → AI ranks, human judges → built with care.*

Vesa's theme is that tools help but judgement and people stay. Every exchange lands on a person:

| Exchange | The tool does | The human does |
| --- | --- | --- |
| Q1 | Draws the estate | Recognises their own wiki diagram |
| Q2 | Walks fifty arrows, survives cycles and diamonds | Reads *owners to notify*, picks up the phone |
| Q3 | Persists to Dataverse | Decides who is accountable |
| Q4 | Ranks unowned systems by blast radius in 90 s | Knows what the answer should look like; decides it matters |
| Q5 | Resets, labels, governs | Chose to build it that way — for the next person |

**Taglines (max three on stage):**
- "A table tells you what you have. A graph tells you what hurts."
- "Criticality labels lie; graphs don't."
- "Build the right thing — and build it the right way. Those used to be two budgets."

**Don't:** drag nodes during a simulation · open `src/generated/` · explain OData, lookups or record ownership · say "visited set" or "BFS" — say *the computer walks the graph*.

### Cheat sheet (presenter view)

| Q | Action | Expected |
| --- | --- | --- |
| Q1 | load app | 32 assets · 50 dependencies |
| Q2 | Identity API → Simulate | **8 / 1 / 9** · 7 owners + 2 nobody · Shipping API yellow |
| Q3 | Admin Console → owner Grady Archie → maker portal | green toast · row shows owner |
| Q4 | paste prompt → Local Play → Ownership gaps | **#1 Maps Provider 7** · #2 Shipping API 6 · #3 ETL Pipeline 4 |
| Q4 panic | `git checkout rehearsal/ownership-gaps` | same result |
| Q5 | `npm run reset` | ~20 s · back to 32 / 50 · Admin Console unowned |

---

## Backstage — not on stage, but good to know for Q&A, blog, hallway

Kept with stable IDs so earlier notes still resolve.

| # | Concept | One sentence |
| --- | --- | --- |
| C3 | Generated, typed data access | `pa app add data-source` reads the table and generates TypeScript models and CRUD services; no hand-written HTTP. |
| C4 | Lookups are relationships | Business Owner and the two asset references are foreign keys to real rows, set via `@odata.bind`. |
| C5 | Business ownership ≠ record ownership | Dataverse `ownerid` is about permissions; our Business Owner lookup is about accountability; tables are org-owned so they don't collide. |
| C8 | Direction matters | Arrows mean *requires*; outages flow against them. (Implicit in C7.) |
| C10 | What-if vs persisted | Simulation is browser state only; owner/dependency edits are real writes. (Said in one line in Q3.) |
| C11 | You own the UX now | Canvas apps made layout decisions for you; here the layout is computed once and never reshuffles — a moving picture destroys trust. |
| I2 | Shared services are quiet SPOFs | Dependents accumulate one integration at a time; nobody sees the aggregate until it's down. |
| I3 | Cycles exist | Legacy CRM ⇄ CRM Sync Job; anything assuming a tree loops or crashes. |
| I4 | Diamonds exist | Customer Portal reaches Identity two ways; counted once. |
| I5 | No owner has an operational cost | The ranking turns a data-quality backlog into a prioritised list. |
| A1 | CLI-first | `pa app init` → `add data-source` → `npm run dev` → `pa app push`. |
| A2 | Schema as code | Tables created by a script via the Web API, in git, re-runnable. |
| A3 | Test the algorithm, not the UI | 11 Vitest tests on the traversal and ranking; UI click-tested by hand. |
| A5 | Branch for the stunt | `main` deployed, `rehearsal/ownership-gaps` is the safety net. |

If someone asks "how long did this take?": the schema scripts, seed, app, tests and deploy were built in one session with an AI assistant — which is itself the point of Q4.
