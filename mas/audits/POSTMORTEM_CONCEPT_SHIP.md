# Postmortem — how the MAS shipped a concept and passed every gate

**codebase-auditor · 2026-08-21 · R0 of the product rerun**
**Companion register:** `PRODUCT_AUDIT_2026-08-21.md` (28 findings, severity-classed).
**Trigger:** the owner's verdict — *"the entire site is little more than a conceptual barebones
sample… zero functionality… why is the MAS not designing around or even thinking about the bugs
I'm finding?"* — verified correct by a first-visitor walkthrough of live jw3b.dev.

## The headline failure

A visitor can complete Mission Control on the live site and click *Send request*. The UI answers:
*"You're on John's list — John will follow up."* **No system fulfils that sentence.** The lead
writes to D1 `engagement_requests` (0 rows ever written in production), no notification mechanism
of any kind exists in the worker (verified: no mail, webhook, Telegram, or push anywhere in
`workers/portfolio-agent/src/`), `/book-a-call` validates the contact and then discards it without
persisting, and the scheduler URL is null. The site's commercial purpose terminates in an unread
table. Every quality gate from P1 through P4 passed over this.

## Root causes — each proven by the MAS's own artifacts

### 1. Requirements encoded *capture*, not *outcomes*
FR-036, in full: "Provide a book-a-call floor that **completes an engagement request** (offline-
capable **capture + confirmation**)." FR-048 lists "engagement-request capture" and "book-a-call
handoff" as worker routes. **No FR anywhere states "a lead reaches John."** The builders built
exactly what was written; the gates verified exactly what was written; what was written was wrong.
*Evidence:* `mas/REQUIREMENTS.md` FR-036/FR-048 · `routes/engagement.js` (validate → INSERT →
200, nothing else).

### 2. "Degrade honestly" became the product
OD-03 made book-a-call "the guaranteed, default, primary terminal action" — the floor every rail
degrades to. The honesty rules (BR-03 labelled fallbacks, BR-09 testnet labels, BR-10 disclaimer)
were enforced everywhere and are genuinely good. But nothing enforced that the floor *works end to
end* — so escrow degrades to Unlock degrades to book-a-call degrades to a table nobody reads,
each step honestly labelled. Degradation was engineered so well it became the shipped product.
The same cause explains /messages (an honest stub promoted in the primary nav), the iframe
flagships (honest windows sold as operable), and the thesis pages (operability argued in prose).

### 3. Gates measured code properties, never visitor outcomes
P4-GATE: **PASS** — 536 tests, coverage thresholds, claims cleared, secret scan, CSP intact,
LCP 0.66s, CLS 0.00. P1's QA gate explicitly recorded: "Playwright installed but no `.spec`
files — the critical journeys are covered at integration level in jsdom." No gate in the entire
pipeline ever: walked a page walletless in its first-visit state, read the browser console
(4 CSP errors on every page, every day), asked the live model a single question (which would have
caught the concierge fabricating page descriptions and hijacking navigation), or submitted a lead
and asked *who was told*. Mocked tests structurally cannot catch model-behavior or
deployment-reality failures, and nothing else was looking.
*Evidence:* `mas/audits/P4-GATE.md`, `P1-GATE_1_qa.md` · live walkthrough 2026-08-21.

### 4. Component-scoped task packets — seams and wrappers owned by nobody
The audit-console redesign brief scoped "/audit, embedded on /work"; the implementation task cut
from it listed two component files, so the page *around* the console still contradicts it (old
"heuristics… live" intro above a section named "Instant screen"; the numbered workflow described
nowhere). The concierge tool-call rides a `#contact`/`#pricing` hash that **no code reads** —
each half built and tested alone, the seam never owned. The ROLE_LEDGER records per-file role
hops; no entry owns a visitor journey end to end.
*Evidence:* `design/briefs/audit-console.md` vs the task packet · grep: no `location.hash`
consumer in `src/` · `ROLE_LEDGER.md` structure.

