# 05 — Master Business Requirements Document — jw3b.dev v2

**Role:** business-analyst (MAS Phase 1) · **Date:** 2026-08-16 · **Status:** **DRAFT** (human approval precedes handoff to PM / Requirements Architect / Architect)
**Companion docs:** `01_stakeholders.md` · `02_process_flows.md` · `03_requirements.md` · `04_user_stories.md`
**Binding upstream:** `mas/facts/00_FACTS_BRIEF.md`, `mas/market_validation/01–05`, and the `mas/facts/` register.

---

## 1. Executive summary

jw3b.dev v2 is a **total, ground-up rebuild** (frontend **and** Cloudflare Worker backend) of John
Wellard's portfolio + Web3 service platform, positioning him as a **Senior Agentic AI Developer &
smart-contract auditor**. Phase-0 validation returned **PROCEED**: the market gap — *operable,
verifiable, honest proof of production-grade systems* — is real, and John sits squarely in it with
live systems, a public audit record (**CodeHawks #124 · 17 findings / 8 High · 1,430 EXP**), and a
"proof, not promises" voice that publishes failures.

The north star is **"a portfolio you OPERATE, not one you read."** The site *is* the systems: an AI
security console, a global AI concierge, a live on-chain CTF, and a **Mission Control** hire flow —
each an operable proof surface, not a marketing section. The primary buyer is the **Building
Founder/CTO** whose #1 fear is *"works in demos, fails in production"*; the design answers it by
letting that buyer poke a running system in the first interaction.

Two problems dominate the rebuild. **(1) Conversion:** today's `/hire-me` is a polished 4-step
configurator that **dead-ends** — every terminal CTA is a disabled Unlock placeholder or a no-op
button, and the real escrow hook is orphaned. This BRD specifies Mission Control to **actually
convert** via a ticket-size-routed terminal step (**book-a-call floor · on-chain escrow · Unlock**),
with a guaranteed book-a-call path that completes even when every fragile primitive is unavailable.
**(2) Claims discipline:** several headline metrics (GraphRAG +18pts, 9,828 entities, 192K corpus,
1,345 tests) are the *studio's* register, not jw3b's — this BRD makes claims discipline a **functional
content gate** and delivers an explicit **claims-reconciliation list** (§9) for John to rule on before
any such number ships.

Scope: **60 FRs** (45 MUST / 9 SHOULD / 3 COULD), **8 data entities**, **12 business rules**,
**51 user stories / ~108 acceptance criteria**, all traced objective→FR→story. Every "live" surface
carries a **cached/replay fallback** so *live* degrades to *verifiably real*, never *broken* — the
one non-negotiable execution constraint.

---

## 2. Objectives & KPIs (from `01`)

| OBJ | Objective | Headline KPI(s) | Persona |
|---|---|---|---|
| OBJ-01 | Convert attention into booked engagements | Mission Control completion ≥ 25% `[baseline]`; ≥ 3 qualified requests/mo by day 90; hire CTA ≤ 1 click from 100% of routes; **0** dead-ends | S1/S2 |
| OBJ-02 | Prove production reliability in first interaction | ≥ 1 operable proof surface before first scroll; live-surface effective success ≥ 95% (incl. fallback); **0** hard-broken states; exactly 3 operable systems | S2 |
| OBJ-03 | Make the record verifiable in one click | CodeHawks #124 deep-linked from ≥ 2 surfaces; 100% record numbers match register; ≤ 1 click to proof; branded search rank #1 | S3 |
| OBJ-04 | Satisfy senior screens with depth + honesty | exactly 3 systems; ≥ 1 failures surface; 0 avoid-list sections; 4 hats always visible | S4 |
| OBJ-05 | Ship every claim as verifiable proof | 100% claims traceable; 0 `[REQUIRES_RESOLUTION]` stats live; 0 forbidden claims; 0 zero-counters | S1/S6 |
| OBJ-06 | Premium-technical, fast, accessible, operable | LCP ≤ 2.5s marquee; mobile fallback on every proof surface; reduced-motion 100%; 0 decorative-only 3D/glass heroes | all |

Full KPI definitions and `[ASSUMPTION — baseline]` notes are in `01 §2`.

---

## 3. Process analysis (from `02`)

- **Whole-site journey (Flow A):** As-Is buries proof behind a headshot hero, zero-value counters,
  and proficiency bars, then dead-ends at `/hire-me`. To-Be opens on an operable proof surface,
  shows exactly three deep systems, deep-links the verifiable record, foregrounds a failures surface,
  and keeps a persistent hire spine.
- **Mission Control (Flow B — centerpiece):** As-Is has ≥ 7 structural defects (decorative
  assessment, label drift, hardcoded prices, no wallet prompt, placeholder Unlock locks, dead
  ENQUIRE, orphaned escrow) and **0% completable** conversion. To-Be makes the assessment inform the
  loadout, prompts the wallet in-flow, and **routes the terminal action by ticket size** with a
  **book-a-call floor** that always completes and captures the lead server-side.

Quantified gap table (defects removed, states supplied, conversion delta) is in `02 §3`.

---

## 4. Prioritised functional requirements (from `03`)

Full 60-FR table with per-FR OBJ links, MoSCoW, build-basis (New/Carry/Repair/Decision), and status
is in `03 §1`. Summary by priority:

- **MUST (45)** — the operable proof-first IA (FR-001–005, 007, 060), the working AI security console
  (FR-008, 011–014), the resilient concierge (FR-015, 017, 018, 020, 021), the CTF state machine +
  testnet honesty + fallback (FR-023, 024, 026, 027), **all of Mission Control** (FR-028–038) plus the
  XMTP-honesty decision (FR-039), wallet/payment primitives (FR-040–042), the **claims-discipline
  gate** (FR-043, 044, 045, 046, 047), the backend (FR-048–052), branded SEO (FR-053), and the
  privacy notice (FR-057).
- **SHOULD (9)** — FR-006 (explorable graph/pipeline), FR-009/010 (fuzz/tx tools), FR-019 (concierge
  routing), FR-022/025 (CTF challenge + leaderboard), FR-054 (structured data/cross-link), FR-058/059
  (consent, checkout terms — gated on `[NEEDS RESEARCH]`).
- **COULD (3)** — FR-016 (voice), FR-055 (content-gap pages), FR-056 (GitHub reinforcement).

---

## 5. Data model (from `03 §2`)

Eight entities: **EngagementRequest** (DE-01) · **ServicePackage/Tier** (DE-02) · **EscrowAgreement**
(DE-03) · **CtfSolve/LeaderboardEntry** (DE-04) · **ConciergeSession/Message** (DE-05) · **AuditRun**
(DE-06) · **ClaimRecord** (DE-07, the evidence-register model behind claims discipline) ·
**Credential** (DE-08). Attributes, types, and validation rules are in `03 §2`. Note DE-03 mandates
6-decimal USDC BigInt + simulate-before-write; DE-07 is what makes claims discipline data-governed
rather than manual.

---

## 6. Business rules (from `03 §3`)

Twelve rules as condition → action → exception. The load-bearing ones: **BR-01** (claims gate — only
`cleared` claims render), **BR-03** (live-fallback — down ⇒ labelled recorded run ⇒ book-a-call, never
broken), **BR-04** (simulate-first), **BR-05** (ticket-size routing), **BR-06** (USDC precision),
**BR-07** (four hats never fully hidden), **BR-08/09/10** (AI disclosure / testnet honesty / audit
disclaimer), **BR-11** (book-a-call floor always completes), **BR-12** (price provenance). Full text in
`03 §3`.

---

## 7. Story backlog (from `04`)

51 stories across 10 epics (A–J), each `As a [persona] I want [action] so that [outcome]` with ≥ 2
BDD acceptance criteria (happy + error/edge). Epic E (Mission Control) is the largest at 12 stories,
reflecting the centerpiece rigor. Full backlog + per-story ACs in `04`.

---

## 8. Non-functional requirement seeds (for the Architect — targets, NOT stacks)

These state *what must be true*, not *how*. The Architect (Phase 3) chooses mechanisms within the
fixed stack floor (React 19 · Vite · Tailwind 3 · Framer Motion · wagmi 2 · viem 2 · Worker + D1 +
Anthropic via AI Gateway).

| NFR | Target |
|---|---|
| NFR-01 Performance | LCP ≤ 2.5s on the marquee route (mid-tier mobile, throttled); INP ≤ 200ms; concierge first-token ≤ 2s; audit stream first-token ≤ 3s. |
| NFR-02 Resilience | Live-surface effective success ≥ 95% including fallback; **every** live surface has a cached/replay artifact (BR-03); 0 hard-broken states. |
| NFR-03 3D budget | If R3F is used, it is budgeted (≥ 30fps mobile / ≥ 50fps desktop) with a non-3D fallback; never a decorative-only hero. |
| NFR-04 Security | All secrets server-side (Worker); simulate-first on writes; input validation on all AI inputs; AI endpoints rate-limited; no secret in client bundle; CSP appropriate to embedded live surfaces. |
| NFR-05 Accessibility | WCAG 2.2 AA target; `prefers-reduced-motion` honored 100%; keyboard-navigable proof surfaces; AA contrast on the dark theme. |
| NFR-06 SEO/Trust | Branded search rank #1; valid Person structured data; correct OG unfurls. |
| NFR-07 Privacy/Compliance | AI disclosure, testnet honesty, audit disclaimer, privacy notice present; consent + checkout terms per the `[NEEDS RESEARCH]` outcomes (§10). |
| NFR-08 Cost | AI-endpoint cost bounded per session (rate limits + right-sized models); a live public AI cannot be weaponized into runaway spend. |
| NFR-09 Brand distinctness | jw3b.dev shares the deep-space-glass + HUD DNA with agilegypsy.com but uses a **distinct** accent identity + dimensionality so the person-brand never blurs into the studio (constraint C7; `agilegypsy-reference §6`). |

---

## 9. Claims reconciliation & open decisions (carried to the owner)

**Claims-reconciliation list (`03 §4`) — `[REQUIRES_RESOLUTION]`:** CR-01 GraphRAG +18pts · CR-02
9,828 entities · CR-03 77k chunks · CR-04 192K corpus · CR-05 1,345 tests/100%/2,468 lines · CR-06
13-phase/51 modules · CR-07 112+ PRs · CR-08 "paying users" · CR-09 memory-miss >2× · CR-10 Neo4j
Certified Professional. **Each is gated OUT of public surfaces (BR-01/FR-047) until John rules.** The
cleared-to-ship set (CodeHawks #124 record, 20+ plants/7 countries, AgilePM + Cyfrin/Chainlink/Dapp
certs, product existence) is listed alongside for contrast.

**Open owner decisions (`03 §5`) — `[REQUIRES JOHN]`:** OD-01 DevGuild/EcoGraph/Overmind on jw3b or
studio-only (blocks the "3 flagship systems" pick) · OD-02 XMTP build-or-remove · OD-03 Mission
Control payment posture + whether real Unlock locks / escrow deployment are coming · OD-04
jurisdiction/location line (UK vs Gauteng) · OD-05 the CR-01…10 rulings.

---

## 10. Assumptions & Risks (includes unresolved red-team items)

| # | Item | Type | Disposition |
|---|---|---|---|
| R-01 | **Live-reliability is existential** — a live surface that fails on load disproves the thesis. | Risk (HARD) | Mitigated by BR-03 + NFR-02 (cached/replay on every live surface); this is why "live-surface success" counts fallbacks. |
| R-02 | No old-site analytics → conversion KPIs are targets, not forecasts. | Assumption | Flagged `[ASSUMPTION — baseline]` on K1.1/K1.2; calibrate in first 90 days. |
| R-03 | Provisioning (real Unlock locks, escrow deployment, scheduler endpoint, KTHULHU embed) may be absent at build start. | Risk | Mitigated by BR-11 book-a-call floor + FR-034 fallback; nothing gates conversion on a missing primitive. |
| R-04 | Studio metrics could leak onto jw3b.dev. | Risk | Mitigated by the CR list + BR-01 gate + NFR-09 distinctness. |
| R-05 | Heavy live surfaces threaten LCP ≤ 2.5s. | Risk | Feasible only with lazy-loaded proof surfaces + budgeted R3F + fallbacks (NFR-01/03); Architect to sequence. |
| R-06 | Escrow-on-acceptance is sales-assisted, not instant e-commerce, for high-ticket deals. | Assumption | Intentional (BR-05); book-a-call floor covers the gap. |
| R-07 | XMTP "E2E channel" currently advertised but unbuilt. | Risk | FR-039 forces build-or-remove (OD-02). |
| R-08 | `[NEEDS RESEARCH]` compliance questions unresolved (see §Red-team #5). | Risk | Handed to research/compliance; clear surfaces (AI disclosure, testnet, privacy notice) ship regardless. |

---

## 11. Out of scope (explicit)

Studio (agilegypsy.com) redesign · importing studio-register metrics unless cleared (§9) · a full
production XMTP rebuild (only the honesty decision is in scope) · instant self-serve crypto checkout
for high-ticket engagements · mainnet CTF · new keyword/volume research. (Full list + rationale in
`01 §3.2`.)

---

## 12. Mandatory red-team critique (all 5 challenges)

**1 · Which requirements are technically infeasible at stated scope?**
None are infeasible *as scoped*, but two are feasible **only** because of an accompanying mitigation,
and one was scoped out for exactly this reason: (a) **LCP ≤ 2.5s with embedded live systems** (NFR-01)
is achievable only via lazy-loaded proof surfaces + budgeted/optional R3F + fallbacks (NFR-03) —
flagged to the Architect as a sequencing constraint, not a free target. (b) **Live-surface success
≥ 95%** (NFR-02) is infeasible without BR-03's cached/replay fallback counting toward the metric — the
rule is what makes the number reachable. (c) A **full XMTP E2E rebuild** would be infeasible in a
normal build window, which is why FR-039 makes it a *decision* (build-or-remove), not a build task.
**Resolved** — no un-mitigated infeasible MUST remains.

**2 · Which business rules conflict with each other?**
No hard conflicts. Two apparent tensions, reconciled: **BR-05** (route high-ticket to
escrow/book-a-call, low-ticket may use Unlock) vs **BR-11** (book-a-call always completes) — no
conflict; book-a-call is the floor beneath every route, not an alternative to it. **BR-01** (only
`cleared` claims render) vs the marketing pull of impressive metrics (CR-01…10) — resolved in favor of
BR-01: the gate wins until John rules (OD-05). One consistency guard added to the record: **BR-03**'s
cached replay MUST be *labelled a recorded run* so it never conflicts with the radical-honesty
principle by masquerading as live. **Resolved.**

**3 · Which stories have no measurable outcome in their "so that"?**
All 51 "so that" clauses name an outcome, verified against ACs. The softest is **US-036** ("so that
self-serve checkout is safe and correct") — "safe and correct" is a quality outcome; it is backed by
measurable ACs (correct lock+metadata; degrade to book-a-call on script failure), so no rewrite is
required. Enabler stories (Epic H) phrase outcomes as owner/buyer value ("interactions actually run",
"no lead is lost") and each is AC-testable. **No `[NOT TESTABLE]` story remains.**

**4 · Which stakeholder need is documented but addressed by no FR?**
Found one gap and closed it: the register calls the **20+ plants / 7 countries / AgilePM** delivery
record "the site's strongest material" (`PORTFOLIO_REFERENCE §2`) and persona S4 lists it as a
required seniority marker, yet the initial 59 FRs only carried it implicitly inside the four-hat PM
surface (FR-003). **Added FR-060** (surface the delivery-credibility record as a seniority anchor) +
**US-051**, traced to OBJ-04. S5 (studio-distinctness) is addressed via the CR gate (BR-01) + NFR-09 +
FR-054 rather than a functional FR — its *visual* dimension is a design-phase constraint (C7), recorded
as such. **Resolved.**

**5 · What compliance or regulatory obligation is not captured?**
The clear duties are captured (AI disclosure FR-021/014, testnet honesty FR-024/042, privacy notice
FR-057, consent FR-058, checkout terms FR-059). Open questions are flagged, not invented:
- `[NEEDS RESEARCH: Does EU AI Act Art. 50 transparency apply to the concierge/audit console, and what disclosure wording satisfies it?]`
- `[NEEDS RESEARCH: Do D1 analytics require GDPR/ePrivacy or POPIA cookie-consent?]`
- `[NEEDS RESEARCH: Is a connected wallet address + engagement request "personal data" requiring a specific lawful basis/notice?]`
- `[NEEDS RESEARCH: Do consumer-protection/refund/distance-selling rules attach to on-chain/Unlock service checkout, and in which jurisdiction (OD-04)?]`
- **New this pass:** `[NEEDS RESEARCH: Data-subject rights mechanism — how does a user request access/erasure of engagement-request + analytics data (GDPR/POPIA DSAR)?]` (implied by FR-057 but the *mechanism* is unspecified).
- **New this pass:** `[NEEDS RESEARCH: Invoicing/VAT/tax obligations for accepting USDC as payment for services (John is VAT-registered in SA — `PORTFOLIO_REFERENCE §7`).]`
These are handed to the research/compliance roles; the clear surfaces ship independently. **Resolved to flags** (no invented regulation).

---

## 13. Approval

Status **DRAFT**. Ready for owner (John) approval + downstream handoff to Project Manager /
Requirements Architect / Architect once OD-01…05 and the `[NEEDS RESEARCH]` items are dispositioned.
No `[FILL_IN]` markers remain; every objective has a KPI; both process diagrams render; every FR is
testable and traced; every story has ≥ 2 ACs; the 5-challenge red-team is complete.
