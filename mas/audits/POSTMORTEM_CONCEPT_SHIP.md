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

**Corollary: state confidence per fact, not per document.** "Confirmed (live API)", "confirmed to
exist, value unreadable" and "plausible, unverified" are three different claims. Collapsing them is
how a report becomes wrong while every sentence in it still feels true. See
`KTHULHU_INFRA_AUDIT.md` §3 for the format.

**Standing gap:** the v2 worktree has **no `CLAUDE.md`**. The project instructions loaded in
sessions come from the v1 repo — the tree this project's own consolidation retired to the
`v1-archive` tag. Process rules are therefore being read from dead code, which is the same class of
error as everything above. That file needs writing in `jw3b.dev-v2`.

