# 05 — Master Solution Design Document (SDD) — jw3b.dev v2

**Role:** solutions-architect (MAS Phase 3) · **Date:** 2026-08-16 · **Status:** **COMPLETE — DRAFT for
John's approval** (human sign-off gates the build per the roadmap; all NFRs pre-approved upstream).
**Companion phase docs:** `01_requirements_and_nfrs.md` · `02_system_context_and_data_flow.md` ·
`03_tech_stack_and_infrastructure.md` · `04_security_and_compliance_model.md`.
**Source-of-truth order:** `REQUIREMENTS.md` > `01_OWNER_DECISIONS.md` > general knowledge.

---

## 1. Executive summary

jw3b.dev v2 is an **edge-serverless React SPA + a single Cloudflare Worker**, designed around one
existential constraint: **"a portfolio you OPERATE, not read" dies if a live surface breaks on load**
(risk R-01, RED). The whole architecture therefore hangs on a **3-tier replay/fallback spine** — every
live surface (concierge, `/audit`, CTF, KTHULHU embed) degrades to a **labelled recorded run**: Tier-1 from
the Worker (KV/R2) when an upstream is down, Tier-2 from the SPA's own bundle when the Worker is
unreachable — so *live degrades to verifiably-real, never broken* (NFR-02, ≥95% effective success, 0
hard-broken states). The one always-available conversion path, **book-a-call**, is client-queued and
depends on no wallet, no chain, and no live Worker (BR-11).

The platform is **fixed** (React 19 · Vite · Tailwind · wagmi 2/viem 2/RainbowKit 2 · Cloudflare Worker +
Workers AI + D1 + **Anthropic via AI Gateway** · `@xmtp/browser-sdk` · Foundry). The nine architecture
decisions this SDD makes are the *open* ones within that platform. The headline resolved choices:

- **Replay store:** KV (transcripts) + R2 (media) for Tier-1, **plus** SPA-bundled Tier-2 — chosen over D1
  precisely because the fallback must not share the live DB's failure domain (ADR-01).
- **Orchestration:** **stateless Worker + D1**; Durable Objects / Workflows deferred with named triggers
  (ADR-02).
- **Model routing:** **Haiku for the concierge, stronger models reserved for security analysis**, with a
  Workers-AI (Llama) → KV → client fallback chain; all Anthropic traffic through the AI Gateway cost/rate
  choke point (ADR-05, NFR-01/02/08).
- **Claims gate:** a **build-time** validator over a repo evidence register that **fails CI** on any
  uncleared/forbidden claim, with the concierge KB generated from that same register so the AI can't state
  an ungoverned number (ADR-06/09, BR-01/02).
- **First paint:** **prerendered hero shell** + inline critical CSS, hydrate + lazy-load Web3/R3F after
  (ADR-07, LCP ≤ 2.5s); the SPA shell is never edge-cached (stale-shell trap).

Conversion (Mission Control) is a real product with a **checkout state machine** across all three rails
(book-a-call floor · escrow simulate→write→wait USDC-6-dec · Unlock real-lock-only), every terminal path
converging on a confirmed `Captured` state — **zero dead-ends**. Escrow + Unlock are built now but
**feature-flagged on owner provisioning** and degrade to book-a-call until live.

---

## 2. Architecture at a glance

- **Pattern:** edge-serverless SPA + one stateless edge Worker; state in D1/KV/R2; 3-tier replay spine
  (doc 02 §1, §7).
- **C4 L1 + L2:** doc 02 §2–§3 (Mermaid, protocols annotated).
- **Primary journeys (6 sequence diagrams):** concierge SSE + tag-parse + fallback (02 §5); `/audit`
  heuristic-first stream (02 §6); book-a-call capture → D1, no wallet/chain (02 §8); escrow
  simulate→write→wait (02 §9); CTF exploit→verify (02 §10); XMTP MLS onboarding (02 §12).
- **Checkout state machine:** doc 02 §11 (all 3 rails, book-a-call floor, no dead-ends).
- **Route contracts + D1 DDL + model routing:** doc 03 §4–§6.
- **Security/compliance/DR:** doc 04.

