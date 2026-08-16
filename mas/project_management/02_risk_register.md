# 02 — Risk Register — jw3b.dev v2

**Role:** project-manager (MAS Phase 1.5) · **Date:** 2026-08-16 · **Status:** DRAFT
**Scoring:** Score = Probability × Impact on a 1–9 matrix. Prob/Impact each LOW = 1 · MED = 2 · HIGH = 3
(CRITICAL noted in text where existential, scored 3). **RED 7–9** = escalate to John + mitigate **before build**.
**AMBER 4–6** = monitor weekly with a contingency. **GREEN 1–3** = log, review monthly.
**Categories present:** technical · resource · dependency · compliance · timeline · market · reputational (≥ 3 required — 7 covered).
Ranked by score, highest first. Every risk carries a mitigation **and** a contingency (a risk without one is a worry, not a plan).

---

## RED risks (score ≥ 7 — escalated to John before Phase-5 build)

### R-01 — Live-surface reliability (EXISTENTIAL) · Score **9** · RED
- **Category:** technical (existential). **Owner:** architect + synthetic-data (fallback artifacts); accepted by John.
- **Description:** A live proof surface (audit console / concierge / CTF / KTHULHU embed) that **fails on load disproves the
  entire "operable, works-in-front-of-you" thesis** — the one non-negotiable execution constraint (master-report Risk 1, BRD R-01).
- **Probability:** HIGH (3) — inherent: live systems on a shared backend + third-party embeds *will* be unavailable sometimes.
- **Impact:** CRITICAL (3) — a single hard-broken flagship on load contradicts the core positioning to the primary buyer.
- **Mitigation:** **BR-03 / NFR-02** — *every* live surface ships a labelled **cached/replay "recorded run"**; the ≥ 95%
  effective-success metric (SC-2) **counts the fallback**. synthetic-data owns recorded artifacts; codebase-auditor verifies
  **0 hard-broken states** at every gate; the fallback harness is a **Phase-0 foundation primitive**, built before any live surface.
- **Contingency:** if no cached artifact exists for a surface, show "temporarily offline — book a call" (never a blank/error);
  circuit-break the surface to its recorded run + the book-a-call floor.

### R-03 — Bus-factor = 1 (single human operator) · Score **9** · RED
- **Category:** resource. **Owner:** John (structural — accept + reduce load); PM governs the mitigation.
- **Description:** John is the **only** human — sole decision-maker, **single approver at every gate**, and **sole deployer**.
  His unavailability halts all progress; his review cadence bounds throughput; there is no backup approver or deployer.
- **Probability:** HIGH (3) — a single approver/deployer is a certain, continuous bottleneck across a 51-story build.
- **Impact:** HIGH (3) — every gate and every deploy blocks on one person; illness/absence stalls the project outright.
- **Mitigation:** **front-load and batch** John's decisions at **phase-gate boundaries** (not per-task); **async digest-based
  reviews** (status + files + gate result, no code dumps); persist every ruling in an `OWNER_DECISIONS`-style record so context
  survives compaction and personnel is not needed to re-derive intent; keep agent work accumulating **on branch `v2`** so it does
  not idle waiting on a deploy.
- **Contingency:** work **queues on `v2`** without blocking when John is unavailable; deploys are **batched** at release gates,
  not per-change; the roadmap sets **no calendar commitment**, so an absence stretches wall-clock without breaching a deadline.

---

## AMBER risks (score 4–6 — monitor weekly, contingency ready)

### R-02 — Provisioning availability (John-owed primitives absent at build start) · Score **6** · AMBER
- **Category:** dependency. **Owner:** John (supplies) + app-ui-engineer (feature-flags).
- **Description:** Real **Unlock lock addresses**, **escrow contract deploy + funding**, the **book-a-call scheduler endpoint**,
  and **KTHULHU embed access** may all be **absent** when the build needs them (A2; no delivery date).
