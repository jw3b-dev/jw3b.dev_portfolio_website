# 01 — Requirements & NFR Baseline — jw3b.dev v2 (MAS Phase 3, Solution Architecture)

**Role:** solutions-architect · **Date:** 2026-08-16 · **Status:** BASELINED (NFRs pre-resolved + human-approved upstream)
**Source-of-truth order:** `mas/REQUIREMENTS.md` > `mas/facts/01_OWNER_DECISIONS.md` > general knowledge.
**Inputs read:** `REQUIREMENTS.md` (61 FRs / 46 MUST, §9 NFRs, §7 DE-01…08, §8 BR-01…12), `ACTIVE_STACK.md`,
`01_OWNER_DECISIONS.md`, `05_master_brd.md`, `04_release_roadmap.md`, `facts/existing-features-inventory.md`,
`facts/00_FACTS_BRIEF.md`, and the **live Worker source** (`workers/portfolio-agent/src/index.js`, `schema.sql`,
`config/worker.js`) as the factual behavioral reference for the rebuild.

> **Template override applied (per launch brief).** The generic skill says *STOP and present the NFR
> table for confirmation*. The NFR targets are **already resolved and human-approved** in
> `REQUIREMENTS.md §9` (validation gate PASSED, §16). Per the override this document **restates them
> as the measurable NFR baseline and proceeds** — it does not block. Where a target is a launch guess it
> is tagged `[ASSUMPTION]`.

---

## 1. The one constraint that governs every decision

Every technology mechanism in docs 02–05 is justified against a numbered NFR below. The dominant,
**existential** constraint is **NFR-02 (Resilience)**: *the north star "a portfolio you OPERATE, not
read" dies the instant a live surface fails on load.* Risk **R-01** (live-reliability is existential) is
RED. Therefore the architecture's spine is the **3-tier replay/fallback model** (doc 02 §7): every live
surface degrades to a **labelled recorded run** — *verifiably real, never broken*. This is not a feature;
it is the load-bearing wall.

---

## 2. Measurable NFR baseline (restated from `REQUIREMENTS.md §9`)

P50/P95 are added where a percentile is meaningful; the single-number targets are the human-approved
ceilings. Field metrics (LCP/INP) follow the Web-Vitals **P75** convention.

| NFR | Metric | Target (measurable) | Percentile / basis | Verifies |
|---|---|---|---|---|
| **NFR-01a** | LCP, marquee route `/` | **≤ 2.5 s** | P75, mid-tier mobile, throttled (Lighthouse "Slow 4G / 4× CPU") | OBJ-06 |
| **NFR-01b** | INP | **≤ 200 ms** | P75 | OBJ-06 |
| **NFR-01c** | Concierge first token | P50 ≤ 1.2 s · **P95 ≤ 2 s** | SSE, warm Worker | OBJ-02 |
| **NFR-01d** | `/audit` stream first token | P50 ≤ 1.5 s · **P95 ≤ 3 s** | SSE; heuristic pass emits < 300 ms locally | OBJ-02 |
| **NFR-02a** | Live-surface **effective success** (live **+** fallback counts as success) | **≥ 95 %** | per surface (concierge, audit, CTF, KTHULHU embed) | OBJ-02 |
| **NFR-02b** | Hard-broken states | **0** | every live surface has a Tier-1 **and** Tier-2 replay (BR-03) | OBJ-02, R-01 |
| **NFR-02c** | Book-a-call floor completion | **100 %** with no wallet / no chain / no live Worker | BR-11 (client-queued capture) | OBJ-01 |
| **NFR-03** | R3F frame rate (only if used) | **≥ 30 fps mobile / ≥ 50 fps desktop**, non-3D fallback present | budgeted; never decorative-only hero | OBJ-06 |
| **NFR-04** | Security controls | secrets Worker-only · simulate-before-write · all AI inputs validated · AI endpoints rate-limited · **0** secrets in client bundle · CSP on embedded surfaces | binary pass/fail (doc 04) | OBJ-05 |
| **NFR-05** | Accessibility | **WCAG 2.2 AA**; `prefers-reduced-motion` honored **100 %**; proof surfaces keyboard-navigable; AA contrast on dark theme | axe/manual gate | OBJ-06 |
| **NFR-06** | SEO / trust | branded search **#1**; valid **Person** structured data; correct OG unfurls | Rich-Results + SERP check | OBJ-03 |
| **NFR-07** | Privacy / compliance | AI disclosure · testnet honesty · audit disclaimer · privacy notice **present**; consent + checkout terms per §13 research outcomes | mapping table (doc 04 §7) | OBJ-05 |
| **NFR-08** | AI cost bound | per-session token cap **and** per-IP rate limit **and** AI-Gateway ceiling on every AI endpoint; **no** path to unbounded spend | mechanism-verified (doc 03 §7); exact $ `[NEEDS RESEARCH]` | OBJ-06 |
| **NFR-09** | Brand distinctness | shares deep-space-glass/HUD DNA with agilegypsy.com but a **distinct** accent + dimensionality (token layer, brand-architect P0) | design-QA | S5 |

