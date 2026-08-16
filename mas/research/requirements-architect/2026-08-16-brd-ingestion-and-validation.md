# Mode-D ingestion + validation worksheet — jw3b.dev v2 (requirements-architect)

**Date:** 2026-08-16 · **Mode:** D (upstream-BRD ingestion, fresh workspace)
**Mode evidence:** `business_analysis/05_master_brd.md` present (validated BRD) · `src/` absent (only `mas/`) · no prior `REQUIREMENTS.md` · no `.agents/` dir → standalone MAS layout, deliverables under `mas/` per task.

## Inputs read end-to-end
BRD `05` + companions `01`(stakeholders/OBJ/KPI) `02`(flows) `03`(60 FR / 8 DE / 12 BR / claims-recon / OD) `04`(51 stories/matrix) · `facts/01_OWNER_DECISIONS` (binding) · `facts/00_FACTS_BRIEF` · `facts/{cv-source,capability-accuracy,PORTFOLIO_REFERENCE}` · charter `01` + roadmap `04` · market `05` (PROCEED). All present — **not blocked**.

## Owner-decision deltas folded (BRD → REQUIREMENTS)
| OD | BRD baseline | Folded result |
|---|---|---|
| OD-01 | "exactly 3" flagships; jw3b-vs-studio open | **4 flagships** (KTHULHU · on-site AI · Overmind · **Kointel**); FR-004 amended; K2.4/K4.1 3→4; FR-060 = separate anchor |
| OD-05 | CR-01…10 gated OUT `[REQUIRES_RESOLUTION]` | **cleared IN**; **new FR-061** (register seeding + evidence pointers + AgileGypsy-Labs/EcoGraph provenance notes); FR-047 reframed |
| OD-03 | book-a-call floor + flagged rails | **all-3 rails built now**, book-a-call = guaranteed primary; escrow/Unlock feature-flagged on provisioning; FR-032/034 sharpened |
| OD-02 | FR-039 Decision (build-or-remove) | **build now** via `@xmtp/browser-sdk`; FR-039 promoted Decision→MUST |
| OD-04 | jurisdiction open | deferred/tracked (compliance phase) |

**FR count:** 60 → **61** (+FR-061). **MoSCoW:** MUST 45→46 (FR-061 new; FR-039 Decision→MUST), SHOULD 9, COULD 3.

## NFR seeds → concrete targets
Carried BRD §8 into REQUIREMENTS §9 as testable targets (LCP ≤2.5s / INP ≤200ms / first-token ≤2s concierge, ≤3s audit / ≥95% effective success / R3F ≥30fps mobile,≥50fps desktop + fallback / WCAG 2.2 AA / reduced-motion 100% / rank #1 / cost bounded / brand-distinct). None left as a bare seed.

## Validation gate — PASS
identity ✔ · vision measurable (6 testable outcomes) ✔ · ≥1 business goal (6 OBJ+KPI) ✔ · stack resolved (ACTIVE_STACK, fixed given; arch-design deferred to Phase 3) ✔ · compliance explicitly answered (clear duties ship; 6 items deferred-tracked) ✔ · no contradictions (OD deltas reconciled; one primary persona; one primary terminal action) ✔ · no `[FILL_IN]` ✔ · owner decisions folded ✔.

## Scoring (0–4; PASS ≥3.0)
- **WHO 3.9** — primary persona sourced (4), full register (4), priority resolved (4), success thresholds `[ASSUMPTION-baseline]` (3.5).
- **WHAT 4.0** — scope bounded (4), 61 FRs testable+traced (4), 8 DE+12 BR (4), north-star operationalized (4).
- **HOW 3.5** — stack fixed (4), method concrete (4), arch-design deferred to P3 (3), provisioning pending/mitigated (3).
- **WHY 3.9** — gap validated PROCEED (4), objectives measurable (4), buyer-fear answered (4), search-demand MEDIUM (3.5).

## Genuinely-open (surfaced, not invented)
`[REQUIRES_HUMAN_INPUT]`: CR-10 Neo4j-Certified reconciliation (OD-05 clearance vs "no artifact yet"); budget + wall-clock timeline (absent upstream, non-blocking).
`[NEEDS RESEARCH]` (deferred-tracked, compliance phase): EU AI Act Art.50 scope · D1 cookie-consent · wallet-address-as-PII · consumer-protection on on-chain checkout · DSAR/erasure mechanism · USDC VAT/invoicing · OD-04 jurisdiction.
**Provisioning owed by John (tracked):** real Unlock locks · escrow deploy/fund · book-a-call scheduler endpoint · KTHULHU embed.

## Deliverables written
`mas/REQUIREMENTS.md` (v1.0.0) · `mas/context/ACTIVE_STACK.md` · `mas/context/ACTIVE_AGENTS.md` · `mas/context/WORKSPACE_CONTEXT.md`.
**Status: complete.**
