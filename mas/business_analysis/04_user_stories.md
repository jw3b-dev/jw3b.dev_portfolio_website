# 04 — User Stories & Acceptance Criteria — jw3b.dev v2

**Role:** business-analyst (MAS Phase 1) · **Date:** 2026-08-16 · **Status:** DRAFT
FRs (`03`) grouped into 10 epics. Every story is `As a [persona] I want [action] so that [outcome]`
(the "so that" names an outcome, not the action). Every story has **≥ 2 BDD acceptance criteria**
(≥ 1 happy path + ≥ 1 error/edge), Given/When/Then. Personas: **Founder/CTO** (S2/primary),
**Security Buyer** (S3), **Hiring Manager** (S4), **John/owner** (S1), **Compliance** (S6).

---

## EPIC A — Operable, proof-first IA & four-hat identity  *(FR-001…007)*

**US-001 — Operable hero** — *As a Founder/CTO, I want to run a real system in the hero so that I trust John ships production systems before I read a word.*
- AC1 (happy): **Given** I land on `/`, **When** the hero loads, **Then** an operable proof surface (run-audit / query-agent / explore-graph) is interactive above the fold **before any scroll**, and **no** headshot-and-tagline two-column hero is present.
- AC2 (edge): **Given** the backing Worker is unreachable, **When** I interact with the hero surface, **Then** it serves a labelled recorded run and never shows a blank/broken hero.

**US-002 — One hire path everywhere** — *As a Founder/CTO, I want the hire action always one click away so that the proof spectacle never costs me the way to engage.*
- AC1: **Given** any route, **When** the page renders, **Then** a persistent hire CTA is reachable in ≤ 1 click.
- AC2 (edge): **Given** a deep-linked sub-page (e.g. `/ctf`), **When** it loads directly, **Then** the hire CTA is still present.

**US-003 — Four hats at once** — *As a Hiring Manager, I want to see all four hats together so that I read John as one senior operator, not four half-people.*
- AC1: **Given** the identity surface, **When** it renders, **Then** Engineer/Auditor/PM/Founder are all visible simultaneously.
- AC2 (edge): **Given** I apply a hat filter, **When** it activates, **Then** non-selected hats **dim** but remain visible (0 fully-hidden hats).

**US-004 — Three deep systems** — *As a Hiring Manager, I want exactly three deep systems so that I can judge depth instead of wading through twenty toys.*
- AC1: **Given** the systems surface, **When** it renders, **Then** exactly 3 flagship systems are featured, each with an operable or verifiable element.
- AC2 (edge): **Given** the catalog contains more than 3 candidates, **When** the page builds, **Then** no more than 3 are surfaced as flagship.

**US-005 — No generic clichés** — *As John, I want the site free of the rejected patterns so that it never re-files me as a template user.*
- AC1: **Given** the full site, **When** audited against the avoid-list, **Then** there are 0 skills grids, 0 proficiency bars, 0 headshot two-column heroes, 0 résumé-timeline primary sections, 0 zero-value counters.
- AC2 (edge): **Given** any numeric hero/stat element, **When** it renders, **Then** it shows a real evidence-backed value, never `0` as a placeholder.

**US-006 — Explore the graph/pipeline** — *As a Founder/CTO, I want to step the validated pipeline so that I can see the reliability I'm buying, not just read about it.*
- AC1: **Given** the verification surface, **When** I step the pipeline, **Then** each step visibly passes a validator gate (e.g. green = passed).
- AC2 (edge): **Given** reduced-motion is set, **When** I step it, **Then** the same state is reachable without animation.

**US-007 — Respect my device & motion prefs** — *As any visitor, I want motion and load respected so that the site feels engineered, not janky.*
- AC1: **Given** `prefers-reduced-motion: reduce`, **When** any animated surface renders, **Then** non-essential motion is disabled.
- AC2 (edge): **Given** a mid-tier throttled mobile, **When** the marquee route loads, **Then** LCP ≤ 2.5s (NFR target).