**Availability & DR (derived, not in the source table — flagged `[ASSUMPTION]` targets for launch):**

| Concern | Target | Basis |
|---|---|---|
| Static SPA availability | **≥ 99.9 %** `[ASSUMPTION]` | Cloudflare edge static-asset hosting; SPA is CDN-cacheable |
| Worker (AI/API) availability | best-effort; **degradation, not raw SLA**, is the contract | resilience via NFR-02 tiers, not a 5-nines Worker |
| D1 RPO / RTO | RPO ≤ Time-Travel granularity · RTO ≤ minutes | Cloudflare **D1 Time Travel** point-in-time restore (documented feature; exact retention window `[VERIFY]`) |
| Replay-artifact durability | versioned in repo (Tier-2) **and** KV/R2 (Tier-1) | survives a total Worker/D1 loss (doc 02 §7) |

---

## 3. Functional-requirement → architecture-surface map

Every MUST maps to a container/route/route-contract that docs 02–04 specify concretely. (Full FR text in
`REQUIREMENTS.md §5`; this is the traceability the build agents follow.)

| FR cluster | Owning architecture element (doc ref) |
|---|---|
| FR-001/003/005/060 operable hero · four-hat identity · delivery anchor | SPA route `/`; prerendered hero shell (03 §6); four-hat token/IA layer |
| FR-002 persistent ≤1-click hire spine | global layout element (persistent CTA outside `<Suspense>`), 02 §4 |
| FR-004 four flagships operable | `/` sections + KTHULHU sandboxed-iframe embed (CSP ADR-08); on-site-AI = `/audit`+concierge+`/ctf`; Overmind explorable graph; Kointel external verified link |
| FR-006 explorable graph/pipeline | client-only steppable object (R3F optional & budgeted, NFR-03) |
| FR-008–014 `/audit` console (auditor/fuzz/tx, stream, tag-strip, validate, disclaimer, replay) | Worker routes `/audit` `/fuzz` `/tx-explain` (03 §5); heuristic-first pass; Tier-1/2 replay |
| FR-015–021 concierge (SSE, STT/TTS, tag-sync, grounded, hire-route, degrade, disclosure) | Worker route `POST /` + `/speech-to-text` `/text-to-speech`; curated evidence-grounded KB (ADR-06) |
| FR-022–027 CTF | Worker `/ctf/verify` `/ctf/leaderboard`; ReentrantVault (deployed) + client Attacker; simulate-first |
| FR-028–039 Mission Control | `/hire-me` route + checkout state machine (02 §6); 3 rails; escrow contract; XMTP (P3) |
| FR-040–042 wallet/payment primitives | wagmi2/viem2/RainbowKit providers; Unlock script+iframe; chain config Base/Base-Sepolia |
| FR-043–047, FR-061 claims gate + register seeding | **build-time claims-gate** over a repo evidence register (ADR-09) + runtime `<Claim>`; ClaimRecord DE-07 |
| FR-048–052 backend | Worker route contracts + D1 schema + secrets + rate-limit + server-owned tag protocol (03 §3–§5) |
| FR-053–056 SEO | Helmet head manager; Person JSON-LD; studio cross-link |
| FR-057–059 compliance surfaces | `/privacy`; consent + checkout-terms behind research flag (doc 04 §7) |

---

## 4. Constraints extracted as architecture inputs (not re-decided here)

