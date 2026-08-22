# KTHULHU — full infrastructure and pipeline audit

**codebase-auditor · 2026-08-21 · read from the source AND verified against the live Cloudflare API**

> **Revision 2.** The first pass read `wrangler.toml` and inferred the cloud tier from it. That was
> not an audit, it was a reading — and it was wrong in three places, because `kthulhu-api`'s config
> describes one of SIX deployed workers. This revision enumerates the account through the
> Cloudflare API. Everything in §1 and §3 marked ✎ is a correction to revision 1.

**Why this exists.** jw3b.dev calls KTHULHU an "operable flagship" and shows a 13-stage pipeline
on `/work` that I invented from a label list. It is a plausible pipeline; it is not KTHULHU's.
Before the site describes the system it must describe the real one, and before it publishes a
number it must know which tier produced it. Every claim below is cited to a file.

Six corrections to my own understanding are recorded inline, because each was wrong in a way that
would have shipped a false statement. The two largest came from verifying against the live API
instead of the repo: the cloud tier is six workers in a different account, and the job queue has no
consumer. **Rev 7 came from neither the repo nor the API but from KTHULHU's own ticket board**
(`tickets/KTH-0215.md`) — which had cut this exact defect, measured it more completely, and named a
coupling that made the cleanup I recommended dangerous.

---

## 1. The three execution tiers

The system is not "a Worker plus a GPU". It is three tiers with different trust and cost models.

| Tier | What runs there | Evidence |
|---|---|---|
| **Cloudflare edge** | SIX workers: public API, a separate orchestrator ticking every minute, a nightly retention worker, two scrapers; two Workflows; a Durable Object per audit; kill-gate votes, consolidation, review gate, reports, query embedding | live Cloudflare API + `workers/api/` |
| **The box** (self-hosted) | Every heavy tool job, in rootless-Podman containers; the corpus embedding service; Neo4j; self-hosted CI runners | `box/` |
| **GitHub Actions** | The dispatch mechanism *today* — the Worker triggers workflows that execute **on the box's own runners** | `.github/workflows/`, `box/runners/README.md` |

### ✎ Cloudflare — SIX workers in a SEPARATE account

KTHULHU lives in Cloudflare account `971a9330143ed6b1a59183c35fb803eb`, **not** the agilegypsy
account that hosts jw3b.dev. That is why an MCP enumeration of the agilegypsy account showed no
`kthulhu-api` and no `kthulhu-overmind` — the entire cloud tier was invisible from there.

| Worker | Cron | Role |
|---|---|---|
| `kthulhu-api` | — | the public API (`api.kthulhu.co`) |
| **`kthulhu-overmind`** | **`* * * * *`** | the orchestrator — ticks every minute |
| `kthulhu-retention` | `0 3 * * *` | nightly retention / reconciler |
| `kthulhu-scrapers` | `0 0,6,12,18 * * *` | Solodit harvest (the 6-hourly incremental) |
| `kthulhu-scraper` | `0 */6 * * *` | older scraper, same cadence |
| `graft-web` | — | a different product sharing the account |

**The orchestrator is its own worker, not a module of the API.** `kthulhu-overmind` holds a
`service` binding to `API`, both Workflows, the queue producer, and every per-tool routing flag.

**✎ Cloudflare Workflows are in use** — I reported none because the repo search only found test
files: `OvermindWorkflow` and `GithubIngestWorkflow` are bound to `kthulhu-overmind`. That is
durable execution, which materially changes the orchestration story.

**Stores:** D1 `kthulhu-overmind` (+ `-dev`), KV `KTHULHU_KV` (+ dev/preview), R2
`kthulhu-storage`, Neon via `NEON_DATABASE_URL`, Workers AI + AI Gateway. `graft-db`,
`GRAFT_KV` and `graft-storage` belong to the other product.