---

## 3. Selected stack + the key architecture choices (justified)

| Layer | Choice | Justifying NFR |
|---|---|---|
| Frontend | React 19 · Vite · Tailwind (token layer) · Framer Motion · R3F optional/budgeted | fixed; NFR-03/05 |
| First paint | prerendered hero shell + lazy Web3/R3F (ADR-07) | NFR-01 (LCP ≤ 2.5s) |
| Web3 | wagmi 2 · viem 2 · RainbowKit 2 · Unlock · USDC 6-dec · simulate-first | fixed; BR-04/06 |
| Backend | one stateless Cloudflare Worker (ADR-02) | NFR-01/08 |
| AI | Anthropic **via AI Gateway** (Haiku concierge / stronger audit) + Workers-AI fallback (ADR-05) | NFR-01/02/08 |
| Concierge grounding | curated **cleared-claims KB** (drop Neon RAG) (ADR-06) | BR-01/02, NFR-08 |
| Data | D1 (analytics/leaderboard/engagements/escrow-index/rate-limits) — DDL doc 03 §4 | FR-049 |
| Replay | KV + R2 (Tier-1) + SPA bundle (Tier-2) (ADR-01) | NFR-02 (R-01) |
| Rate/cost | D1 fixed-window + AI-Gateway ceiling (ADR-04) | NFR-04/08 |
| Claims | build-time gate over repo register + runtime `<Claim>` (ADR-09) | BR-01/02, OBJ-05 |
| Messaging | `@xmtp/browser-sdk` (MLS), client-side, P3, flagged | FR-039 |
| Contracts | Foundry — MilestoneEscrow (Base) + ReentrantVault/Attacker (Base Sepolia) | FR-022/033 |
| Embeds | sandboxed iframe + strict CSP, degrade to recorded run (ADR-08) | NFR-04 |

---

## 4. Data architecture

- **D1 (authoritative for off-chain state):** `conversations`, `messages` (tag-stripped, PII-minimized,
  `source` live/replay), `audit_runs` (hashed input, no raw source), `ctf_solves` (leaderboard),
  **`engagement_requests`** (the conversion record — DE-01), `escrow_agreements` (off-chain mirror; chain is
  authoritative), `rate_limits` (per-IP/endpoint window). Full DDL: doc 03 §4.
- **Repo files (build-time authoritative):** the **evidence register** (ClaimRecord DE-07) + **credentials**
  (DE-08) — versioned, PR-reviewable, CI-enforced (ADR-09). This is what makes claims discipline a *gate*,
  not a convention.
- **On-chain (authoritative for money/solves):** MilestoneEscrow state (funded/released/refunded, USDC
  6-dec BigInt), ReentrantVault drain. D1 only mirrors/indexes these.
- **KV/R2 (recorded runs):** the labelled replay artifacts; canonical copies live in the repo (Tier-2) and
  are seeded to KV/R2 on deploy.
- **Precision invariant:** USDC amounts are TEXT in D1 and `parseUnits(x,6)` BigInt on the client — never a
  float (BR-06).

---

## 5. Security model (summary; full in doc 04)

Secrets Worker-only (`wrangler secret put`; CI bundle-leak scan) · browser never calls Anthropic (only the
Worker→Gateway) · input validation on every AI + on-chain input · simulate-before-write (BR-04) ·
defense-in-depth rate-limiting (D1 window + AI-Gateway ceiling) · strict CSP with a minimal allowlist for
the Unlock + KTHULHU embeds (doc 04 §5) · CORS locked to the site origin (not `*`) · wallet/PII minimized
and covered by the privacy notice. No login/RBAC (public portfolio); the only identity primitives are
wallet-connect and XMTP MLS, both client-side with no server session to revoke.

---

## 6. Deployment topology (doc 03 §8)

