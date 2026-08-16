# 04 — Release Roadmap — jw3b.dev v2

**Role:** project-manager (MAS Phase 1.5) · **Date:** 2026-08-16 · **Status:** DRAFT
**Traces to:** BRD epics A–J / 51 stories (`04_user_stories.md`), OWNER_DECISIONS deltas, charter scope (`01_project_charter.md`).
**Sequencing principle (from the task):** build from **real dependencies** — *tokens/design-system → primitives → backend
contracts → feature surfaces → checkout rails* — **not** from the "hero-first" hunch. The operable hero is the first *shippable*
increment, but it sits **atop** Phase-0 foundations it depends on.

**Duration unit.** Effort is `[ESTIMATE]`, basis = **story count + gate count** per phase, expressed ordinally (S/M/L/XL).
**Wall-clock is `[UNKNOWN — needs input]`** for every phase: throughput is a function of shared session-token budget (R-08) and
John's single-approver cadence (R-03). **No calendar date is committed** — any would be a fabricated promise.

**60%-MUST discipline.** Enforced *per phase* by (a) distributing project-MUST stories across MVP/Beta/GA so no single phase's
MUST load exceeds ~60% of its capacity, and (b) reserving the remaining ~40% for SHOULD/COULD + rework. Residual MUST-heaviness is
tracked as **R-10**. Safety/claims/backend MUSTs are **never** downgraded to fake slack — slack comes from cross-phase distribution
and reserved rework capacity.

---

## Phase overview

| Phase | Theme | Size `[ESTIMATE]` | Stories (primary) | Gate |
|---|---|---|---|---|
| **P0 — Foundations & Contracts** | Enablers everything else consumes | **M** (~6–8 enabler slices) | enabler portions of A/E/F/G/H + design story/tokens + register seed | build-green + design-approved |
| **P1 — MVP: the operable thesis** ★ | First shippable vertical slice; proves the whole thesis | **XL** (~18 MUST + buffer) | A (core) · B (auditor) · C (concierge core) · E (configurator + book-a-call floor + capture) · G · H (core) · I (branded SEO) · J (privacy) | full Phase-5 gate + John deploy |
| **P2 — Beta: full proof-set + rails** | Four flagships operable; all 3 rails wired; CTF | **L** (~15 stories + on-chain contracts) | rest of A/B/C · D (CTF) · E (escrow/Unlock/ticket-routing) · F · Overmind graph · H (CTF/leaderboard) · I (structured data) | full Phase-5 gate + John deploy |
| **P3 — GA: hardening + XMTP + provisioning + compliance** | The risky/late items, sequenced last | **M–L** (~6–8 stories + XMTP migration) | XMTP (E US-034) · escrow/Unlock live-activation · J (consent/terms) · COULD (voice, explainers, GitHub) · full regression | launch gate + John deploy |

---

## P0 — Foundations & Contracts

**Purpose:** stand up the primitives the feature surfaces depend on. From a genuinely empty `v2` tree (confirmed: only `mas/` exists).
**Precedes it (MAS meta-phases, not release phases):** requirements-architect consolidates `REQUIREMENTS.md` folding OWNER_DECISIONS
(Phase 2) → architect designs cross-subsystem sequencing (Phase 3) → art-director design story + brand-architect token layer +
per-section briefs (Phase 4).

**MoSCoW (capacity ≈ MUST 60% / SHOULD+COULD+rework 40%):**
- **MUST:** scaffold + provider tree (Wagmi→Query→RainbowKit→Helmet→Router) on `v2`; **token layer** (core: colour/type/space,
  distinct-from-studio accent C7); **backend contract** — server-side **tag-protocol** + Worker route shapes + **D1 schema** +
  secrets-in-Worker skeleton; **claims-gate engine** (ClaimRecord DE-07) + **evidence-register seeded with the 10 cleared stats +
  evidence pointers + AgileGypsy-Labs/EcoGraph provenance notes** (OD-05 — gates all later claim rendering); **wallet connect
  primitive** (RainbowKit button) + chain config; **cached/replay fallback harness** (BR-03 primitive).
