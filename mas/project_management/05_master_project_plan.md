# 05 — Master Project Plan — jw3b.dev v2

**Role:** project-manager (MAS Phase 1.5) · **Date:** 2026-08-16 · **Status:** DRAFT (John's approval precedes Phase-2 handoff)
**Embeds:** [`01_project_charter.md`](01_project_charter.md) · [`02_risk_register.md`](02_risk_register.md) ·
[`03_stakeholder_register.md`](03_stakeholder_register.md) · [`04_release_roadmap.md`](04_release_roadmap.md).

---

## 1. Executive summary (≤ 250 words)

jw3b.dev v2 is a ground-up rebuild (frontend + Cloudflare Worker) repositioning John Wellard as a Senior Agentic AI Developer and
auditor on one thesis: **a portfolio you operate, not one you read.** Phase-0 returned PROCEED. This plan governs **60 requirements
/ 51 stories / 10 epics** against six objectives, folding in John's **binding owner decisions**: four fixed flagships (KTHULHU, the
live on-site AI, Overmind, Kointel), all three checkout rails with **book-a-call the guaranteed primary**, all ten stat-claims
cleared into a seeded evidence register with provenance notes, and **XMTP built now** via `@xmtp/browser-sdk`.

Governance is unusual: **John is the only human** (sponsor, sole approver, sole deployer — **bus-factor = 1, a RED risk**), and the
delivery team is a **MAS multi-agent pipeline** dispatched by a lead-architect, gated by QA, security, audit, performance, and
compliance checks. Agent throughput draws on a shared session-token budget: a scheduling risk, not a blocker.

Delivery runs in four phases: Foundations → **MVP** (the operable thesis slice, first deployable increment) → Beta (proof-set +
rails + CTF) → GA (XMTP, provisioning, compliance). The **critical path** runs from the backend tag-protocol contract through the
live AI surfaces and Mission Control capture to the on-chain rails; XMTP is a parallel pole into GA. The **book-a-call floor** keeps
launch un-blocked when John-owed provisioning is late.

Two **RED risks** (live-surface reliability, bus-factor) need **John's sign-off before build**. No budget or deadline is stated;
none is fabricated.

## 2. Embedded artifacts

The five documents are one governance set: the **Charter** fixes scope + success criteria; the **Risk Register** ranks the 11 risks
(2 RED); the **Stakeholder Register** sets the async, digest-based communication + escalation; the **Roadmap** sequences the 51
stories into P0–P3 with the critical path; this **Plan** binds them with RACI, quality gates, and change control.

## 3. RACI matrix (key activities)

**Convention:** R = does the work · A = accountable owner (one per activity) · C = consulted · I = informed. **John is Accountable
on every gated activity** — the honest consequence of bus-factor = 1 (R-03); within a phase, lead-architect is the delivery proxy,
but final accountability and **all deploy authority remain John's**.

| # | Activity | R (Responsible) | A | C | I |
|---|---|---|---|---|---|
| 1 | Requirements consolidation (Phase 2) | requirements-architect | **John** | business-analyst, PM | architect |
| 2 | Architecture + cross-subsystem sequencing (Phase 3) | architect | **John** | lead-architect, backend-specialist, web3-blockchain | all engineers |
| 3 | Design story + token layer + creative briefs (Phase 4) | art-director, brand-architect | **John** | frontend-engineer | app-ui-engineer |
| 4 | Scaffold + provider tree + shared contracts (P0) | lead-architect | **John** | backend-specialist, full-stack-integrator, devops-engineer | qa-tester |
| 5 | Evidence-register seeding + claims-gate engine (P0) | domain-engine, portfolio-evidence | **John** | business-analyst | frontend-engineer, codebase-auditor |
| 6 | Backend: Worker routes + D1 + tag-protocol + rate-limit (P0–P1) | backend-specialist | **John** | domain-engine, audit-heuristics-engineer, devops-engineer | frontend-engineer, security |
| 7 | Public UI: hero, four-hat IA, hire spine, failures surface, SEO/a11y (P1) | frontend-engineer | **John** | art-director, creative-technologist | performance-monitor |
| 8 | Live AI surfaces (concierge/audit/CTF) + cached-replay fallback (P1–P2) | app-ui-engineer, domain-engine | **John** | synthetic-data, audit-heuristics-engineer | security, performance-monitor |
| 9 | Mission Control + all-3 checkout rails + wallet (P1–P2) | app-ui-engineer, full-stack-integrator | **John** | web3-blockchain, smart-contract-engineer, backend-specialist | qa-tester |
| 10 | On-chain contracts (escrow + CTF vault), simulate-first (P2) | smart-contract-engineer | **John** | web3-blockchain | security, devops-engineer |
| 11 | XMTP E2E build (`@xmtp/browser-sdk`, P2–P3) | full-stack-integrator | **John** | architect, backend-specialist | security |
| 12 | Phase-5 quality gates (qa / security / audit / perf / compliance) | qa-tester, security, codebase-auditor, performance-monitor, compliance-officer | **John** | lead-architect, PM | all roles |
| 13 | Production deploy (`v2` → prod) | **John** (exclusive) | **John** | devops-engineer, security | all roles |

## 4. Quality gates per phase (MAS Phase-5 discipline)

**Every phase exit is a hard gate — each check is PASS / WARN / FAIL; any FAIL blocks the exit; John gives the final deploy
approval.** Gate ownership (from the MAS role library):

