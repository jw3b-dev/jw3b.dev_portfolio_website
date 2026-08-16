# 03 — Functional & Data Requirements — jw3b.dev v2

**Role:** business-analyst (MAS Phase 1) · **Date:** 2026-08-16 · **Status:** DRAFT
One FR per To-Be capability (`02`). Every FR is testable and traces to an objective (`01`). Format:
`FR-ID | System shall [action] | [OBJ] | MoSCoW | Basis | Status`. **Basis** = build reality from
`existing-features-inventory.md`: **New** (net-new) · **Carry** (behavior exists, rebuild it) ·
**Repair** (exists but broken/dead-ends) · **Decision** (blocked on an owner ruling). Status = Proposed.

> A requirement a QA engineer could not test without clarification is flagged
> `[NOT TESTABLE — rewrite required]`. None remain. Technology choices are **not** made here (Phase 3
> architecture owns HOW); where a constraint dictates a pattern it is cited as an inherited constraint,
> not a decision.

---

## 1. Functional requirements

### EPIC A — Operable, proof-first IA & four-hat identity
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-001 | Render the hero as an **operable proof surface** (a visitor can run an audit / query the agent / explore the graph) that is interactive **before the first scroll**, with **no** headshot-and-tagline two-column hero. | OBJ-02 | MUST | New | Proposed |
| FR-002 | Expose a **persistent single-spine hire CTA** reachable in **≤ 1 click from every route**. | OBJ-01 | MUST | New | Proposed |
| FR-003 | Present the **four-hat identity** (Engineer/Auditor/PM/Founder) **together on one surface**; hat filters **dim** non-selected hats and **never fully hide** any hat. | OBJ-04 | MUST | New | Proposed |
| FR-004 | Feature **exactly three** flagship systems (not a 20-project wall), each shown **operably** rather than as a screenshot. | OBJ-04 | MUST | New | Proposed |
| FR-005 | Contain **zero** avoid-list sections: no skills/tech-icon grid, no proficiency bars, no headshot two-column hero, no chronological résumé-timeline as a primary section, no zero-value counters. | OBJ-04, OBJ-05 | MUST | New | Proposed |
| FR-006 | Render the **"systems-are-graphs" + zero-trust validated-pipeline** thesis as an **explorable/steppable object** (nodes + gates that visibly pass validation), not a static diagram. | OBJ-02 | SHOULD | New | Proposed |
| FR-007 | Honor `prefers-reduced-motion` and keep all motion within a stated performance budget on **100%** of animated surfaces. | OBJ-06 | MUST | New | Proposed |
| FR-060 | Surface John's **delivery-credibility record** (20+ industrial plants across **7 countries**, **AgilePM® Practitioner**, ~20 years) as a **seniority anchor** tied to the PM/Founder hats — the register's "strongest material" (`PORTFOLIO_REFERENCE §2`), currently buried. | OBJ-04 | MUST | New | Proposed |

### EPIC B — AI Security Console (`/audit`)
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-008 | Provide a **Solidity auditor** tool: accept pasted contract source and **stream** findings. | OBJ-02 | MUST | Carry | Proposed |
| FR-009 | Provide a **fuzz-harness generator** tool that streams a generated harness for pasted contract source. | OBJ-02 | SHOULD | Carry | Proposed |
| FR-010 | Provide a **transaction explainer**: decode a Base tx client-side and narrate it in plain language. | OBJ-02 | SHOULD | Carry | Proposed |
| FR-011 | Render streamed AI output while **parsing and stripping** the tag protocol (`[AUDIO]`, `[TOOL_CALL]`, `[RENDER_CARD]`). | OBJ-02 | MUST | Carry | Proposed |
| FR-012 | Serve a **cached/replay recorded run** for each console tool when the Worker is unavailable or exceeds a timeout, labelled as a recorded run. | OBJ-02, OBJ-06 | MUST | New | Proposed |
| FR-013 | **Validate all console inputs** before dispatch (tx-hash format, contract source size cap) and surface a specific validation error. | OBJ-02 | MUST | Carry | Proposed |
| FR-014 | Display an **AI-assisted-first-pass disclaimer** with console output (not a substitute for a full professional audit). | OBJ-05 | MUST | New | Proposed |

