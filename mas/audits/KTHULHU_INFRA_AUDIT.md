# KTHULHU — full infrastructure and pipeline audit

**codebase-auditor · 2026-08-21 · read from the source, not from marketing copy**

**Why this exists.** jw3b.dev calls KTHULHU an "operable flagship" and shows a 13-stage pipeline
on `/work` that I invented from a label list. It is a plausible pipeline; it is not KTHULHU's.
Before the site describes the system it must describe the real one, and before it publishes a
number it must know which tier produced it. Every claim below is cited to a file.

Three corrections I made to my own understanding while writing this are recorded inline, because
each was wrong in a way that would have shipped a false statement.

---

## 1. The three execution tiers

The system is not "a Worker plus a GPU". It is three tiers with different trust and cost models.

| Tier | What runs there | Evidence |
|---|---|---|
| **Cloudflare edge** | API, orchestration, the Overmind Durable Object, kill-gate LLM votes, consolidation, review gate, report generation, query embedding | `wrangler.toml`, `workers/api/` |
| **The box** (self-hosted) | Every heavy tool job, in rootless-Podman containers; the corpus embedding service; Neo4j; self-hosted CI runners | `box/` |
| **GitHub Actions** | The dispatch mechanism *today* — the Worker triggers workflows that execute **on the box's own runners** | `.github/workflows/`, `box/runners/README.md` |

### Cloudflare bindings (`wrangler.toml`)

- Worker `kthulhu-api`, routed to `api.kthulhu.co`
- **Durable Object** `KTHULHU_OVERMIND` — one per audit, its realtime identity
- **D1** `kthulhu-overmind` — Overmind state + task queue + `signal_log` + `audit_steps`
- **KV** `KTHULHU_KV`, **R2** `kthulhu-storage` (reports, FV evidence)
- **Workers AI** (`AI` binding) + AI Gateway
- **Neon Postgres/pgvector** — via connection string, not a binding

### The box (`box/`) — a platform, not a machine

- **Rootless Podman + quadlet units** under a dedicated `kthulhu.slice`:
  `anvil` · `halmos` · `hevm` · `medusa` · `slither` · `mutation` · `supply-chain` · `builder`
- **Custom images**: ensemble · claude-discovery · scenario · mutation · hevm · md-to-pdf
- **Dispatcher**: 37 modules — per-tool runners, FV bundle generate/repair, fuzz harness
  generate/repair, solc error classification, seven `verify-*` gates, and a **watchdog** that
  re-enqueues jobs past their deadline
- **Embedding service**: `box/embed/serve.py` — `BAAI/bge-m3`, 1024-dim, GPU-resident, systemd unit
- **Neo4j**: own schema, retention policy, GC timer (`box/graph/`)
- **Timers**: KB backfill, image rebuild, graph GC
- **Self-hosted GitHub Actions runners in TWO trust tiers** (`box/runners/README.md`):
  - `kthulhu-private` — host-equivalent (podman socket, systemd bus, live checkout). Six
    BOX_BOUND jobs only.
  - `kthulhu-ci` — `--cap-drop=ALL`, `no-new-privileges`, no sockets. Everything else.
  - The partition is enforced by a test (`tests/unit/workflow-runners.test.ts`), not by convention.

> **Correction 1.** I called this "your GPU box" and argued against exposing it because "a public
> page shouldn't depend on your desktop being awake". That was wrong about the infrastructure. It
> is systemd-managed, containerised, self-healing, with scheduled maintenance and a two-tier CI
> security model. The argument against publishing the graph survives on *data* grounds alone.

---

## 2. The pipeline — four phases, ~20 recorded steps

From `lib/ui/display.ts` (`PIPELINE_STEPS`, `STEP_META`) and `lib/engine/phases/`.

| # | Phase | Steps | Where |
|---|---|---|---|
| 1 | **Triage** | attack-surface scoping · static grounding (Slither + RAG context) | cloud orchestrates, **slither on box** |
| 2 | **Ensemble** | box ensemble · claude discovery · static adjudication · primary audit · adversary pass · cross-contract · scenario decomposition · per-function · RAG pattern match · red-team review · **kill-gate vote** · consolidation · submit findings · static ledger pull | mixed — discovery jobs **on box**, kill-gate + consolidation **in cloud** |
| 3 | **Verification** | fuzzing campaign · proof generation · **FV dispatch** | **box** (forge/halmos/medusa/anvil) |
| 4 | **Reporting** | report generation · **review gate** | cloud |

### The kill gate (`lib/engine/phases/kill_gate.ts`)

N *decorrelated* critic passes vote UPHOLD/REFUTE on every candidate; a majority-refute drops it
as `dropped_fp` **with the refutation reason persisted — never silently lost**. Deliberately
asymmetric:

> "REFUTE only when you can name that specific reason… this gate must never discard a real
> vulnerability, and a false negative is far worse than a false positive that a human reviewer
> later dismisses."

Deep tier only; the rush tier keeps the single-pass path.

### The review gate (`lib/db/review-gate.ts`)

Terminal status is **derived from the findings**, never stored independently:

```
∃ unconfirmed CRITICAL or HIGH  → 'awaiting_review'   (report delivery held)
otherwise                        → 'complete'          (report deliverable)
```

> **Correction 2.** I first scoped "delivered work" to `status='complete'` and reported 22 audits /
> 171 findings. That is backwards: `complete` means the audit found nothing serious, and
> `awaiting_review` is the EU AI Act human-oversight gate holding a report that **did** find
> something. Filtering to `complete` excluded exactly the audits that found the most — understating
> findings by 12×.

---

## 3. Dispatch — how the cloud reaches the box

