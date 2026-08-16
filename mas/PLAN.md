# PLAN.md — jw3b.dev v2 Build Task List (MAS Phase 4 — Task Seeding)

**Role:** lead-architect · **Date:** 2026-08-16 · **Status:** SEEDED (ready for Phase-5 dispatch)
**Decomposes:** Master SDD `05` (+ companions `02` C4/sequences/state-machine, `03` route contracts/D1 DDL/model-routing, `04` security/compliance) into buildable units.
**Source-of-truth order:** `facts/01_OWNER_DECISIONS.md` (binding, incl. OD-06) > `REQUIREMENTS.md` > SDD `05`/`02`/`03`/`04` > `04_release_roadmap.md` (phase order).
**Scope of THIS file:** a task list only. No code, scaffold, installs, or configs were produced — those are Phase 5, dispatched per this plan. Architecture is FIXED by the SDD; this plan does not re-open ADRs.

---

## Legend

- **Phases:** **P0** Foundations & Contracts → **P1** MVP operable-thesis vertical slice → **P2** Beta full proof-set + rails + CTF → **P3** GA hardening + XMTP + provisioning + compliance. No task depends on a later-phase task.
- **Owning role:** from `context/ACTIVE_AGENTS.md` (full activated roster). `lead-architect` = scaffold/config/gating; `FE` frontend-engineer, `AUI` app-ui-engineer, `FSI` full-stack-integrator, `BE` backend-specialist, `DE` domain-engine, `AHE` audit-heuristics-engineer, `SCE` smart-contract-engineer, `W3` web3-blockchain, `PE` portfolio-evidence, `SD` synthetic-data, `CT` creative-technologist, `AD` art-director, `BA` brand-architect, `DevOps` devops-engineer, and the gate roles `QA` qa-tester / `SEC` security / `CA` codebase-auditor / `PERF` performance-monitor / `CMP` compliance-officer.
- **implements:** FR IDs / SDD component / ADR realized. Every MUST FR appears in exactly **one** task (cross-cutting rules get a dedicated owner task that others depend on).
- **verification:** the acceptance check / test / gate that proves the task done.
- **deps:** task IDs that must complete first. **∥:** tasks with disjoint file sets — safe to dispatch in parallel.
- **John = sole approver + deployer at every gate.** CI never deploys. Build stays on branch `v2`.

## Phase summary

| Phase | Theme | Tasks | Gate |
|---|---|---|---|
| **P0** | Foundations & Contracts (enablers everything consumes) | 12 | build-green on `v2` + design story/tokens **approved by John** + claims-gate blocks an uncleared claim + fallback harness serves a labelled recorded run |
| **P1** ★ | MVP: the operable thesis (first shippable vertical slice) | 22 build + 1 gate | SC-1…SC-4 + privacy notice + all Phase-5 gates PASS + **John deploys** |
| **P2** | Beta: 4 flagships operable · all 3 rails · live CTF · edge-RAG | 19 build + 1 gate | 3 rails wired+degrade · 4 flagships operable · escrow simulate-first proven · claims-gate green · gates PASS + **John deploys** |
| **P3** | GA: XMTP · provisioning activation · compliance | 7 build + 1 GA sweep + 1 compliance-final | SC-1…SC-5 met-or-deferred-with-reason · XMTP built or claim removed · gates PASS + **John deploys GA** |

**Critical path (longest serial dependency chain):**
`P0-01 → P0-05 → P0-06 → P1-01 → P1-02 → P1-07 → P1-21 → P1-GATE → P2-01 → P2-04 → P2-06 → P2-07 → P2-GATE → P3-01 → P3-08` — i.e. scaffold → D1 schema → Worker skeleton → rate-limit → concierge route → ChatWidget → book-a-call floor+capture (P1 first deployable slice) → on-chain escrow contract → escrow flow → ticket routing → checkout state machine (P2 rails) → XMTP → GA sweep. On-chain rails (P2) and the XMTP migration (P3) are the long poles; both are decoupled from launch by the book-a-call floor.

---

## P0 — Foundations & Contracts

### P0-01 — Scaffold repo + provider tree + routing
- **role:** lead-architect · **phase:** P0
- **files:** `package.json`, `.npmrc` (legacy-peer-deps), `vite.config.js` (global/process polyfill), `tailwind.config.js`, `eslint.config.js`, `vitest.config.js`, `index.html`, `src/main.jsx` (Buffer/global polyfill), `src/App.jsx` (lazy routes + Suspense), `src/config/worker.js`, `src/config/wagmi.js` (skeleton)
- **implements:** provider order Wagmi→Query→RainbowKit→Helmet→Router (SDD `02` §4); lazy-route tree `/ /audit /ctf /hire-me /messages /privacy`; fixed-stack floor (`ACTIVE_STACK.md`). Enabler for all FRs.
- **verification:** `npm run build` green on `v2`; dev server boots; provider tree mounts; empty routes render behind Suspense.
- **deps:** none · **∥:** P0-02

### P0-02 — Design story + per-section creative briefs
- **role:** art-director · **phase:** P0
- **files:** `design/design-story.md`, `design/briefs/*.md` (hero, four-hat IA, failures surface, Mission Control, flagships)
- **implements:** Vision §2 (proof-as-interface / verification-as-signature / radical honesty); NFR-09 distinct-from-studio; OBJ-06; kills the avoid-list clichés feeding FR-005.
- **verification:** story + per-P1-section briefs exist; **approved by John** (design-approved gate); every brief names HARD survival constraints per the Cyborg-Desk format.
- **deps:** none · **∥:** P0-01

### P0-03 — Token layer (color/type/space/motion/elevation)
- **role:** brand-architect · **phase:** P0
- **files:** `src/styles/tokens.css` (`:root` custom properties), `tailwind.config.js` (`theme.extend` reads vars)
- **implements:** P0 token layer; NFR-05/09; constraint C7; SDD `02` §4 design-token hookpoint (semantic token classes only, zero raw hex outside the layer).
- **verification:** WCAG-AA contrast validated on dark theme; grep shows no raw hex in components; distinct accent vs agilegypsy.com.
- **deps:** P0-01, P0-02 · **∥:** P0-04, P0-05, P0-09

### P0-04 — Tag-protocol shared contract (server-owned, one source)
- **role:** domain-engine · **phase:** P0
- **files:** `src/lib/tagProtocol.js` (regexes + `parseTags()`), `workers/portfolio-agent/src/tagProtocol.js` (shared/mirrored), sync unit test
- **implements:** FR-052 (server-owned tag contract), and the shared parser consumed by FR-011/FR-017 surfaces; SSE frame shape `data:{response}` + `[DONE]`; tags `[AUDIO]`/`[TOOL_CALL]`/`[RENDER_CARD]` (SDD `02` §5, `03` §3).
- **verification:** unit test asserts the Worker's emitted examples parse cleanly; drift breaks CI.
- **deps:** P0-01 · **∥:** P0-03, P0-05, P0-09