### EPIC C — AI Concierge (global "Sentinel" chat)
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-015 | Provide a **global floating concierge** with **SSE-streamed** responses on every route. | OBJ-02 | MUST | Carry | Proposed |
| FR-016 | Support **voice input (STT)** and **voice output (TTS playback)** in the concierge. | OBJ-02 | COULD | Carry | Proposed |
| FR-017 | Parse/strip the concierge **tag protocol**, keeping the tag contract **in sync** across Worker ↔ agent hook ↔ widget. | OBJ-02 | MUST | Carry | Proposed |
| FR-018 | Ground concierge answers in an **evidence-checked knowledge base** so it emits **no claim** that fails claims discipline (OBJ-05). | OBJ-05 | MUST | New | Proposed |
| FR-019 | Let the concierge **route a user to the hire path** (book-a-call / Mission Control) via a tool-call. | OBJ-01 | SHOULD | New | Proposed |
| FR-020 | Provide a **graceful degraded/canned response** (with a link, never a blank error) when the Worker is unavailable. | OBJ-06 | MUST | Repair | Proposed |
| FR-021 | Display an **AI-disclosure indicator** so users know the concierge is an AI. | OBJ-05 | MUST | New | Proposed |

### EPIC D — Live on-chain CTF ("Capture the Vault", Base Sepolia)
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-022 | Run a **real reentrancy CTF** on Base Sepolia: deploy Attacker → `attack{value}` → Worker verifies the drain → leaderboard. | OBJ-02 | SHOULD | Carry | Proposed |
| FR-023 | Handle the **full CTF state machine** (idle/switching/deploying/attacking/verifying/success/error) plus not-connected, wrong-chain, vault-empty/armed, already-solved. | OBJ-02 | MUST *(if CTF ships)* | Carry | Proposed |
| FR-024 | **Label the CTF as Base Sepolia testnet with no real funds** on every CTF surface. | OBJ-05 | MUST | New | Proposed |
| FR-025 | **Persist the leaderboard** (D1) and display ranked solves. | OBJ-02 | SHOULD | Carry | Proposed |
| FR-026 | Serve a **cached/replay recorded solve** when chain or Worker is unavailable. | OBJ-06 | MUST | New | Proposed |
| FR-027 | **Simulate before every on-chain write** in the CTF (deploy/attack), surfacing revert reasons on failure. | OBJ-02 | MUST | Carry | Proposed |

### EPIC E — Mission Control wallet-gated hire flow (`/hire-me`) ★ centerpiece
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-028 | Preserve the **4-step configurator** (objective → assessment → engagement → loadout) and progress rail, and **fix the label drift** (step-3 shows "ENGAGEMENT", not "PARAMETERS"). | OBJ-01 | MUST | Repair | Proposed |
| FR-029 | Make the **assessment answers inform the loadout** — a recommended tier and an indicative scope — so Step 2 is no longer decorative. | OBJ-01 | MUST | Repair | Proposed |
| FR-030 | Render loadout tiers whose **prices trace to `retainer.json`** (no hardcoded, unsourced price strings). | OBJ-01, OBJ-05 | MUST | Repair | Proposed |
| FR-031 | **Prompt the visitor to connect a wallet in-flow** (mount the connect button inside `/hire-me`). | OBJ-01 | MUST | New | Proposed |
| FR-032 | **Route the terminal action by ticket size**: low-ticket fixed-price → Unlock; high-ticket retainer/project → escrow-on-acceptance; **book-a-call available on every branch**. | OBJ-01 | MUST | New | Proposed |
| FR-033 | Execute on-chain escrow via **Simulate → Write → Wait** (`useSimulateContract` → write → `useWaitForTransactionReceipt`) in **USDC on Base** with **6-decimal BigInt** precision. | OBJ-01 | MUST | Repair | Proposed |
| FR-034 | Offer **Unlock checkout only when a real lock address is deployed**; when a lock is a placeholder/undeployed, **hide Unlock and fall back to book-a-call** (no perpetually-disabled button). | OBJ-01 | MUST | Repair | Proposed |
| FR-035 | Provide the **full product-state set** the wizard lacks today: connect-prompt, checkout-loading, tx-pending, **success (receipt + next steps)**, error/retry, empty. | OBJ-01 | MUST | New | Proposed |
| FR-036 | Provide a **book-a-call floor** that completes an engagement request **even with no wallet, no chain, and no live Worker** (offline-capable capture + confirmation). | OBJ-01 | MUST | New | Proposed |
| FR-037 | **Capture every engagement request** (objective, assessment, engagement, tier, indicative price, route, optional wallet, contact) to the Worker + D1 and **show a confirmation**. | OBJ-01 | MUST | New | Proposed |
| FR-038 | **Remove** the dead no-op "ENQUIRE" button and the `/test-agent` dev scaffold before ship. | OBJ-01 | MUST | Repair | Proposed |
| FR-039 | **Not advertise an XMTP / "E2E encrypted channel"** unless it is actually built; otherwise remove that claim from Mission Control and retainer copy. | OBJ-05 | MUST | Decision | Proposed |