**Today: GitHub Actions.** The Worker holds `GHA_PAT` and triggers workflows
(`rust-tools.yml` and others) which execute on the box's self-hosted runners; results return via a
`TOOLS_WEBHOOK_KEY`-authenticated callback.

**Built but not live: Cloudflare Queues.** `lib/engine/dispatch/queue.ts` implements
`enqueueToolJob` = INSERT `tool_jobs` + `TOOL_QUEUE.send`, explicitly to replace "the five
workflow_dispatch fetches" and to avoid spending scarce external subrequests. It is **inert**:
gated behind `SHADOW_DISPATCH='true'` AND a bound `TOOL_QUEUE`, and **no queue binding exists in
`wrangler.toml`** (verified: zero matches). A per-tool canary is designed so one tool can cut over
without kicking Medusa/anvil's 90-minute jobs onto an unproven path.

### Job deadlines (`DEADLINE_MS`) — where the wall-clock goes

| Job | Budget | | Job | Budget |
|---|---|---|---|---|
| `fv` | 90 min | | `static-adjudication` | 45 min |
| `medusa` | 90 min | | `ensemble` | 45 min |
| `anvil` | 90 min | | `claude-discovery` | 30 min |
| `fuzz` | 60 min | | `scenario-decomposition` | 30 min |
| `slither` | 20 min | | `builder` | 15 min |

The watchdog re-enqueues anything still running past its deadline with a **fresh** deadline.

---

## 4. The findings funnel — live aggregates, 2026-08-21

Queried through `GET /kb/stats` on jw3b.dev's Worker (counts only; no rows leave the database).

```
245 submissions   →  166 failed · 4 queued
                  →   75 ran to a terminal state (22 complete + 53 awaiting_review)

2,056 findings from those 75 audits
   ├─ 438 dropped_fp   (engine's own false-positive removal)
   ├─  25 dropped_dupe ·  14 dropped_scope
   ├─ 1,579 kept
   ├─    76 FV-PROVEN  (exploit reproduced)
   └─    20 human-confirmed
```

**FV verdicts:** `proven` 76 · `inconclusive` 1,175 · `not_attempted` 805 · **`refuted` 0**

**Rejection stage:** `kill_gate` 16 · not rejected 2,040

### Two findings worth acting on

**a. The kill gate is not where false positives die.** 438 dropped as FP, but only **16** carry
`rejection_stage='kill_gate'` — ~96% of removal happens at consolidation, not at the gate built for
it. Consistent with the gate being deep-tier-only, but worth confirming it is running as intended.

**b. Formal verification mostly does not finish, and zero refutations prove it.** `refuted`
requires a completed proof attempt that failed to reproduce; not one finding in 2,056 reached that
state. So FV is not producing wrong answers — it is not completing. The cause is visible in the
code's own comments: generation alone was observed at **68 minutes** against a 90-minute job
deadline, and `FV_GEN_BUDGET_MS` was cut 40m → 30m to fit two calls under it, over the author's
own objection that "40m was the number the EVIDENCE supported… Making a constraint fit by shrinking
the side that was already working is not closing the arithmetic." `fv` also contends for the same
box as medusa (90m), anvil (90m), fuzz (60m), the KB backfill timer and image rebuilds.

**This reframes the headline number.** 76 is not "only 76 of 2,056 were real". It is *76 exploits
reproduced within the compute budget available* — a capacity statement, not a quality one.

---

## 5. Data stores and what may be published

| Store | Contents | Publishable |
|---|---|---|
| Neon `knowledge_base_findings` | Public audit research (Solodit, Sherlock, DeFiHackLabs, vulns DB), bge-m3 embedded | **Yes** — searchable on jw3b.dev today |
| Neon `findings` (88 cols) | Client findings: impact, location, remediation_diff, poc, confirmed_by | **Aggregates only** |
| Neon `audit_submissions` (109 cols) | Client submissions: org_id, contract_code, repo_url, `embargo_until` | **Aggregates only** |
| Neo4j (box) | `Audit → Finding → Location` mirror of client work | **No** — anonymised projection only |
| D1 `kthulhu-overmind` | Overmind state, signal_log, audit_steps | Internal |
| R2 `kthulhu-storage` | Reports, FV evidence bundles | Internal |

`findings` has **no** disclosed/public flag, and `audit_submissions` carries a contractual
`embargo_until`. Nothing in either schema can tell a query which rows are safe to publish, which is
why the jw3b.dev route is counts-only and a test asserts it never names these tables.

> **Correction 3.** I twice assumed the embedding model from stale comments — `search.ts`'s header
> still says Vertex `text-embedding-004`, and a doc described a Workers-AI-quota-throttled backfill.
> Both are dead. The live path is a self-hosted `BAAI/bge-m3` on the box, and CF's `@cf/baai/bge-m3`
> is the same weights — measured equivalent at cosine 0.999688 / 1.000000 / 0.999999
> (`box/embed/serve.py:13`). That equivalence is what lets jw3b.dev embed queries at the edge
> against a corpus embedded on the box.

---

## 6. What jw3b.dev should say

The `/work` Overmind stepper shows an invented 13-stage pipeline. It should show the real one:
**two lanes** — Cloudflare orchestration and box execution — with the real gates (kill-gate vote,
review gate), the real deadlines, and FV honestly marked as the async step whose verdict may not
land.

"Multi-agent pipeline" is a claim every AI product makes. "Cloudflare Workers orchestrating
containerised Foundry/Halmos/Medusa jobs on self-hosted infrastructure, with queue dispatch,
watchdog re-enqueue and deadline budgets" is one almost nobody can make — and it is entirely
KTHULHU's own architecture, with no client data in it.