Vite build (+ hero prerender) → Cloudflare static hosting (**shell `no-store`**, hashed assets
`immutable`). Worker `portfolio-agent` v2 with bindings `AI · DB(D1) · KV · R2` + `ANTHROPIC_API_KEY`
secret + AI-Gateway/CTF vars. Contracts on Base / Base Sepolia, **owner-deployed**. CI = lint → coverage →
**claims-gate validator** → build; **CI does not deploy — John owns every deploy** (branch `v2`).

---

## 7. Cost estimate (NFR-08 — mechanism-bound; $ figures flagged)

Bounded by five independent mechanisms: AI-Gateway ceiling (hard backstop) · per-IP D1 window ·
`maxTokens` caps · right-sized models (Haiku concierge) · Workers-AI native STT/TTS/fallback. Dominant
driver = Anthropic tokens on `/audit` + concierge. **Exact monthly $ = `[NEEDS RESEARCH]`** (traffic ×
current Cloudflare/Anthropic list prices — not fabricated); three volume scales (10²/10³/10⁴ AI-calls-day)
are given in doc 03 §7 for a research role to price. **The guarantee that holds regardless of price:** a
public visitor cannot drive unbounded spend, because the AI Gateway caps it independent of app logic.

---

## 8. Accepted technical debt (explicit — hidden debt is the expensive kind)

| # | Debt | Why accepted | Mitigation / trigger to revisit |
|---|---|---|---|
| D-01 | **Cloudflare is a single-vendor SPOF** (Worker, D1, KV, R2, hosting, AI Gateway, DNS) | multi-cloud is out of scope/budget; CF is the fixed platform | Tier-2 client replay + client-queued book-a-call survive Worker/D1/AI loss; only a **total CF edge outage** = site down (documented, accepted) |
| D-02 | D1 fixed-window rate-limit **race under burst** | simplest; AI-Gateway ceiling backstops spend | promote to CF native Rate-Limiting or a DO token-bucket if abuse observed (ADR-04) |
| D-03 | Concierge **sends full history each turn** (token growth) | stateless = cheap/simple (ADR-03) | client truncates to last N turns + `maxTokens` cap |
| D-04 | **Replay artifacts must be curated** and can drift from live | the only way to guarantee NFR-02 | capture-dated + "recorded run" label + refreshed each release |
| D-05 | Escrow/Unlock ship **dark (flagged)** until John provisions | provisioning may lag build (R-02) | book-a-call floor covers 100% of conversion until rails light up |
| D-06 | **CR-10 Neo4j** reconciliation (OD-05 clears w/ credential URL vs `REQUIREMENTS.md §11` "gated until reconciled") | claims-gate is ruling-agnostic | clears the instant its credential-URL evidence pointer is attached at P0; withheld until then — **no failure mode either way** |
| D-07 | **6 compliance questions + OD-04** open | genuinely need legal research; not inventable | clear duties ship now; consent/terms behind a flag; no paid checkout without terms |
| D-08 | **Neon RAG dropped** for the curated KB | claims-safety + one fewer vendor > open-domain recall | Vectorize reserved if a large-corpus need appears |
| D-09 | Exact AI **$ not yet measured** | can't fabricate pricing | research role prices the 3 volume scales |

---

## 9. Full ADR decision log (each a ≥2-option comparison on an OPEN choice)

