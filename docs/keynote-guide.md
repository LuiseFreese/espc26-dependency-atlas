# Dependency Atlas — Keynote guide

*"The What-Could-Possibly-Go-Wrong Graph"*

**Slot:** ESPC keynote, Thu 3 Dec 2026, 09:30–09:40, RAI Auditorium. Rehearsal Wed 17:45–18:45.
**Format:** Vesa asks → Luise shows. Five short exchanges. Then sit down.
**Keynote theme (Vesa):** the role of humans and empathy — tools help, human judgement and interaction stay.
**Your angle:** *The future of low code is code (apps).* Every exchange ends on a human.

All numbers are the verified values after `npm run reset`.

---

## What Dependency Atlas is — the purpose, in three sentences

> **Dependency Atlas is a map of which systems need which other systems to work — and a button that answers
> "what breaks if this one goes down?"** Every box is an application, API, database or external service; every
> arrow means *A requires B*; every box has (or embarrassingly lacks) a business owner. Pick any system, press
> *Show blast radius*, and you see exactly what stops working, how far the damage spreads, and who you need to
> call.

The problem it solves: every organisation has an architecture diagram on a wiki that nobody trusts and nobody
can query. Dependency knowledge lives in people's heads and surfaces during the incident, not before. Dependency
Atlas keeps it as *data* — in Dataverse, with real relationships — so the question can be asked by anyone, any
time, from any app.

Who it's for: whoever is on call at 3 a.m., whoever has to decide which systems deserve an owner, and whoever
runs the change-advisory meeting on Monday. In the keynote it is also a vehicle: the same data is shown through a
**React code app** (the graph) and a **zero-code model-driven app** (the grid), which is the whole "data and
platform" argument in one screen switch.

Say-it-in-one-breath version for Vesa's walk-on: *"It's a what-could-possibly-go-wrong graph for your IT estate.
You pick a system, pretend it died, and it tells you what else stops working and who to call."*

---

## 0. Your thesis — data and platform, not low code and apps

Say a version of this early (Q1). It is the lens for everything that follows.

> When people hear *Power Platform* they think *low code* and they think *apps* — a canvas, a formula bar, a
> screen somebody drags together on a Friday afternoon. I've never approached it that way. For me it was always
> **data and platform**. The app is the least interesting part. What matters is that the data lives in one place,
> with real tables and real relationships and real security — and that the platform brings identity, sharing,
> governance and lifecycle for free. Get *that* right and the app on top can be anything: a canvas app today, a
> model-driven form tomorrow, a Copilot agent next year — or, now, my own React.
>
> That's why "the future of low code is code" isn't a betrayal of low code. It's the natural end of it. Low code
> got us the data and the platform. Code apps mean I no longer have to compromise on the thing *on top*.

In plain terms, "data and platform first" means:

- **Model the business, not the screen.** Asset, Dependency, Business Owner are tables with relationships. "What breaks?" is a question about the data, so it is answered from the data — any UI can ask it.
- **The platform is the runtime, not the designer.** Sign-in, sharing, permissions, environments, solutions — you inherit them; you don't build them. A code app plugs into exactly the same sockets a canvas app does.
- **The app is replaceable; the data is not.** Dependency Atlas could be deleted tonight and the landscape would still be in Dataverse, ready for the next app.

---

## 1. What you teach — on stage

Eight things, in two groups: five about *what it does*, three ♥ about *how it was built*. Nothing else gets said on stage. IDs are stable (see backstage list for the rest).

| # | Concept | Explain it (newcomer) | Stage line | Where |
| --- | --- | --- | --- | --- |
| **C1** | **Code apps** | Power Apps used to mean a browser designer and formulas. A *code app* is a normal React/TypeScript web app, written in VS Code, that Power Apps hosts and runs — same sign-in, same sharing, same data, same app list. | "Same tenant, same login, same governance — but it's *my* React." | Q1 |
| **C2** | **Dataverse underneath** | Dataverse is the Power Platform's database. The two tables live there; the React app is just one way to look at them. On stage a *second*, zero-code model-driven app (**Dependency Atlas Admin**) shows the same rows — change the owner in React, refresh the grid, it's there. *This is the "data and platform" thesis made visible.* | "Same row, same table, two apps. The data doesn't care which one you use." | Q1, Q3 |
| **C6** | **The graph** | A list says what you have. A graph — boxes and arrows — says what depends on what. Every arrow here means *A requires B*. Once dependencies are rows pointing at rows, "what breaks?" becomes a computation instead of a memory. | "A table tells you what you have. A graph tells you what hurts." | Q1, Q2 |
| **C7** ↺ | **The computer walks the graph** | Start at the box that died, follow the arrows backwards, collect everything you reach, stop when you've seen it all. That's the whole simulation. The messy bits — two systems needing each other, one system reachable two ways — are exactly what people get wrong under pressure and computers get right every time. | "Every team knows what *their* system needs. Nobody knows the whole chain. That's a memory problem — and computers don't have it. The app follows the chain; the people decide what to do." | Q2 |
| **C9** | **Breaks immediately vs breaks because of that** | *Breaks immediately* = uses the dead thing itself. *Breaks because of that* = only breaks because something in between broke. The indirect people are the ones who find out last. | "The thing that breaks is rarely the thing you touched." | Q2 |