### EPIC F — Wallet & payment primitives (shared)
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-040 | Provide a **custom RainbowKit connect button** handling connect / wrong-network / account+chain states. | OBJ-01 | MUST | Carry | Proposed |
| FR-041 | Wrap **Unlock Protocol checkout** (loads `window.unlockProtocol`), driven only by real deployed lock addresses. | OBJ-01 | MUST | Repair | Proposed |
| FR-042 | Configure chains (**Base primary; Base Sepolia for testnet demos**) and **label testnet↔mainnet honestly** wherever an on-chain surface renders. | OBJ-05 | MUST | Carry | Proposed |

### EPIC G — Claims discipline & evidence (functional content gate)
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-043 | **Render no numeric/credential claim** as fact unless it traces to `PORTFOLIO_REFERENCE.md` or `cv-source.md` (post-reconciliation) — enforced as a content gate. | OBJ-05 | MUST | New | Proposed |
| FR-044 | **Deep-link the CodeHawks #124 record** to the public profile from **≥ 2 surfaces** (not a self-asserted badge). | OBJ-03 | MUST | New | Proposed |
| FR-045 | Provide a **first-class "unedited run / what failed & why"** surface (real logs, the failure, the fix). | OBJ-04 | MUST | New | Proposed |
| FR-046 | **Block the forbidden-claims list** (no aggregate TVL / $ secured / "protocols secured" / "50+ audits" / "PMP certified" / "PRINCE2 Practitioner" / Neo4j-Certified-until-cleared). | OBJ-05 | MUST | New | Proposed |
| FR-047 | **Gate every `[REQUIRES_RESOLUTION]` stat** (see §4) out of public surfaces until John clears it into the evidence register. | OBJ-05 | MUST | New | Proposed |

### EPIC H — Backend (Cloudflare Worker) — full rebuild
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-048 | Expose Worker routes for **concierge chat (stream)**, **audit tools (stream)**, **STT/TTS**, **CTF verify**, **leaderboard**, **engagement-request capture**, and **book-a-call handoff**. | OBJ-01, OBJ-02 | MUST | Carry | Proposed |
| FR-049 | Persist **analytics, CTF leaderboard, and engagement requests** in **D1**. | OBJ-01 | MUST | Carry | Proposed |
| FR-050 | Handle **all secrets server-side only** (Worker; Anthropic via AI Gateway); **no secret** appears in the client bundle or `.env`-public. | OBJ-05 | MUST | Carry | Proposed |
| FR-051 | **Rate-limit AI endpoints** (concierge, audit tools, STT/TTS) to bound cost and abuse. | OBJ-06 | MUST | New | Proposed |
| FR-052 | Own the **tag-protocol contract** server-side and keep it synchronized with the frontend parser. | OBJ-02 | MUST | Carry | Proposed |

### EPIC I — Arrival / SEO / trust
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-053 | **Win branded search** ("John Wellard" / "jw3b" / "AgileGypsy") via title/meta/OpenGraph/structured data. | OBJ-03 | MUST | New | Proposed |
| FR-054 | Emit **Person structured data** and **cross-link agilegypsy.com** (studio ↔ person). | OBJ-03 | SHOULD | New | Proposed |
| FR-055 | Publish **content-gap explainer pages** ("systems are graphs", "zero-trust validator in multi-agent systems"). | OBJ-03 | COULD | New | Proposed |
| FR-056 | **Reinforce GitHub ↔ site** by linking real repos from the systems surface. | OBJ-03 | COULD | New | Proposed |

