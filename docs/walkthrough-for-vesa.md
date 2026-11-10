# ESPC keynote — Luise's slot (09:30–09:40) · walkthrough for Vesa

**Demo:** *Dependency Atlas* — a Power Apps **code app** (React/TypeScript) on **Dataverse**.
A "what-could-possibly-go-wrong graph" of an IT estate: every box is a system, every arrow means *A requires B*.
Pick a system, press **Show blast radius**, and it shows what else stops working and who to call.
Plus a zero-code model-driven app on the same tables, and one live-coding moment with Copilot.

**My angle:** people hear Power Platform and think *low code* and *apps*. I always thought *data and platform*.
→ "The future of low code is code (apps)."
**Your theme:** every answer lands on a human — the tool computes, the person decides.

---

## The five questions (≈ 10 min, cumulative)

**0:30 · Q1 — "You keep saying the future of low code is code. What do you mean?"**
*Show: the graph, 32 systems · 50 dependencies.*
- Power Platform ≠ low code + apps. For me it's **data and platform**: real tables, real relationships, identity/sharing/governance for free. The app on top is the least interesting part.
- This *is* a Power App — React, written in VS Code, run by Power Apps. Same login, same Share button, same governance.
- Every arrow = "A requires B". Everyone has this diagram on a wiki. Nobody has it as something you can *ask*.

**2:15 · Q2 — "Okay — what can I actually ask it?"**
*Show: Identity API → Show blast radius.*
- "What breaks if single sign-on dies?" → **8 break immediately, 1 more because of that, 9 systems.**
- Shipping API never talks to Identity, yet it's down — those are the people who find out last.
- You know what Identity API *does*; nobody holds fifty arrows in their head at 3 a.m. The computer walks the graph. *We* read the list of **people to call** — seven names, and two systems where the answer is *nobody*.

**4:15 · Q3 — "Is that real data or a demo file?"** *(the one I drop if we're over)*
*Show: model-driven app grid (Admin Console, no owner) → set owner in React → refresh grid → owner appears.*
- Second Power App, zero code, same two tables.
- **Same row, two apps, one commit. That is data and platform.**
- A human just decided who's accountable. That decision isn't getting automated — and shouldn't.

**5:15 · Q4 — "Where's the AI in this — and where's the human?"**
*Show: paste one prompt into Copilot → new "Ownership gaps" panel → ranked list.*
- The prompt asks it to *reuse* the graph walk and rank unowned systems by how much depends on them. I know what the answer should look like — that part stays human.
- Result #1: **Maps Provider. "Low" criticality. No owner. Seven systems depend on it.**
- **Criticality labels lie; graphs don't.** The AI ranked it in ninety seconds. Deciding it matters and walking to someone's desk to say *this one's yours* — that's us.

**7:30 · Q5 — "Impressive — but what did it take to put this in a real tenant, properly?"**
*Show: `npm run reset` running · the legend · (say) the admin switch.*
- **Reproducible:** scripts run twice, same result; whole demo resets in 20 s. *Nobody inherits my mess.*
- **Accessible:** words and icons, not red/green. One in twelve people in this room can't tell them apart; neither can the projector.
- **Governed:** an admin had to enable code apps for the environment; it's in a solution; it runs with the user's permissions. *Admins keep the keys, developers get a better car.*
- Close: **build the right thing — and build it the right way. Those used to be two budgets.** With AI typing and the platform doing the plumbing, there's no excuse anymore. That's empathy in code: for the person on call, the back row, the admin, whoever inherits it. *Go find your Maps Provider.*

**9:30 · you wrap, I sit.**

---

## Practicalities

- Needs: my laptop on the main screen, clicker not required.
- Rehearsal Wed 17:45 — I'd like to run Q2 and Q4 once on the real projector (colour + readability).
- If the live-coding model misbehaves I switch to a prepared branch; same result, 10 seconds.
- Taglines you can echo back if useful: *"A table tells you what you have. A graph tells you what hurts."* · *"Criticality labels lie; graphs don't."*