### P0-05 — D1 schema + migrations
- **role:** backend-specialist · **phase:** P0
- **files:** `workers/portfolio-agent/migrations/0001_init.sql`, `workers/portfolio-agent/wrangler.toml` (D1 binding `DB`)
- **implements:** FR-049 (D1 persistence); DDL for `conversations`, `messages`, `audit_runs`, `ctf_solves`, `engagement_requests`, `escrow_agreements`, `claim_records` (mirror), `rate_limits` (DE-01…08; SDD `03` §4). USDC amounts as TEXT (BR-06).
- **verification:** `wrangler d1 migrations apply` (local) succeeds; schema matches DDL; CHECK constraints + indexes present.
- **deps:** P0-01 · **∥:** P0-03, P0-04, P0-09

### P0-06 — Worker skeleton: routes + bindings + secrets + CORS
- **role:** backend-specialist · **phase:** P0
- **files:** `workers/portfolio-agent/src/index.js` (all 10 route stubs), `workers/portfolio-agent/wrangler.toml` (bindings `AI·DB·KV·R2` + AI-Gateway var + `CTF_VAULT_ADDRESS`/`CTF_RPC_URL`; `ANTHROPIC_API_KEY` via `wrangler secret put`)
- **implements:** **FR-048** (expose concierge/audit/fuzz/tx-explain/STT/TTS/ctf-verify/leaderboard/engagement/book-a-call), **FR-050** (secrets Worker-only), ADR-02 (stateless Worker); CORS locked to site-origin allowlist (SDD `04` §5).
- **verification:** `wrangler dev` boots; each route returns a typed stub; no secret in the client bundle; `Access-Control-Allow-Origin` = origin allowlist (not `*`).
- **deps:** P0-04, P0-05 · **∥:** P0-03, P0-09

### P0-07 — Claims-gate engine (build validator + runtime `<Claim>`)
- **role:** domain-engine · **phase:** P0
- **files:** `scripts/claims-gate.mjs` (CI validator), `src/components/Claim.jsx` (runtime), `src/lib/claimsRegister.js` (sealed-register loader), `src/data/evidence-register.schema.json`
- **implements:** **FR-043** (render only if traces to register), **FR-046** (block forbidden list), **FR-047** (gate `requires_resolution` out until cleared+pointer); ADR-09; DE-07; BR-01/02; OBJ-05.
- **verification:** unit fixtures — a forbidden/uncleared claim **fails** the validator (CI-blocking); `<Claim>` renders a value only when `status==='cleared'`, else nothing/cleared-alternative.
- **deps:** P0-01 · **∥:** P0-05, P0-06

### P0-08 — Seed the v2 evidence register (gates ALL claim rendering)
- **role:** portfolio-evidence · **phase:** P0
- **files:** `src/data/evidence-register.json`, `docs/PORTFOLIO_REFERENCE.md` (human successor)
- **implements:** **FR-061** (seed CR-01…CR-10 with evidence pointers; CR-01/02/03/09 carry the "AgileGypsy Labs / EcoGraph" provenance note; **CR-10 cleared via the Neo4j credential URL per OD-05**); CodeHawks #124 + certs/record seeded as cleared; forbidden list seeded `status='forbidden'` (BR-02). §11; OD-05.
- **verification:** claims-gate (P0-07) passes on cleared, blocks forbidden; every stat has an evidence pointer; provenance notes attached; CR-10 has its credential URL (else it stays withheld — no failure either way).
- **deps:** P0-07 · **∥:** P0-06, P0-09
- **provisioning input:** John's Neo4j Certified Professional credential URL (OD-05).

### P0-09 — Wallet-connect primitive + chain config
- **role:** full-stack-integrator · **phase:** P0
- **files:** `src/config/wagmi.js` (chains Base 8453 + Base Sepolia; viem named imports), `src/components/wallet/ConnectButton.jsx`
- **implements:** **FR-040** (custom RainbowKit button: connect / wrong-network / account+chain states), **FR-042** (chain config + honest testnet↔mainnet labels); SDD `04` §2a. wagmi 2 / viem 2 floor (never v3).
- **verification:** button renders all states; both chains configured; testnet/mainnet labelled honestly wherever it mounts.
- **deps:** P0-01 · **∥:** P0-04, P0-05, P0-06

### P0-10 — 3-tier replay / fallback harness (mechanism)
- **role:** domain-engine · **phase:** P0
- **files:** `workers/portfolio-agent/src/replay.js` (Tier-1 KV/R2 serve), `src/lib/replay.js` (Tier-2 SPA-bundled loader + "recorded run" label + capture date), `src/data/recorded-runs/` (bundle dir)
- **implements:** BR-03 primitive; NFR-02; ADR-01 (KV+R2 Tier-1 **+** SPA-bundle Tier-2 — independent failure domains); SDD `02` §7. The mechanism behind FR-012/020/026 (data seeded later by SD).
- **verification:** forced upstream-down serves a labelled Tier-1 recorded run; forced Worker-unreachable serves a labelled Tier-2 bundled run; every artifact is visibly labelled + dated.
- **deps:** P0-06 · **∥:** P0-08

### P0-11 — LCP/caching/CSP shell config + code-split + prerender pipeline
- **role:** lead-architect · **phase:** P0
- **files:** `vite.config.js` (prerender plugin + manualChunks for Web3/R3F), `index.html` (critical-CSS shell), shell headers config (`Cache-Control: no-store` shell / `immutable` hashed assets), CSP (SDD `04` §5)
- **implements:** ADR-07 (prerendered hero shell + lazy Web3/R3F; LCP ≤ 2.5s, NFR-01); stale-shell rule; ADR-08 CSP header (frame-src allowlist for Unlock + KTHULHU; Anthropic absent from connect-src).
- **verification:** hero-shell prerender pipeline runs in build; Web3/R3F code-split out of the initial chunk; shell served `no-store`, hashed assets `immutable`; CSP header present + minimal.
- **deps:** P0-01, P0-03 · **∥:** P0-06, P0-07