### EPIC J — Compliance & trust surfaces
| FR | System shall… | OBJ | MoSCoW | Basis | Status |
|---|---|---|---|---|---|
| FR-057 | Publish a **privacy notice** covering analytics, connected-wallet data, and engagement-request PII. | OBJ-05 | MUST | New | Proposed |
| FR-058 | Present **cookie/analytics consent** if the analytics implementation legally requires it. `[NEEDS RESEARCH — see §6]` | OBJ-05 | SHOULD | New | Proposed |
| FR-059 | Present **engagement/checkout terms** (scope, refund/cancellation) at the point of any paid checkout. `[NEEDS RESEARCH — see §6]` | OBJ-05 | SHOULD | New | Proposed |

**MoSCoW summary:** MUST = 45 · SHOULD = 9 · COULD = 3 · (Decision-gated MUST: FR-039). Total FRs = 60.
(FR-060 added during Master-BRD red-team — see `05` §Red-team challenge 4.)
Every FR carries an OBJ link (no scope-creep FR); every objective is covered by ≥ 1 FR (no uncovered
objective — see traceability in `04`/`05`).

---

## 2. Data entities

| DE | Entity | Key attributes (type) | Validation / rules |
|---|---|---|---|
| DE-01 | **EngagementRequest** | id (uuid); objective (enum: security\|engineering\|pm); assessment (map<qId,answer>); engagement (enum: project\|retainer); tier (string); indicative_price (string, from retainer.json); route (enum: book_a_call\|escrow\|unlock); wallet (0x-address, nullable); contact (email\|handle, required); status (enum: submitted\|contacted\|escrow_funded\|paid\|closed); created_at (ts) | contact required & format-valid; objective/engagement/tier must exist in the loadout catalog; wallet, if present, is a 42-char 0x address; price copied from catalog, never free-typed |
| DE-02 | **ServicePackage/Tier** | name (string); price (string); period (string); features (string[]); objective (enum); engagement (enum); recommended (bool); lock_address (0x, nullable); escrow_eligible (bool) | source of truth = `retainer.json`; a tier with no real lock_address is **not** Unlock-purchasable (→ book-a-call); prices are claims → OBJ-05 applies |
| DE-03 | **EscrowAgreement** | id; client_wallet (0x); provider_wallet (0x); amount_usdc (bigint, 6-dec); milestone (string); state (enum: funded\|released\|refunded); contract_address (0x); chain (enum: base\|base_sepolia); is_testnet (bool) | amount uses 6-decimal BigInt; **write requires prior successful simulate**; is_testnet must match chain and be shown to the user |
| DE-04 | **CtfSolve / LeaderboardEntry** | id; wallet (0x); attacker_contract (0x); tx_hash (0x-64); drained_amount (bigint); block (int); solved_at (ts); rank (int) | tx_hash validated (0x + 64 hex); solve accepted only after Worker verifies the on-chain drain; one active rank per wallet |
| DE-05 | **ConciergeSession / Message** | session_id; role (enum: user\|assistant); content (text, tags stripped); had_audio (bool); created_at (ts) | PII-minimized (no wallet/contact stored unless the user submits an engagement); analytics only |
| DE-06 | **AuditRun** | id; tool (enum: auditor\|fuzz\|tx_explainer); input_ref (hash, not raw source retained long-term); duration_ms (int); source (enum: live\|cached_replay); created_at (ts) | input size-capped (FR-013); `source` recorded so a cached run is never presented as live |
| DE-07 | **ClaimRecord (evidence register model)** | claim_id; text (string); value (string/number); evidence_source (enum: portfolio_reference\|cv_source\|none); status (enum: cleared\|requires_resolution\|forbidden); surfaces (string[]) | status=cleared required to render as fact (FR-043); requires_resolution/forbidden ⇒ must not render (FR-046/047) |
| DE-08 | **Credential** | name; date; evidence (string); claimable (bool) | claimable=false for PRINCE2 Practitioner, PMP, and Neo4j-Certified-until-cleared (per `PORTFOLIO_REFERENCE §1`) |

---

## 3. Business rules (condition → action → exception)