### ♥ Built the right way — the part that carries the empathy theme

These three are not "nice to have" at the end. They are the keynote's argument: **we don't only want to build the
right thing, we want to build it the right way** — and with AI doing the typing and the platform doing the plumbing,
the right way is no longer the expensive way. Each one is empathy for a specific person who isn't in the room.

| # | Concept | Explain it (newcomer) | Who it's for | Stage line | Where |
| --- | --- | --- | --- | --- | --- |
| **C12** ♥ | **Idempotent — run it twice, same result** | The scripts that create the tables and load the demo data check what exists before they create anything, and a *reset* puts everything back exactly as it was — in about 20 seconds, as often as you like. No duplicates, no "it worked on my environment", no half-configured leftovers. It's lifecycle management for schema *and* data, from the first day. | **Whoever comes after you** — the colleague who inherits this, the person who has to rebuild it in another environment, and future-you at the rehearsal tomorrow. | "I can nuke it and be back in twenty seconds. Nobody inherits my mess." | Q5 |
| **C13** ♥ | **Accessible — words and icons, not red and green** | Every impact state has a label and an icon (💥 Down, ⚠ Breaks immediately, ◔ Breaks because of that), and the rest of the graph is dimmed. Colour is a bonus, never the only signal. Roughly one in twelve men can't reliably tell red from green — and no projector in any auditorium renders colour the way your monitor does. | **The user you'll never meet** — the one in the room who can't see the difference, and the one in the back row. | "Red/green is not a legend. ⚠ *Breaks immediately* is. One in twelve people in this room can't see the difference — and neither can that projector." | Q5 |
| **C14** ♥ | **Governed — the admin kept the keys** | A code app is still a Power App. An administrator has to enable *Power Apps code apps* for the environment before anyone can publish one (we hit that switch building this). It is added to a solution for ALM, shared like any other app, follows DLP, and reads Dataverse with the *user's* permissions — never a backdoor account. Developers got freedom; the organisation lost nothing. | **The admin and the people they protect** — the person who has to say yes to this and sleep at night. | "Admins keep the keys. Developers get a better car." | Q5 |

**One insight (I1):** *Criticality labels lie; graphs don't.* A field someone typed says "low". The structure says seven systems fall over. Risk should be computed, not declared — and then a human decides what to do about it.

**One approach (A4):** *A rehearsed prompt.* Know the shape of the answer, name the function to reuse, keep it small. Then AI on stage is a demonstration, not a gamble.

---

## 2. The ten minutes — Vesa asks, Luise shows

Pre-stage: `npm run reset` done · published app open, hard-refreshed, zoomed ~125 % · VS Code on `main`, `npm run dev` already running, Copilot chat open · **Dependency Atlas Admin** (model-driven app) open on *Active Assets* in a second tab: https://org4caa9250.crm4.dynamics.com/main.aspx?appid=b67a7d91-fbdc-f111-84ea-000d3a489879

Cumulative timings. **Q3 is the one to drop** if you're over.

### 0:00 — Walk-on (30 s)

Vesa: intro — Luise, independent, Power Platform. No spoilers: *you* deliver the line.

### 0:30 — **Q1 · "How do you see Power Platform in the age of AI?"** → the app (1:45) — C1, C2, C6

**Show:** the published app. Let it load. Point at *32 assets · 50 dependencies*.

**Say (thesis first):** "When people hear Power Platform they think *low code* and they think *apps*. I never did. For me it was always **data and platform**: the data in one place, with real tables and real relationships — and a platform that gives me identity, sharing and governance for free. The app on top is the least interesting part. It can be a canvas app, a model-driven form, an agent — or, now, my own React."

**Say (C1 — your line):** "So here's how I see it: **the future of low code is code.** Not as a betrayal of low code — as the natural end of it. Because this *is* a Power App. React and TypeScript, written in VS Code, and Power Apps runs it — same login, same sharing button up there, same governance. That's a code app. Low code got us the data and the platform. AI writes the code now. So I don't have to compromise on the thing on top anymore."

