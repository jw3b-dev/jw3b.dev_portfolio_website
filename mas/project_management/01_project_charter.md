# 01 — Project Charter — jw3b.dev v2

**Role:** project-manager (MAS Phase 1.5) · **Date:** 2026-08-16 · **Status:** DRAFT (John's approval precedes Phase-2 handoff)
**Traces to:** `mas/business_analysis/05_master_brd.md` (60 FR / 6 OBJ / 51 stories / 10 epics / 12 BR),
`mas/facts/01_OWNER_DECISIONS.md` (**BINDING — supersedes any BRD open-flag**), `mas/facts/00_FACTS_BRIEF.md`,
`mas/market_validation/05_master_report.md` (verdict: **PROCEED**).
**Worktree:** `/home/agilegypsy/code/projects/jw3b.dev-v2`, git branch `v2` (confirmed empty but for `mas/` — a true ground-up build).

---

## 1. Purpose & business case

A total, ground-up rebuild — frontend **and** Cloudflare Worker backend — of John Wellard's portfolio +
Web3 service platform, repositioning him as a **Senior Agentic AI Developer & smart-contract auditor**.
North star: **"a portfolio you OPERATE, not one you read."** Phase-0 validation returned PROCEED: the
market gap — *operable, verifiable, honest proof of production-grade systems* — is real and John sits in it
(live systems + public audit record **CodeHawks #124 · 17 findings / 8 High · 1,430 EXP** + a "proof, not
promises" voice that publishes failures). Two problems drive the rebuild: (1) today's `/hire-me` **dead-ends
at 0% conversion** (every terminal CTA is a disabled placeholder or no-op); (2) several headline metrics were
the *studio's* register, not jw3b's — a claims-integrity exposure. This charter scopes the fix for both.

## 2. Objectives (trace target for all scope)

| OBJ | Objective (from BRD §2 / `01`) |
|---|---|
| OBJ-01 | Convert qualified attention into booked engagements (0 dead-ends; hire CTA ≤ 1 click everywhere). |
| OBJ-02 | Prove production-grade reliability in the first interaction (operable proof surface before first scroll). |
| OBJ-03 | Make the record externally verifiable in one click (CodeHawks #124 deep-linked; branded search #1). |
| OBJ-04 | Satisfy senior screens with depth + honesty (curated flagships, a failures surface, four hats). |
| OBJ-05 | Ship every public claim as verifiable proof (claims discipline as a functional gate). |
| OBJ-06 | Premium-technical, fast, accessible, operable experience (perf/a11y floor). |

## 3. Owner-decision deltas folded into this charter (BINDING — `01_OWNER_DECISIONS.md`)

1. **Flagships fixed at FOUR** (was "exactly 3"): **KTHULHU · the live on-site AI (concierge + `/audit` + CTF
   as ONE self-demonstrating system) · Overmind GenAI Engine · Kointel.** Relaxes OBJ-04/K4.1 "exactly 3"→"exactly 4";
   requirements-architect updates that KPI in Phase 2. DevGuild/EcoGraph/Art-of-Zeta are **not** flagships.
2. **All 10 stat-claims CLEARED IN** to jw3b's own evidence register; each needs an evidence pointer, and the
   **studio-origin figures** (+18pts · 9,828 entities · 77k chunks · memory-miss >2× · any EcoGraph-derived number)
   carry an **"AgileGypsy Labs / EcoGraph" provenance note.** Build task: **seed the register before any surface renders a claim.**
3. **Mission Control ships ALL THREE checkout rails** — **book-a-call · on-chain escrow · Unlock** — with
   **book-a-call the guaranteed, default, primary path**; escrow + Unlock are **built now but feature-flagged on provisioning**.
4. **XMTP is BUILD-NOW** via `@xmtp/browser-sdk` (MLS successor) — a first-class feature build + migration, not a version bump.
5. **OD-04 jurisdiction + 6 `[NEEDS RESEARCH]` compliance items DEFERRED** to the compliance phase (tracked, non-blocking).

## 4. Scope — IN (MoSCoW on every item; each traces to an OBJ)

> The **60% MUST-capacity rule is enforced per release phase** (see `04_release_roadmap.md`), **not** at charter
> level. At charter level the build is legitimately MUST-heavy (owner-mandated functional floor); that MUST-heaviness
> is registered as **R-10** with per-phase distribution + SHOULD/COULD buffers as its mitigation. No MUST is padded and
> none is downgraded to fake slack.

### MUST (29) — the operable thesis + functional floor
| # | Scope item | OBJ | FRs |
|---|---|---|---|
| M1 | Ground-up frontend **and** Worker rebuild on branch `v2` (reuse nothing) | all | — |
| M2 | Design-system **token layer**, distinct-from-studio accent/dimensionality (C7/NFR-09) | 06 | — |
| M3 | **Evidence-register seeding** — 10 cleared stats + evidence pointers + AgileGypsy-Labs/EcoGraph provenance notes (**gates all claim rendering**) | 05 | DE-07, OD-05 |
| M4 | **Claims-discipline content gate** (only `cleared` claims render; forbidden list blocked) | 05 | FR-043/046/047, BR-01/02 |
| M5 | **Four-hat identity IA**, shown together; filters DIM, never hide | 04 | FR-003, BR-07 |
| M6 | **Operable proof-first hero** (run audit / query agent / explore graph) interactive before first scroll | 02 | FR-001 |
| M7 | **Persistent single-spine hire CTA** reachable ≤ 1 click from every route | 01 | FR-002 |
| M8 | **Radical-honesty "unedited run / what failed & why"** surface (first-class) | 04 | FR-045 |
| M9 | **Four flagship systems shown operably** — KTHULHU · on-site AI · Overmind · Kointel | 04 | FR-004 (amended to 4), OD-01 |
| M10 | **Delivery-credibility seniority anchor** (20+ plants / 7 countries / AgilePM®) | 04 | FR-060 |
| M11 | **AI security console `/audit`** — Solidity auditor (stream + tag-strip + input validation + AI disclaimer) | 02 | FR-008/011/013/014 |
| M12 | **AI concierge** — global SSE stream, tag protocol, evidence-grounded, AI disclosure | 02/05 | FR-015/017/018/020/021 |
| M13 | **Live-fallback (cached/replay "recorded run")** on **every** live surface (the existential constraint) | 02/06 | FR-012/020/026, BR-03 |
| M14 | **Mission Control** 4-step configurator that converts; assessment informs loadout; prices from `retainer.json`; label-drift + dead-buttons removed | 01 | FR-028/029/030/035/038, BR-12 |
| M15 | **Book-a-call floor** — guaranteed primary path; offline-capable capture; completes with no wallet/chain/Worker | 01 | FR-036, BR-11 |
| M16 | **On-chain escrow rail built** — Simulate → Write → Wait; USDC 6-decimal BigInt | 01 | FR-033, BR-04/06 |
| M17 | **Unlock paywall rail built** — real-lock-only; degrade to book-a-call (no perpetually-disabled button) | 01 | FR-034/041 |
| M18 | **Engagement-request capture** → Worker + D1 with confirmation | 01 | FR-037 |
| M19 | **Wallet primitives** — custom RainbowKit connect button; chain config; testnet/mainnet honesty labels | 01/05 | FR-040/042, BR-09 |
| M20 | **Worker routes** — concierge / audit / STT-TTS / CTF-verify / leaderboard / engagement / book-a-call | 01/02 | FR-048 |
| M21 | **D1 persistence** — analytics, leaderboard, engagement requests | 01 | FR-049 |
| M22 | **Secrets server-side only**; no secret in client bundle or `.env`-public | 05 | FR-050 |
| M23 | **AI-endpoint rate-limiting** (bound cost + abuse) | 06 | FR-051, NFR-08 |
| M24 | **Server-side tag-protocol contract**, kept synced with the frontend parser | 02 | FR-052 |
| M25 | **Branded-search SEO** — title/meta/OpenGraph | 03 | FR-053 |
| M26 | **CodeHawks #124 deep-link** to the public profile from ≥ 2 surfaces | 03 | FR-044 |
| M27 | **Privacy notice** (analytics, wallet data, engagement PII) | 05 | FR-057 |
| M28 | **Performance + a11y floor** — LCP ≤ 2.5s marquee (throttled mobile), INP ≤ 200ms, reduced-motion 100%, mobile fallbacks | 06 | FR-007, NFR-01/05 |
| M29 | **XMTP E2E encrypted messaging** built via `@xmtp/browser-sdk` (owner build-now; sequenced off the conversion critical path) | 01/05 | FR-039, OD-02 |

### SHOULD (8)
| # | Scope item | OBJ | FRs / gate |
|---|---|---|---|
| S1 | Console **fuzz-harness generator** + **tx explainer** | 02 | FR-009/010 |
| S2 | **Live on-chain CTF** (Base Sepolia) — full state machine, testnet honesty, cached-replay, leaderboard *(FR-023/024/026/027 become MUST **if** CTF ships)* | 02 | FR-022/023/024/025/026/027 |
| S3 | **Explorable/steppable Overmind graph + validated-pipeline** object (the "systems are graphs" signature) | 02 | FR-006 |
| S4 | Concierge **hire-routing tool-call** | 01 | FR-019 |
| S5 | **Escrow + Unlock LIVE-activation** (rails are built MUST; *going live* is gated on provisioning — real locks + escrow deploy/fund) | 01 | FR-032/033/034 activation |
| S6 | **Person structured data** + agilegypsy.com cross-link | 03 | FR-054 |
| S7 | **Cookie/analytics consent** *(gated on `[NEEDS RESEARCH]`)* | 05 | FR-058 |
| S8 | **Checkout/engagement terms** at paid checkout *(gated on `[NEEDS RESEARCH]`)* | 05 | FR-059 |

### COULD (3)
| # | Scope item | OBJ | FRs |
|---|---|---|---|
| C1 | Concierge **voice STT/TTS** | 02 | FR-016 |
| C2 | **Content-gap explainer pages** ("systems are graphs", "zero-trust validator") | 03 | FR-055 |
| C3 | **GitHub ↔ site** repo reinforcement | 03 | FR-056 |

## 5. Scope — OUT (WON'T; each with a documented reason)

| # | Out of scope | Reason |
|---|---|---|
| W1 | Studio (**agilegypsy.com**) redesign | jw3b.dev is the distinct person-brand; cross-link, don't absorb (S5/NFR-09). |
| W2 | **Mainnet CTF** | Stays Base **Sepolia** testnet, honestly labeled — no real-funds risk (BR-09). |
| W3 | **New keyword/volume research** | No tool data available; channel priority already set in Phase 0. |
| W4 | **Forbidden claims** (aggregate TVL / $ secured / "protocols secured" / "50+ audits" / PMP / PRINCE2-Practitioner / Neo4j-Certified-until-artifact) | Unverifiable or false; violates claims discipline (BR-02). Forbidden list is **unchanged** by OD-05. |
| W5 | Full XMTP rebuild on **deprecated `@xmtp/xmtp-js`** | Superseded; the build is on `@xmtp/browser-sdk` (OD-02). |
| W6 | **Instant self-serve crypto checkout for high-ticket** ($6k–$50k+) | Routed to book-a-call / escrow-on-acceptance by design — sales-assisted, not instant e-commerce (BR-05). |
| W7 | Resolving **jurisdiction (OD-04)** + the **6 `[NEEDS RESEARCH]`** compliance questions | Deferred to the compliance phase; tracked, not this build's job to answer (clear surfaces ship regardless). |

## 6. Success criteria (measurable + time-bound)

| SC | Criterion | Measure | When |
|---|---|---|---|
| **SC-1 Conversion** | Mission Control completion ≥ **25%**; **≥ 3** qualified engagement requests / month; hire CTA ≤ 1 click from **100%** of routes; **0** terminal dead-ends | K1.1–K1.4 `[ASSUMPTION — baseline; no old-site analytics]` | dead-ends/CTA at launch; rate + requests by **day 90** post-launch |
| **SC-2 Live-surface reliability** | Live-surface **effective success ≥ 95%** (live *or* labelled cached/replay); **0 hard-broken states**; ≥ 1 operable surface interactive before first scroll on 100% of sessions | K2.1–K2.3 | structural at launch gate; success rate over **first 30 days** |
| **SC-3 Claims integrity** | **100%** of rendered numeric/credential claims trace to the seeded register; **0** forbidden claims; **0** unreconciled `[REQUIRES_RESOLUTION]` stats live | K5.1–K5.4 | verified at the **claims-gate audit** at every release gate |
| **SC-4 Performance / a11y** | LCP ≤ **2.5s** marquee (mid-tier throttled mobile); INP ≤ **200ms**; reduced-motion honored **100%**; mobile fallback on every proof surface | K6.1/6.3, NFR-01/05 | verified at the **performance gate** each phase |
| **SC-5 Verifiability** | CodeHawks **#124** deep-linked from ≥ 2 surfaces; branded search ("John Wellard"/"jw3b"/"AgileGypsy") **rank #1** | K3.1/3.4 | deep-link at launch; rank #1 within **90 days** |

## 7. Sponsor, lead & governance

- **Sponsor / Project Lead / sole human = John Wellard (JW3B / AgileGypsy).** He is the **only** human, the **single
  approver at every gate**, and **retains all deploy control** (build stops at branch `v2`; John deploys). **Bus-factor = 1**
  — registered as **R-03 (RED)**.
- **Delivery team = a MAS multi-agent pipeline** (art-director, brand-architect, lead-architect, frontend-engineer,
  app-ui-engineer, backend-specialist, domain-engine, creative-technologist, synthetic-data, smart-contract-engineer,
  full-stack-integrator, web3-blockchain, portfolio-evidence, audit-heuristics-engineer, devops-engineer + the gate roles
  qa-tester / security / codebase-auditor / performance-monitor / compliance-officer), dispatched by **lead-architect** in
  MAS Phase 5. RACI in `05_master_project_plan.md`.
- **Agent throughput draws on a shared Claude session-token budget** → throttling is a **scheduling risk (R-08)**, not a blocker.

## 8. Budget & timeline (no figure fabricated)

- **Budget: `[UNKNOWN — needs input]`.** No cash budget stated. Cost drivers are (a) the **shared Claude session-token
  budget** for agent compute, (b) **Cloudflare usage** (Worker / D1 / Workers AI / AI Gateway, usage-tiered), and (c) John's
  time as sole approver/deployer. None is quantified upstream; none is invented here.
- **Timeline: `[ESTIMATE]`, basis = story/epic count + phase sequencing; wall-clock `[UNKNOWN — needs input]`.**
  Effort is sized per phase by story count (`04_release_roadmap.md`); **wall-clock is unknowable** because it is a function of
  session-budget throughput (R-08) and John's single-approver cadence (R-03). No calendar commitment is made — any date
  would be a fabricated guess treated as a promise.

## 9. Constraints (given — recorded, not chosen) & assumptions

**Constraints:** React 19 · Vite · Tailwind 3 · Framer Motion · **wagmi 2 (NEVER v3)** · viem 2 · R3F optional & budgeted;
backend = Cloudflare Worker (Workers AI + D1 + Anthropic via AI Gateway); simulate-first on writes; secrets Worker-only;
**do NOT deploy or push — build on `v2` only**; architecture/technology choices belong to Phase 3, not here.
**Assumptions:** A1 no old-site analytics (KPIs are targets); A2 **provisioning may be absent at build start** (R-02);
A3 concierge/audit depend on a live Worker (each needs a fallback); A4 John retains deploy control; A5 the four flagships are fixed (OD-01).

## 10. Self-critique (charter)

1. **Traceable?** Every IN item carries an OBJ + FR link; no `[UNLINKED SCOPE]`. ✔
2. **Owner + deadline on everything?** Owner = John (sponsor/approver) + the responsible MAS role per item (RACI in `05`);
   success criteria are time-bound (launch / day 30 / day 90 / per-gate). ✔
3. **Uncomfortable risks written down?** Bus-factor=1, MUST-heaviness, claim-attribution, cost/abuse, session-throttling all registered (`02`). ✔
4. **Fillable placeholders?** Budget/timeline are genuinely absent upstream → `[UNKNOWN — needs input]` / `[ESTIMATE]` with basis, not `[FILL_IN]`. ✔
5. **Would a new team member know what to do next?** Yes — Phase-0 foundations → MVP thesis slice, sequenced in `04`. ✔

**Escalation before build:** the two RED risks (**R-01 live-surface reliability**, **R-03 bus-factor = 1**) require John's
acknowledgment of their mitigations before Phase-5 build starts.