- **SHOULD:** extended motion-token system; rate-limit tuning; provenance-note automation; a broader recorded-run library.
- **COULD:** design-token export to TS/JSON for reuse.

**Milestones:** (1) `v2` builds green with provider tree; (2) token layer + primitives published; (3) backend contract +
D1 schema + secrets wired (routes stubbed); (4) evidence register seeded + claims-gate blocks an uncleared claim in a test;
(5) fallback harness serves a labelled recorded run on a forced Worker-down.
**Exit criteria:** build green on `v2`; tokens + primitives + claims-gate + backend contract + fallback harness in place;
design story + briefs **approved by John**; secret-leak scan clean on the skeleton.
**Owner:** lead-architect (R) · brand-architect + art-director + backend-specialist + domain-engine + portfolio-evidence (R by area) · **John (A)**.
**Dependencies:** Phase-2 requirements + Phase-3 architecture complete. **Duration `[ESTIMATE]`:** **M**; wall-clock `[UNKNOWN]`.

## P1 — MVP: the operable thesis ★ (first shippable vertical slice)

**Purpose:** ship the smallest increment that **proves the entire thesis end-to-end** and converts — independently deployable.
**Vertical slice (the [ASSUMPTION] worth testing, now sequenced atop P0):** *operable proof-first hero (run the `/audit` auditor
**or** query the concierge) → persistent hire spine → Mission Control configurator → **book-a-call floor** capturing to D1 → claims
gate green → the failures surface → every live surface backed by its cached/replay fallback.* This is the first thing worth
deploying; it de-risks the whole program because it validates proof-as-interface + conversion in one slice.

**Story map (MoSCoW; MUST ≈ ≤ 60% of phase capacity, remainder = SHOULD + reserved rework):**
- **MUST (thesis + safety + backend floor):** US-001 (operable hero) · US-002 (hire spine) · US-003 (four hats) · US-005 (no
  clichés) · US-007 (motion/perf prefs) · US-008 (Solidity audit) · US-011 (console fallback) · US-012 (audit disclaimer) ·
  US-013 (ask concierge) · US-015 (concierge grounded) · US-017 (never-dead concierge) · US-018 (AI disclosure) · US-023
  (configurator, label-drift fixed) · US-025 (honest prices) · US-031 (**book-a-call floor**) · US-032 (request captured) ·
  US-038 (claims gate) · US-041 (backend routes live) · US-043 (no leaked secrets) · US-044 (rate-limit) · US-045 (failures
  surface) · US-048 (privacy notice).
- **SHOULD (deferrable to Beta without breaking MVP exit — this is the slack):** US-004 (2-of-4 flagships operable now, full four
  in Beta) · US-024 (assessment informs loadout) · US-026 (connect-in-flow) · US-033 (dead-button removal) · US-035 (connect
  states) · US-039 (CodeHawks deep-link — one surface in MVP, ≥ 2 by Beta) · US-042 (D1 durability hardening) · US-051 (delivery anchor).
- **COULD:** none in MVP.
- **WON'T (this phase):** all rails beyond book-a-call, CTF, XMTP, Overmind graph → later phases.

**Milestones:** (1) hero interactive + ≥ 1 live surface before first scroll (SC-2 K2.1); (2) concierge + auditor stream with
tag-strip **and** both degrade to a labelled recorded run on Worker-down (SC-2); (3) Mission Control completes a **book-a-call**
engagement request → persisted to D1 → confirmation, **with no wallet/chain/Worker** (SC-1 K1.4 / BR-11); (4) claims-gate audit
passes — 0 uncleared/forbidden claims rendered (SC-3); (5) LCP ≤ 2.5s on marquee (throttled mobile) + reduced-motion 100% (SC-4).
**Exit criteria:** SC-1 structural (0 dead-ends, CTA ≤ 1 click 100% of routes) · SC-2 (≥ 1 operable pre-scroll, ≥ 95% effective
success incl. fallback, **0 hard-broken states**) · SC-3 green · SC-4 met · privacy notice live · **all Phase-5 gates PASS
(qa/security/audit/perf/compliance)** · **John approves + deploys.**
**Owner:** frontend-engineer + app-ui-engineer + backend-specialist + domain-engine (R by area) · **John (A/deployer)**.
**Dependencies:** **P0 complete** (tokens, backend contract, claims-gate, fallback harness, wallet primitive). **Duration `[ESTIMATE]`:** **XL** (largest phase); wall-clock `[UNKNOWN]`.