**Model/provider credentials bound:** `CLAUDE_CODE_OAUTH_TOKEN`, `GOOGLE_AI_API_KEY`,
`VOYAGE_API_KEY`, `NIM_API_KEY` — more providers than the embedding audit implied.

**Per-tool routing flags on the orchestrator** — the canary mechanism, deployed:
`LEDGER_PULL_{DISCOVERY,ENSEMBLE,FUZZ,FV,PDF,SCENARIO,STATIC}`, `FV_BOX_GEN`,
`STATIC_ADJ_ON_BOX`, `SCOPE_GATE_ENABLED`, `SHADOW_DISPATCH`.

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

### ✎ Cloudflare Queues — deployed, produced-to, and CONSUMED BY NOTHING

Revision 1 said Queues was "built but inert, no binding exists". That was wrong: I had only read
`kthulhu-api`'s config, and the binding lives on the orchestrator.

Verified against the API:

```
queue     kthulhu-tool-jobs   (created 2026-07-13)
producers 1  → kthulhu-overmind          [TOOL_QUEUE binding present]
consumers 0
retention 86400s (24h)
```

**One producer, zero consumers.** Nothing — no push consumer worker, no HTTP pull consumer — takes
messages off this queue. Anything enqueued sits for 24 hours and is discarded.

So the Queues cutover is **half-deployed**: the producer side is live on the orchestrator, with
`SHADOW_DISPATCH` and per-tool `LEDGER_PULL_*` canaries in place, while the consumer side does not
exist. Real work still reaches the box through GitHub Actions.

**✎ Rev 3 — the branch is decidable, and it is the first one. Owner-verified.**

`kindEnqueueEnabled` returns true if `SHADOW_DISPATCH === 'true'` **or** the per-kind flag is set.
`SHADOW_DISPATCH` is absent from config, but `LEDGER_PULL_DISCOVERY`, `_PDF`, `_ENSEMBLE` and
`_FV` are all `"true"`, and `TOOL_QUEUE` is bound. So **four job kinds are actively enqueued to a
queue with no consumer**. Not idle — actively discarding.

**And no work is lost, which rev 2 failed to say.** `dispatch.sh`'s own header: *"Drains queued
tool_jobs from prod D1."* **The box polls the D1 ledger, not the queue.** Dispatch runs on the
database row; the queue send is the vestigial half of an unfinished cutover — live, producing,
discarded. That is a materially different defect from "dispatch is broken": nothing fails, a
side-channel is simply dead weight, and the comparison shadow mode exists to perform cannot happen.

**✎ Why the grep missed the producer.** The binding, both `[[workflows]]`, the `[[services]]`
binding to the API and `crons = ["* * * * *"]` all live in **`wrangler.overmind.toml`** — a second
config file. Rev 1 grepped `wrangler.toml`, found zero, and concluded zero. The file was never the
system.

**✎ An orphan worker.** `kthulhu-scraper` (singular) was last deployed 2026-07-06 and has **no
config anywhere in the repo** — it exists only in the account. Deployed, scheduled `0 */6 * * *`,
and unreproducible from source.

### ✎ Rev 4 — the cutover DID happen, and the ledger proves it

Asked the ledger instead of reasoning about the flags. `tool_jobs` in D1 `kthulhu-overmind`:

| kind | done | failed | latest |
|---|---|---|---|
| static-adjudication | 51 | 26 | 2026-08-08 |
| fuzz | 49 | 23 | 2026-08-08 |
| scenario-decomposition | 47 | 12 | 2026-08-08 |
| ensemble | 38 | 10 | 2026-08-08 |
| markdown-pdf | 33 | 7 | 2026-08-08 |
| **fv** | **31** | 11 | 2026-08-08 |
| claude-discovery | 21 | 5 | 2026-07-31 |

**270 jobs completed through the ledger.** The box-pull cutover is real and worked; the queue send
is confirmed vestigial. `LEDGER_PULL_*` names the path that actually carries the work.

