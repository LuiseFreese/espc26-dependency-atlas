# Luise · 09:30–09:40 · walkthrough for Vesa

**What I built:** *Dependency Atlas* — a Power Apps **code app** (React) on Dataverse. A "what-could-possibly-go-wrong
graph" of an IT estate: pick a system, press **Show blast radius**, see what else breaks and who to call.
Plus a zero-code model-driven app on the same tables and one live Copilot prompt.

**Please don't pre-empt my line** ("the future of low code is code") — I deliver it in Q1.

| | You ask | I show | I say |
| --- | --- | --- | --- |
| 0:30 | **How do you see Power Platform in the age of AI?** | The graph | People think *low code + apps*; I think **data and platform**. The app on top is the least interesting part. **The future of low code is code** — this *is* a Power App, written in React, AI typed most of it. Same login, same governance. |
| 2:15 | **What can I actually ask it?** | Identity API → *Show blast radius* | "What breaks if SSO dies?" → 8 immediately, 1 more because of that, 9 total. Nobody holds fifty arrows in their head at 3 a.m. — the computer walks, *we* read **people to call**. Two systems: owner = nobody. |
| 4:15 | **Is that real data?** *(skip if over)* | Change an owner in React → refresh the model-driven grid | Same row, two apps, one commit. **That is data and platform.** A human decided who's accountable — that shouldn't be automated. |
| 5:15 | **Where's the AI — and where's the human?** | One Copilot prompt → ranked "Ownership gaps" | #1: **Maps Provider — "low" criticality, no owner, 7 systems depend on it.** Criticality labels lie; graphs don't. AI ranked it in 90 s; deciding it matters is us. |
| 7:30 | **What did it take to put this in a real tenant, properly?** | `npm run reset` live · the legend | Reproducible (reset in 20 s), accessible (words + icons, not red/green), governed (admin enabled it, runs as the user). **Build the right thing — and build it the right way. Those used to be two budgets.** That's empathy in code. *Go find your Maps Provider.* |
| 9:30 | you wrap | | |

Rehearsal Wed: I want Q2 and Q4 once on the real projector. Live-coding fallback is a prepared branch — 10 s.