**US-051 — Two decades of delivery** — *As a Hiring Manager, I want John's real delivery record surfaced so that I read him as a proven operator, not a bootcamp grad.* (FR-060; added in BRD red-team.)
- AC1: **Given** the identity/seniority surface, **When** it renders, **Then** the delivery record (20+ industrial plants · 7 countries · AgilePM® Practitioner) is presented as a seniority anchor, with values matching the evidence register.
- AC2 (edge): **Given** claims discipline, **When** the record renders, **Then** it asserts no forbidden claim (no TVL/$/"decades of combined experience") — only cleared figures.

---

## EPIC B — AI Security Console  *(FR-008…014)*

**US-008 — Run a Solidity audit** — *As a Security Buyer, I want to paste a contract and watch it get audited so that I see a real tool, not a claim.*
- AC1: **Given** valid Solidity source, **When** I submit to the Auditor, **Then** findings stream in and tag-protocol markers are stripped from the rendered text.
- AC2 (edge): **Given** input exceeding the size cap or empty, **When** I submit, **Then** a specific validation error shows and no request is dispatched.

**US-009 — Generate a fuzz harness** — *As a Security Buyer, I want a fuzz harness generated so that I can gauge John's test rigor first-hand.*
- AC1: **Given** valid source, **When** I run the generator, **Then** a harness streams to the output.
- AC2 (edge): **Given** the Worker errors mid-stream, **When** generation fails, **Then** a retry affordance appears (no silent hang).

**US-010 — Explain a transaction** — *As a Founder/CTO, I want a Base tx decoded in plain language so that I see applied on-chain fluency.*
- AC1: **Given** a valid Base tx hash, **When** I submit, **Then** it decodes client-side and a narration streams.
- AC2 (edge): **Given** a malformed hash, **When** I submit, **Then** a tx-hash validation error shows before any call.

**US-011 — Console still works when offline** — *As a Security Buyer, I want a real result even if the backend is down so that "live" never becomes "broken".*
- AC1: **Given** the Worker is unavailable, **When** I run any console tool, **Then** a labelled cached/replay run renders.
- AC2 (edge): **Given** no cached artifact exists, **When** I run it, **Then** a "temporarily offline — book a call" state shows, not an error.

**US-012 — Understand the tool's limits** — *As Compliance, I want an AI disclaimer on audit output so that no one over-relies on it.*
- AC1: **Given** console findings render, **When** they display, **Then** an "AI-assisted first pass, not a full professional audit" disclaimer is visible.
- AC2 (edge): **Given** a cached replay, **When** it renders, **Then** the same disclaimer is present.

---

## EPIC C — AI Concierge (Sentinel)  *(FR-015…021)*

**US-013 — Ask the concierge** — *As a Founder/CTO, I want to ask questions and get streamed answers so that the site works in front of me.*
- AC1: **Given** the concierge is open, **When** I send a message, **Then** a response streams token-by-token with tags parsed/stripped.
- AC2 (edge): **Given** an empty message, **When** I try to send, **Then** send is prevented.

**US-014 — Talk to it** — *As a Founder/CTO, I want voice in/out so that I can interact hands-free.* (COULD)
- AC1: **Given** mic permission, **When** I speak, **Then** STT transcribes and a spoken TTS reply plays.
- AC2 (edge): **Given** mic permission denied, **When** I tap voice, **Then** it falls back to text without error.

**US-015 — Trust what it says** — *As John, I want the concierge grounded in the evidence register so that it never invents a claim that fails claims discipline.*
- AC1: **Given** a question about metrics, **When** the concierge answers, **Then** every number it states traces to the evidence register (no `[REQUIRES_RESOLUTION]` stat).
- AC2 (edge): **Given** it lacks grounded evidence, **When** asked, **Then** it declines/deflects rather than fabricating a figure.

**US-016 — Route me to hire** — *As a Founder/CTO, I want the concierge to hand me to the hire path so that curiosity converts.*
- AC1: **Given** I express hiring intent, **When** the concierge responds, **Then** it offers a book-a-call / Mission Control route via tool-call.
- AC2 (edge): **Given** the routing target is unavailable, **When** it responds, **Then** it still surfaces the book-a-call fallback.