**But the whole pipeline stopped dead on 2026-08-08T20:28.** `tool_jobs` (382 rows) and
`signal_log` (2,699 rows) end within 27 seconds of each other. Thirteen days of total silence.

**And four submissions were never dispatched at all.** Submission recency by status:

```
awaiting_review   newest 2026-08-08     complete  newest 2026-08-05
queued            newest 2026-07-31     failed    newest 2026-07-06
                  oldest 2026-07-06
```

The four `queued` audits arrived between **6 and 31 July** and never started — while the pipeline
demonstrably ran other work around them, right through to 8 August. That is not an idle system: it
is work that arrived, was accepted, and was silently skipped. Between three and seven weeks stuck.

Two separate conditions, and they should not be conflated:

1. **Four submissions in the insert-default `queued` state** — see Rev 6: DOWNGRADED from "a real
   defect" to unresolved, pending the plan tier on those rows.
2. **Thirteen days of no activity since 8 August** — no new submissions either, so this is
   consistent with no demand rather than a second fault. Not proof of health; just not evidence of
   breakage.

### ✎ Rev 5 — the flags live in THREE places, and two gate both ends

Owner correction, verified. My rev-4 table read only the Worker side of a mechanism that is
deliberately two-sided, which is the same single-source error this document opens by describing.

| Phase | Mechanism | On the box? |
|---|---|---|
| claude-discovery, ensemble, fv, markdown-pdf | `LEDGER_PULL_*` in the Worker | **yes** |
| static-adjudication | **`STATIC_ADJ_ON_BOX` — two-sided** | **yes** (box side confirmed) |
| fuzz | `LEDGER_PULL_FUZZ` + `FUZZ_REAL_PROJECT=1` on the box | **partial** — dep provisioning on, ledger pull off |
| scenario-decomposition | `LEDGER_PULL_SCENARIO` | not found set in config or on the box |
| graph mirror | `LEDGER_PULL_GRAPH` | **box-only, on** |

So roughly **6 of 7**, not 4 of 7.

**`STATIC_ADJ_ON_BOX` has three production readers** — `workers/workflows/overmind.ts:691`,
`lib/engine/phases/static_adjudicate.ts:448`, and `box/dispatcher/dispatch.sh:2023` — and is
`true` in the box's `dispatcher.env`. It does **not** use `LEDGER_PULL_STATIC`; that is a separate
mechanism. The `FV_BOX_GEN` comment in the overmind config states the two-sided pattern is
deliberate.

**`LEDGER_PULL_GRAPH` is not a tool-kind flag.** `graph` is absent from `TOOL_KINDS`; the flag
gates `mirror_graph()` at `dispatch.sh:1643`, mirroring ensemble findings into the box-local
Neo4j. Box-only by design, correctly absent from the Worker's map.

**Where the flags live — the reason single-sided reading fails:**

1. **Worker config** (`wrangler.overmind.toml`, `plain_text`) — readable:
   `LEDGER_PULL_{DISCOVERY,ENSEMBLE,FV,PDF}`, `FV_BOX_GEN`, `SCOPE_GATE_ENABLED`
2. **Worker secrets** (`secret_text`, opaque) — verified present on the deployed orchestrator via
   the Cloudflare API: `LEDGER_PULL_{FUZZ,SCENARIO,STATIC}`, `SHADOW_DISPATCH`, `STATIC_ADJ_ON_BOX`
3. **Box env** (`dispatcher.env`) — `STATIC_ADJ_ON_BOX=true`, `FUZZ_REAL_PROJECT=1`,
   `LEDGER_PULL_GRAPH=true`

**✎ Narrowing the owner's open item.** "LEDGER_PULL_SCENARIO / _FUZZ not found set on either side"
is true of *config and box*, but the deployed Worker carries a `secret_text` binding for each — and
a secret binding only exists once `wrangler secret put` has run. So they **are set to something**.
"Not set" is refuted; **"off" remains unproven**, because secret values are unreadable. The split is
exact: every flag the owner could resolve is config, every flag he could not is a secret.