**Say (C6):** "And this is the *What-Could-Possibly-Go-Wrong Graph*: every box is a system in a web shop, every arrow says *A requires B*. Every company has this diagram on a wiki page. Nobody has it as something you can *ask*."

Zoom gently into the top row (portals, mobile app). Point at a ⚠ *No business owner*. "Hold that thought."

### 2:15 — **Q2 · "Okay — what can I ask it?"** → blast radius of Identity API (2:00) — C7, C9

**Say (before clicking):** "One question. *If this system goes down — what else stops working?* Let's take the Identity API. That's the login. Every system that needs people to sign in goes through it."

**Click:** search `Identity` → Enter → **💥 Show blast radius**. Let it breathe for two seconds.

**Say (what they see):** "**Eight systems break immediately** — the customer portal, the mobile app, the partner portal, checkout, orders… all of them log people in through Identity. **One more breaks a step later: Shipping.** Shipping has nothing to do with login. But Shipping needs Inventory, and Inventory needs Identity. So Shipping is down too — and the Shipping team is the last to find out. **Nine systems, from one failure.**"

**Say (why a computer — C7):** "Every team knows what *their* system needs. Nobody knows the whole chain — three, four hops deep, across teams. That's not a knowledge problem, it's a *memory* problem, and computers don't have it. The app follows the chain end to end, every time, in a blink."

**Say (the human part — C9):** point at **People to call** — "And this is the part that stays human. Six names. The app knows *what* broke; these are the people who decide what to do about it. And look: two systems where the answer is *nobody*. That's not a technical problem. Hold that thought."

**Click:** ↺ Clear.

### 4:15 — **Q3 · "Is that real data or a demo file?"** → update a row, see it in a second app (1:00) — C2

**Say:** "Real data. It's two Dataverse tables — Assets and Dependencies. Let me show you with a second app."

**Switch tab:** *Dependency Atlas Admin* — a model-driven app, **Active Assets** grid. Point at **Admin Console**: Business Owner column is empty.

**Say:** "This is a standard model-driven Power App on the same two tables. No code, took a couple of minutes. Admin Console — no business owner."

**Switch back:** React app → search `Admin Console` → ✎ Change owner → **Grady Archie** → Save. Green message. ⚠ becomes 👤.

**Say:** "I just set the Business Owner field on that row. That's an update to Dataverse, through the service the CLI generated for me."

**Switch to the model-driven app** → **Refresh**. Grady Archie appears in the Admin Console row.

**Say:** "Same row, same table, two apps. The React one is the one I *wanted* to build. The model-driven one is what the platform gives me for free. The data doesn't care which one you use. That's what I mean by data and platform."

**Why this beat matters:** it is the only moment the audience *sees* the thesis instead of hearing it. If you drop Q3 for time, at least leave the grid tab open and gesture at it during Q5.

### 5:15 — **Q4 · "Where's the AI in this — and where's the human?"** → live coding (2:15) — I1, A4

**Switch:** VS Code, Copilot chat. Paste:

> In Dependency Atlas, add an "Ownership gaps" panel: find every asset with no business owner, compute how many unique assets depend on it directly or indirectly by reusing `computeImpact` from `src/graph/impact.ts`, and rank them by that count (highest first). Show it as a toggleable panel in the top bar with the asset name, type and dependent count; clicking a row selects and centres that asset on the graph.

**While it types, say:** "I'm not asking it to invent anything. I'm asking it to *reuse* the walk we just watched and rank the unowned systems by how much falls over. I know what the answer should look like — that's the part that stays human."

**Switch:** Local Play tab → **⚠ Ownership gaps (11)**.

**Punchline:** "Number one: **Maps Provider. Low criticality. Nobody owns it. Seven systems depend on it.** The label said *low* — a human typed that, once, years ago. The graph says *you have a problem*. Criticality labels lie; graphs don't. The AI did the ranking in ninety seconds. Deciding that this matters, and walking over to someone's desk to say *this one is yours now* — that's us."

**Fallback:** `git checkout rehearsal/ownership-gaps`, reload. "…and this is why we rehearse."

### 7:30 — **Q5 · "Impressive — but what did it take to put this in a real tenant, properly?"** → ♥ built the right way (2:00) — C12, C13, C14

This is the empathy beat. Slow down. Three things, each for a person who isn't in the room.