- **Probability:** HIGH (3) — explicitly flagged as not guaranteed; John-owed with no date.
- **Impact:** MED (2) — **capped by design:** the **book-a-call floor (BR-11)** carries conversion with zero on-chain dependency,
  and rails **degrade to book-a-call** (FR-034); the KTHULHU flagship falls back to a **recorded run / verifiable link** (BR-03).
- **Mitigation:** build escrow + Unlock **now but feature-flagged**; light them up on provisioning; ship MVP/Beta with the
  book-a-call floor as the guaranteed terminal action; treat rail **live-activation** as SHOULD (S5), not a launch blocker.
- **Contingency:** launch with rails built-but-flagged and KTHULHU on its recorded fallback; activate each primitive the moment
  John supplies it — **no re-architecture required**, only a flag flip + address swap in `contracts.js`/`retainer.json`.

### R-04 — XMTP new-SDK / MLS build · Score **6** · AMBER
- **Category:** technical. **Owner:** full-stack-integrator / backend-specialist; C: architect.
- **Description:** `@xmtp/browser-sdk` is a **from-scratch MLS-based rewrite** (new inbox/identity model, wallet-signature
  onboarding) — a **migration-class** build, not a version bump (OD-02). Unfamiliar surface area, deprecated predecessor.
- **Probability:** HIGH (3) — new SDK + MLS model + first-time integration.
- **Impact:** MED (2) — **off the conversion critical path** (book-a-call floor carries hiring); it is the retainer *perk*, and
  **FR-039 honesty is preserved either way** — build it, or don't advertise it.
- **Mitigation:** **spike browser-sdk onboarding early** (Beta) to retire the unknowns; run XMTP as a **parallel workstream** that
  gates into GA, never blocking the MVP/Beta thesis slices; keep it behind a feature flag.
- **Contingency:** if not shippable by GA, **remove the "E2E encrypted channel / XMTP" claim** (FR-039) — honesty intact, no dead-end.

### R-05 — Claim-attribution on cleared studio-origin stats · Score **6** · AMBER
- **Category:** reputational. **Owner:** portfolio-evidence + codebase-auditor; A: John.
- **Description:** The cleared studio-origin figures (**+18pts · 9,828 entities · 77k chunks · memory-miss >2× · EcoGraph-derived**)
  are John's to claim, but rendering them **without the provenance note** implies they came from a different jw3b system — the exact
  "proof, not promises" failure the site exists to avoid (S1 success signal: *zero reputational claim-risk incidents*).
- **Probability:** MED (2) — the OD-05 provenance guard exists but must be applied on **every** surface; a dropped note is easy.
- **Impact:** HIGH (3) — reputational; one mis-attributed stat undermines the whole thesis with the senior audience.
- **Mitigation:** **OD-05 mandate** — an "AgileGypsy Labs / EcoGraph" provenance note on every studio-origin figure; the
  **evidence register (DE-07)** stores provenance per claim; the **claims gate + concierge grounding (FR-018/043)** prevent any
  figure rendering without its register entry; codebase-auditor audits every rendered claim against the register at each gate.
- **Contingency:** if provenance for a given stat cannot be evidenced, **gate it back out** (BR-01) rather than ship it bare.

### R-07 — AI-endpoint cost / abuse (runaway spend on a public AI) · Score **6** · AMBER
- **Category:** technical + resource (financial). **Owner:** backend-specialist; verified by security.
- **Description:** The public concierge + `/audit` + STT/TTS on Workers AI / AI Gateway can be **weaponized into runaway spend**
  against a sole operator (NFR-08); sustained abuse could also force taking the flagship AI offline (→ feeds R-01).
- **Probability:** MED (2) — public AI endpoints attract abuse, but the mitigation is standard and effective.
- **Impact:** HIGH (3) — direct financial harm to one person; secondary reliability hit if the AI must be pulled.
- **Mitigation:** **FR-051 rate-limiting** per session/IP; **right-sized models** (Haiku-class concierge, heavier reserved for
  audit); **AI Gateway caching + spend caps**; security role **proves the limiter actually fires** (DAST), not just that it exists.