- **BR-01 (Claims gate).** IF a `ClaimRecord.status ≠ cleared` THEN it MUST NOT render as fact on any public surface. EXCEPTION: none until John rules; the surface omits it or shows a cleared alternative.
- **BR-02 (Forbidden claims).** IF copy would assert aggregate TVL / $ secured / "protocols secured" / "50+ audits" / "PMP certified" / "PRINCE2 Practitioner" THEN block it. EXCEPTION: none.
- **BR-03 (Live-fallback).** IF a live surface's backend (Worker/chain) is unavailable OR exceeds its timeout THEN serve the cached/replay artifact labelled "recorded run". EXCEPTION: if no cached artifact exists, show a "temporarily offline — book a call" state; **never** a blank/error/hard-broken state.
- **BR-04 (Simulate-first).** IF an on-chain write is requested THEN it MUST be preceded by a successful `useSimulateContract`. EXCEPTION: simulate failure blocks the write and surfaces the revert reason.
- **BR-05 (Ticket-size routing).** IF engagement = retainer OR indicative price ≥ the high-ticket threshold THEN route to book-a-call / escrow-on-acceptance (not instant Unlock). ELSE a low-ticket fixed-price tier MAY offer Unlock. EXCEPTION: if the tier's Unlock lock is placeholder/undeployed, always fall back to book-a-call.
- **BR-06 (USDC precision).** IF a USDC amount is handled THEN use 6-decimal BigInt. EXCEPTION: reject/guard sub-unit amounts rather than rounding silently.
- **BR-07 (Four-hat visibility).** IF a hat filter is applied THEN dim non-selected hats. EXCEPTION: never reduce a hat to fully hidden (all four remain present).
- **BR-08 (AI disclosure).** IF an AI surface (concierge, audit console) renders THEN an AI-disclosure indicator is present. EXCEPTION: none.
- **BR-09 (Testnet honesty).** IF a testnet on-chain surface renders THEN it is explicitly labelled testnet / no real funds. EXCEPTION: none.
- **BR-10 (Audit disclaimer).** IF the audit console returns findings THEN a disclaimer (AI-assisted first pass, not a substitute for a professional audit) is shown. EXCEPTION: none.
- **BR-11 (Book-a-call floor).** IF every other terminal primitive is unavailable (no wallet / chain down / locks undeployed / Worker down) THEN book-a-call MUST still complete an engagement request. EXCEPTION: none — this is the guaranteed path.
- **BR-12 (Price provenance).** IF a price renders THEN its value derives from `retainer.json`. EXCEPTION: none; no free-typed prices.

---

## 4. ★ Claims-reconciliation list (MANDATORY — `[REQUIRES_RESOLUTION]` for John)