**1. Terminal — type `npm run reset` and let it run while you talk (~20 s).**
"Everything you saw — the tables, the fifty dependencies, the owner I just changed — is going back to zero right now. Then it comes back, identical. I can do this twice a day. The scripts that built this check what's there before they create anything; run them twice, same result. That's not for me. That's for whoever has to set this up in the next environment, or inherits it when I move on. **Nobody inherits my mess.**"

**2. App — point at the legend: 💥 ⚠ ◔.**
"Look at what the simulation showed you earlier: not just orange and yellow — *Breaks immediately*, *Breaks because of that*, with icons, and everything else dimmed. Colour is a bonus, never the only signal. One in twelve men in this room can't tell red from green. And that projector can't either. **Red/green is not a legend. ⚠ *Breaks immediately* is.** It cost me nothing. It just had to be decided."

**3. Say it, don't show it.**
"And the part you didn't see: before I could publish this, an administrator had to switch on *Power Apps code apps* for the environment. It sits in a solution. It runs with *your* permissions on Dataverse, not some backdoor account. I got all the freedom of React; the organisation gave up nothing. **Admins keep the keys. Developers get a better car.**"

**Close (land it on empathy):**
"We talk a lot about building the *right* thing. This graph is the right thing — it answers *what breaks*. But I care just as much about building it the *right way*: reproducible, accessible, governed. Those used to be two budgets — you did the second one if there was time left, and there never was. With AI doing the typing and the platform doing the plumbing, there is no excuse anymore. That's what empathy looks like in code. For the person on call at three in the morning. For the one in the back row who can't see red. For the admin who has to say yes and sleep at night. For whoever inherits it. Go find your Maps Provider."

### 9:30 — Vesa wraps, you sit.

### Time budget

| Exchange | Teaches | Minutes |
| --- | --- | --- |
| Walk-on | — | 0:30 |
| Q1 Power Platform in the age of AI (thesis) | C1, C2, C6 | 1:45 |
| Q2 What can I ask it | C7, C9 | 2:00 |
| Q3 Is it real *(drop if over)* | C2 | 1:00 |
| Q4 AI vs human | I1, A4 | 2:15 |
| Q5 ♥ Built the right way | C12, C13, C14 | 2:00 |
| Wrap | — | 0:30 |
| | | **10:00** (9:00 without Q3) |

### Suggested questions to give Vesa

1. "How do you see Power Platform in the age of AI?"  *(don't pre-empt the "future of low code is code" line — Luise says it)*
2. "Okay — what can I actually ask it?"
3. "Is that real data or a demo file?"
4. "Where's the AI in this — and where's the human?"
5. "Impressive — but what did it take to put this in a real tenant, properly?"

---

## 3. Storyline

**Arc:** *Data and platform, not low code and apps → a graph you can ask → the computer walks, the human decides → it's real → AI ranks, human judges → built with care, for people who aren't in the room.*

Vesa's theme is that tools help but judgement and people stay. Every exchange lands on a person:

| Exchange | The tool does | The human does |
| --- | --- | --- |
| Q1 | Draws the estate | Recognises their own wiki diagram |
| Q2 | Follows the whole dependency chain, end to end | Reads *People to call*, picks up the phone |
| Q3 | Updates a Dataverse row; a second app shows it | Picks the owner |
| Q4 | Ranks unowned systems by blast radius in 90 s | Knows what the answer should look like; decides it matters |
| Q5 | Resets, labels, governs | Chose to build it that way — for the next person, the back row, the admin |

**The ♥ thread in one breath:** *right thing* is Q1–Q4; *right way* is Q5. Don't let Q5 become the "if there's time" part — it is the part that connects your slot to Vesa's theme. If anything has to go, it's Q3.

**Taglines (pick three):**
- "A table tells you what you have. A graph tells you what hurts."
- "Criticality labels lie; graphs don't."
- "Same row, same table, two apps."
- "Build the right thing — and build it the right way. Those used to be two budgets."

**Don't:** drag nodes during a simulation · open `src/generated/` · explain OData, lookups or record ownership · say "visited set" or "BFS" — say *the computer walks the graph*.

### Cheat sheet (presenter view)

| Q | Action | Expected |
| --- | --- | --- |
| Q1 | load app | 32 assets · 50 dependencies |
| Q2 | Identity API → Show blast radius | **8 / 1 / 9** · 6 owners + 2 nobody · Shipping API yellow |
| Q3 | MDA grid (empty) → React: Admin Console → Grady Archie → MDA Refresh | green message · grid row shows Grady Archie |
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
| C10 | What-if vs persisted | Simulation is browser state only; owner/dependency edits are real Dataverse updates. |
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