**US-017 — Never a dead concierge** — *As any visitor, I want a useful reply even when the backend is down so that the flagship AI feature never embarrasses.*
- AC1: **Given** the Worker is unavailable, **When** I message, **Then** a graceful canned response with a link renders (no blank error).
- AC2 (edge): **Given** a mid-stream disconnect, **When** it drops, **Then** partial content is retained and a retry is offered.

**US-018 — Know it's an AI** — *As Compliance, I want clear AI disclosure so that users are informed they're talking to an AI.*
- AC1: **Given** the concierge renders, **When** it opens, **Then** an AI-disclosure indicator is visible.
- AC2 (edge): **Given** voice mode, **When** engaged, **Then** the disclosure remains discoverable.

---

## EPIC D — Live on-chain CTF (Capture the Vault)  *(FR-022…027)*

**US-019 — Solve the vault** — *As a Security Buyer, I want to exploit a real reentrancy vault on testnet so that I see security skill demonstrated, not asserted.*
- AC1: **Given** a connected wallet on Base Sepolia, **When** I deploy the attacker and call `attack{value}`, **Then** the Worker verifies the drain and records a solve.
- AC2 (edge): **Given** wrong chain or disconnected wallet, **When** I try to attack, **Then** the flow prompts switch/connect and blocks the write.

**US-020 — Know it's testnet** — *As Compliance, I want explicit testnet labelling so that no one thinks real funds are at stake.*
- AC1: **Given** any CTF surface, **When** it renders, **Then** "Base Sepolia testnet · no real funds" is shown.
- AC2 (edge): **Given** a success state, **When** shown, **Then** it still avoids implying mainnet value.

**US-021 — See the leaderboard** — *As a Founder/CTO, I want a persisted leaderboard so that the challenge reads as real and active.*
- AC1: **Given** a verified solve, **When** it completes, **Then** the leaderboard (D1) updates with the ranked entry.
- AC2 (edge): **Given** a wallet already solved, **When** it solves again, **Then** it is not double-counted.

**US-022 — CTF resilient when down** — *As John, I want a recorded solve fallback so that a chain/Worker outage doesn't disprove the thesis.*
- AC1: **Given** chain/Worker unavailable, **When** I open `/ctf`, **Then** a labelled recorded solve renders.
- AC2 (edge): **Given** recovery, **When** the backend returns, **Then** the live flow resumes.

---

## EPIC E — Mission Control wallet-gated hire flow ★  *(FR-028…039)*

**US-023 — Configure my engagement** — *As a Founder/CTO, I want to step objective→assessment→engagement→loadout so that I self-qualify toward the right service.*
- AC1: **Given** `/hire-me`, **When** I progress the wizard, **Then** the progress rail is correct and step 3 is labelled "ENGAGEMENT" (drift fixed).
- AC2 (edge): **Given** an incomplete assessment, **When** I try to advance, **Then** the CTA is disabled until all questions are answered.

**US-024 — Assessment that matters** — *As a Founder/CTO, I want my answers to shape the recommendation so that the loadout feels custom, not canned.*
- AC1: **Given** completed assessment answers, **When** I reach the loadout, **Then** a recommended tier and indicative scope reflect those answers.
- AC2 (edge): **Given** I change answers and return, **When** the loadout recomputes, **Then** the recommendation updates accordingly.

**US-025 — Honest prices** — *As John, I want tier prices sourced from `retainer.json` so that every price on the page is defensible.*
- AC1: **Given** the loadout, **When** tiers render, **Then** each price matches `retainer.json`.
- AC2 (edge): **Given** a tier lacks a catalog price, **When** it would render, **Then** it shows "quote on call", never a free-typed number.