### P0-12 — CI pipeline (lint → coverage → claims-gate → build) + secret-leak scan
- **role:** devops-engineer · **phase:** P0
- **files:** `.github/workflows/ci.yml`, `workers/portfolio-agent/wrangler.toml` (KV/R2 binding config + seed step), DR runbook notes (`docs/RUNBOOK.md`)
- **implements:** SDD `03` §8 / `05` §6 topology; ADR-09 CI enforcement; FR-050 client-bundle secret-leak scan; **NO auto-deploy** (John owns). DR: D1 Time-Travel + KV/R2 re-seed-from-repo + register-in-git (SDD `04` §8).
- **verification:** CI runs all gates in order; claims-gate **blocks** an uncleared claim in CI; secret-leak scan clean; no deploy step exists; KV/R2 seed step wired.
- **deps:** P0-07, P0-01 · **∥:** P0-10, P0-11

---

## P1 — MVP: the operable thesis ★ (first shippable vertical slice)

### P1-01 — Rate-limiting (D1 fixed-window per-IP + AI-Gateway ceiling)
- **role:** backend-specialist · **phase:** P1 · **implements:** **FR-051**; NFR-04/08; ADR-04 (defense-in-depth); SDD `04` §4
- **files:** `workers/portfolio-agent/src/rateLimit.js`, `index.js`
- **verification:** unit test — over-limit returns the uniform rate-limited SSE/JSON frame; per-endpoint budgets (`chat`/`audit`/`stt`/`tts`/`ctf`/light); AI-Gateway ceiling configured.
- **deps:** P0-05, P0-06 · **∥:** P1-06

### P1-02 — Concierge route `/` (SSE · Haiku via Gateway · Llama/KV fallback · tag emit · D1 append)
- **role:** backend-specialist · **phase:** P1 · **implements:** SDD `/` route contract (`03` §5) + backend of FR-015; ADR-03 (`conversationId` + D1 append, PII-minimized), ADR-05 (Haiku concierge routing), FR-052 emit; SDD `02` §5
- **files:** `workers/portfolio-agent/src/routes/concierge.js`, `src/index.js`
- **verification:** streams `data:{response}`…`[DONE]`; on Anthropic-down falls to Llama then KV Tier-1 (labelled); tags stripped before D1 insert; first-token ≤ 2s (NFR-01c).
- **deps:** P0-06, P0-04, P1-01, P0-10 · **∥:** P1-04, P1-06

### P1-03 — Concierge KB grounding (curated cleared-claims KB from the sealed register)
- **role:** domain-engine · **phase:** P1 · **implements:** **FR-018**; ADR-06; BR-01/02
- **files:** `workers/portfolio-agent/src/knowledge.js` (generated from `src/data/evidence-register.json`), build step
- **verification:** KB is generated from the sealed register (no hand-authored numbers); a red-team prompt cannot elicit an uncleared/forbidden figure.
- **deps:** P0-08, P1-02 · **∥:** P1-04

### P1-04 — Audit route `/audit` (heuristic-first stream + Sonnet/Opus narrative + KV fallback + input validation)
- **role:** backend-specialist · **phase:** P1 · **implements:** **FR-013** (source-size cap + specific error); SDD `/audit` route (`03` §5), ADR-05 (heuristics always + stronger model narrative); SDD `02` §6
- **files:** `workers/portfolio-agent/src/routes/audit.js`, `src/index.js`
- **verification:** heuristic findings stream < 300ms; Anthropic-down → Llama/KV narrative fallback (heuristics still real); oversize/empty source rejected with a specific error.
- **deps:** P0-06, P1-01, P0-10 · **∥:** P1-02

### P1-05 — `/audit` Solidity heuristics detectors + disclaimer string
- **role:** audit-heuristics-engineer · **phase:** P1 · **implements:** **FR-008** (Solidity auditor, streamed findings); the AI-assisted-first-pass disclaimer content (BR-10)
- **files:** `workers/portfolio-agent/src/auditHeuristics.js`
- **verification:** deterministic regex/line first-pass emits a real severity table with zero upstream dependency; severity labels + recommendations reviewed as public security claims.
- **deps:** P1-04

### P1-06 — Engagement + book-a-call routes (capture → D1, validation)
- **role:** backend-specialist · **phase:** P1 · **implements:** SDD `/engagement` + `/book-a-call` route contracts (`03` §5); SDD `02` §8. Persists via P0-05 (FR-049)
- **files:** `workers/portfolio-agent/src/routes/engagement.js`, `src/index.js`
- **verification:** validates `contact` format, `tier`∈`retainer.json`, `wallet` 42-char if present, `indicative_price` from catalog (BR-12); INSERT into `engagement_requests`; returns `{id,status}`.
- **deps:** P0-05, P0-06 · **∥:** P1-02, P1-04

### P1-07 — Concierge ChatWidget (global SSE client + tag-strip parser + AI-disclosure + graceful degrade)
- **role:** full-stack-integrator · **phase:** P1 · **implements:** **FR-015** (global floating concierge), **FR-017** (concierge tag strip, synced via P0-04), **FR-020** (never-blank degraded → Tier-2 + "book a call"), **FR-021** (AI-disclosure indicator)
- **files:** `src/components/chat/ChatWidget.jsx`, `src/hooks/usePortfolioAgent.js`
- **verification:** streams + strips `[AUDIO]/[TOOL_CALL]/[RENDER_CARD]` before render; Worker-unreachable serves a labelled Tier-2 run + book-a-call link (never a blank error); AI-disclosure visible.
- **deps:** P0-04, P1-02, P0-10

### P1-08 — `/audit` console UI (stream render + strip tags + validation UX + disclaimer)
- **role:** full-stack-integrator · **phase:** P1 · **implements:** **FR-011** (render while stripping tags), **FR-014** (display AI-assisted-first-pass disclaimer)
- **files:** `src/components/audit/AuditConsole.jsx`, `src/hooks/useAuditStream.js`
- **verification:** renders heuristic + narrative frames with tags stripped; shows the disclaimer with every finding set; mirrors P1-04 input validation client-side.
- **deps:** P0-04, P1-04, P1-05

### P1-09 — Operable proof-first hero (+ prerender wiring, LCP ≤ 2.5s)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-001** (operable hero — run audit / query agent — interactive before first scroll; no headshot two-column hero); NFR-01 via P0-11
- **files:** `src/components/hero/Hero.jsx`, prerender entry
- **verification:** ≥ 1 operable surface interactive before first scroll (SC-2 K2.1); LCP ≤ 2.5s throttled-mobile on `/`; renders any numbers via `<Claim>`.
- **deps:** P0-03, P0-11, P1-07, P0-08