### ✎ Rev 6 — discovery RESOLVED (nothing broken), and my own stuck-audits claim DOWNGRADED

**`claude-discovery` is billing-tier gated. It works as designed.** Owner-verified end to end.

```
tier starter            frontierDiscovery = false
tier managed_standard   frontierDiscovery = false
tier managed_pro        frontierDiscovery = true   ← the only one
```

The gate at `overmind.ts:285` is `tierFor(state.plan).frontierDiscovery && LEDGER_PULL_DISCOVERY
=== 'true'` — **tier first, flag second**. The flag reading `"true"` was never the operative
condition, so its visibility in plain config is exactly what made it look like the cause.

The ledger closes it: **35 rows across exactly 7 audits** (21 done · 9 skipped · 5 failed),
2026-07-15 → 07-31, then nothing. Those seven were `managed_pro`. Discovery did not regress on
07-31 — **the last managed_pro audit did**. Every audit since has been on a tier without frontier
discovery.

And the missing `claude-discovery.yml` is dead by design, not broken: `overmind.ts:435` — *"when the
box runs claude-discovery from the ledger (pre-built image, no GHA), skip the GitHub Actions
dispatch entirely"* — returns before it is ever called.

**✎ Applying the same test to MY claim, which does not survive it intact.**

Rev 4 said four submissions were *"accepted and silently skipped"*. That was inferred from a status
column without reading what sets it — the same shape as the discovery error, made by me. Checking:

- `neon.ts:98` — `status: text('status').notNull().default('queued')`. **`queued` is the INSERT
  DEFAULT**, not a state something must actively place a row into.
- `audit-status.ts:204` — an unrecognised status also *falls back* to `queued`.
- Against that: `workers/api/routes/audits.ts:514,549` reject submission with **402
  PAYMENT_REQUIRED** on insufficient credits, so a row that exists is one whose credit check passed.

So the honest statement is **not** "silently skipped". It is: *four submissions that passed the
credit gate sit in the insert-default state, oldest 2026-07-06, while other audits ran to completion
through 2026-08-08.* That is worth investigating and is **not** established as a defect — the
discovery case is precisely the precedent for a tier or plan condition explaining an apparent gap.

**The check that would settle it** (owner-side, needs the row): the `plan` on those four
submissions, and whether anything advances `queued` for that plan. If they are a tier the pipeline
does not serve, this is the discovery finding again. If they are `managed_pro`, they are stuck.

### ✎ Rev 7 — the factory had already cut this ticket, and it names a trap my fix would have sprung

**Source:** KTHULHU's own board — `tickets/KTH-0215.md` and `docs/factory-queue.md:71`, cut
2026-08-21, P2, status `ready`. Owner-supplied. Same defect, measured independently, and more
completely than this audit had it. Four corrections follow; the third is the one that matters.

**1. "Dead weight" understates it — there is a live fail-mode.** Rev 3 concluded *"nothing fails, a
side-channel is simply dead weight."* Wrong on the first half. The insert at `queue.ts:194` precedes
the send at `:200`, and `shadowEnqueue` (`:210-217`) is the only caller and catches everything. So a
send failure returns `null` for a job whose row **is committed and will run** — the Worker records a
failed dispatch for work that happens. Traced downstream: on the two highest-volume kinds the return
value is consumed at `overmind.ts:328` as `[staticJobId, fuzzJobId].filter(Boolean).length`, a
*count* of dispatched jobs. A `null` is filtered out, so the Worker undercounts its own dispatch
while the box executes normally.

**2. But the blast radius is bounded, which I did not establish.** The in-flight check at `:186`
returns the existing row's id for any non-terminal `(auditId, kind)`, so a retry after a false
negative reuses the job rather than duplicating it. The ledger self-heals; only the Worker's record
of what it dispatched is wrong. Undercount, never double-spend.