- **Platform stack is FIXED** (`ACTIVE_STACK.md`): React 19 · Vite · Tailwind 3 · Framer Motion · wagmi 2
  (**never v3**) · viem 2 · RainbowKit 2 · R3F optional; Cloudflare Worker + Workers AI + D1 + Anthropic
  **via AI Gateway**; XMTP via **`@xmtp/browser-sdk`**; Foundry for contracts. Doc 03 applies the ≥2-option
  ADR discipline **only** to the OPEN choices *within* this platform, never to the platform itself.
- **Hard prohibitions:** wagmi 3.x · `@xmtp/xmtp-js` · any secret in the client/`.env`-public/`wrangler.toml`
  · any `writeContract` without a preceding successful `useSimulateContract` · **deploy/push** (John owns
  all deploys; build on branch `v2`).
- **Business rules that are architecture invariants:** BR-03 (live-fallback), BR-04 (simulate-first),
  BR-06 (USDC 6-dec BigInt), BR-11 (book-a-call floor always completes), BR-01/02 (claims gate + forbidden
  list), BR-12 (price provenance = `retainer.json`).
- **Provisioning may be absent at build start** (A2, R-02/R-03): escrow deploy/fund, real Unlock lock
  addresses, book-a-call scheduler endpoint, KTHULHU embed access. Architecture must **feature-flag** each
  and degrade to the book-a-call floor — nothing gates conversion on a missing primitive.

---

## 5. Phasing the architecture must support (from `04_release_roadmap.md`)

The design is **phase-aware** so each release slice is independently shippable:

- **P0 Foundations:** provider tree · token layer · **server-side tag-protocol + Worker route shapes + D1
  schema** · **claims-gate engine + seeded evidence register** · wallet-connect primitive · **cached/replay
  fallback harness** (the BR-03 primitive). *Everything downstream consumes these.*
- **P1 MVP (the operable-thesis vertical slice):** operable hero → hire spine → Mission Control configurator
  → **book-a-call floor → D1 capture** → claims gate green → failures surface → **every live surface backed
  by its replay**. Concierge + Solidity auditor live, both degrading to a labelled recorded run.
- **P2 Beta:** all four flagships operable · **all three rails** (escrow simulate→write→wait, Unlock
  real-lock-only) · CTF · Overmind graph · CodeHawks deep-link ≥2 surfaces.
- **P3 GA:** **XMTP** (`@xmtp/browser-sdk`, MLS) off the critical path · rail live-activation on provisioning
  · consent/terms once research resolves · full regression.

**Architectural consequence:** the replay/fallback harness, claims-gate, tag-protocol contract, and D1
schema are **P0 primitives** — they are designed first and completely in docs 02–04 so P1 can consume them.

---

## 6. Open items carried into the design (tracked, non-blocking)

| Item | Type | Disposition in this architecture |
|---|---|---|
| Exact AI $/request & monthly cost | `[NEEDS RESEARCH]` | Cost **mechanism** fully specified (NFR-08); dollar figures not fabricated (doc 03 §7) |
| 6 compliance questions (EU AI Act Art.50 wording, cookie-consent, wallet-as-PII, consumer/refund, DSAR/erasure, VAT/USDC) | `[NEEDS RESEARCH]` | Clear duties implemented now; the 6 flagged in the compliance mapping (doc 04 §7); consent/terms behind a flag |
| OD-04 jurisdiction (UK vs SA) | `[REQUIRES_HUMAN_INPUT]` | Non-blocking; selects which privacy regime *leads* the same privacy-notice surface |
| CR-10 Neo4j-Certified (OD-05 "clears with credential URL" vs `REQUIREMENTS.md §11` "gated until reconciled") | `[REQUIRES_HUMAN_INPUT]` | Claims-gate is ruling-agnostic: CR-10 flips to `cleared` the moment its **credential-URL evidence pointer** is attached at P0 seeding (per OD-05 + brief). Absent the URL, the gate withholds it (safer default). **No failure mode either way.** |
| Budget / wall-clock timeline | `[REQUIRES_HUMAN_INPUT]` | Genuinely absent upstream; effort sized ordinally in the roadmap; non-blocking to design |

---

*End 01 — NFR baseline set. Proceed to 02 (system context, data flows, replay architecture).*