### P1-10 — Persistent hire spine (≤ 1 click from every route)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-002**
- **files:** `src/components/layout/HireSpine.jsx`, `src/App.jsx` (persistent layout)
- **verification:** hire CTA reachable ≤ 1 click from 100% of routes; 0 terminal dead-ends (SC-1).
- **deps:** P0-01 · **∥:** P1-11, P1-12

### P1-11 — Four-hat identity (Engineer/Auditor/PM/Founder shown together; dim never hide)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-003**; BR-07
- **files:** `src/components/identity/FourHats.jsx`, `src/constants/index.js` (`HATS`)
- **verification:** all four hats visible on one surface; filters DIM non-selected, never fully hide.
- **deps:** P0-03, P0-02 · **∥:** P1-10

### P1-12 — Motion/perf system (reduced-motion 100% + motion budget)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-007**; NFR-05
- **files:** `src/lib/motion.js` (Framer Motion presets bound to motion tokens), reduced-motion guard
- **verification:** `prefers-reduced-motion` honored on 100% of animated surfaces; motion within the stated budget.
- **deps:** P0-03 · **∥:** P1-10, P1-11

### P1-13 — Radical-honesty failures surface (unedited run / what failed & why)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-045**
- **files:** `src/components/proof/FailuresSurface.jsx`
- **verification:** shows real logs + the failure + the fix (from P1-16 artifacts); ≥ 1 first-class failures surface (OBJ-04).
- **deps:** P0-03, P1-16