### 5. The MAS knew on day one — and nothing forced the knowledge into the requirements
Phase-0's own fact-finding (`facts/existing-features-inventory.md`, headline): "Mission Control
is a polished 4-step configurator that **terminates in a dead end**… the checkout half currently
does not exist." The knowledge was recorded, then requirements encoded capture+degrade instead of
closure, and every later gate certified the weaker promise. There was no standing product-owner
or adversarial role whose job was to keep asking *"what job does the visitor finish?"* — so depth
only ever arrived when the owner personally demanded it (the iterative audit workspace being the
proof: obvious next-need, built only on request).

## One sentence

The MAS optimized labelled honesty and code health — and passed its own gates — while no
requirement, role, or gate owned a visitor outcome; degradation was so well-engineered it became
the shipped product.

## What changes (encoded in the rerun, not promised)

1. **Outcome requirements**: every product loop carries an outcome KPI with its driving
   visitor-side E2E named in the FR itself (hire: lead reaches John's Telegram ≤ 60s; concierge:
   true in-chat answers, consent-only navigation; audit: workflow legible pre-spend + exportable
   artifact; CTF: readable challenge pre-wallet; flagships/theses: operable or silent).
2. **Blocking gate upgrades**: first-visitor walkthrough on the deployed site (walletless,
   empty-state, mobile) · zero unexpected console errors · live-model behavioral smoke ·
   state-machine invariant suites · seam contract tests for every shared protocol.
3. **Route-scoped task packets** carrying the journey they serve; renames unfinished until every
   naming surface is swept.
4. **Product-owner pass** in every brief: the job the visitor finishes + ≥3 proposed next-needs.
5. This document is falsification criteria for R4: the rerun's exit gate fails unless the shipped
   site disproves all five causes.

---

## R4 — the falsification check, 2026-08-22

This document declares itself R4's exit criteria: *"the rerun's exit gate fails unless the shipped
site disproves all five causes."* Run honestly, that is a test three of the five pass outright and
two passed only after work done during the check itself.