| Gate role | Checks (evidence-based; verdict PASS/WARN/FAIL) |
|---|---|
| **qa-tester** | Vitest/Testing-Library suite green; coverage gate held (scoped include-list, high thresholds); regression sweep with **per-failure attribution**; NFR perf assertions in tests; no flaky-green masking a real gap. |
| **security** | SAST (injection / XSS / hardcoded secrets / vulnerable deps); **client-bundle secret-leak scan** (FR-050 / US-043); DAST that **proves the AI rate-limiter fires** (R-07 / FR-051), CORS + security headers; **simulate-first verified on every write** (BR-04). |
| **codebase-auditor** | Requirement→evidence map (built / partial / missing) across the phase's stories; **orphan detection** (no dead `ENQUIRE`, no `/test-agent` — FR-038); architecture-compliance vs the Phase-3 design; **claims-gate audit** (0 uncleared / mis-attributed / forbidden claims rendered — SC-3, R-05); **0 hard-broken states** verified (SC-2, R-01). |
| **performance-monitor** | LCP ≤ 2.5s marquee on throttled mid-tier mobile + INP ≤ 200ms (SC-4, R-06); reduced-motion 100%; R3F within frame budget or non-3D fallback present; **agent-output quality scoring** (PASS/WARN/FAIL, trend-tracked) before downstream work builds on a deliverable. |
| **compliance-officer** | Clear duties present every phase (AI disclosure · testnet honesty · audit disclaimer · privacy notice); research-gated duties (consent FR-058 / checkout-terms FR-059) shipped **only** once resolved (R-09); OD-04 jurisdiction surfaced before the privacy regime is named. |

**Per-phase gate emphasis:** **P0** — build-green + secret-leak clean on the skeleton + claims-gate blocks an uncleared claim +
fallback harness proven. **P1 (MVP)** — SC-1 structural, SC-2 (0 hard-broken + ≥ 95% incl. fallback), SC-3, SC-4; privacy live.
**P2 (Beta)** — escrow **simulate-first proven** (security + web3), rail-degradation verified, CTF resilient, four flagships operable.
**P3 (GA)** — full regression + security + audit + perf sweep; XMTP built **or** claim removed; SC-5 (branded #1 + deep-link);
provisioning live **or** flagged.

## 5. Change-control process

1. **Detect / propose.** Any scope change (add, drop, reprioritise) is raised to the PM with the OBJ it serves.
2. **Trace-or-reject.** A change that does **not** trace to a business objective is rejected as `[UNLINKED SCOPE]` — no unlinked FR enters the plan.
3. **Classify impact.**
   - **MUST scope item or a success criterion changes** → PM writes a **change-impact assessment** (scope · risk · roadmap delta) → **escalate to John**; silent re-planning is prohibited.
   - **SHOULD/COULD reprioritisation *within* a phase** → lead-architect + PM decide, **logged** in the plan (not escalated).
   - **New scope added** → must fit the phase's reserved ~40% buffer or bump a SHOULD/COULD out; **re-run MoSCoW** for that phase.
4. **Re-baseline.** On any accepted MUST change: update the Risk Register (drift risks), re-check the 60%-per-phase capacity, adjust the roadmap, and **notify John** if a MUST moved.
5. **Provisioning + compliance changes** (John supplies a lock / escrow deploy / scheduler / KTHULHU embed; a `[NEEDS RESEARCH]` item resolves) → flip the feature flag / ship the gated surface; **no re-architecture** (rails were built to absorb this).

## 6. Escalation path (single human endpoint)

Full diagram in [`03_stakeholder_register.md` §3](03_stakeholder_register.md). In brief:
`delivery role / gate FAIL → lead-architect → gate owner → PM (change-control · risk) → **John**`.
**Auto-escalate to John:** any RED risk realised (R-01, R-03); any MUST-scope or success-criterion change; any provisioning
dependency going critical (R-02); any compliance-gate FAIL; **every deploy** (John is the sole deployer).
**Resolved in-pipeline (logged):** SHOULD/COULD reprioritisation, gate-WARN rework, agent-throughput scheduling (R-08).

## 7. Autonomous vs human-review boundary

- **Autonomous (inside a phase, within gates):** agent dispatch + implementation on branch `v2`; SHOULD/COULD sequencing; mechanical
  rework on WARNs; routing fan-out to cheaper models (R-08 mitigation).
- **Human review (John) required:** phase entry/exit approval; **all deploys**; RED-risk acceptance (pre-build sign-off on R-01 +
  R-03); MUST-scope / success-criterion changes; provisioning + compliance rulings (OD-04, the 6 `[NEEDS RESEARCH]` items);
  the final claims-gate sign-off before any surface renders a cleared stat.

## 8. Pre-build gate (must clear before Phase-5 build starts)

1. **John acknowledges the two RED risks** (R-01 live-surface reliability, R-03 bus-factor = 1) and their mitigations.
2. **Phase 2** (requirements-architect folds OWNER_DECISIONS into `REQUIREMENTS.md`, incl. flagships 3→4) **and Phase 3** (architecture) complete.
3. **Budget `[UNKNOWN — needs input]`** and any hard deadline confirmed absent or supplied — the plan currently commits to **no calendar date**.

## 9. Self-critique (master plan)

1. **Executive summary ≤ 250 words?** Yes. ✔
2. **RACI ≥ 5 activities, one A each?** 13 activities; a single Accountable per row (John, per the governance reality). ✔
3. **Quality gates per phase with pass/fail criteria?** Yes — five gate roles + per-phase emphasis, all PASS/WARN/FAIL. ✔
4. **Change control + escalation explicit?** Yes — trace-or-reject, impact-classify, re-baseline; single-endpoint escalation with auto-escalate list. ✔
5. **Autonomous vs human boundary drawn?** Yes — §7 separates pipeline-autonomous from John-review, with deploy exclusively John's. ✔
