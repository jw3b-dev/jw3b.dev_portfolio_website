# WORKSPACE_CONTEXT.md — jw3b.dev v2 (operating rules for every role)

**Owner:** requirements-architect (Phase 2) · **Date:** 2026-08-16 · **Status:** ACTIVE
Read this alongside `REQUIREMENTS.md`, `ACTIVE_STACK.md`, `ACTIVE_AGENTS.md`, and `facts/01_OWNER_DECISIONS.md` before doing any work.

---

## 1. Worktree & branch
- **Workspace root:** `/home/agilegypsy/code/projects/jw3b.dev-v2`
- **Branch:** `v2` — a **linked git worktree** of the main repo (`gitdir → /home/agilegypsy/code/projects/jw3b.dev_website/.git/worktrees/jw3b.dev-v2`).
- **Tree state:** genuinely empty but for `mas/` — this is a **true ground-up build**, not an edit of the old site. `src/` does not exist yet.
- The old v1 site lives in the sibling checkout (`jw3b.dev_website`); it is **reference-dead** (see §3).

## 2. Do NOT deploy or push (hard rule)
- **John owns all deploys.** Build **on branch `v2` only**. Do **not** push, open PRs, or deploy. <!-- FACTS: 00_FACTS_BRIEF §3; charter §7 -->
- Bus-factor = 1 (John is the sole approver + deployer at every gate) — registered RED risk R-03; his acknowledgment of the R-01/R-03 mitigations precedes Phase-5 build.
- Secrets never leave the Worker (`wrangler secret put`); `.env` = public values only; never commit secrets to `wrangler.toml`.

## 3. Scrapped-vs-facts rule (what survives from v1)
- **Reuse NOTHING** from the prior site: all components, the IA, the layout, the visual design, and **every prior design doc** are **SCRAPPED** (`design-story.md` "THE ORCHESTRATION", the old `REQUIREMENTS.md`, `tokens.md`, `rebuild-audit.md`, `v2-redesign-brief.md`). They read as a generic portfolio and were rejected. <!-- FACTS: 00_FACTS_BRIEF §6 -->
- **Only *facts* survive**, and they live in `mas/facts/`: `cv-source.md` (identity/claims source of truth), `capability-accuracy.md` (real AI language — "Overmind" is real, "the Swarm" does not exist), `PORTFOLIO_REFERENCE.md` (the evidence register / arbiter), `existing-features-inventory.md` (carry the **feature behavior**, ignore its dead old-FR numbers), `agilegypsy-reference.md`.
- Build against **these facts + the Phase-0 market validation**, not against any memory of the old site.

## 4. Claims discipline ("proof, not promises")
- Every number/credential shown as fact must trace to the **seeded evidence register** (the `PORTFOLIO_REFERENCE.md` successor) or be dropped. The **claims-gate** (BR-01/FR-043/046/047) enforces this as a functional content gate. <!-- SOURCE: REQUIREMENTS §11 -->
- **Always-citable audit record:** **CodeHawks #124 · 17 findings (8 High / 5 Med / 4 Low) · 1,430 EXP** → deep-link `profiles.cyfrin.io/u/agilegypsy` from ≥ 2 surfaces.
- **The 10 CV stats are CLEARED IN (OD-05)** but each needs an evidence pointer; studio-origin figures (+18pts · 9,828 entities · 77k chunks · memory-miss >2× · EcoGraph numbers) carry an **"AgileGypsy Labs / EcoGraph" provenance note**. **Seed the register before any surface renders a claim** (FR-061).
- **Forbidden (unchanged):** aggregate TVL · $/bounties secured · "protocols secured" · "50+ audits" · "PMP certified" · "PRINCE2 Practitioner" · Neo4j-Certified-until-artifact. **Never publish PII** (SA ID/DOB/OU Personal Identifier/UK home address/Student-Finance ref/personal mobile/`bets` repo/DecentX by name).
- **CR-10 Neo4j-Certified** is `[REQUIRES_HUMAN_INPUT]` — reconcile OD-05 clearance vs the register's "no artifact yet"; gated until resolved.

## 5. The 4-hat IA rule
- Identity = **four hats, shown together**: **Engineer** · **Auditor** · **PM** · **Founder**. Filters may **DIM**, never fully hide (BR-07). Identity surfaces show all four at once. <!-- SOURCE: 00_FACTS_BRIEF §1; BR-07 -->
- The **four flagships** cover Engineer/Auditor/Founder + AI: **KTHULHU · the live on-site AI (concierge + `/audit` + CTF as ONE self-demonstrating system) · Overmind · Kointel** (OD-01). PM is carried by the **delivery-credibility anchor** (20+ plants / 7 countries / AgilePM®, FR-060) — a separate anchor, not a flagship slot.

## 6. Live-fallback discipline (existential — HARD)
- **Every "live" surface needs a cached/replay fallback** labelled "recorded run" so live degrades to *verifiably real*, never *broken* (BR-03, NFR-02). A live surface that fails on load **disproves the whole thesis** (RED risk R-01). This is why "live-surface effective success ≥ 95%" counts fallbacks.

## 7. Six must-exist features (functional floor)
AI security console (`/audit`) · AI concierge chat · live on-chain CTF (Base Sepolia) · **Mission Control** hire flow that **actually converts** (all-3 rails: book-a-call floor · escrow · Unlock) · wallet connect (custom RainbowKit button) · Unlock paywall. <!-- SOURCE: 00_FACTS_BRIEF §2 -->

## 8. Source-of-truth order (when docs disagree)
`OWNER_DECISIONS` (binding) **>** `BRD` (`business_analysis/01–05`) **>** `facts/` register **>** inference. The BA docs were written **before** the owner rulings — where they differ, OWNER_DECISIONS wins (folded in `REQUIREMENTS.md §12`).

## 9. Release sequencing pointer (do not re-plan)
Phased delivery is defined in **`mas/project_management/04_release_roadmap.md`**:
- **P0 — Foundations & Contracts:** scaffold + provider tree · token layer · backend tag-protocol contract + D1 schema · **claims-gate engine + evidence-register seeded** · wallet primitive · cached/replay fallback harness.
- **P1 — MVP (the operable thesis) ★:** operable hero → hire spine → Mission Control configurator → **book-a-call floor → D1 capture** → claims gate green → failures surface → every live surface backed by fallback. First deployable slice.
- **P2 — Beta:** all **four flagships** operable · all 3 checkout rails wired (escrow simulate-first, Unlock real-lock-only) · CTF · Overmind graph.
- **P3 — GA:** **XMTP** (`@xmtp/browser-sdk`) · escrow/Unlock **live-activation on provisioning** · consent/terms (research-gated) · COULD items · full regression.
Each phase exits only on **all Phase-5 gates PASS (qa/security/audit/perf/compliance) + John approves + deploys.**

## 10. Tracked-open (non-blocking) — owed by John / deferred to compliance
Provisioning (real Unlock lock addresses → replace `0x…` in `contracts.js`/`retainer.json`; escrow deploy+fund; book-a-call scheduler endpoint; KTHULHU embed) · OD-04 jurisdiction (UK vs SA) · the 6 `[NEEDS RESEARCH]` compliance items · budget & wall-clock timeline (`[REQUIRES_HUMAN_INPUT]`). None gates the thesis slice — the **book-a-call floor** decouples launch from every fragile primitive.
