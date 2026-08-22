# REQUIREMENTS.md — jw3b.dev v2 (MAS Phase-2 Consolidated Requirements)

**Owner:** requirements-architect (MAS Phase 2) · **Date:** 2026-08-16 · **Status:** VALIDATED (score ≥ 3.0 all four axes) · **Version:** v1.0.0
**Mode:** D — upstream-BRD ingestion into a **fresh** workspace (`src/` empty; only `mas/` present; no prior `REQUIREMENTS.md`).
**Primary ingestion source:** `mas/business_analysis/05_master_brd.md` (+ companions `01`–`04`).
**Binding overrides:** `mas/facts/01_OWNER_DECISIONS.md` — **where this file and the BRD disagree, the OWNER DECISIONS win** and are folded in below (see §12).
**Companion outputs:** `mas/context/ACTIVE_STACK.md` · `mas/context/ACTIVE_AGENTS.md` · `mas/context/WORKSPACE_CONTEXT.md`.

### Source-of-truth tiering (every claim below is tagged)
`OWNER` = `facts/01_OWNER_DECISIONS.md` (binding, human-confirmed) **>** `BRD` = `business_analysis/01–05` **>** `FACTS` = `facts/` register (cv-source, capability-accuracy, PORTFOLIO_REFERENCE, existing-features-inventory) **>** `INFERRED` = reasoned from the above. Tags appear inline as HTML comments so downstream tools can diff them.

---

## 1. Project identity

- **Name:** jw3b.dev v2 <!-- SOURCE: BRD §1 -->
- **Owner / operator / sole approver:** John Wellard (JW3B / AgileGypsy). <!-- FACTS: cv-source; charter §7 -->
- **What it is:** a total, ground-up rebuild (React frontend **and** Cloudflare Worker backend) of John Wellard's portfolio + Web3 service platform, repositioning him as a **Senior Agentic AI Developer & smart-contract auditor**. <!-- SOURCE: BRD §1; OWNER OD framing -->
- **Rebuild posture:** reuse **nothing** from the prior site — components, IA, layout, visual design, and every prior design doc are **SCRAPPED**; only the *facts* in `mas/facts/` survive as input. <!-- FACTS: 00_FACTS_BRIEF §1,§6 -->

---

## 2. Vision statement (measurable)

> **"A portfolio you OPERATE, not one you read."** <!-- FACTS: 00_FACTS_BRIEF §1; BRD §1 -->

**Operationalized (user + verb + outcome, all testable):** a **Building Founder/CTO** can **operate at least one live proof surface before the first scroll**, **verify** the CodeHawks #124 record in **≤ 1 click**, **see a real failure** (unedited-run surface), and **reach a guaranteed hire path** from every route — while every "live" surface **degrades to *verifiably real* (labelled recorded run), never *broken***, and **every rendered number/credential traces to the evidence register**. <!-- SOURCE: BRD §1–§2; OWNER; FACTS -->

This vision is not a slogan: it fails measurement if any of {operable-pre-scroll surface, ≤1-click verification, failures surface, guaranteed hire path, live-fallback, claims-traceability} is absent — each maps to a KPI in §4 and a business rule in §8.

**Four pillars (the locked strategic direction):** proof-as-interface · verification-as-visual-signature · radical honesty (failures shown) · AI-as-headline · four-hat identity shown together · one unmistakable hire path. <!-- FACTS: 00_FACTS_BRIEF §1 -->

---

## 3. WHO — stakeholders & personas