**US-026 — Connect in-flow** — *As a Founder/CTO, I want to connect my wallet inside the hire flow so that I can actually transact without leaving.*
- AC1: **Given** a terminal route needing a wallet, **When** I reach it disconnected, **Then** a connect-wallet prompt appears in-flow.
- AC2 (edge): **Given** I decline to connect, **When** I proceed, **Then** the book-a-call floor remains available.

**US-027 — Right checkout for the ticket** — *As a Founder/CTO, I want the checkout matched to deal size so that a $12.5k retainer isn't shoved through a one-click paywall.*
- AC1: **Given** a retainer or high-ticket price, **When** I reach the terminal step, **Then** it routes to book-a-call / escrow-on-acceptance (not instant Unlock).
- AC2 (edge): **Given** a low-ticket fixed-price tier, **When** I reach checkout, **Then** Unlock is offered only if a real lock is deployed, else book-a-call.

**US-028 — Fund an escrow** — *As a Founder/CTO, I want to fund a milestone escrow in USDC so that money moves safely on agreed terms.*
- AC1: **Given** an escrow route with a connected wallet, **When** I confirm, **Then** the tx is **simulated first**, then written, then awaited to receipt, using 6-decimal USDC.
- AC2 (edge): **Given** simulate fails, **When** I confirm, **Then** the write is blocked and the revert reason is shown.

**US-029 — Buy a fixed-price tier** — *As a Founder/CTO, I want to purchase a low-ticket tier via Unlock so that self-serve is possible when it's appropriate.*
- AC1: **Given** a tier with a deployed lock, **When** I check out, **Then** the Unlock modal opens with the correct lock and metadata.
- AC2 (edge): **Given** the lock is a placeholder/undeployed, **When** I reach checkout, **Then** Unlock is hidden and book-a-call is offered (no disabled "Lock Pending" button).

**US-030 — See it complete** — *As a Founder/CTO, I want clear states through checkout so that I always know what's happening and what's next.*
- AC1: **Given** a checkout, **When** it progresses, **Then** connect / loading / tx-pending / **success (receipt + next steps)** states render in order.
- AC2 (edge): **Given** a tx fails or is rejected, **When** it errors, **Then** an error state with retry shows (no silent dead-end).

**US-031 — Book a call, always** — *As a Founder/CTO, I want a guaranteed way to engage so that no outage or missing wallet blocks me from hiring.*
- AC1: **Given** no wallet / chain down / locks undeployed / Worker down, **When** I choose book-a-call, **Then** an engagement request is captured and confirmed.
- AC2 (edge): **Given** the scheduler endpoint is down, **When** I submit, **Then** the request is still captured (queued) and I get a confirmation.

**US-032 — My request is received** — *As John, I want every engagement request captured server-side so that no lead is lost to a no-op button.*
- AC1: **Given** any terminal action, **When** I submit, **Then** the request (objective, assessment, engagement, tier, price, route, optional wallet, contact) persists to D1 and a confirmation shows.
- AC2 (edge): **Given** a missing/invalid contact, **When** I submit, **Then** a validation error blocks submission.

**US-033 — No dead buttons** — *As John, I want dead ends removed so that the flow is a product, not a demo.*
- AC1: **Given** the shipped flow, **When** audited, **Then** there is no no-op "ENQUIRE" button and no `/test-agent` route.
- AC2 (edge): **Given** any terminal CTA, **When** clicked, **Then** it resolves to a real action or the book-a-call floor.

**US-034 — Honest about XMTP** — *As Compliance, I want no unbuilt feature advertised so that copy matches reality.*
- AC1: **Given** OD-02 = "not built", **When** Mission Control / retainer copy renders, **Then** no "E2E encrypted channel / XMTP" claim appears.
- AC2 (edge): **Given** OD-02 = "built", **When** it ships, **Then** the claim renders only alongside the working feature.

---

## EPIC F — Wallet & payment primitives  *(FR-040…042)*

**US-035 — Connect states** — *As a Founder/CTO, I want a clear connect button so that wallet status is never ambiguous.*
- AC1: **Given** the connect button, **When** I connect, **Then** account + chain pills show; wrong-network shows a switch prompt.
- AC2 (edge): **Given** provider not ready, **When** the button mounts, **Then** it shows a non-blocking not-ready state.