## P2 — Beta: full proof-set + checkout rails

**Purpose:** all four flagships operable; the verification-as-signature object; all three checkout rails wired; the live CTF.

**Story map (MoSCoW):**
- **MUST:** US-004 completed (**all four** flagships operable — KTHULHU embed · on-site AI · Overmind · Kointel; note FR-004/K4.1
  amended 3→4 per OD-01) · US-027 (ticket-size routing) · US-028 (escrow — **Simulate → Write → Wait**, USDC 6-dec) · US-029
  (Unlock buy — real-lock-only) · US-030 (checkout states) · US-037 (testnet/mainnet honesty) · US-039 (CodeHawks deep-link from
  ≥ 2 surfaces) · US-041/044 (CTF-verify + leaderboard routes; rate-limit hardened).
- **SHOULD:** US-006 (explorable Overmind graph/pipeline) · US-009 (fuzz harness) · US-010 (tx explainer) · US-016 (concierge
  hire-routing) · US-019 (CTF solve) · US-020 (CTF testnet label) · US-021 (leaderboard) · US-022 (CTF fallback) · US-036 (Unlock
  wrapper robustness) · US-054-class structured data (US-047 GitHub reinforcement may land here).
- **COULD:** —.
- **Note (conditional MUST):** if the CTF ships (SHOULD), FR-023/024/026/027 (state machine · testnet label · fallback ·
  simulate-first) become **MUST for that surface** (BR-09/BR-03/BR-04).

**Milestones:** (1) all four flagships render operably (with fallbacks); (2) escrow path **simulated-first**, written, awaited to
receipt on Base with 6-decimal USDC (web3 simulate gate green); (3) Unlock offered only on a real deployed lock, else degrades to
book-a-call (US-029 edge); (4) CTF full state machine + testnet label + recorded-solve fallback; (5) leaderboard persists ranked
solves in D1.
**Exit criteria:** all three rails wired + degradation verified · four flagships operable · CTF resilient · escrow simulate-first
**proven** by security + web3 gates · claims-gate still green · all Phase-5 gates PASS · **John approves + deploys.**
**Owner:** app-ui-engineer + full-stack-integrator + smart-contract-engineer + web3-blockchain + creative-technologist (R by area) · **John (A/deployer)**.
**Dependencies:** **P1 deployed**; on-chain escrow + CTF vault contracts authored/deployed (smart-contract-engineer) — an internal
long pole; **rail live-activation additionally gated on provisioning (R-02)** but decoupled from launch by the book-a-call floor.
**Duration `[ESTIMATE]`:** **L**; wall-clock `[UNKNOWN]`.

## P3 — GA: hardening + XMTP + provisioning + compliance

**Purpose:** land the risky/late items **last**, so none of them ever gate the thesis slices.

**Story map (MoSCoW):**
- **MUST (owner build-now, off critical path):** US-034 (**XMTP E2E built** via `@xmtp/browser-sdk` → the E2E-channel claim renders
  only alongside the working feature; FR-039/OD-02) · full **regression + security + audit + performance** sweep.
- **SHOULD:** escrow + Unlock **live-activation** when John supplies provisioning (real locks + escrow deploy/fund) · US-049
  (consent, research-gated) · US-050 (checkout terms, research-gated) · privacy-regime finalisation once OD-04 resolves.