- **Contingency:** **circuit-breaker** — on a spend threshold, degrade the AI surfaces to their cached/replay runs + book-a-call.

### R-08 — Session-budget throttling of the agent pipeline · Score **6** · AMBER
- **Category:** timeline / resource. **Owner:** lead-architect (dispatch) + PM (scheduling).
- **Description:** MAS agent phases draw on a **shared Claude session-token budget**; a 51-story, many-role build can **exhaust
  the budget in bursts**, throttling throughput (a scheduling reality, explicitly flagged).
- **Probability:** HIGH (3) — shared budget + large multi-agent build makes throttling likely.
- **Impact:** MED (2) — **schedule slip only**, not a scope or quality loss; work resumes when budget frees; no deadline is committed.
- **Mitigation:** route **mechanical fan-out to cheaper models** (Haiku / effort overrides per CLAUDE.md); keep agent definitions
  **prompt-cache-stable**; **parent does the graph legwork** and hands surgical coordinates; **digest-only returns**; **`/compact`
  at task boundaries**; sequence non-parallel work to avoid burst exhaustion.
- **Contingency:** treat as **wall-clock stretch, not scope cut** — phases lengthen, the MVP thesis slice is protected first.

---

### R-06 — LCP with embedded live surfaces (performance) · Score **4** · AMBER
- **Category:** technical (performance). **Owner:** performance-monitor + creative-technologist.
- **Description:** Embedded live systems (audit console, concierge, optional R3F graph) threaten **LCP ≤ 2.5s** and mobile (SC-4).
- **Probability:** MED (2) — heavy surfaces, but mitigable. **Impact:** MED (2) — misses OBJ-06; caught pre-launch, not existential.
- **Mitigation:** **lazy-load** proof surfaces; **budgeted/optional R3F** with a non-3D fallback (NFR-03, ≥ 30fps mobile / ≥ 50fps
  desktop); **performance gate** (chrome-devtools Lighthouse) per phase on throttled mid-tier mobile; the marquee LCP element is a
  lightweight above-the-fold artifact, heavy surfaces hydrate after.
- **Contingency:** defer/simplify or swap a heavy surface for its recorded artifact to hold the budget.

### R-09 — Open compliance items unresolved · Score **4** · AMBER
- **Category:** compliance. **Owner:** compliance-officer + research-specialist; A: John (OD-04).
- **Description:** OD-04 jurisdiction (UK vs SA) + 6 `[NEEDS RESEARCH]` questions (EU AI Act Art. 50, GDPR/POPIA cookie-consent,
  wallet-as-PII, consumer-protection/refund, DSAR/erasure, VAT on USDC) may not resolve before a gated surface needs them.
- **Probability:** MED (2). **Impact:** MED (2) — affects only consent/checkout-terms/privacy-regime wording; **clear duties ship
  regardless** (AI disclosure, testnet honesty, privacy notice, audit disclaimer — FR-014/021/024/042/057).
- **Mitigation:** encode the clear duties **now**; hold consent (FR-058) + checkout-terms (FR-059) as **SHOULD, gated on research**;
  compliance-officer resolves before the gated surface ships; surface OD-04 to John at the compliance phase.
- **Contingency:** **withhold the research-gated surface** (it is SHOULD, never MUST) until resolved — never blocks MVP/GA launch.

### R-10 — MUST-heavy scope / no slack (scope-creep exposure) · Score **4** · AMBER
- **Category:** timeline / scope. **Owner:** PM (change-control) + lead-architect.
- **Description:** The BRD is **45/60 FRs MUST (~75%)**; a plan with no slack slips on the first surprise, and MUST-heaviness invites
  quiet scope-creep.