**US-036 — Unlock wrapper** — *As John, I want a robust Unlock wrapper so that self-serve checkout is safe and correct.*
- AC1: **Given** `window.unlockProtocol` loaded, **When** checkout opens, **Then** it uses the configured real lock and metadata.
- AC2 (edge): **Given** the script failed to load, **When** checkout is attempted, **Then** it degrades to book-a-call.

**US-037 — Testnet/mainnet honesty** — *As Compliance, I want every on-chain surface labelled by network so that no demo masquerades as production.*
- AC1: **Given** a testnet surface, **When** it renders, **Then** it is labelled Base Sepolia / no real funds.
- AC2 (edge): **Given** a mainnet checkout, **When** it renders, **Then** it is labelled Base mainnet.

---

## EPIC G — Claims discipline & evidence  *(FR-043…047)*

**US-038 — Only cleared claims ship** — *As John, I want a content gate so that nothing unverified renders as fact.*
- AC1: **Given** a claim with status `cleared`, **When** a surface renders it, **Then** it displays; **Given** status `requires_resolution`/`forbidden`, **Then** it does not render.
- AC2 (edge): **Given** any forbidden claim (TVL/$/"50+ audits"/PMP/PRINCE2 Practitioner), **When** copy is built, **Then** it is blocked.

**US-039 — One-click proof** — *As a Security Buyer, I want the CodeHawks record verifiable in one click so that I don't have to take a badge on faith.*
- AC1: **Given** an audit/security surface, **When** it shows the record, **Then** it deep-links to the public CodeHawks #124 profile from ≥ 2 surfaces.
- AC2 (edge): **Given** the numbers render, **When** displayed, **Then** they equal #124 · 17 · 8 High · 1,430 EXP (match the register).

**US-040 — Show the failures** — *As a Hiring Manager, I want an unedited-run/failures surface so that I can screen for the honesty I explicitly look for.*
- AC1: **Given** the honesty surface, **When** it renders, **Then** it shows a real run including a failure and the fix.
- AC2 (edge): **Given** it's a headline feature, **When** the site is navigated, **Then** it is reachable without digging into a blog archive.

---

## EPIC H — Backend (Cloudflare Worker)  *(FR-048…052)*

**US-041 — Backed proof surfaces** — *As John, I want Worker routes for every live feature so that the buyer's interactions actually run.*
- AC1: **Given** the Worker, **When** the frontend calls concierge/audit/STT-TTS/CTF-verify/leaderboard/engagement/book-a-call routes, **Then** each responds per contract with the tag protocol synced.
- AC2 (edge): **Given** a route errors, **When** called, **Then** it returns a structured error the frontend can map to a fallback (BR-03), not a 500 with a stack trace.

**US-042 — Durable records** — *As John, I want D1 persistence so that leaderboard and leads survive restarts.*
- AC1: **Given** a solve or engagement request, **When** written, **Then** it persists in D1 and is retrievable.
- AC2 (edge): **Given** a duplicate write, **When** it occurs, **Then** integrity is preserved (idempotent/deduped).

**US-043 — No leaked secrets** — *As Compliance, I want all secrets server-side so that nothing sensitive reaches the client.*
- AC1: **Given** the built client bundle, **When** scanned, **Then** no API token/private key/secret is present.
- AC2 (edge): **Given** `.env`, **When** inspected, **Then** it contains only public values (e.g. WalletConnect project id).

**US-044 — Bounded AI cost/abuse** — *As John, I want rate limiting on AI endpoints so that a live public AI can't be weaponized or bankrupt me.*
- AC1: **Given** requests above the limit, **When** they arrive, **Then** they are throttled with a clear response.
- AC2 (edge): **Given** a throttled user, **When** they hit the limit, **Then** the frontend degrades gracefully (queued/try-later), not a crash.

---

## EPIC I — Arrival / SEO / trust  *(FR-053…056)*

