# 01 — Stakeholder Needs & Objectives — jw3b.dev v2

**Role:** business-analyst (MAS Phase 1) · **Date:** 2026-08-16 · **Status:** DRAFT (human approval precedes handoff)
**Upstream inputs (read end-to-end):** `mas/facts/00_FACTS_BRIEF.md`, `mas/market_validation/01–05`,
`mas/facts/{cv-source, capability-accuracy, existing-features-inventory, PORTFOLIO_REFERENCE, agilegypsy-reference}.md`.
**North star (locked, Phase 0):** *"A portfolio you OPERATE, not one you read."* Proof-as-interface ·
verification-as-signature · radical honesty · AI-as-headline · four-hat identity · one unmistakable hire path.

> This document defines WHAT the rebuild must achieve and for whom. It makes no technology or
> architecture choices (those are Phase 3). Every objective carries a KPI number so it can fail a
> measurement and therefore guide trade-offs. Where no old-site analytics exist to set a threshold
> (confirmed: none — `market_validation/04`, `05`), the target is stated as a concrete launch goal
> flagged `[ASSUMPTION — calibrate against first-90-day baseline]`; the *metric* is testable now,
> the *threshold* is an owner-tunable business target.

---

## 1. Stakeholder register

| # | Stakeholder | Type | Core need (what they must get) | Success signal |
|---|---|---|---|---|
| S1 | **John Wellard (owner / operator)** | Owner | A site that converts qualified attention into booked engagements without overclaiming; deploy control retained; every claim defensible | Qualified inbound rises; zero reputational claim-risk incidents |
| S2 | **PRIMARY — Building Founder/CTO** (seed–Series A) | End decision-maker | Proof, in the first interaction, that John ships agentic systems that survive production — not demos; evaluation/reliability evidence he can poke | Interacts with a live proof surface, then hits the hire path |
| S3 | **SECONDARY A — Protocol Security Buyer** | End decision-maker | A *verifiable* audit record (CodeHawks #124) one click away + a runnable security tool | Verifies CodeHawks profile, runs the audit console, requests engagement |
| S4 | **SECONDARY B — Senior-AI Hiring Manager / Recruiter** | End decision-maker | Three deep real systems (not 20), a named focus, seniority markers, an honest "what failed" surface | Reads the three systems + failure surface, forwards/keeps the tab |
| S5 | **AgileGypsy Labs (studio, sibling brand)** | Secondary / brand | jw3b.dev stays a *distinct person-brand* that shares DNA but never blurs into the studio; studio-only metrics don't leak onto jw3b.dev | Two sites cross-link; no studio metric mis-attributed to jw3b |
| S6 | **Compliance / data-protection stakeholder** (John as POPIA Info Officer + EU/SA visitors) | Governance | AI disclosure, privacy notice, testnet honesty, audit disclaimer, lawful handling of wallet + engagement data | No undisclosed AI, no unlawful data capture, disclaimers present |
| S7 | **Downstream MAS build team** (PM, requirements-architect, architect, engineers, QA, security) | Internal | Testable, traceable requirements + explicit open decisions, so they can build without guessing | Every FR traces to an objective and a story; no `[FILL_IN]` left |

Persona sourcing is in `market_validation/01_personas.md` (each frustration cited). Priority call
(inherited, not re-litigated): **design for S2 (Building Founder/CTO)**; S3 and S4 are served by the
*same* proof-first architecture, so there is emphasis, not conflict.

---

## 2. Measurable business objectives (each with a KPI number)

Traceback = the validated Phase-0 need each objective answers.

### OBJ-01 — Convert qualified attention into booked engagements (PRIMARY win)
*Traceback:* S1 owner goal; the old `/hire-me` dead-ends at 0% (`existing-features-inventory §3`);
master report Risk 3 "spectacle burying conversion."
**KPIs**
- K1.1 Mission Control **completion rate** (flow start → a terminal action submitted: book-a-call *or* escrow-intent *or* Unlock checkout) **≥ 25%** `[ASSUMPTION — baseline]`.
- K1.2 **≥ 3 qualified engagement requests / month** by day 90 post-launch `[ASSUMPTION — baseline]`.
- K1.3 A persistent single-spine hire CTA reachable in **≤ 1 click from 100% of routes** (structural, testable at build).
- K1.4 **Terminal dead-ends = 0** (every checkout CTA resolves to a real action or a book-a-call fallback; today = 2 dead-ends).

### OBJ-02 — Prove production-grade reliability in the first interaction ("works in front of you")
*Traceback:* S2 #1 fear "works in demos, fails in production" (`01_personas`); differentiation Angle 1 (live) + Angle 2 (verification).
**KPIs**
- K2.1 **≥ 1 operable proof surface** (audit console / concierge / graph) is interactive **before the first scroll** on 100% of sessions.
- K2.2 **Live-surface effective success ≥ 95%** — a visitor who triggers a live surface gets a real result (live *or* cached-replay) at least 95% of attempts.
- K2.3 **Hard-broken states = 0** (no uncaught error with no fallback on any live surface) — the existential constraint (master report Risk 1).
- K2.4 **Exactly 3** flagship systems shown *operably* (not as screenshots).

### OBJ-03 — Make the record externally verifiable in one click (trust primitive)
*Traceback:* S3 buys on "externally verifiable leaderboard evidence, not logo walls" (`01_personas`, `02_competitor_teardown` Tier C).
**KPIs**
- K3.1 CodeHawks **#124** record deep-links to the public profile from **≥ 2 surfaces**; **0** self-asserted badges standing in for a link.
- K3.2 **100%** of on-site audit-record numbers match `PORTFOLIO_REFERENCE.md` (#124 · 17 findings · 8 High · 1,430 EXP).
- K3.3 **Time-to-verifiable-proof ≤ 1 click** from any audit/security surface (old site: 7 empty platform links to sift, `PORTFOLIO_REFERENCE §0`).
- K3.4 Branded search ("John Wellard" / "jw3b" / "AgileGypsy") returns jw3b.dev **rank #1** (must-win, `04`).

### OBJ-04 — Satisfy senior hiring screens with depth + honesty (not breadth)
*Traceback:* S4 "show exactly three polished projects," "a 'what failed' section signals honesty" (`01_personas`, differentiation Angle 3).
**KPIs**
- K4.1 **Exactly 3** deep systems featured; project count on the systems surface **≤ 3** (not 20).
- K4.2 **≥ 1** first-class "unedited run / failures included" surface present.
- K4.3 **0** skills-grid / proficiency-bar / headshot-two-column-hero / résumé-timeline-as-primary sections (the avoid-list, `02` §"clichés").
- K4.4 Four-hat identity (Engineer/Auditor/PM/Founder) shown together; **0** states where a hat is fully hidden (filters DIM only).

### OBJ-05 — Ship every public claim as verifiable proof (claims discipline is a hard requirement)
*Traceback:* Facts Brief §4; master report Risk 2; `PORTFOLIO_REFERENCE §0/§1b` (the old zero counters are *factually false*).
**KPIs**
- K5.1 **100%** of numeric/credential claims rendered as fact trace to `PORTFOLIO_REFERENCE.md` or `cv-source.md` (post-reconciliation).
- K5.2 **0** unreconciled `[REQUIRES_RESOLUTION]` stats rendered as fact at launch (gated until John rules — see `03` §Claims Reconciliation).
- K5.3 **0** forbidden claims (no TVL / $ secured / "protocols secured" / "50+ audits" / "PMP certified" / "PRINCE2 Practitioner").
- K5.4 **0** hero counters reading `0`; **0** proficiency percentages.

### OBJ-06 — Deliver a premium-technical, fast, accessible, operable experience (the register + floor)
*Traceback:* locked register (Linear-precise/Rauno-dense/Anthropic-evidence-forward); master report Risk 5 (performance is a design input); accessibility as senior-signal.
**KPIs**
- K6.1 **LCP ≤ 2.5s** on the marquee route, mid-tier mobile, throttled (target; NFR seed).
- K6.2 Every operable proof surface is usable on mobile via **≥ 1 fallback / reduced mode**.
- K6.3 **`prefers-reduced-motion` honored on 100%** of animated surfaces.
- K6.4 **0** decorative-only 3D/glass hero sections (R3F is *optional & budgeted*, never a generic hero, per Facts Brief §3 + `02`).

Coverage check: every objective has ≥ 1 KPI number; every Phase-0 persona (S2/S3/S4) and the owner
(S1), studio (S5), and compliance (S6) needs map to ≥ 1 objective. No uncovered stakeholder.

---

## 3. Scope

### 3.1 In scope
- Ground-up rebuild of **frontend AND the Cloudflare Worker backend** (reuse nothing from old `src/`).
- The **six must-exist features**: (1) AI security console, (2) AI concierge chat, (3) live on-chain CTF, (4) wallet-gated Mission Control hire flow *that converts*, (5) wallet connect, (6) Unlock paywall.
- The **Mission Control** configure → assess → loadout → **terminal checkout** (book-a-call floor · on-chain escrow · Unlock) — special rigor; today it dead-ends.
- A first-class **radical-honesty ("unedited run / what failed")** surface.
- The **four-hat identity** IA (shown together; filters dim).
- **Claims-discipline enforcement** as a functional content gate + a **claims-reconciliation list** for John.
- Backend rebuild: concierge stream, audit tools, STT/TTS, CTF verify + leaderboard, engagement-request capture, book-a-call handoff, analytics — on Cloudflare Worker + D1 + Anthropic via AI Gateway.
- Branded-search SEO + structured data + agilegypsy.com cross-link.
- Compliance surfaces: AI disclosure, privacy notice, testnet honesty, audit disclaimer.

### 3.2 Out of scope (this rebuild)
- Studio (agilegypsy.com) redesign — jw3b.dev only; cross-link, don't absorb.
- Importing **studio-register metrics** onto jw3b.dev (GraphRAG +18pts, 9,828 entities, 192K corpus, 1,345 tests/100%, etc.) unless John clears them into jw3b's own register — see `03` §Claims Reconciliation.
- A full production XMTP E2E rebuild (treat as a separate migration project to `@xmtp/browser-sdk`); **in scope only** is the *honesty decision* — build it or stop advertising it (FR in `03`).
- Instant self-serve crypto checkout for high-ticket ($6k–$50k+) engagements (routed to book-a-call / escrow-on-acceptance instead — see To-Be, `02`).
- Mainnet CTF (CTF stays Base **Sepolia** testnet, honestly labeled).
- New keyword/volume research (deferred — `04` has no tool data; channel priority stands).

### 3.3 Assumptions
- A1 No old-site analytics exist; conversion KPIs are launch targets to calibrate (`04`, `05`).
- A2 Provisioning John will supply later (real Unlock lock addresses, escrow deployment posture, book-a-call scheduler endpoint, KTHULHU embed access) is *not* guaranteed at build start; the design must degrade gracefully when a primitive is absent (book-a-call floor always works).
- A3 The concierge + audit console depend on a live Worker; each requires a cached/replay fallback (hard constraint).
- A4 John retains all deploy control (Facts Brief §3); the build stops at branch `v2`.
- A5 The three flagship systems are drawn from the cleared set (KTHULHU, the concierge/`/audit` itself, the graph/validated-pipeline thesis); final selection is an owner decision (`OD` list, `03`).

### 3.4 Constraints (given — recorded, not chosen)
- C1 **Stack floor:** React 19 · Vite · Tailwind 3 · Framer Motion · **wagmi 2 (NEVER v3)** · viem 2 · R3F optional & budgeted. Backend = Cloudflare Worker (Workers AI + D1 + Anthropic via AI Gateway).
- C2 **Web3 pattern:** simulate-first (`useSimulateContract` → write → `useWaitForTransactionReceipt`); `useReadContract`. USDC = 6-decimal BigInt precision.
- C3 **Secrets** never in frontend — only via Worker (`wrangler secret put`); `.env` = public values only.
- C4 **Do NOT deploy or push;** build on branch `v2` only.
- C5 **Claims discipline** (OBJ-05) binds all copy: no number ships unless it traces to the evidence register.
- C6 **Live-fallback discipline** (OBJ-02): every live surface degrades to *verifiably real*, never *broken*.
- C7 **Distinct-from-studio** palette/identity (S5): share deep-space-glass + HUD DNA, differ on accent + dimensionality (`agilegypsy-reference §6`).

---

## 4. Phase-1 exit note
Objectives are measurable; scope is bounded; the primary persona and the six features anchor
everything downstream. Process flows (`02`) quantify the As-Is → To-Be gap, with the Mission Control
hire flow as the centerpiece. Open owner decisions and the claims-reconciliation list are carried
forward to `03` and surfaced again in the Master BRD (`05`).