Every stat that appears in `cv-source.md` and/or `capability-accuracy.md` but is **NOT** in
`PORTFOLIO_REFERENCE.md` (jw3b's own evidence register). Per Facts Brief §4, do **not** silently pick
a side — John rules on each. Until ruled, BR-01/FR-047 gate these **out** of public surfaces.

| CR | Claim (as stated in cv-source / capability) | In `PORTFOLIO_REFERENCE`? | Conflict note | Ruling |
|---|---|---|---|---|
| CR-01 | GraphRAG hybrid retriever **+18 pts** vs baseline | No | `capability-accuracy §CLAIMS` explicitly names +18pts as **studio** register, not jw3b's | `[REQUIRES_RESOLUTION]` |
| CR-02 | **9,828 entities** (GraphRAG) | No | Explicitly flagged studio-register in `capability-accuracy` | `[REQUIRES_RESOLUTION]` |
| CR-03 | **77k chunks** (GraphRAG) | No | Same GraphRAG studio figure family | `[REQUIRES_RESOLUTION]` |
| CR-04 | **192,000+** corpus embedded & classified | No | Master report Risk 2 lists "192K corpus" as client-supplied, reconcile | `[REQUIRES_RESOLUTION]` |
| CR-05 | **1,345** governance tests / **100% coverage** / **2,468** lines | No | Master report Risk 2 lists "1,345 tests/100% cov" as client-supplied; `capability-accuracy` cites studio "4,866 lines / 99.76%" as not-to-import | `[REQUIRES_RESOLUTION]` |
| CR-06 | **13-phase** pipeline / **51** non-test modules (Overmind) | No | Master report Risk 2 lists "Overmind 13-phase" as client-supplied, reconcile | `[REQUIRES_RESOLUTION]` |
| CR-07 | KTHULHU **112+ merged PRs** | No | Not in the register | `[REQUIRES_RESOLUTION]` |
| CR-08 | KTHULHU **"paying users"** | No | Master report Risk 2 flags "paying users" as client-supplied; register verifies KTHULHU exists, not the paying-users claim | `[REQUIRES_RESOLUTION]` |
| CR-09 | GraphRAG **memory-miss recovery > 2×** | No | Not in the register | `[REQUIRES_RESOLUTION]` |
| CR-10 | **Neo4j Certified Professional** (+ Neo4j GenAI/MCP/GDS) listed as a cert | No | `PORTFOLIO_REFERENCE §1` lists Neo4j Certified Professional as **"Unverified, no artifact yet"** — do not claim until an artifact exists | `[REQUIRES_RESOLUTION]` |

**Stats that ARE cleared to ship** (trace to `PORTFOLIO_REFERENCE.md`, for contrast): CodeHawks
**#124 · 17 findings (8 High / 5 Med / 4 Low) · 1,430 EXP**; **20+ years** delivery / **7 countries** /
**20+ industrial plants**; **AgilePM® v2 Practitioner + Foundation**, **PRINCE2 Foundation**, **APM
PFQ**, **five Cyfrin Updraft** certs (with IDs), **Chainlink Fundamentals**, **Dapp University**
bootcamp; existence of shipped products KTHULHU / Kointel / Art of Zeta / MB-agentic / AgileCEO.

---

## 5. Open owner decisions (`[REQUIRES JOHN]`)

| OD | Decision | Source | Impact if unresolved |
|---|---|---|---|
| OD-01 | Do **DevGuild ($GUILD)** / **EcoGraph** / **Overmind GenAI Engine** appear on jw3b.dev, or are they studio-only? | `capability-accuracy §New projects` | Cannot finalize the "3 flagship systems" (FR-004) selection |
| OD-02 | XMTP: **build** the E2E channel (migration to `@xmtp/browser-sdk`) or **remove** the claim? | `existing-features-inventory §4`; FR-039 | Blocks the retainer perk copy + Mission Control back-card |
| OD-03 | Which **payment posture** for Mission Control terminal step: escrow-on-acceptance vs Unlock membership vs off-chain quote/booking + backend — and are real Unlock locks / escrow deployment coming? | `existing-features-inventory §3–4`; FR-032/033/034 | Determines which terminal routes are live at launch (book-a-call floor covers the gap) |
| OD-04 | **Jurisdiction/location line**: UK (Tadworth, Surrey) vs "Built in Gauteng" — confirm before publishing. | `PORTFOLIO_REFERENCE §9` | Affects About/contact copy + which privacy regime leads (§6) |
| OD-05 | Ruling on each **CR-01…CR-10** stat (§4). | Facts Brief §4 | Gates those numbers on/off the site (FR-047) |

---

## 6. Compliance items — flagged, not invented `[NEEDS RESEARCH]`

Per the compliance context, real obligations are flagged for research rather than assumed:

- `[NEEDS RESEARCH: Does EU AI Act Art. 50 transparency obligation apply to a portfolio's AI concierge/audit console, and what exact disclosure wording satisfies it?]` — informs FR-021/FR-014. (John's KTHULHU already carries an EU AI Act dossier per `cv-source`, so disclosure is on-brand.)
- `[NEEDS RESEARCH: Do the D1 analytics set cookies or process EU/SA visitor personal data such that GDPR/ePrivacy or POPIA consent is required?]` — informs FR-058.
- `[NEEDS RESEARCH: Is a connected wallet address + engagement request "personal data" requiring a specific privacy notice/lawful basis under GDPR/POPIA?]` — informs FR-057.
- `[NEEDS RESEARCH: Do consumer-protection / distance-selling / refund-terms obligations attach to an on-chain or Unlock service checkout, and in which jurisdiction (see OD-04)?]` — informs FR-059.

These do not block Phase 1; they are handed to the research/compliance roles and revisited before the
relevant surface ships. FR-014, FR-021, FR-024, FR-042, FR-057 already encode the *clear* disclosure
duties (AI disclosure, testnet honesty, privacy notice) independent of the open research questions.