**US-045 — Win my own name** — *As a referred Founder/CTO, I want jw3b.dev to rank #1 for John's name so that the highest-intent search lands cleanly.*
- AC1: **Given** a branded search, **When** results show, **Then** jw3b.dev is rank #1 with correct title/OG/meta.
- AC2 (edge): **Given** a social share, **When** unfurled, **Then** the OG card renders correctly (Person structured data valid).

**US-046 — Own the niche explainers** — *As a Founder/CTO researching, I want authoritative explainer pages so that John's thesis terms lead me to him.* (COULD)
- AC1: **Given** "systems are graphs" / "zero-trust validator", **When** the page renders, **Then** it explains the concept with a live artifact.
- AC2 (edge): **Given** thin content risk, **When** published, **Then** each page ties to a real on-site proof surface.

**US-047 — GitHub reinforces the site** — *As a Hiring Manager, I want real repos linked so that commit cadence corroborates the systems.* (COULD)
- AC1: **Given** the systems surface, **When** it renders, **Then** each system links its real repo where public.
- AC2 (edge): **Given** a private repo, **When** it can't be linked, **Then** no dead/404 link is shown.

---

## EPIC J — Compliance & trust surfaces  *(FR-057…059)*

**US-048 — Privacy notice** — *As Compliance, I want a privacy notice so that analytics/wallet/engagement data handling is disclosed.*
- AC1: **Given** the site, **When** I look for it, **Then** a privacy notice covering analytics, wallet data, and engagement PII is reachable from every page.
- AC2 (edge): **Given** OD-04 jurisdiction, **When** resolved, **Then** the notice names the correct regime (GDPR/POPIA).

**US-049 — Consent when required** — *As Compliance, I want consent handled if the law requires it so that analytics is lawful.* (SHOULD; gated on `[NEEDS RESEARCH]`)
- AC1: **Given** research confirms consent is required, **When** a first-time visitor arrives, **Then** consent is captured before non-essential analytics fire.
- AC2 (edge): **Given** consent declined, **When** browsing, **Then** only essential processing occurs.

**US-050 — Checkout terms** — *As Compliance, I want engagement terms at checkout so that paid actions are covered.* (SHOULD; gated on `[NEEDS RESEARCH]`)
- AC1: **Given** a paid checkout (escrow/Unlock), **When** I reach it, **Then** scope + refund/cancellation terms are presented and acknowledgeable.
- AC2 (edge): **Given** terms not acknowledged, **When** I try to pay, **Then** checkout is blocked.

---

## Traceability matrix (OBJ → FR → Story → AC count)

| OBJ | FRs | Stories | AC count |
|---|---|---|---|
| OBJ-01 (convert) | FR-002, 019, 028–038, 040, 041, 048, 049 | US-002, 016, 023–033, 035, 036, 041, 042 | 36 |
| OBJ-02 (prove live) | FR-001, 006, 008–013, 015–017, 020, 022, 023, 025–027, 048, 052 | US-001, 006, 008–011, 013, 014, 016, 017, 019, 021, 022, 041 | 30 |
| OBJ-03 (verifiable) | FR-044, 053, 054, 055, 056 | US-039, 045, 046, 047 | 8 |
| OBJ-04 (depth+honesty) | FR-003, 004, 005, 045, 060 | US-003, 004, 005, 040, 051 | 10 |
| OBJ-05 (claims discipline) | FR-014, 018, 021, 024, 039, 042, 043, 046, 047, 050, 057, 058, 059 | US-005, 012, 015, 018, 020, 034, 037, 038, 043, 048, 049, 050 | 24 |
| OBJ-06 (register/perf) | FR-007, 012, 020, 026, 051 | US-007, 011, 017, 022, 044 | 10 |

**Coverage:** all 60 FRs appear in ≥ 1 story (no `[DECOMPOSITION INCOMPLETE]`); all 6 objectives have
≥ 1 FR and ≥ 1 story (no uncovered objective); 51 stories, ~108 ACs, every story ≥ 2 ACs with a
happy + an error/edge path.