| ADR | Decision | Chosen because (NFR/BR) | Rejected alternative(s) |
|---|---|---|---|
| **ADR-01** | KV+R2 Tier-1 **+** SPA-bundle Tier-2 replay | NFR-02 — max failure-domain independence | D1 rows (shares the hedged DB's SPOF); client-only (can't refresh/vary) |
| **ADR-02** | Stateless Worker + D1 request path | NFR-01/08 — low latency, low cost | Durable Objects / Workflows (deferred w/ triggers) |
| **ADR-03** | Client `conversationId` + D1 append | NFR-08/07 — no per-session infra, less PII | DO-per-session; signed-cookie session |
| **ADR-04** | D1 fixed-window + AI-Gateway ceiling | NFR-08 — defense-in-depth cost bound | CF native RL; DO token-bucket (upgrade paths) |
| **ADR-05** | Anthropic-via-Gateway per-endpoint + Workers-AI fallback | NFR-01/02/08 — fast+resilient+cheap | Workers-AI-only (quality); Anthropic-only (no fallback → fails NFR-02) |
| **ADR-06** | Curated cleared-claims KB (drop Neon RAG) | BR-01/02 — AI can't state an ungoverned number | Vectorize; Neon pgvector (off-stack vendor + BR-01 risk) |
| **ADR-07** | Prerendered hero shell + lazy Web3/R3F | NFR-01 — LCP ≤ 2.5s independent of Worker | Worker SSR (couples paint to Worker); pure CSR (risks LCP) |
| **ADR-08** | Sandboxed iframe + strict CSP, degrade to recorded run | NFR-04 — min-privilege live embed | proxy re-embed (fraught); recorded-only (weaker OBJ-04) |
| **ADR-09** | Build-time claims-gate over repo register + runtime `<Claim>` | BR-01/02, OBJ-05 — CI blocks a bad claim | runtime D1 gate (uptime-coupled, unreviewed); both (redundant) |

---

## 10. Red-team critique (all 5 challenges — run, not skipped)

**① Where does it fail under 10× load? (bottleneck + failure mode)**
Bottleneck = **AI inference** (Anthropic-via-Gateway + Workers-AI) latency/cost, secondarily **D1 write
contention** on `rate_limits`/`messages`. Failure mode: first-token exceeds NFR-01c/d and cost spikes.
*Mitigations already in the design:* AI-Gateway rate-limit + caching absorbs repeated prompts; per-IP D1
window sheds abusers; Haiku + `maxTokens` bound per-call cost; the **replay tiers act as a load-shed
valve** — under saturation the Worker can serve a labelled recorded run instead of a live call. Stateless
Workers scale horizontally for SSE. *Residual:* the D1 window's read-modify-write race (D-02) — accepted;
the Gateway caps spend; promote to DO/native if it bites. **Verdict: bounded, no un-mitigated failure.**

**② Single point of failure?**
**Cloudflare itself** (Worker, D1, KV, R2, hosting, AI Gateway, DNS all one vendor) — named as **D-01**.
*Mitigation:* the 3-tier replay means a Worker/D1/AI outage still yields Tier-2 client replay + a
client-queued book-a-call, so the site stays *verifiably-real* and *convertible*; only a **total CF edge
outage** takes it fully down — accepted, documented, multi-cloud out of scope. Secondary SPOF = **John as
sole approver/deployer** (bus-factor 1, R-03) — process risk; mitigated by CI gates + docs; accepted.