- **COULD:** US-014 (voice STT/TTS) · US-046 (content-gap explainer pages) · US-047 (GitHub reinforcement, if not in Beta).
- **WON'T (this build):** the OD-04 jurisdiction ruling + the 6 `[NEEDS RESEARCH]` legal answers are *inputs to* the SHOULD items,
  resolved at the compliance phase — the build does not author law.

**Milestones:** (1) XMTP onboarding (wallet-signature → MLS inbox) works end-to-end behind a flag; (2) provisioning activated **or**
gracefully flagged (no dead-ends either way); (3) compliance-gated surfaces (consent/terms) either shipped or withheld-with-reason;
(4) branded search returns jw3b.dev **rank #1** + CodeHawks #124 deep-linked from ≥ 2 surfaces (SC-5); (5) full regression +
security + audit + perf sweep green across the whole site.
**Exit criteria:** all success criteria (SC-1…SC-5) **met or explicitly deferred-with-reason**; XMTP built **or** its claim removed
(FR-039 honesty preserved); provisioning live **or** flagged; **all gates PASS** · **John approves + deploys GA.**
**Owner:** full-stack-integrator + backend-specialist + compliance-officer + devops-engineer (R by area) · **John (A/deployer)**.
**Dependencies:** **P2 deployed**; XMTP spike (started in P2) retired; provisioning from John (R-02); compliance research (R-09).
**Duration `[ESTIMATE]`:** **M–L** (XMTP is a migration, not a bump — its own risk R-04); wall-clock `[UNKNOWN]`.

---

## Critical path (longest dependency chain sets the real end, not optimism)

```
requirements-consolidation (P2)
   → architecture + sequencing (P3-meta)
      → design tokens + backend tag-protocol contract + D1 schema      [P0]
         → live concierge/audit surfaces + cached-replay fallback       [P1]
            → Mission Control configurator + book-a-call floor + D1 capture   [P1 EXIT ← first deployable slice]
               → on-chain escrow + CTF vault (contract deploy + web3 simulate gate) + Overmind graph   [P2]
                  → XMTP E2E build (browser-sdk / MLS) + provisioning activation + compliance finalise   [P3 GA]
```

**Longest serial pole:** the **on-site-AI live-surface chain** (backend tag-protocol contract → concierge/audit live + fallback →
Mission Control capture) through MVP, then the **on-chain rails** (escrow/CTF contract deploy + simulate gate) through Beta.
**Parallel long pole into GA:** the **XMTP migration** (start the spike in P2 so its unknowns are retired before GA; it never gates
MVP/Beta). **External gate (John-owed):** provisioning activates the rails — **decoupled from launch by the book-a-call floor**, so a
late primitive slips a SHOULD, never the release.

**First shippable vertical slice = the P1 MVP thesis slice** (above). It is the earliest *releasable* increment and is deliberately
sequenced **after** P0 — it cannot be literally first because it consumes P0's tokens, backend contract, fallback harness, and
claims-gate engine. Shipping it first (before the rails, CTF, Overmind graph, and XMTP) validates proof-as-interface + conversion at
the lowest cost and de-risks everything downstream.

## Self-critique (roadmap)

1. **Every story mapped to a phase?** All 51 (US-001…051) appear in P0–P3; none orphaned. ✔
2. **Exit criteria on every phase?** Yes — measurable, tied to SC-1…SC-5 + Phase-5 gates + John's deploy. ✔
3. **60% MUST honored?** Managed by cross-phase MUST distribution + reserved rework buffer; residual tracked as R-10; no safety/
   claims/backend MUST mislabeled. ✔
4. **Fabricated dates?** None — sizes are `[ESTIMATE]` (story/gate basis), wall-clock `[UNKNOWN — needs input]` with the reason stated. ✔
5. **Critical path from dependencies, not optimism?** Yes — traced through the real chain; XMTP + provisioning explicitly kept off
   the MVP path. ✔