**3. ✎ The fix I recommended is a trap, and the ticket names it.** I proposed deleting the send *and
retiring the `TOOL_QUEUE` binding with it*. `queue.ts:109` makes the binding part of the enqueue's
**success condition**:

```ts
if (!kindEnqueueEnabled(env, job.kind) || !env.TOOL_QUEUE) return null;
```

Dropping the producer binding — which is exactly what "remove the dead queue" looks like — silently
disables **every box dispatch**, even though the box reads D1 and would be unaffected. It would
present as a flag problem, on the path that carries all the real work. KTH-0215's AC5 sequences the
`wrangler.overmind.toml` change **after** the code change for this reason; AC2 requires the coupling
be broken first. My recommendation had the order unstated, which is the same as having it wrong.

**4. Two of my open items are closed by measurement.** The caveat I left — *"whether anything outside
this repo consumes `kthulhu-tool-jobs`"* — was already answered by two instruments: no push-consumer
worker, no HTTP pull consumer, `Number of Consumers: 0`. And my suggestion to *"re-add a
consumer-first implementation if the cutover is revived"* contradicts a **measured non-goal**: the
consumer side was removed deliberately, and `dispatch.sh:30-36` records the cost it avoided —
`npx wrangler` at *"~50% of one core, continuously, forever, to ask whether the queue is empty"* on a
box that *"sits at 96 C and has already hard-frozen once."* Reinstating it re-imposes exactly that.

**Scale, restated from the ledger:** 382 `tool_jobs` rows since 2026-07-13 across **seven** kinds —
every one also sent a descriptor that was retained 24h and discarded. This supersedes Rev 3's
flag-derived "four job kinds"; Rev 4's table already showed seven.

**✎ Process note — this is the addendum rule running backwards.** The five instances in
`POSTMORTEM_CONCEPT_SHIP.md` are all *consulted a repo artifact instead of the running system*. Here
I did ask the running system, and the finding was right — but I recommended a change to a system
whose own issue tracker had already adjudicated it, including a hazard I had not found. See that
document's addendum for the corollary this adds.

### Confidence, stated per fact

| Fact | Verified how | Confidence |
|---|---|---|
| Queue: 1 producer, 0 consumers | REST `GET /queues` + owner's `wrangler queues` | **Confirmed** (independently, twice) |
| Retention 86400s | REST `GET /accounts/{a}/queues/{id}` → `settings.message_retention_period` | **Confirmed via REST.** The owner's `queues info` does not surface it — the CLI is the weaker instrument here |
| ~~4~~ **7** kinds actively enqueued; 382 sends | Rev 3 inferred 4 from the config flags; the `tool_jobs` ledger shows seven kinds with rows, and a row implies the gate passed | **Confirmed (ledger).** The flag-derived figure is superseded |
| Box drains D1, not the queue | `dispatch.sh` header | **Confirmed** |
| A send failure returns `null` for a committed job | `queue.ts:194` insert → `:200` send → `shadowEnqueue:210-217` catch-all; KTH-0215 | **Confirmed (source, both readings)** |
| …and it undercounts rather than duplicating | `overmind.ts:328` consumes the ids as a count; `queue.ts:186` in-flight guard returns the existing id | **Confirmed (source)** |
| Dropping the `TOOL_QUEUE` binding would take **all** box dispatch dark | `queue.ts:109` — binding is part of the success condition | **Confirmed (source).** Not found by this audit; supplied by KTH-0215 |
| `LEDGER_PULL_{FUZZ,SCENARIO,STATIC}`, `STATIC_ADJ_ON_BOX`, `SHADOW_DISPATCH` **exist** | REST worker settings → present as `secret_text` bindings | **Confirmed to exist** |
| …their VALUES | — | **Unverified.** Secret values are unreadable; absent from config, so dashboard- or CLI-set. Do not treat as on |

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