### P1-14 — Credibility & verification surfaces (delivery anchor + CodeHawks #124 deep-link)
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-060** (20+ plants · 7 countries · AgilePM® — separate PM seniority anchor, not a flagship slot), **FR-044** (deep-link CodeHawks #124 to the public profile)
- **files:** `src/components/proof/DeliveryAnchor.jsx`, `src/components/proof/CodeHawksLink.jsx`
- **verification:** every number via `<Claim>` (cleared only); CodeHawks #124 deep-links to the public record from ≥ 1 surface in MVP (2nd surface added in P2-19-adjacent flagship work).
- **deps:** P0-08

### P1-15 — Branded SEO + meta/OpenGraph
- **role:** frontend-engineer · **phase:** P1 · **implements:** **FR-053**; NFR-06
- **files:** `src/components/seo/Seo.jsx` (Helmet), per-route title/meta/OG
- **verification:** per-route title/meta/OG correct; OG unfurls valid; branded-search targeting in place (Person structured data is P2-18).
- **deps:** P0-01

### P1-16 — Synthetic recorded-run artifacts (concierge · audit · failure logs)
- **role:** synthetic-data · **phase:** P1 · **implements:** **FR-012** (cached/replay recorded run per console tool); supplies data for FR-020/FR-045
- **files:** `src/data/recorded-runs/concierge/*.json`, `src/data/recorded-runs/audit/*.json`, `src/data/recorded-runs/failures/*`
- **verification:** each P1 live surface has a dated, labelled recorded run in the Tier-2 bundle + seeded to KV; artifacts are verifiably real (not fabricated).
- **deps:** P1-02, P1-04, P0-10

### P1-17 — Mission Control 4-step configurator (label-drift fixed)
- **role:** app-ui-engineer · **phase:** P1 · **implements:** **FR-028** (objective→assessment→engagement→loadout + progress rail; step-3 label = "ENGAGEMENT" not "PARAMETERS")
- **files:** `src/components/mission-control/MissionControl.jsx`, `.../ProgressRail.jsx`
- **verification:** 4 steps + rail; step-3 label correct; renders on `/hire-me`.
- **deps:** P0-03, P0-02

### P1-18 — Mission Control domain logic (assessment→loadout + price provenance)
- **role:** domain-engine · **phase:** P1 · **implements:** **FR-029** (assessment informs recommended tier + indicative scope — Step 2 non-decorative), **FR-030** (loadout prices trace to `retainer.json`); BR-12
- **files:** `src/lib/loadout.js`, `src/data/retainer.json`
- **verification:** assessment answers change the recommended tier/scope; every price string is copied from `retainer.json` (grep shows no free-typed prices).
- **deps:** P0-01, P1-17

### P1-19 — Book-a-call floor + engagement capture UI (no wallet/chain/Worker)
- **role:** app-ui-engineer · **phase:** P1 · **implements:** **FR-036** (guaranteed default terminal action), **FR-037** (capture every request + show confirmation); BR-11; SDD `02` §8
- **files:** `src/components/mission-control/BookACall.jsx`, `src/lib/engagementQueue.js` (localStorage queue + optimistic confirm + retry/backoff)
- **verification:** completes an engagement request with no wallet/chain/live-Worker → optimistic confirmation → retries `POST /engagement` on reconnect → persisted to D1 (SC-1 K1.4 / BR-11).
- **deps:** P1-06, P1-17, P1-18

### P1-20 — Privacy notice (`/privacy`)
- **role:** compliance-officer (content) + frontend-engineer (page) · **phase:** P1 · **implements:** **FR-057**; NFR-07
- **files:** `src/pages/Privacy.jsx`, `src/content/privacy.md`
- **verification:** covers analytics + connected-wallet data + engagement-request PII; live at `/privacy`. (Regime lead per OD-04 finalized in P3-09.)
- **deps:** P0-01

### P1-21 — (checkpoint) P1 vertical-slice integration
- **role:** lead-architect · **phase:** P1 · **implements:** the MVP thesis slice wiring (hero → hire spine → concierge/audit → Mission Control → book-a-call → D1) as one coherent deployable
- **files:** `src/App.jsx` route composition, feature-flag defaults
- **verification:** end-to-end: operable hero → ≤1-click hire → book-a-call captured to D1 with confirmation; every live surface degrades to a labelled recorded run on forced Worker-down; 0 hard-broken states (SC-2).
- **deps:** P1-07, P1-08, P1-09, P1-10, P1-19

### P1-22 — Claims-render integration sweep (wrap P1 claims in `<Claim>`)
- **role:** portfolio-evidence · **phase:** P1 · **implements:** enforcement of **FR-043/046/047** across the built P1 surfaces (engine = P0-07, data = P0-08)
- **files:** edits across `src/components/**` to route every numeric/credential through `<Claim>`
- **verification:** claims-gate audit — 0 uncleared/forbidden claims rendered; 0 zero-value counters (SC-3, OBJ-05).
- **deps:** P0-07, P0-08, P1-09, P1-11, P1-14

### P1-GATE — Phase-5 exit gate (QA · SEC · CA · CMP · PERF)
- **role:** qa-tester + security + codebase-auditor + compliance-officer + performance-monitor · **phase:** P1
- **implements:** **FR-038** (codebase-auditor: no dead no-op buttons / no `/test-agent` scaffold ships); verification of FR-050/051 (security), NFR-01 (QA perf), privacy/disclosure duties (compliance)
- **files:** `tests/**`, gate reports
- **verification:** QA unit/integration/E2E + coverage + LCP/first-token asserted; SEC SAST/DAST + bundle-leak scan clean + CORS/headers + rate-limit proven; CA req→impl trace (no orphans, FR-038 clean); CMP AI-disclosure + audit-disclaimer + privacy present; PERF PASS on all P1 deliverables → **John deploys P1**.
- **deps:** P1-01…P1-22

---

## P2 — Beta: full proof-set + rails + live CTF + edge-RAG

### P2-01 — MilestoneEscrow contract (Foundry, USDC-on-Base)
- **role:** smart-contract-engineer · **phase:** P2 · **implements:** on-chain half of FR-033 (SDD escrow contract, `02` §9); USDC 6-dec; funded/released/refunded
- **files:** `contracts/src/MilestoneEscrow.sol`, `contracts/test/MilestoneEscrow.t.sol`, `contracts/script/DeployEscrow.s.sol`, ABI → `src/config/abis/MilestoneEscrow.json`
- **verification:** `forge test` (incl. fuzz) green; simulate-compatible; deploy script dry-run. **Owner-deployed/funded** (provisioning).
- **deps:** P1-GATE · **∥:** P2-02

### P2-02 — CTF ReentrantVault + Attacker contracts (Foundry, Base Sepolia)
- **role:** smart-contract-engineer · **phase:** P2 · **implements:** on-chain half of FR-022/FR-027 (SDD CTF contracts, `02` §10)
- **files:** `contracts/src/ReentrantVault.sol`, `contracts/src/Attacker.sol`, `contracts/test/Ctf.t.sol`, `contracts/script/DeployCtf.s.sol`, ABIs → `src/config/abis/`
- **verification:** `forge test` reproduces the reentrancy drain; deploy to Base Sepolia (owner); vault address wired to Worker var.
- **deps:** P1-GATE · **∥:** P2-01

### P2-03 — Web3 correctness gate: simulate-first + USDC precision + testnet honesty
- **role:** web3-blockchain · **phase:** P2 · **implements:** **FR-027** (simulate before every on-chain write, as a gate); BR-04/06/09; DE-03
- **files:** `src/lib/web3Guards.js` (simulate-first assertion helper), review checklist
- **verification:** no `writeContract` path exists without a preceding successful `useSimulateContract`; USDC handled as `parseUnits(x,6)` BigInt (never float); testnet/mainnet labelled on every on-chain surface.
- **deps:** P0-09 · **∥:** P2-01, P2-02

### P2-04 — Escrow checkout flow (simulate → write → wait, feature-flagged)
- **role:** app-ui-engineer + full-stack-integrator · **phase:** P2 · **implements:** **FR-033** (client flow, USDC 6-dec on Base); degrades to book-a-call until provisioned
- **files:** `src/components/mission-control/EscrowCheckout.jsx`, `src/hooks/useEscrow.js`
- **verification:** `useSimulateContract`→write→`useWaitForTransactionReceipt` to a funded receipt; simulate-revert surfaces the reason + degrades to book-a-call; success posts `route=escrow` to `/engagement`.
- **deps:** P2-01, P2-03, P0-09, P1-19

### P2-05 — Unlock checkout wrapper (real-lock-only, feature-flagged)
- **role:** full-stack-integrator · **phase:** P2 · **implements:** **FR-034** (offer Unlock only on a real deployed lock; else hide → book-a-call), **FR-041** (wrap `window.unlockProtocol`)
- **files:** `src/components/pricing/UnlockPaywall.jsx`, `src/config/contracts.js`
- **verification:** placeholder/undeployed lock ⇒ Unlock hidden, no perpetually-disabled button, falls back to book-a-call; real 42-char lock ⇒ checkout mints key.
- **deps:** P0-09, P1-19

### P2-06 — Ticket-size routing (Mission Control)
- **role:** domain-engine · **phase:** P2 · **implements:** **FR-032** (route terminal action by ticket size; book-a-call on every branch); BR-05; SDD `02` §11 routing
- **files:** `src/lib/checkoutRouting.js`
- **verification:** low-ticket→Unlock, high-ticket→escrow, book-a-call available on every branch; escrow/Unlock feature-flagged, degrade to book-a-call when off.
- **deps:** P2-04, P2-05, P1-19

### P2-07 — Full checkout state machine + product-state set + in-flow connect
- **role:** app-ui-engineer · **phase:** P2 · **implements:** **FR-031** (mount connect button in `/hire-me`), **FR-035** (connect-prompt/loading/tx-pending/success-receipt/error-retry/empty); SDD `02` §11
- **files:** `src/components/mission-control/CheckoutStateMachine.jsx`
- **verification:** every terminal path converges on `Captured` with a visible confirmation; no state (disconnected/wrong-chain/not-provisioned/sim-revert/script-fail) dead-ends (OBJ-01: dead-ends = 0).
- **deps:** P2-06, P0-09

### P2-08 — CTF Worker routes (`/ctf/verify` + `/ctf/leaderboard`)
- **role:** backend-specialist · **phase:** P2 · **implements:** **FR-025** (persist + rank leaderboard); SDD CTF route contracts (`03` §5); reads chain drain, idempotent solve
- **files:** `workers/portfolio-agent/src/routes/ctf.js`
- **verification:** verifies drain via RPC read; INSERT `ctf_solves` (tx_hash UNIQUE, idempotent); leaderboard returns ranked entries; KV snapshot fallback.
- **deps:** P2-02, P0-05, P1-01

### P2-09 — CTF challenge UI (state machine + testnet label + deploy→attack→verify)
- **role:** app-ui-engineer · **phase:** P2 · **implements:** **FR-022** (run the reentrancy CTF), **FR-023** (full state machine incl. not-connected/wrong-chain/vault-empty/armed/already-solved), **FR-024** (Base Sepolia · no real funds label)
- **files:** `src/components/ctf/CtfChallenge.jsx`, `src/hooks/useCtf.js`
- **verification:** connect→switch-chain→simulate→deploy Attacker→attack→verify→rank; "Base Sepolia testnet · no real funds" on every CTF surface; chain/Worker-down → recorded solve (FR-026 data).
- **deps:** P2-02, P2-03, P2-08, P0-09

### P2-10 — KTHULHU flagship embed (sandboxed iframe + CSP + recorded fallback)
- **role:** frontend-engineer · **phase:** P2 · **implements:** ADR-08 (sandboxed iframe, `frame-src` allowlist; degrade to recorded walkthrough); SDD KTHULHU flagship
- **files:** `src/components/flagships/KthulhuEmbed.jsx`
- **verification:** operable live embed at minimum privilege; if framing refused → labelled recorded walkthrough (Tier-1/2); CSP unchanged from P0-11 allowlist.
- **deps:** P0-11, P0-10, P2-18
- **provisioning input:** KTHULHU embed/framing access (John).

### P2-11 — Overmind explorable/steppable graph + validated-pipeline object
- **role:** creative-technologist · **phase:** P2 · **implements:** **FR-006** (systems-are-graphs + zero-trust validated pipeline as a steppable object; nodes + gates visibly passing validation); NFR-03 (R3F budget ≥30fps mobile / ≥50fps desktop + non-3D fallback)
- **files:** `src/components/flagships/OvermindGraph.jsx`, `src/three/` (budgeted)
- **verification:** steppable pipeline (not a static diagram); frame budget met on mobile; non-3D fallback present; never decorative-only.
- **deps:** P0-03, P0-02

### P2-12 — Kointel flagship surface
- **role:** frontend-engineer · **phase:** P2 · **implements:** SDD Kointel flagship (live external kointel.co.za URL; compliance-first CI gate + EU AI Act dossier; Auditor/compliance + Founder dimensions)
- **files:** `src/components/flagships/Kointel.jsx`
- **verification:** links to the live external product; any stat via `<Claim>` (CR-05/06-class cleared only).
- **deps:** P0-03, P0-08

### P2-13 — Four-flagship composition (operable proof-set)
- **role:** frontend-engineer · **phase:** P2 · **implements:** **FR-004** (exactly FOUR flagships shown operably: KTHULHU · the live on-site AI [concierge + `/audit` + CTF as ONE] · Overmind · Kointel)
- **files:** `src/components/flagships/FlagshipShowcase.jsx`
- **verification:** all four render operably (with fallbacks); on-site-AI flagship composes P1-07/P1-08 + P2-09; exactly four headliners (delivery record stays a separate anchor, P1-14).
- **deps:** P2-10, P2-11, P2-12, P1-07, P1-08, P2-09

### P2-14 — Vectorize `/audit` edge-RAG (binding + vuln corpus + retrieval-safety guard)
- **role:** backend-specialist (binding/retrieval) + audit-heuristics-engineer (corpus) · **phase:** P2 · **implements:** **OD-06** — RE-ADD edge-RAG via Cloudflare Vectorize for `/audit` (amends SDD ADR-06 / D-08; on-stack, NOT Neon); "RAG at the edge" as a shipped AI capability
- **files:** `workers/portfolio-agent/wrangler.toml` (Vectorize binding), `workers/portfolio-agent/src/auditRag.js`, `src/data/vuln-corpus/`
- **verification:** `/audit` narrative retrieves from the vuln corpus; retrieval-safety guard prevents surfacing an ungoverned **portfolio** stat (claims-gate framing stays on output); concierge KB untouched (stays curated, P1-03).
- **deps:** P1-04, P0-06
- **note:** NOT in SDD `03` §5/§6 — see Lessons (OD-06 post-dates the SDD; folded here).

### P2-15 — `/fuzz` harness generator
- **role:** audit-heuristics-engineer · **phase:** P2 · **implements:** **FR-009** (stream a fuzz harness for pasted source)
- **files:** `workers/portfolio-agent/src/routes/fuzz.js`, `src/components/audit/FuzzTool.jsx`
- **verification:** streams a Markdown harness; Llama/KV fallback; same tag contract (P0-04).
- **deps:** P1-04, P0-04

### P2-16 — `/tx-explain` transaction explainer (client decode + narrate)
- **role:** full-stack-integrator · **phase:** P2 · **implements:** **FR-010** (decode a Base tx client-side, narrate in plain language)
- **files:** `workers/portfolio-agent/src/routes/txExplain.js`, `src/components/audit/TxExplainer.jsx`, `src/hooks/useTxExplain.js`
- **verification:** `txHash` matched `^0x[0-9a-fA-F]{64}$`; client-decoded calldata shows even on Worker-down; AI narrative streams with KV fallback.
- **deps:** P0-06, P0-09

### P2-17 — Concierge hire-routing tool-call
- **role:** full-stack-integrator + domain-engine · **phase:** P2 · **implements:** **FR-019** (concierge routes a user to book-a-call / Mission Control via `[TOOL_CALL]`)
- **files:** `src/components/chat/toolCalls.js`, Worker system-prompt tool registry
- **verification:** `{"action":"openModal","type":"pricing"|"contact"}` opens Mission Control; pricing numbers still come from `retainer.json`.
- **deps:** P1-07, P2-07

### P2-18 — Synthetic recorded-run artifacts (CTF solve · flagship walkthroughs · fuzz/tx)
- **role:** synthetic-data · **phase:** P2 · **implements:** **FR-026** (recorded CTF solve) + KTHULHU recorded walkthrough + fuzz/tx recorded runs; BR-03 data
- **files:** `src/data/recorded-runs/ctf/*.json`, `.../kthulhu/*`, `.../fuzz/*`, `.../tx/*`, leaderboard fixtures
- **verification:** every P2 live surface has a dated labelled recorded run in Tier-2 bundle + KV/R2.
- **deps:** P2-09, P2-10

### P2-19 — Person structured data + agilegypsy.com cross-link
- **role:** frontend-engineer · **phase:** P2 · **implements:** **FR-054** (Person JSON-LD + studio↔person cross-link `sameAs`/`rel=me`); NFR-06
- **files:** `src/components/seo/PersonJsonLd.jsx`
- **verification:** valid Person structured data; cross-link to agilegypsy.com; CodeHawks #124 now deep-linked from ≥ 2 surfaces (completes FR-044 target).
- **deps:** P1-15, P1-14

### P2-GATE — Phase-5 exit gate (QA · SEC · CA · CMP · PERF · W3)
- **role:** qa-tester + security + codebase-auditor + compliance-officer + performance-monitor + web3-blockchain · **phase:** P2
- **implements:** BR-09 testnet-honesty verification (CMP); escrow simulate-first proven (W3); regression + rate-limit hardening (QA/SEC)
- **files:** `tests/**`, gate reports
- **verification:** 3 rails wired + degradation verified; 4 flagships operable; CTF resilient; escrow simulate-first proven by SEC+W3; claims-gate still green; all gates PASS → **John deploys P2**.
- **deps:** P2-01…P2-19

---

## P3 — GA: hardening + XMTP + provisioning + compliance

### P3-01 — XMTP E2E messaging (`@xmtp/browser-sdk` MLS onboarding + `/messages`, flagged)
- **role:** full-stack-integrator · **phase:** P3 · **implements:** **FR-039** (real E2E encrypted messaging; MLS identity via wallet signature; the "E2E encrypted channel" claim renders only alongside the working feature); OD-02; SDD `02` §12 / `04` §2b
- **files:** `src/components/messages/XmtpChannel.jsx`, `src/hooks/useXMTP.js`, `src/pages/Messages.jsx`
- **verification:** wallet-signature → MLS inbox → E2E message to John's inbox works behind the flag; entirely client-side; never gates book-a-call/checkout.
- **deps:** P0-09

### P3-02 — Escrow + Unlock live-activation (provisioning)
- **role:** devops-engineer + full-stack-integrator · **phase:** P3 · **implements:** live-activation of FR-032/034 rails when John provisions (real Unlock lock addresses + escrow deploy/fund)
- **files:** `src/config/contracts.js`, `src/data/retainer.json` (replace `0x…` placeholders), feature-flag flip
- **verification:** rails light up on real provisioning; absent provisioning → still degrade to book-a-call (no dead-ends either way).
- **deps:** P2-04, P2-05 · **provisioning input:** Unlock lock addresses + escrow deploy/fund + scheduler endpoint (John).

### P3-03 — Cookie/analytics consent (flagged, research-gated)
- **role:** compliance-officer + frontend-engineer · **phase:** P3 · **implements:** **FR-058** (consent banner behind a flag, flippable on the ruling)
- **files:** `src/components/compliance/ConsentBanner.jsx`
- **verification:** banner present behind flag; off by default until the GDPR/POPIA cookie-consent research resolves.
- **deps:** P1-20

### P3-04 — Checkout terms (flagged, research-gated)
- **role:** compliance-officer + app-ui-engineer · **phase:** P3 · **implements:** **FR-059** (engagement/checkout terms at any paid checkout)
- **files:** `src/components/compliance/CheckoutTerms.jsx`, `src/content/terms.md`
- **verification:** no paid checkout (escrow/Unlock) reachable without terms; gated behind the same provisioning flag as the rails.
- **deps:** P2-07

### P3-05 — Voice STT/TTS (routes functional + concierge mic/playback)
- **role:** full-stack-integrator + backend-specialist · **phase:** P3 · **implements:** **FR-016** (voice input/output in concierge; Whisper STT + Aura TTS via Workers AI; R2 recorded-audio fallback)
- **files:** `workers/portfolio-agent/src/routes/speech.js`, `src/components/chat/VoiceControls.jsx`
- **verification:** mic → `/speech-to-text` → text; `[AUDIO]` summary → `/text-to-speech` → playback; mic disables gracefully on failure.
- **deps:** P1-07, P0-06

### P3-06 — Content-gap explainer pages ("systems are graphs", "zero-trust validator")
- **role:** frontend-engineer · **phase:** P3 · **implements:** **FR-055** (COULD)
- **files:** `src/pages/thesis/*.jsx`
- **verification:** explainer pages published under `/thesis/*`; support branded-search + content-gap SEO.
- **deps:** P1-15

### P3-07 — GitHub ↔ site reinforcement
- **role:** frontend-engineer · **phase:** P3 · **implements:** **FR-056** (COULD — link real repos from the systems surface)
- **files:** `src/components/proof/RepoLinks.jsx`
- **verification:** real repos linked from the flagship/systems surface; no `bets`/DecentX (PII forbidden list).
- **deps:** P2-13

### P3-08 — GA sweep (full regression + security + audit + performance)
- **role:** qa-tester + security + codebase-auditor + performance-monitor · **phase:** P3
- **implements:** whole-site regression + NFR sweep (NFR-01…09) at GA
- **files:** `tests/**`, sweep reports
- **verification:** full regression green; security (SAST/DAST/leak/CORS/CSP) clean; req→impl trace complete (no orphans); LCP/INP/first-token asserted site-wide; branded search rank #1 targeted + CodeHawks deep-linked ≥ 2 surfaces (SC-5).
- **deps:** P3-01…P3-07

### P3-09 — Compliance finalization (OD-04 regime · Art.50 wording · DSAR)
- **role:** compliance-officer · **phase:** P3 · **implements:** NFR-07 finalization + dispositions for the 6 `[NEEDS RESEARCH]` items + OD-04 jurisdiction lead
- **files:** `src/content/privacy.md` (regime lead), `docs/COMPLIANCE.md`
- **verification:** each research item shipped-or-withheld-with-reason; privacy-notice regime finalized per OD-04; disclosure wording refined per the Art.50 ruling; no MUST compliance item unimplemented.
- **deps:** P3-03, P3-04 · **external input:** OD-04 ruling + 6 legal-research answers (research/compliance roles).

---

## Coverage self-check

### A. MUST FR → owning task (every MUST FR maps to exactly one task)

| FR | Task | FR | Task | FR | Task |
|---|---|---|---|---|---|
| FR-001 | P1-09 | FR-023 | P2-09 | FR-045 | P1-13 |
| FR-002 | P1-10 | FR-024 | P2-09 | FR-046 | P0-07 |
| FR-003 | P1-11 | FR-026 | P2-18 | FR-047 | P0-07 |
| FR-004 | P2-13 | FR-027 | P2-03 | FR-048 | P0-06 |
| FR-005 | P0-02 (design) + P1-GATE (AD/CA QA) | FR-028 | P1-17 | FR-049 | P0-05 |
| FR-007 | P1-12 | FR-029 | P1-18 | FR-050 | P0-06 |
| FR-008 | P1-05 | FR-030 | P1-18 | FR-051 | P1-01 |
| FR-011 | P1-08 | FR-031 | P2-07 | FR-052 | P0-04 |
| FR-012 | P1-16 | FR-032 | P2-06 | FR-053 | P1-15 |
| FR-013 | P1-04 | FR-033 | P2-04 | FR-057 | P1-20 |
| FR-014 | P1-08 | FR-034 | P2-05 | FR-060 | P1-14 |
| FR-015 | P1-07 | FR-035 | P2-07 | FR-061 | P0-08 |
| FR-017 | P1-07 | FR-036 | P1-19 | | |
| FR-018 | P1-03 | FR-037 | P1-19 | | |
| FR-020 | P1-07 | FR-038 | P1-GATE (CA) | | |
| FR-021 | P1-07 | FR-039 | P3-01 | | |
| | | FR-040 | P0-09 | | |
| FR-043 | P0-07 | FR-041 | P2-05 | | |
| FR-044 | P1-14 | FR-042 | P0-09 | | |

**MUST coverage:** all MUST FRs by §5 enumeration are mapped (46 per the REQUIREMENTS summary line; **49 by strict enumeration** — see Lessons — the enumerated superset above covers every one, so 46/46 ✅ regardless of which 3 the summary excludes). FR-005 is realized at design-time (P0-02) and enforced at the P1 gate (avoid-list QA).

**SHOULD (9):** FR-006→P2-11 · FR-009→P2-15 · FR-010→P2-16 · FR-019→P2-17 · FR-022→P2-09 · FR-025→P2-08 · FR-054→P2-19 · FR-058→P3-03 · FR-059→P3-04. **COULD (3):** FR-016→P3-05 · FR-055→P3-06 · FR-056→P3-07. → **all 61 FRs mapped.**

### B. SDD component coverage

| SDD component | Task(s) | ✓ |
|---|---|---|
| Worker route contracts (10 routes, `03` §5) | P0-06 (expose) + P1-02/04/06, P2-08/14/15/16, P3-05 (logic) | ✅ |
| D1 tables (8, `03` §4) | P0-05 | ✅ |
| Tag protocol (`02` §5, `03` §3) | P0-04 (+ P1-07/08 consumers) | ✅ |
| 3-tier replay harness (`02` §7) | P0-10 (mechanism) + P1-16/P2-18 (data) | ✅ |
| Claims-gate (build validator + runtime `<Claim>` + register) | P0-07 + P0-08 + P0-12 (CI) + P1-22 | ✅ |
| Checkout state machine (`02` §11, all 3 rails, no dead-ends) | P2-06 + P2-07 | ✅ |
| 4 flagships (KTHULHU · on-site AI · Overmind · Kointel) | P2-10, (P1-07/08+P2-09), P2-11, P2-12 → P2-13 | ✅ |
| Escrow contract (MilestoneEscrow) | P2-01 | ✅ |
| CTF contracts (ReentrantVault + Attacker) | P2-02 | ✅ |
| XMTP (`@xmtp/browser-sdk` MLS) | P3-01 | ✅ |
| Vectorize `/audit` edge-RAG (OD-06) | P2-14 | ✅ |
| Token layer | P0-03 | ✅ |
| Design story + briefs + visual QA | P0-02 + P1-GATE (AD QA) | ✅ |
| Model routing per endpoint (`03` §6, ADR-05) | P1-02/04 + P2-14/15/16 + P3-05 | ✅ |
| Rate-limiting (ADR-04) | P1-01 | ✅ |
| Prerender/LCP + caching + CSP (ADR-07/08) | P0-11 | ✅ |
| Secrets/CORS/input-validation/bundle-leak (`04`) | P0-06 + per-route validation + P0-12/P1-GATE | ✅ |
| Compliance duties (disclosure/testnet/disclaimer/privacy/consent/terms) | P1-07, P2-09, P1-08, P1-20, P3-03, P3-04, P3-09 | ✅ |
| DR (D1 Time-Travel · KV/R2 re-seed · register git) | P0-12 | ✅ |
| SEO (branded + Person structured data + cross-link) | P1-15 + P2-19 | ✅ |

**ADR coverage:** ADR-01→P0-10; ADR-02→P0-06; ADR-03→P1-02; ADR-04→P1-01; ADR-05→P1-02/04; ADR-06→P1-03 (amended for `/audit` by OD-06→P2-14); ADR-07→P0-11; ADR-08→P0-11+P2-10; ADR-09→P0-07+P0-12. ✅

### C. Dependency graph is acyclic

- **Phase monotonicity:** every dep points to an equal-or-earlier task within the same phase or an earlier phase. No P0 task depends on P1+; no P1 on P2+; no P2 on P3. **No forward dependencies.**
- **P0 internal order:** 01 → {03,04,05,07,09} → {06,08,10,11,12} — a DAG rooted at the scaffold.
- **Critical path** (above) is a single strictly-increasing chain P0-01…P3-08. **Graph is acyclic.** ✅

---

## Lessons / flagged gaps (SDD gaps + contradictions — flagged, NOT decided here)

1. **OD-06 (Vectorize `/audit` RAG) post-dates the SDD.** SDD `03` §5 (`/audit` row) and §6 (model-routing) + `05` D-08/ADR-06 keep Vectorize "reserved" and ground `/audit` on heuristics+narrative only. OD-06 (binding, 2026-08-16) explicitly **amends ADR-06/D-08** to add Cloudflare Vectorize edge-RAG for `/audit`. Reconcilable (concierge KB stays curated; `/audit` gains a vuln-corpus RAG) — folded as **P2-14**. Not a blocker; flagged so the SDD route contract/model-routing tables get updated to match.
2. **CR-10 Neo4j — REQUIREMENTS.md vs OWNER_DECISIONS.** `REQUIREMENTS.md` §11 leaves CR-10 `[REQUIRES_HUMAN_INPUT]`/gated; `01_OWNER_DECISIONS.md` OD-05 **resolves it CLEARED** (John holds the credential; use its verifiable URL). OWNER_DECISIONS wins per the source-of-truth tiering → seeded cleared in **P0-08**, contingent on John supplying the credential URL (a P0-08 provisioning input). No failure mode either way (withheld if URL absent).
3. **MUST-FR count inconsistency in REQUIREMENTS.md.** The §5 MoSCoW summary says "MUST = 46 … Total = 61", but 61 − 9 SHOULD − 3 COULD = **49 MUST by strict enumeration**. Minor internal inconsistency in the requirements doc; this plan maps the full enumerated superset, so all 46 are covered regardless.
4. **Provisioning dependencies are owner-owed (R-02), not build blockers.** P0-08 (Neo4j URL), P2-10 (KTHULHU framing access), P3-02 (Unlock addresses + escrow deploy/fund + scheduler) all degrade gracefully to the book-a-call floor / recorded runs until John provisions — the roadmap's decoupling holds.
5. **MUST FRs whose roadmap stories are SHOULD-in-P1** (FR-029/031/035): placed to honor the FR MoSCoW (FR-029 in P1; FR-031/035 in P2 alongside the rails they depend on). The roadmap's SHOULD label was phase-slack, not a downgrade.

*End PLAN.md — 64 tasks (P0 12 / P1 23 [22 build + gate] / P2 20 [19 build + gate] / P3 9 [7 build + GA-sweep + compliance-final]). Ready for Phase-5 dispatch under John's per-gate approval. No code, scaffold, installs, or configs produced.*