- **Probability:** MED (2). **Impact:** MED (2).
- **Mitigation:** **enforce the 60% MUST-capacity rule per phase** (distribute MUSTs across MVP/Beta/GA so no phase exceeds it);
  **re-run MoSCoW** at the start of any phase whose scope changed; **change-control gate** rejects any addition that does not trace
  to an OBJ (`[UNLINKED SCOPE]`); SHOULD/COULD are the deferrable buffer.
- **Contingency:** phase-slip SHOULD/COULD items first; **protect the MVP thesis slice** as the last thing cut.

### R-11 — Conversion-KPI baseline uncertainty · Score **4** · AMBER
- **Category:** market. **Owner:** John + PM (calibration).
- **Description:** No old-site analytics exist → the ≥ 25% completion / ≥ 3 requests-per-month KPIs are **targets, not forecasts**;
  the rebuilt flow could underperform the assumed baseline (SC-1).
- **Probability:** MED (2). **Impact:** MED (2).
- **Mitigation:** flag KPIs `[ASSUMPTION — baseline]`; **instrument analytics from day 1** (D1); **calibrate over the first 90 days**;
  protect the **single hire spine** so proof-spectacle never buries conversion (master-report Risk 3).
- **Contingency:** recalibrate the day-90 targets against the measured baseline; if completion lags, A/B the terminal-step routing
  and the book-a-call prominence (no scope change, tuning only).

---

## Summary

| Rank | ID | Risk | Cat | P×I | Score | Status |
|---|---|---|---|---|---|---|
| 1 | R-01 | Live-surface reliability (existential) | technical | 3×3 | **9** | **RED** |
| 2 | R-03 | Bus-factor = 1 (single human operator) | resource | 3×3 | **9** | **RED** |
| 3 | R-02 | Provisioning availability (primitives absent) | dependency | 3×2 | 6 | AMBER |
| 4 | R-04 | XMTP new-SDK / MLS build | technical | 3×2 | 6 | AMBER |
| 5 | R-05 | Claim-attribution (studio-origin stats) | reputational | 2×3 | 6 | AMBER |
| 6 | R-07 | AI-endpoint cost / abuse | technical/resource | 2×3 | 6 | AMBER |
| 7 | R-08 | Session-budget throttling (agent pipeline) | timeline/resource | 3×2 | 6 | AMBER |
| 8 | R-06 | LCP with embedded live surfaces | technical/perf | 2×2 | 4 | AMBER |
| 9 | R-09 | Open compliance items | compliance | 2×2 | 4 | AMBER |
| 10 | R-10 | MUST-heavy scope / no slack | timeline/scope | 2×2 | 4 | AMBER |
| 11 | R-11 | Conversion-KPI baseline uncertainty | market | 2×2 | 4 | AMBER |

**11 risks / 2 RED** (R-01 live-surface reliability, R-03 bus-factor = 1) — both escalated to John, mitigations required before build.
**7 AMBER at score 6** (R-02, R-04, R-05, R-07, R-08) and **4 at score 4** (R-06, R-09, R-10, R-11) — weekly monitor.

## Self-critique (risk register)

1. **Traceable?** Each risk cites its source (BRD R-01…R-08, master-report Risks 1–5, OWNER_DECISIONS deltas, task brief). ✔
2. **Owner + status on every risk?** Yes — owner, probability basis, impact basis, mitigation, contingency, status all present. ✔
3. **Uncomfortable risks omitted?** No — bus-factor=1, MUST-heaviness, claim-attribution on the owner's *own* cleared stats, and
   runaway AI spend against the sole operator are all written down plainly. ✔
4. **Fillable placeholders?** None — all scores computed, no `[FILL_IN]`. ✔
5. **Every task-required risk present?** bus-factor (R-03), provisioning (R-02), live-surface reliability (R-01), XMTP (R-04),
   claim-attribution (R-05), LCP-perf (R-06), AI cost/abuse (R-07), session-throttling (R-08), open-compliance (R-09) — all present. ✔