| # | Cause | Falsified? | The evidence, and what it does not cover |
|---|---|---|---|
| 1 | Requirements encoded **capture**, not outcomes | **YES — but only as of today** | The check found FR-036 still reading *"capture + confirmation"* and **no FR anywhere naming an outcome**. The behaviour was fixed and gated; the requirement that caused it was untouched, so the next person building from `REQUIREMENTS.md` would have encoded capture again. R1 had never been executed. Now: **EPIC K**, six outcome FRs (FR-062…067), each naming the deployed-site test that proves it, plus a standing rule that a mechanism FR must name the outcome it serves. |
| 2 | "Degrade honestly" became the product | **PARTIALLY** | The floor now works end to end — a lead reaches John, proven live, and the confirmation states the real delivery state instead of a promise. `/messages` degrades rather than overselling. **Not fully falsified:** two flagships are still frames of other origins (#21), which is the original shape — an honest label over an absent capability. Owner-gated on API access, and until then FR-066 stays open rather than being quietly reworded. |
| 3 | Gates measured code properties, never visitor outcomes | **YES** | Five gates now fail on visitor-facing reality: first-visitor walkthrough (walletless, empty-state, mobile), a console-error budget that filters by originating URL so our own failures cannot hide as third-party noise, live-model behavioural smoke, the lead-path probe, and the copy gate. Four are blocking in `verify`; two run post-deploy against production. |
| 4 | Component-scoped tasks; seams owned by nobody | **YES** | Each seam that failed now has one source and a guard: `consoleCopy.js` + the copy gate for naming, `tagProtocol.js` + its drift test for the AI protocol, the tool-call↔hash seam test, and `conciergeSystemPrompt.test.js` asserting every defined prompt block actually reaches `system` — the regression that shipped green inside this very remediation. |
| 5 | The MAS knew on day one; no standing product-owner | **YES — closed 2026-08-22** | First scored PARTIAL and recorded as a residual: the rule was in `CLAUDE.md` and **zero of ten briefs carried it**, with nothing failing. Now gated. `scripts/brief-gate.mjs` blocks in `verify` on any brief missing *"the job the visitor finishes"* or carrying fewer than three next-needs, and all ten briefs were written to it — each with real next-needs drawn from the re-walk, not filler. Red-witnessed: dropping one next-need turns it red, restoring it turns it green. |

### Verdict

**✎ Updated 2026-08-22: four falsified, one partial.** #5 was closed by gating the rule that had
only been written down (see its row). The single remaining residual is **#2**, and it is not an
engineering gap: two flagships are frames of other origins, owner-gated on read-only API access,
with FR-066 left OPEN rather than reworded to match what shipped.

*Original verdict, kept because the movement is the point:* three falsified, two partially —
neither residual an engineering gap.

**The check earned its keep by failing.** Had R4 been a re-walk of the product register alone, cause
1 would have read as closed: every visible symptom was fixed and gated. It was the *requirements
layer* that was untouched, and only testing the cause rather than the symptoms found it. That is the
same lesson as the addendum below — an instrument aimed at the wrong artifact returns a clean,
confident, wrong answer.

---

## Addendum — root cause 3, restated after it bit four more times

Cause 3 was written as "gates measured code properties, never visitor outcomes". A day of work
showed it is narrower and sharper than that:

> **A repo artifact was consulted in place of the running system, and the artifact agreed with a
> plausible wrong answer.**

Every instance, all real, all from 2026-08-21:

| Consulted | Concluded | Actually |
|---|---|---|
| `wrangler.toml` grep for a queue binding | "Queues is inert" | Binding lives in `wrangler.overmind.toml`; four job kinds actively enqueuing to a consumerless queue |
| MCP account enumeration | "one Cloudflare worker" | Connector bound to a different account and structurally blind to six |
| `CREATE TABLE IF NOT EXISTS` + a ✅ from `d1 migrations apply` | "the migration applied" | No-op against an existing table; five days of transcripts and every CTF solve lost |
| Green CI after defining a prompt block | "the fix shipped" | Never concatenated into the system string; the deployed model kept fabricating |
| `grep -cE "^gate:"` returning 0 | "unstamped" | The guard itself returned rc=0 |

**The rule.** Before asserting what a deployed system does, ask the system — the live API, the
running process, the deployed endpoint, the actual database. A file, a grep or a green pipeline is
evidence about the repo; it is evidence about production only once something has proven the two
agree.

**✎ The rule has a second half, learned 2026-08-22 by breaking it.** Asking the running system is
necessary and not sufficient. I traced a KTHULHU defect against live source and the deployed
account, got the finding right, and recommended a fix — deleting the dead `TOOL_QUEUE.send` *and its
binding*. KTHULHU's own board had already cut that ticket (`KTH-0215`, 2026-08-21) with the same
measurements plus one I never found: `queue.ts:109` makes the binding part of the enqueue's success
condition, so removing it takes **every box dispatch dark** on the path that carries all the real
work, presenting as a flag problem. The ticket sequences the binding removal after the code change
for exactly that reason.

> **Before recommending a change to a system, read that system's own record of itself.** A ticket
> board, a decision log, an ADR — these are not repo artifacts of the kind the rule above warns
> about, because they record *adjudications*, not descriptions. The failure above was consulting a
> file that described the system. This one was not consulting the file that had already judged it.

Note the asymmetry that makes both live: `d1.ts:135` — a comment *describing* the dispatcher — was
wrong for a month and nearly propagated. `KTH-0215` — a ticket *adjudicating* the same code — was
right and would have prevented a dangerous recommendation. Same repo, opposite reliability. The
discriminator is whether the artifact was written to explain the system or to decide about it.

**Corollary: state confidence per fact, not per document.** "Confirmed (live API)", "confirmed to
exist, value unreadable" and "plausible, unverified" are three different claims. Collapsing them is
how a report becomes wrong while every sentence in it still feels true. See
`KTHULHU_INFRA_AUDIT.md` §3 for the format.

**Standing gap:** the v2 worktree has **no `CLAUDE.md`**. The project instructions loaded in
sessions come from the v1 repo — the tree this project's own consolidation retired to the
`v1-archive` tag. Process rules are therefore being read from dead code, which is the same class of
error as everything above. That file needs writing in `jw3b.dev-v2`.