| # | Stakeholder | Priority | Core need | Success signal |
|---|---|---|---|---|
| S2 | **Building Founder/CTO** (seed–Series A) | **PRIMARY — design for this persona** | Proof, in the first interaction, that John ships agentic systems that **survive production, not demos** — evaluation/reliability evidence he can poke | Interacts with a live proof surface, then hits the hire path |
| S3 | Protocol Security Buyer | Secondary A | A **verifiable** audit record (CodeHawks #124) one click away + a runnable security tool | Verifies profile, runs `/audit`, requests engagement |
| S4 | Senior-AI Hiring Manager / Recruiter | Secondary B | **Curated** deep real systems (not 20), a named focus, seniority markers, an honest "what failed" surface | Reads the systems + failure surface, keeps the tab |
| S1 | John Wellard | Owner | Converts qualified attention without overclaiming; retains deploy control; every claim defensible | Qualified inbound rises; zero claim-risk incidents |
| S5 | AgileGypsy Labs (studio) | Brand | jw3b.dev stays a **distinct** person-brand; studio-only metrics don't leak | Cross-link, no mis-attributed metric |
| S6 | Compliance / data-protection (John = POPIA Info Officer) | Governance | AI disclosure, privacy notice, testnet honesty, audit disclaimer, lawful wallet/engagement data | No undisclosed AI, no unlawful capture |
| S7 | Downstream MAS build team | Internal | Testable, traceable requirements + explicit open decisions | Every FR traces to an OBJ + story |

<!-- SOURCE: BRD/01_stakeholders §1; personas sourced to market_validation/01_personas -->
**Priority call (inherited, not re-litigated):** design for **S2**; S3 and S4 are served by the *same* proof-first architecture — emphasis, not conflict. <!-- SOURCE: 01_stakeholders §1 -->

---

## 4. WHY — objectives & KPIs (amended for owner decisions)

Market verdict: **PROCEED** (HIGH confidence on positioning/anti-generic direction; MEDIUM on absolute search-demand). The gap — *operable, verifiable, honest proof of production-grade systems* — is real and John sits in it. <!-- SOURCE: market_validation/05 -->

| OBJ | Objective | Headline KPIs | Persona |
|---|---|---|---|
| OBJ-01 | Convert attention into booked engagements | Mission Control completion **≥ 25%** `[ASSUMPTION — baseline]`; **≥ 3** qualified requests/mo by day 90; hire CTA **≤ 1 click from 100%** of routes; **terminal dead-ends = 0** | S1/S2 |
| OBJ-02 | Prove production reliability in first interaction | **≥ 1** operable proof surface **before first scroll**; live-surface **effective success ≥ 95%** (incl. fallback); **hard-broken states = 0**; **exactly FOUR** flagship systems shown operably ⟵ *amended 3→4* | S2 |
| OBJ-03 | Make the record verifiable in one click | CodeHawks **#124** deep-linked from **≥ 2** surfaces; **100%** record numbers match register; **≤ 1 click** to proof; branded search **rank #1** | S3 |
| OBJ-04 | Satisfy senior screens with depth + honesty | **exactly FOUR** systems ⟵ *amended 3→4*; **≥ 1** failures surface; **0** avoid-list sections; **four hats always visible** | S4 |
| OBJ-05 | Ship every claim as verifiable proof | **100%** claims traceable to the seeded register; **0** `[REQUIRES_RESOLUTION]` stats live; **0** forbidden claims; **0** zero-counters | S1/S6 |
| OBJ-06 | Premium-technical, fast, accessible, operable | LCP **≤ 2.5s** marquee; mobile fallback on **every** proof surface; reduced-motion **100%**; **0** decorative-only 3D/glass heroes | all |

<!-- SOURCE: BRD §2 / 01_stakeholders §2 -->
**AMENDMENTS (OWNER OD-01):** K2.4 and K4.1 "**exactly 3**" → "**exactly 4**"; OBJ-02/OBJ-04 wording updated. Spirit intact = a curated few deep systems, not a 20-project wall. <!-- OWNER: OD-01 -->
**Baseline honesty:** no old-site analytics exist → K1.1/K1.2 thresholds are `[ASSUMPTION — calibrate against first-90-day baseline]`; the *metrics* are testable now, the *thresholds* are owner-tunable targets. <!-- SOURCE: 01_stakeholders §2; market_validation/05 Risk 2 -->

---

## 5. WHAT — functional requirements (60 FRs ingested + folded deltas)

Ingested verbatim-in-substance from `BRD §4 / 03_requirements §1`, then reconciled to the OWNER DECISIONS. Each FR keeps its OBJ link + MoSCoW + build-basis (**New** / **Carry** = behavior existed in old app, rebuild it / **Repair** = existed but broken / **Decision** = was owner-gated). **★ = folded/amended by an owner decision** (details in §12). Full As-Is behavior lives in `facts/existing-features-inventory.md`; the *old FR numbers there are dead* — these are canonical.

### EPIC A — Operable, proof-first IA & four-hat identity
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-001 | Render the hero as an **operable proof surface** (run an audit / query the agent / explore the graph) interactive **before first scroll**; **no** headshot-and-tagline two-column hero. | 02 | MUST | New |
| FR-002 | Expose a **persistent single-spine hire CTA** reachable **≤ 1 click from every route**. | 01 | MUST | New |
| FR-003 | Present the **four-hat identity** (Engineer/Auditor/PM/Founder) **together on one surface**; filters **DIM** non-selected hats and **never fully hide** any. | 04 | MUST | New |
| **FR-004 ★** | Feature **exactly FOUR** flagship systems shown **operably** (not screenshots): **KTHULHU · the live on-site AI (concierge + `/audit` + CTF as ONE system) · Overmind GenAI Engine · Kointel**. *(Amended from BRD "exactly three" per OWNER OD-01.)* | 04 | MUST | New |
| FR-005 | Contain **zero** avoid-list sections: no skills/tech-icon grid, no proficiency bars, no headshot two-column hero, no résumé-timeline-as-primary, no zero-value counters. | 04,05 | MUST | New |
| FR-006 | Render the **"systems-are-graphs" + zero-trust validated-pipeline** thesis as an **explorable/steppable object** (nodes + gates visibly passing validation), not a static diagram. | 02 | SHOULD | New |
| FR-007 | Honor `prefers-reduced-motion` and keep motion within the stated performance budget on **100%** of animated surfaces. | 06 | MUST | New |
| FR-060 | Surface John's **delivery-credibility record** (20+ industrial plants · **7 countries** · **AgilePM® Practitioner** · ~20 yrs) as a **seniority anchor** tied to PM/Founder hats — a **separate anchor, not one of the four flagship slots**. | 04 | MUST | New |

### EPIC B — AI Security Console (`/audit`)
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-008 | Provide a **Solidity auditor**: accept pasted source and **stream** findings. | 02 | MUST | Carry |
| FR-009 | Provide a **fuzz-harness generator** streaming a harness for pasted source. | 02 | SHOULD | Carry |
| FR-010 | Provide a **transaction explainer**: decode a Base tx client-side, narrate in plain language. | 02 | SHOULD | Carry |
| FR-011 | Render streamed output while **parsing/stripping** the tag protocol (`[AUDIO]`,`[TOOL_CALL]`,`[RENDER_CARD]`). | 02 | MUST | Carry |
| FR-012 | Serve a **cached/replay recorded run** for each console tool when the Worker is down/timed-out, **labelled a recorded run**. | 02,06 | MUST | New |
| FR-013 | **Validate all console inputs** (tx-hash format, source size cap) with a specific error. | 02 | MUST | Carry |
| FR-014 | Display an **AI-assisted-first-pass disclaimer** with console output (not a substitute for a full professional audit). | 05 | MUST | New |

### EPIC C — AI Concierge (global chat)
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-015 | Provide a **global floating concierge** with **SSE-streamed** responses on every route. | 02 | MUST | Carry |
| FR-016 | Support **voice input (STT)** and **voice output (TTS)** in the concierge. | 02 | COULD | Carry |
| FR-017 | Parse/strip the concierge **tag protocol**, keeping it **in sync** across Worker ↔ agent hook ↔ widget. | 02 | MUST | Carry |
| FR-018 | Ground answers in an **evidence-checked knowledge base** so it emits **no claim** failing claims discipline. | 05 | MUST | New |
| FR-019 | Let the concierge **route a user to the hire path** (book-a-call / Mission Control) via a tool-call. | 01 | SHOULD | New |
| FR-020 | Provide a **graceful degraded/canned response** (with a link, never a blank error) when the Worker is down. | 06 | MUST | Repair |
| FR-021 | Display an **AI-disclosure indicator**. | 05 | MUST | New |

### EPIC D — Live on-chain CTF ("Capture the Vault", Base Sepolia)
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-022 | Run a **real reentrancy CTF** on Base Sepolia: deploy Attacker → `attack{value}` → Worker verifies drain → leaderboard. | 02 | SHOULD | Carry |
| FR-023 | Handle the **full CTF state machine** (idle/switching/deploying/attacking/verifying/success/error + not-connected/wrong-chain/vault-empty/armed/already-solved). | 02 | MUST *(if CTF ships)* | Carry |
| FR-024 | **Label the CTF as Base Sepolia testnet, no real funds**, on every CTF surface. | 05 | MUST | New |
| FR-025 | **Persist the leaderboard** (D1) and display ranked solves. | 02 | SHOULD | Carry |
| FR-026 | Serve a **cached/replay recorded solve** when chain/Worker is down. | 06 | MUST | New |
| FR-027 | **Simulate before every on-chain write** (deploy/attack), surfacing revert reasons. | 02 | MUST | Carry |

### EPIC E — Mission Control wallet-gated hire flow (`/hire-me`) ★ centerpiece
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-028 | Preserve the **4-step configurator** (objective → assessment → engagement → loadout) + progress rail; **fix label drift** (step 3 = "ENGAGEMENT", not "PARAMETERS"). | 01 | MUST | Repair |
| FR-029 | Make the **assessment answers inform the loadout** (recommended tier + indicative scope) — Step 2 no longer decorative. | 01 | MUST | Repair |
| FR-030 | Render loadout tiers whose **prices trace to `retainer.json`** (no hardcoded/unsourced price strings). | 01,05 | MUST | Repair |
| FR-031 | **Prompt wallet connect in-flow** (mount the connect button inside `/hire-me`). | 01 | MUST | New |
| **FR-032 ★** | **Route the terminal action by ticket size**: low-ticket fixed-price → **Unlock**; high-ticket retainer/project → **escrow-on-acceptance**; **book-a-call available on every branch**. All three rails are **built now**; escrow + Unlock are **feature-flagged on provisioning** and degrade to book-a-call until live. *(OWNER OD-03 sharpens: all-3-rails in scope, book-a-call the guaranteed primary.)* | 01 | MUST | New |
| FR-033 | Execute on-chain escrow via **Simulate → Write → Wait** (`useSimulateContract` → write → `useWaitForTransactionReceipt`) in **USDC on Base**, **6-decimal BigInt**. | 01 | MUST | Repair |
| **FR-034 ★** | Offer **Unlock only when a real lock address is deployed**; placeholder/undeployed ⇒ **hide Unlock, fall back to book-a-call** (no perpetually-disabled button). Unlock is **built now, activation gated on provisioning**. | 01 | MUST | Repair |
| FR-035 | Provide the **full product-state set**: connect-prompt, checkout-loading, tx-pending, **success (receipt + next steps)**, error/retry, empty. | 01 | MUST | New |
| FR-036 | Provide a **book-a-call floor** that completes an engagement request **with no wallet, no chain, no live Worker** (offline-capable capture + confirmation) — the **guaranteed, default, primary** terminal action. **✎ AMENDED 2026-08-22 → the outcome now lives in FR-062 (EPIC K).** "Capture + confirmation" is what this asked for and precisely what shipped: a lead written to a table nobody read, under a UI that said *"John will follow up"*. The requirement was satisfied and the product was broken. Capture is the **mechanism**; FR-062 owns the **outcome**. | 01 | MUST | Repair |
| FR-037 | **Capture every engagement request** (objective, assessment, engagement, tier, indicative price, route, optional wallet, contact) to Worker + D1 and **show a confirmation**. **✎ The confirmation must state the ACTUAL delivery state** (delivered/alerted · delivered/recorded · queued for reconnect · rejected with a fallback), never a promise the system has not kept. | 01 | MUST | Repair |
| FR-038 | **Remove** the dead no-op "ENQUIRE" button and the `/test-agent` dev scaffold before ship. | 01 | MUST | Repair |
| **FR-039 ★** | **Build real XMTP E2E encrypted messaging** via **`@xmtp/browser-sdk`** (MLS successor; **NOT** `@xmtp/xmtp-js`); the "E2E encrypted channel / Priority Support in XMTP" claim renders **only alongside the working feature**. *(OWNER OD-02 resolves BRD's build-or-remove Decision → **BUILD NOW**.)* | 01,05 | MUST | New *(was Decision)* |

### EPIC F — Wallet & payment primitives (shared)
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-040 | Provide a **custom RainbowKit connect button** (connect / wrong-network / account+chain states). | 01 | MUST | Carry |
| FR-041 | Wrap **Unlock Protocol checkout** (`window.unlockProtocol`), driven only by **real deployed** lock addresses. | 01 | MUST | Repair |
| FR-042 | Configure chains (**Base primary; Base Sepolia for testnet demos**) and **label testnet↔mainnet honestly** wherever an on-chain surface renders. | 05 | MUST | Carry |

### EPIC G — Claims discipline & evidence (functional content gate)
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-043 | **Render no numeric/credential claim** as fact unless it traces to the seeded evidence register (`PORTFOLIO_REFERENCE.md` successor) — enforced as a content gate. | 05 | MUST | New |
| FR-044 | **Deep-link the CodeHawks #124 record** to the public profile from **≥ 2** surfaces (not a self-asserted badge). | 03 | MUST | New |
| FR-045 | Provide a **first-class "unedited run / what failed & why"** surface (real logs, the failure, the fix). | 04 | MUST | New |
| FR-046 | **Block the forbidden-claims list** (no aggregate TVL / $ secured / "protocols secured" / "50+ audits" / "PMP certified" / "PRINCE2 Practitioner" / Neo4j-Certified-until-artifact). *(Forbidden list UNCHANGED by OD-05.)* | 05 | MUST | New |
| **FR-047 ★** | Gate every `[REQUIRES_RESOLUTION]` stat out of public surfaces **until it has a seeded register entry + evidence pointer**. *(OWNER OD-05: the 10 CR stats are now CLEARED IN — they PASS this gate once §11 seeding is done, rather than being withheld pending a ruling.)* | 05 | MUST | New |
| **FR-061 ★ (NEW)** | **Seed the v2 evidence register** with the **10 cleared CV stat-claims** (CR-01…10), each with an **evidence pointer** (repo / product page / dashboard / "owner-attested, <system>"), and attach an **"AgileGypsy Labs / EcoGraph" provenance note** to the studio-origin figures (CR-01 +18pts · CR-02 9,828 entities · CR-03 77k chunks · CR-09 memory-miss >2× · any EcoGraph-derived number). Seeding **gates all later claim rendering** (must exist before any surface renders a claim). *(OWNER OD-05 — new first-class requirement.)* | 05 | MUST | New |

### EPIC H — Backend (Cloudflare Worker) — full rebuild
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-048 | Expose Worker routes for **concierge chat (stream)**, **audit tools (stream)**, **STT/TTS**, **CTF verify**, **leaderboard**, **engagement-request capture**, **book-a-call handoff**. | 01,02 | MUST | Carry |
| FR-049 | Persist **analytics, CTF leaderboard, engagement requests** in **D1**. | 01 | MUST | Carry |
| FR-050 | Handle **all secrets server-side only** (Worker; Anthropic via AI Gateway); **no secret** in the client bundle or `.env`-public. | 05 | MUST | Carry |
| FR-051 | **Rate-limit AI endpoints** (concierge, audit tools, STT/TTS) to bound cost + abuse. | 06 | MUST | New |
| FR-052 | Own the **tag-protocol contract** server-side, synchronized with the frontend parser. | 02 | MUST | Carry |

### EPIC I — Arrival / SEO / trust
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-053 | **Win branded search** ("John Wellard" / "jw3b" / "AgileGypsy") via title/meta/OpenGraph/structured data. | 03 | MUST | New |
| FR-054 | Emit **Person structured data** + **cross-link agilegypsy.com** (studio ↔ person). | 03 | SHOULD | New |
| FR-055 | Publish **content-gap explainer pages** ("systems are graphs", "zero-trust validator"). | 03 | COULD | New |
| FR-056 | **Reinforce GitHub ↔ site** by linking real repos from the systems surface. | 03 | COULD | New |

### EPIC J — Compliance & trust surfaces
| FR | System shall… | OBJ | MoSCoW | Basis |
|---|---|---|---|---|
| FR-057 | Publish a **privacy notice** covering analytics, connected-wallet data, engagement-request PII. | 05 | MUST | New |
| FR-058 | Present **cookie/analytics consent** if legally required. `[NEEDS RESEARCH — §13]` | 05 | SHOULD | New |
| FR-059 | Present **engagement/checkout terms** (scope, refund/cancellation) at any paid checkout. `[NEEDS RESEARCH — §13]` | 05 | SHOULD | New |

### ✎ EPIC K — OUTCOME requirements (added 2026-08-22, R1)

**Why this epic exists.** Every FR above specifies a *mechanism* — capture, render, expose, present.
The MAS built each one correctly, every gate verified each one correctly, and the site could not
convert, because **no requirement anywhere said what the visitor finishes.** FR-036 asked for
"capture + confirmation" and got exactly that: a lead in a table nobody read, under a UI promising
follow-up. That is root cause 1 in `audits/POSTMORTEM_CONCEPT_SHIP.md`, and amending the gates
without amending the requirements would leave the cause in place for whoever builds next.

**The rule this epic sets:** an outcome FR names the visitor-side result *and the test that proves
it on the deployed site*. A mechanism FR is satisfied by code; an outcome FR is satisfied only by
evidence from production.

| FR | The visitor shall be able to… | Driving test (must run against the DEPLOYED site) | OBJ | MoSCoW |
|---|---|---|---|---|
| **FR-062 ★** | …submit an engagement and **have it reach John**, with the confirmation stating the real delivery state — never a promise the system has not kept. Capture (FR-036/037) is the mechanism; *reaching John* is the requirement. | `e2e/lead-path.spec.js` (route deployed, validating, alert channel configured) · write half proven live and recorded in `audits/PRODUCT_AUDIT_2026-08-21.md` | 01 | MUST |
| **FR-063 ★** | …ask the concierge an informational question and get a **true answer, in the chat** — no navigation, no offer card; hire intent gets a consent card the visitor chooses. | `e2e/live.spec.js` — answers in-chat, does not navigate, states a fact only the KB supplies | 01,03 | MUST |
| **FR-064 ★** | …learn the whole `/audit` workflow and what each step costs **before spending anything**, and leave with an artifact (exported report) and a path from a finding to hiring John. | `e2e/first-visit.spec.js` (four steps + costs pre-run) · `AuditConsole` export/jump/hire | 02 | MUST |
| **FR-065 ★** | …read the CTF challenge — brief, target, leaderboard — **before any wallet is requested**, with the ask positioned after the brief. | `e2e/first-visit.spec.js` (bounding-box ordering assertion) | 02 | MUST |
| **FR-066 ★** | …**operate** every surface that claims to be operable, or read copy that stops claiming it. A framed third-party product is not an on-site capability. | `e2e/first-visit.spec.js` (thesis surfaces asserted to CHANGE when driven) · **OPEN for KTHULHU/Kointel — owner-gated on API access** | 04 | MUST |
| **FR-067 ★** | …load any route with **zero same-origin console errors**, walletless, on desktop and mobile. | `e2e/journeys.spec.js` — the budget filters by originating URL, so our own failures cannot be excused as third-party noise | 03 | MUST |

**Standing rule for new FRs:** any FR creating or changing a visitor-facing loop must either be an
outcome FR here, or name the outcome FR it serves. A mechanism with no outcome above it is the
defect this epic exists to prevent.

**MoSCoW summary (post-fold):** MUST = **52** (46 + the six EPIC K outcome FRs) · SHOULD = 9 · COULD = 3. Total FRs = **67** (was 61). Every FR carries an OBJ link; every objective is covered by ≥ 1 FR + ≥ 1 story (traceability in `04_user_stories.md §Matrix`, still valid; add US-052 for FR-061 — see §14). <!-- SOURCE: BRD §4; OWNER OD-01/02/05 -->

---

## 6. HOW — the method (mechanisms that are requirements, not Phase-3 design)

The *architecture design* is Phase 3's job; these are the **method constraints** the requirements already fix:

- **Proof-as-interface:** key surfaces are *operable* (run/query/step), not prose. <!-- FACTS: 00_FACTS_BRIEF §1 -->
- **Live-fallback discipline (HARD, existential):** every live surface has a **cached/replay artifact labelled "recorded run"**; live degrades to *verifiably real*, never *broken*. This is what makes "≥ 95% effective success" reachable. <!-- SOURCE: BRD BR-03, NFR-02; market_validation/05 Risk 1 -->
- **Simulate-first on every write:** `useSimulateContract` → write → `useWaitForTransactionReceipt`; `useReadContract` (never legacy `useContractRead`). USDC = **6-decimal BigInt**. <!-- FACTS: 00_FACTS_BRIEF §3; BRD BR-04/06 -->
- **Claims-gate as a data-governed content gate:** `ClaimRecord` (DE-07) drives rendering; `status=cleared` required. <!-- SOURCE: BRD DE-07, BR-01 -->
- **Ticket-size routing** with a **book-a-call floor** beneath every branch. <!-- SOURCE: BRD BR-05/11; OWNER OD-03 -->
- **Secrets server-side only** (Worker; `wrangler secret put`); `.env` = public values only. <!-- FACTS: 00_FACTS_BRIEF §3 -->
- **Stack is a fixed given, not a choice** — recorded decisively in `mas/context/ACTIVE_STACK.md` (React 19 · Vite · Tailwind 3 · Framer Motion · **wagmi 2, never v3** · viem 2 · R3F optional & budgeted · Cloudflare Worker + D1 + Anthropic via AI Gateway · **XMTP via `@xmtp/browser-sdk`**). <!-- FACTS: 00_FACTS_BRIEF §3; OWNER OD-02 -->

---

## 7. Data model (8 entities — ingested from `03 §2`)

**DE-01 EngagementRequest** · **DE-02 ServicePackage/Tier** · **DE-03 EscrowAgreement** · **DE-04 CtfSolve/LeaderboardEntry** · **DE-05 ConciergeSession/Message** · **DE-06 AuditRun** · **DE-07 ClaimRecord** (the evidence-register model — makes claims discipline data-governed) · **DE-08 Credential**. Full attributes/validation in `business_analysis/03_requirements §2`. Load-bearing rules: DE-03 mandates 6-decimal USDC BigInt + simulate-before-write; DE-07 `status ∈ {cleared, requires_resolution, forbidden}` (only `cleared` renders); DE-08 `claimable=false` for PRINCE2-Practitioner, PMP, Neo4j-Certified-until-artifact. <!-- SOURCE: BRD §5 / 03 §2 -->

---

## 8. Business rules (12 — ingested from `03 §3`)

BR-01 **Claims gate** (only `cleared` renders) · BR-02 **Forbidden claims** (block TVL/$/protocols/50+audits/PMP/PRINCE2-Practitioner) · BR-03 **Live-fallback** (down/timeout ⇒ labelled recorded run ⇒ else "offline — book a call"; never broken) · BR-04 **Simulate-first** · BR-05 **Ticket-size routing** · BR-06 **USDC 6-decimal BigInt** · BR-07 **Four-hat visibility** (dim, never fully hide) · BR-08 **AI disclosure** · BR-09 **Testnet honesty** · BR-10 **Audit disclaimer** · BR-11 **Book-a-call floor always completes** · BR-12 **Price provenance** (`retainer.json` only). Full condition→action→exception text in `03 §3`. <!-- SOURCE: BRD §6 / 03 §3 -->

---

## 9. NFR targets (resolved from BRD §8 seeds into concrete, testable targets)

| NFR | Concrete, testable target |
|---|---|
| **NFR-01 Performance** | **LCP ≤ 2.5s** on the marquee route (mid-tier mobile, throttled); **INP ≤ 200ms**; concierge **first-token ≤ 2s**; audit stream **first-token ≤ 3s**. |
| **NFR-02 Resilience** | Live-surface **effective success ≥ 95%** including fallback; **every** live surface has a cached/replay artifact (BR-03); **0 hard-broken states**. |
| **NFR-03 3D budget** | If R3F used: **≥ 30fps mobile / ≥ 50fps desktop**, with a **non-3D fallback**; never a decorative-only hero. |
| **NFR-04 Security** | Secrets server-side only; simulate-first on writes; input-validate all AI inputs; AI endpoints rate-limited; **no secret in client bundle**; CSP appropriate to embedded live surfaces. |
| **NFR-05 Accessibility** | **WCAG 2.2 AA**; `prefers-reduced-motion` honored **100%**; keyboard-navigable proof surfaces; **AA contrast** on the dark theme. |
| **NFR-06 SEO/Trust** | Branded search **rank #1**; valid **Person** structured data; correct **OG** unfurls. |
| **NFR-07 Privacy/Compliance** | AI disclosure, testnet honesty, audit disclaimer, privacy notice **present**; consent + checkout terms per the `[NEEDS RESEARCH]` outcomes (§13). |
| **NFR-08 Cost** | AI-endpoint cost **bounded per session** (rate limits + right-sized models); a public AI cannot be weaponized into runaway spend. |
| **NFR-09 Brand distinctness** | Shares deep-space-glass + HUD DNA with agilegypsy.com but uses a **distinct** accent identity + dimensionality (constraint C7) so the person-brand never blurs into the studio. |

<!-- SOURCE: BRD §8 -->

---

## 10. Scope boundaries

**IN:** ground-up frontend + Worker rebuild on `v2`; the six must-exist features (AI security console · concierge · live CTF · Mission Control that converts · wallet connect · Unlock paywall); the **four flagships** operable; the radical-honesty surface; four-hat IA; claims-discipline gate + evidence-register seeding; XMTP E2E (build now); backend rebuild (concierge/audit/STT-TTS/CTF-verify/leaderboard/engagement/book-a-call + D1); branded SEO + structured data + studio cross-link; compliance surfaces (AI disclosure, privacy notice, testnet honesty, audit disclaimer). <!-- SOURCE: BRD §11 / 01_stakeholders §3.1; OWNER -->

**OUT (WON'T, with reason):** studio (agilegypsy.com) redesign; importing studio-register metrics **unless cleared into jw3b's own register** (they now are — §11); **mainnet CTF** (stays Base Sepolia); **instant self-serve crypto checkout for high-ticket** (routed to book-a-call/escrow); XMTP on the **deprecated `@xmtp/xmtp-js`** (build is on `browser-sdk`); new keyword/volume research; **forbidden claims** (§8 BR-02); the OD-04 jurisdiction ruling + the 6 `[NEEDS RESEARCH]` legal answers (deferred to the compliance phase — §13). <!-- SOURCE: BRD §11; charter §5; OWNER OD-02/04 -->

---

## 11. Claims discipline — the seeded evidence register (post-OD-05)

**Ruling (OWNER OD-05): CLEAR ALL 10 IN.** John attests the ten CV stat-claims are his real numbers → they **move into jw3b's own evidence register** and may ship **as fact, conditional on an evidence entry + pointer** (FR-061). This keeps "proof, not promises" honest — a cleared claim still needs a source. <!-- OWNER: OD-05 -->

**Now-cleared (were `[REQUIRES_RESOLUTION]` CR-01…10):**
| CR | Claim | Attaches to | Provenance note required? |
|---|---|---|---|
| CR-01 | GraphRAG hybrid retriever **+18 pts** vs baseline | GraphRAG/EcoGraph | **Yes** — "AgileGypsy Labs / EcoGraph" |
| CR-02 | **9,828 entities** | GraphRAG/EcoGraph | **Yes** |
| CR-03 | **77k chunks** | GraphRAG/EcoGraph | **Yes** |
| CR-04 | **192,000+** corpus embedded & classified | Overmind | No (attach to system) |
| CR-05 | **1,345** tests / **100%** cov / **2,468** lines | governance logic | No |
| CR-06 | **13-phase** pipeline / **51** modules | Overmind | No |
| CR-07 | KTHULHU **112+ merged PRs** | KTHULHU | No |
| CR-08 | KTHULHU **"paying users"** | KTHULHU | No |
| CR-09 | GraphRAG **memory-miss recovery > 2×** | GraphRAG/EcoGraph | **Yes** |
| CR-10 | **Neo4j Certified Professional** (+ Neo4j GenAI/MCP/GDS) | cert | No — but see caveat below |

<!-- OWNER: OD-05; claim texts from BRD 03 §4 -->
**Caveat on CR-10:** OD-05 clears the stat-claims John attests. `PORTFOLIO_REFERENCE §1` still lists **Neo4j Certified Professional** as "Unverified, no artifact yet," and BR-02/FR-046 name "Neo4j-Certified-until-cleared" in the forbidden list. **[REQUIRES_HUMAN_INPUT]** — reconcile: does OD-05's blanket clearance include CR-10 despite the register's "no artifact" note, or does CR-10 remain artifact-gated? Portfolio-evidence + John rule at register-seeding time; until reconciled, CR-10 stays gated (safer default). <!-- FACTS: PORTFOLIO_REFERENCE §1; BRD FR-046 vs OWNER OD-05 -->

**Cleared-to-ship (independent of OD-05, trace to `PORTFOLIO_REFERENCE`):** CodeHawks **#124 · 17 findings (8 High / 5 Med / 4 Low) · 1,430 EXP**; **20+ years** / **7 countries** / **20+ industrial plants**; **AgilePM® v2 Practitioner + Foundation**, **PRINCE2 Foundation**, **APM PFQ**, five **Cyfrin Updraft** certs (with IDs), **Chainlink Fundamentals**, **Dapp University** bootcamp; existence of KTHULHU / Kointel / Art of Zeta / MB-agentic / AgileCEO. <!-- FACTS: PORTFOLIO_REFERENCE §1,§1b,§8 -->

**Forbidden (UNCHANGED by OD-05, BR-02/FR-046):** aggregate TVL · $/bounties secured · "protocols secured" · "50+ audits" · "$50M+ secured" · "decades of combined experience" · "PMP certified" · "PRINCE2 Practitioner" · the seven empty audit-platform links. **Never publish (PII):** SA ID/DOB/OU Personal Identifier/HESA ID/UK home address/Student-Finance ref/personal mobile/`bets` repo/DecentX by name. <!-- FACTS: PORTFOLIO_REFERENCE §0,§8 -->

---

## 12. ★ Owner-decision deltas folded (BRD → this doc) — reconciliation

| # | BRD said | OWNER DECISION | Landed here as |
|---|---|---|---|
| OD-01 | "exactly **three** flagships"; OD-01 open (DevGuild/EcoGraph/Overmind — jw3b or studio?) | **Exactly FOUR**: KTHULHU · live on-site AI (concierge+`/audit`+CTF as ONE) · Overmind · **Kointel**. DevGuild/EcoGraph/Art-of-Zeta **not** flagships. Delivery record = separate anchor. | **FR-004 amended**; **OBJ-02 K2.4 & OBJ-04 K4.1 "3→4"**; FR-060 confirmed as separate anchor |
| OD-05 | CR-01…10 = `[REQUIRES_RESOLUTION]`, gated OUT until John rules | **CLEAR ALL 10 IN** to jw3b's register; each needs an evidence pointer; studio-origin figures carry an **"AgileGypsy Labs / EcoGraph" provenance note**; forbidden list unchanged | **New FR-061** (register seeding + provenance); **FR-047 reframed** (gate passes on seeding, not on a pending ruling); §11 rewritten |
| OD-03 | "book-a-call floor + flagged rails" (emphasis) | **Build ALL THREE rails now** (book-a-call · escrow · Unlock); **book-a-call = guaranteed, default, primary**; escrow+Unlock **feature-flagged on provisioning**, degrade to book-a-call until live | **FR-032/FR-034 sharpened**; FR-033/036 confirmed; provisioning tracked (§15) |
| OD-02 | FR-039 = **Decision** (build XMTP **or** remove the claim) | **BUILD NOW** via **`@xmtp/browser-sdk`** (MLS); a first-class feature build + migration; retainer "Priority Support in XMTP" perk becomes real | **FR-039 promoted Decision→MUST**, basis New; sequenced off the conversion critical path (P3) |
| OD-04 | jurisdiction open (UK vs SA) | **DEFERRED** to compliance phase (non-blocking); John = UK citizen resident in Benoni SA (POPIA Info Officer) | Tracked in §13/§15; blocks no build now |

<!-- OWNER: OD-01/02/03/04/05 -->

---

## 13. Compliance (explicitly answered)

**Clear duties — ship regardless of open research** (already FRs): AI disclosure (FR-021/014, BR-08/10), testnet honesty (FR-024/042, BR-09), privacy notice (FR-057), audit disclaimer (FR-014, BR-10). <!-- SOURCE: BRD §12.5 / 03 §6 -->

**Deferred `[NEEDS RESEARCH]` (to research/compliance roles; do NOT invent regulation):**
1. Does **EU AI Act Art. 50** transparency apply to the concierge/`/audit`, and what wording satisfies it? (→ FR-021/014)
2. Do **D1 analytics** require GDPR/ePrivacy or POPIA **cookie-consent**? (→ FR-058)
3. Is a **connected wallet address + engagement request** "personal data" needing a specific lawful basis/notice? (→ FR-057)
4. Do **consumer-protection/refund/distance-selling** rules attach to on-chain/Unlock checkout, and in which jurisdiction (OD-04)? (→ FR-059)
5. **DSAR/erasure mechanism** for engagement-request + analytics data (GDPR/POPIA)? (→ FR-057)
6. **VAT/invoicing** obligations for accepting USDC for services (John is VAT-registered in SA)?

<!-- SOURCE: BRD §12.5 / 03 §6; OWNER OD-04 -->

---

## 14. Traceability & release sequencing (pointers, not re-planning)

- **OBJ → FR → Story → AC** matrix: `business_analysis/04_user_stories.md §Traceability` (51 stories / ~108 ACs; every FR in ≥ 1 story, every OBJ in ≥ 1 FR + story). **Delta:** FR-061 needs a story — **add US-052** ("As John, I want the evidence register seeded with the 10 cleared stats + provenance notes so that every number renders only from a sourced entry"; AC: register seeded before any claim renders; studio-origin figures carry the AgileGypsy-Labs/EcoGraph note). US-034 (XMTP) shifts from a build-or-remove decision to a build story. <!-- SOURCE: 04 §Matrix; OWNER OD-02/05 -->
- **Release phases P0–P3:** `mas/project_management/04_release_roadmap.md` (P0 Foundations & Contracts → P1 MVP operable-thesis slice → P2 Beta full proof-set + rails + CTF → P3 GA hardening + XMTP + provisioning + compliance). Sequencing is **PM/Architect territory**; this doc does not re-plan it. <!-- SOURCE: charter §; roadmap P0–P3 -->

---

## 15. Assumptions, risks & tracked-open items

**Assumptions (carry):** A1 no old-site analytics → conversion KPIs are `[ASSUMPTION — baseline]`; A2 **provisioning may be absent at build start** — design must degrade (book-a-call floor always works); A3 concierge/audit depend on a live Worker → each needs a fallback; A4 John retains all deploy control (build stops at `v2`); A5 the four flagships are fixed (OD-01). <!-- SOURCE: 01_stakeholders §3.3; charter §9 -->

**Key risks (from BRD §10 / charter risk register):** R-01 **live-reliability is existential** (mitigated by BR-03/NFR-02) — RED; R-03 **bus-factor = 1** (John sole approver/deployer) — RED; R-02 provisioning latency (mitigated by book-a-call floor + FR-034 fallback); R-04 studio-metric leakage (mitigated by §11 provenance + BR-01 + NFR-09); XMTP migration risk (new SDK/MLS/wallet-signature onboarding). <!-- SOURCE: BRD §10; charter -->

**Tracked-open (non-blocking to Phase 2/3; do not gate the build):**
- **Provisioning John still owes:** real Unlock lock addresses (replace `0x…` in `contracts.js`/`retainer.json`), escrow contract deploy + funding posture, book-a-call scheduler endpoint, KTHULHU embed access. <!-- OWNER: OD-03; A2 -->
- **OD-04 jurisdiction** (UK vs SA) — compliance-phase input. <!-- OWNER: OD-04 -->
- **6 `[NEEDS RESEARCH]` compliance items** (§13). <!-- SOURCE: BRD §12.5 -->
- **Budget & wall-clock timeline** = `[REQUIRES_HUMAN_INPUT]` — genuinely absent upstream (charter §8); effort is ordinally sized (S/M/L/XL by story+gate count); non-blocking. <!-- SOURCE: charter §8 -->
- **CR-10 Neo4j-Certified reconciliation** (§11 caveat) — `[REQUIRES_HUMAN_INPUT]`; gated until reconciled. <!-- FACTS vs OWNER -->

---

## 16. Validation gate (run 2026-08-16) — PASS

| Check | Result |
|---|---|
| Identity complete (name + description, no `[FILL_IN]`) | **PASS** — §1 |
| Vision measurable (user + verb + outcome) | **PASS** — §2 (six testable outcomes) |
| ≥ 1 business goal | **PASS** — 6 objectives w/ KPIs (§4) |
| Stack confirmed or explicitly deferred | **PASS** — resolved as a fixed given in `ACTIVE_STACK.md`; architecture *design* explicitly deferred to Phase 3 |
| Compliance explicitly answered | **PASS** — §13 (clear duties ship; 6 items deferred-tracked, not invented) |
| No contradictions / one primary where multiple | **PASS** — owner-decision deltas reconciled (§12); one primary persona (S2); one primary terminal action (book-a-call) |
| No `[FILL_IN]` remaining | **PASS** — remaining markers are `[ASSUMPTION — baseline]`, `[NEEDS RESEARCH]`, or `[REQUIRES_HUMAN_INPUT]`, each justified |
| Owner decisions folded | **PASS** — §12 (incl. 3→4 flagships, XMTP build-now, all-3 rails, register seeding) |

**No `[FILL_IN]` markers remain.** Every objective has a KPI; every FR is testable and traces to an OBJ; the 60 BRD FRs are ingested and the owner-decision deltas are reconciled (61 FRs post-fold).

---

## 17. Requirements scoring (WHO / WHAT / HOW / WHY) — gate ≥ 3.0 each

**Scale 0–4** (0 absent · 1 vague · 2 partial · 3 solid & testable · 4 exceptional / evidence-complete). Axis score = mean of named sub-scores. **PASS = ≥ 3.0.**

| Axis | Sub-scores (basis) | Score |
|---|---|---|
| **WHO** | Primary persona identified & sourced to real communities **4**; secondary/owner/studio/compliance registered **4**; priority resolved (design for S2; S3/S4 same architecture) **4**; measurable success signals **3.5** (behavioral thresholds are `[ASSUMPTION — baseline]`, no old-site analytics) | **3.9** |
| **WHAT** | Scope bounded (in/out/assumptions/constraints) **4**; 61 FRs all testable + OBJ-traced **4**; 8 data entities + 12 business rules **4**; north-star operationalized into 6 testable outcomes **4** | **4.0** |
| **HOW** | Stack fully resolved as a fixed given **4**; method concrete (proof-as-interface + live-fallback + simulate-first + claims-gate engine + ticket-routing) **4**; architecture *design* completeness **3** (intentionally deferred to Phase 3); provisioning readiness **3** (real locks/escrow/scheduler pending — mitigated by book-a-call floor) | **3.5** |
| **WHY** | Market gap validated, verdict PROCEED (HIGH on positioning) **4**; 6 objectives measurable **4**; buyer's #1 fear directly answered **4**; reputational/claims rationale **3.5** (MEDIUM confidence on absolute search-demand) | **3.9** |

**Result: WHO 3.9 · WHAT 4.0 · HOW 3.5 · WHY 3.9 — all ≥ 3.0. GATE PASSED.**

---

*End REQUIREMENTS.md v1.0.0 — validated for handoff to Architecture (Phase 3). Human gate is run by the orchestrator; the human confirmation for the folded decisions already exists in `facts/01_OWNER_DECISIONS.md`.*