**③ Weakest security control? (attacker's view)**
The **public AI endpoints** (`/`, `/audit`, `/fuzz`, `/tx-explain`) — an attacker aims for (a) runaway cost
or (b) making the AI emit off-brand/forbidden claims. *Attacker moves:* giant/malicious source, request
spam, prompt-injection past the banned-keyword guard. *Mitigations:* input size caps + tx-hash regex +
`\b`-boundary keyword guard + per-IP window + **AI-Gateway hard cap** + `maxTokens` + the **cleared-claims
KB** (injection can't surface an ungoverned number) + AI output never authorizes a price or on-chain action.
*One concrete fix folded in:* tighten the Worker's permissive **CORS `*` → origin allowlist** (doc 04 §5).
*Residual:* injection can still yield some off-topic prose — bounded by cost caps + the AI-disclosure/no-
authority framing. **Verdict: acceptable with the CORS tightening.**

**④ 4-hour Cloudflare / Anthropic outage — does every live surface still degrade to a recorded run?**
This is the existential check (R-01). Walked per scope:
- **Anthropic down, Worker up:** concierge → Workers-AI **Llama** fallback → if also down, **KV Tier-1**
  recorded run (labelled). `/audit` → **local heuristics still compute real findings**; only the AI
  *narrative* falls back to KV. `/tx-explain` → client-decoded calldata still shows. Book-a-call, CTF,
  leaderboard **unaffected** (no Anthropic dependency). ✅
- **Cloudflare Worker/region down, SPA still served from edge cache:** every AI/CTF surface → **Tier-2
  client-bundled recorded run** (labelled); **book-a-call → localStorage queue**, retried on recovery, so
  the hire path **completes** to the user (BR-11). Site is *verifiably-real + convertible*. ✅
- **Total CF edge down (incl. static hosting):** nothing loads — the single true break (**D-01**, accepted,
  documented). This is the only scope where a surface is "broken," and it's the sole-vendor SPOF, not a
  design gap.
**Verdict: for every realistic outage scope, every live surface degrades to a labelled recorded run and the
hire path still completes. The design passes its own existential test.**

**⑤ Which compliance requirement is partially addressed?**
NFR-07 is **partially** addressed: the **clear duties are implemented** (AI disclosure, testnet honesty,
audit disclaimer, privacy notice, claims honesty — doc 04 §7), but **cookie-consent (FR-058), checkout
terms (FR-059), DSAR/erasure, wallet-as-PII lawful basis, EU AI Act Art. 50 exact wording, VAT/USDC, and
OD-04 jurisdiction** are **`[NEEDS RESEARCH]`/deferred**. *Mitigation (folded in):* those are SHOULD, gated
on research; **no paid checkout is reachable without terms** (terms gated behind the same provisioning flag
as the rails); the privacy notice covers analytics + wallet + engagement PII from day one; a consent banner
sits behind a flag flippable on the ruling. **Verdict: partial by necessity (legal research), not by
oversight; shippable duties ship, risky ones are gated — no MUST compliance item is unimplemented.**

---

## 11. Validation checklist (skill gate)

| Check | Result |
|---|---|
| Every NFR measurable (numbers) — restated + human-approved upstream | **PASS** (doc 01 §2; override applied, not blocked) |
| C4 L1 + L2 present + renderable | **PASS** (doc 02 §2–§3) |
| ≥ 2 user-journey sequence diagrams | **PASS** — **6** (concierge, audit, book-a-call, escrow, CTF, XMTP) |
| Every OPEN component a ≥ 2-option comparison + cost | **PASS** — 9 ADRs (doc 03 §2; cost §7) |
| Auth/identity flow diagram | **PASS** — wallet-connect + XMTP MLS (doc 04 §2); "no login" documented |
| All MUST compliance items implemented | **PASS** — clear duties done; open items are SHOULD/flagged (doc 04 §7) |
| Master SDD with decision log + accepted debt | **PASS** (§8, §9) |
| All 5 red-team challenges run | **PASS** (§10), incl. the outage→recorded-run check |
| No fabricated pricing/benchmarks | **PASS** — cost is mechanism-bound; $ flagged `[NEEDS RESEARCH]` |
| Platform stack not re-litigated | **PASS** — ADRs only on OPEN choices |

---

## 12. Open questions & handoffs

- `[NEEDS RESEARCH]` — the 6 compliance questions (doc 04 §7) → research/compliance roles.
- `[NEEDS RESEARCH]` — exact AI $ for the 3 volume scales (doc 03 §7) → research role.
- `[REQUIRES_HUMAN_INPUT]` — OD-04 jurisdiction; CR-10 credential-URL attach at P0 seeding.
- `[VERIFY]` — D1 Time-Travel retention window; CF native Rate-Limiting binding semantics; KV/R2 exact tiers.
- **Handoff:** this SDD is decisive enough for build agents to start P0 (tokens, tag-protocol contract, D1
  schema, claims-gate engine + register seed, wallet primitive, replay harness) with **no clarifying
  questions**. Human approval (John) gates the build per the roadmap.

---

*End 05 — Master SDD. Status: COMPLETE (DRAFT for John's approval). The architecture's spine — the 3-tier
replay/fallback + build-time claims gate + book-a-call floor — makes the north star ("operate, don't read")
survivable: live degrades to verifiably-real, never broken, and every number on the page traces to a
cleared source.*
