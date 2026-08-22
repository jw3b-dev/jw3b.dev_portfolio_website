# Product audit — live first-visitor walkthrough, full defect & gap register

**codebase-auditor · 2026-08-21 · R0 of the product rerun · companion: `POSTMORTEM_CONCEPT_SHIP.md`**

**Method.** Every route on live **jw3b.dev** walked in a real browser (Playwright) as a walletless
first-time visitor; every finding then traced to code. Nothing here is inferred — each row was
observed on the deployed site or proven by grep/read of the source. This register is the R4
re-walk checklist: every row ends **fixed** or **owner-blocked**; none may be silently dropped.

**Severity.** **P0** = lies to visitors or loses business · **P1** = core value broken/blocked ·
**P2** = product-grade gap · **P3** = polish. **Cause** → root-cause # in the postmortem.

**Audited and verified working** (absent from the register): voice stack (mic → Whisper STT, TTS
opt-in), privacy notice + thesis rendering, Overmind stepper mechanics, configurator logic +
derived recommendation, offline lead queue (capture side, BR-11), audit-console internals
post-redesign (numbered sections, cost lines, gated fixes, version snapshots), recorded-run
fallbacks, CTF verify + leaderboard worker routes, claims gate, CSP/security headers. The
register is complete over the walked surface, not a sample.

| # | Finding (verified) | Sev | Cause | Fix |
|---|---|---|---|---|
| 1 | `/engagement` leads land in D1 (0 rows ever); **no notification mechanism exists in the worker** | P0 | 1 | W1 |
| 2 | `/book-a-call` validates the contact then **discards it** — no persist | P0 | 1 | W1 |
| 3 | Success UI: *"You're on John's list — John will follow up"* — a promise no system fulfils | P0 | 2 | W1 |
| 4 | Concierge tool-call **auto-navigates + closes chat** — visitor's answer never seen | P0 | 3,4 | W2 |
| 5 | Concierge **fabricated** the audit-page description — KB has zero site/page knowledge | P0 | 3 | W2 |
| 6 | Tool-call fires on informational questions (one soft prompt sentence is the only gate) | P1 | 3 | W2 |
| 7 | Tool-call's `#contact`/`#pricing` payload: **no code reads `location.hash`** | P1 | 4 | W2 |
| 8 | "Live — answering now" stuck permanently after the tool-call abort | P1 | 3 | W2 |
| 9 | Launcher "Agent status unknown" until hover/open (ping never fires on load) | P2 | 3 | W2 |
| 10 | **/audit wrapper contradicts its console** — "heuristics… live model" intro above "Instant screen"; numbered workflow described nowhere *(owner's report)* | P1 | 4 | W3 |
| 11 | Section "4 · AI analyses" invisible until a run is burned — workflow unlearnable pre-spend | P2 | 4 | W3 |
| 12 | Hero: "Live heuristic · client-side" (the banned collision), "Heuristic pass" chip, "re-run the auditor" label | P2 | 4 | W3 |
| 13 | /work: "this **live** /audit console" — violates the brief's permanent naming ban | P2 | 4 | W3 |
| 14 | Home "What failed" prose + KthulhuEmbed still name "heuristic pass/pre-screen" as UI terms | P3 | 4 | W3 |
| 15 | Fuzz output renders **literal ``` fences as text**; no Copy, no Download, no run instructions | P1 | 5 | W3 |
| 16 | Tx-explainer untriable: bare hash field, no examples, no statement of what it returns | P2 | 5 | W3 |
| 17 | ~~`src/data/vuln-corpus` ships in the bundle, used by no UI~~ **RETRACTED — the finding was wrong.** It is imported by `workers/portfolio-agent/src/auditRag.js` as the offline seed/reference for the Neon RAG corpus, and it is **not** in the client bundle (verified by grepping `dist/assets`). Nothing to fix. Recorded rather than deleted: an audit that quietly drops its own mistakes is not an audit. | — | — | n/a |
| 18 | Console produces no takeaway: no report export, no finding→line link, no hire CTA from findings | P2 | 5 | W3 |
| 19 | /ctf pre-wallet = **42-line login wall**: no brief/source/address/leaderboard/recorded solve — while `/ctf/leaderboard` + the recorded-solve artifact both exist unused | P1 | 5 | W4 |
| 20 | /messages: stub promoted in primary nav; "← Back to the console" links to **home** | P2 | 2 | W4 |
| 21 | 2 of 4 "operable" flagships (KTHULHU, Kointel) are iframes/link-outs — claim-vs-reality gap | P1 | 2 | W4 |
| 22 | Thesis pages argue "operable, not prose" — in prose, ending in a link. systems-are-graphs claims *"the surfaces here are consoles… the work is traversing it in front of you"* — **no surface traverses any graph** | P2 | 2 | W4 |
| 23 | 4 CSP console errors on **every page** (Cloudflare zone RUM injection vs our CSP) | P2 | 3 | W5+owner |
| 24 | /work console noise: embedded products' own anonymous 401s (theirs; documented) | P3 | — | W5 note |
| 25 | CTF vault is v1-era (3/4 selectors) holding 0.00012 ETH | P1 | — | OWNER |
| 26 | Unlock locks placeholder `0x…` / escrow testnet-only — no path for money to move | P1 | — | OWNER |
| 27 | Scheduler URL null (Cal.com never provisioned) — superseded by the OpenClaw rail | P1 | 2 | W1 |
| 28 | XMTP absent (deliberate dep decision) while /messages sells it | P2 | 2 | R1 |

## Status — W1 and W2 closed and re-verified on live jw3b.dev

| # | Status | Live evidence (2026-08-21) |
|---|---|---|
| 1 | **FIXED** | `POST /engagement` on production returns `"alerting":true`; a Telegram alert channel is configured and was proven by a real send. |
| 2 | **FIXED** | `POST /book-a-call` returns an `id` and the row appears in `book_a_call_leads` — the first row that table has ever held. |
| 3 | **FIXED** | The confirmation now reports the actual delivery state (delivered/alerted · delivered/recorded · queued for reconnect · rejected with a mailto fallback). |
| 4 | **FIXED** | Asked the deployed concierge "How do I use the audit page?" — no navigation, widget stayed open, answer fully readable. |
| 5 | **FIXED** | Same question now returns the real console description: three tools, the four numbered steps, free instant screen, 10 metered AI calls, per-run tabs, and the "not a full audit" caveat. |
| 6 | **FIXED** | The informational question produced no offer card — the tool-call was suppressed by the deterministic intent gate. |
| 7 | **FIXED** | `#contact` opens the booking surface directly; seam test pins the hash Mission Control honours to the hash `toolCallTarget` emits. |
| 8, 9 | **FIXED** | Status probes on mount from the deployed origin (and only there — an unprompted cross-origin ping is CORS-blocked console noise, which CI caught). |
| 27 | **SUPERSEDED** | Cal.com dropped; the OpenClaw Telegram rail replaces it (owner-gated on a dedicated bot). |

A regression found *during* this verification is worth recording: `SITE_GUIDE_PROMPT` was defined
and never concatenated into the system prompt, so #5 shipped "fixed" while the live model kept
fabricating. CI was green throughout — nothing imports a prompt constant. Only re-asking the
deployed model caught it. `conciergeSystemPrompt.test.js` now fails if any defined prompt block
does not reach `system`. **This is root cause 3 reproducing itself inside its own remediation:
static gates cannot see model behaviour.**

## Walkthrough evidence highlights

- **The concierge test, verbatim.** Asked live: *"How do I use the audit page?"* Response
  (recovered by reopening the widget): "The audit page **showcases John's track record** as a
  smart-contract security auditor on CodeHawks…" — invented; the page is the interactive console.
  The reply then offered "I can open the booking flow:" and the `[TOOL_CALL]` auto-fired:
  navigation to `/hire-me#contact`, widget closed, answer never seen, streaming flag stuck at
  "Live — answering now" for the rest of the session, and the `#contact` payload did nothing.
- **The hire test, verbatim.** Completed the configurator (Secure → Live/shipped → Smart
  contracts → Urgent → Project → Security Audit Sprint), submitted a contact. UI: "Request
  captured… John will follow up." D1 `engagement_requests`: **0 rows total** (live query).
  Worker: no notify path exists.
- **/ctf pre-wallet**, entire accessible content: heading, "Base Sepolia testnet · no real
  funds", one sentence, Connect button. 42 lines of accessibility tree.

## Disposition rule

R4 walks this table on live jw3b.dev. A row closes only as **fixed (re-verified live)** or
**owner-blocked (named, with the unblocking ask)**. Anything else keeps the gate red.

---

## R4 — the full re-walk, 2026-08-22

Rows 1–9 and 27 closed above on 2026-08-21. This walks **every remaining row**. Live verification is
`npm run e2e:prod` against `https://jw3b.dev` — **41 passed, 0 failed**, covering the console-error
budget on all nine routes, the first-visitor walkthrough, and three live-model behavioural checks.
Code-only rows say so rather than claiming a live check they did not get.

| # | Sev | Status | Evidence |
|---|---|---|---|
| 10 | P1 | **FIXED (live)** | `/audit`'s wrapper and console both render from `consoleCopy.js`; the "How it works" strip shows all four numbered sections. Pinned by `first-visit.spec.js`, green against production. |
| 11 | P2 | **FIXED (live)** | Section 4 is visible on arrival — the spec asserts all four titles pre-run, so the workflow is learnable before any spend. |
| 12 | P2 | **FIXED (code)** | No rendered copy contains "Live heuristic", "Heuristic pass" or "re-run the auditor". The four surviving matches are **code comments** recording why the term is banned — the intended end state, not a residue. |
| 13 | P2 | **FIXED (code)** | "live /audit console" — 0 occurrences. |
| 14 | P3 | **FIXED (code)** | "heuristic pre-screen" — 0 occurrences in rendered copy. |
| 15 | P1 | **FIXED (code)** | `FuzzTool.jsx`: harness renders in a `<pre>` with fences stripped, plus **Copy** (`:75`), **Download** (`:78`), and the run instruction *"…and run `forge test`"* (`:87`). |
| 16 | P2 | **FIXED (code)** | `TxExplainer.jsx`: an `EXAMPLES` array (`:22`) rendered as chips (`:68`) — triable without owning a transaction hash. |
| 17 | — | **RETRACTED** | The finding was wrong; kept rather than deleted. |
| 18 | P2 | **FIXED (code)** | `AuditConsole.jsx`: **Export report** (`:178`), finding→line via `jumpToLine` (`:69`, wired at `:221`), and a hire link from the findings panel (`:332`). All three takeaways exist. |
| 19 | P1 | **FIXED (live)** | `/ctf` renders brief, target + explorer link and leaderboard **before** the wallet ask — and the spec asserts the ask sits *below* the brief by bounding box, so the ordering cannot silently regress. |
| 20 | P2 | **FIXED (live)** | `/messages` is absent from the primary nav (asserted against production); the "← Back to the console" mislabel no longer exists in `Messages.jsx`. |
| 21 | P1 | **HALF FIXED — and the "owner-gated" half was MY error** ✎ 2026-08-22 | **KTHULHU: FIXED (code).** `KthulhuCorpus.jsx` puts the product's own retrieval layer on the page — semantic search over the public corpus, then traversal along its edges. **No product API was ever required**, and this row asked the owner for one for a month. `/kb/search`, `/kb/related`, `/kb/stats` shipped in W4, deployed, returning real data, with **zero client callers** — `src/config/worker.js` did not even carry the URLs. The Worker holds the same `AI` binding and `NEON_DATABASE_URL` the product does and reads the corpus directly; `kbSearch.js`'s own header says so ("WHY NOT PROXY KTHULHU'S /v1/search"). I wrote that header and then filed the finding as blocked on the thing it explains is unnecessary. **✎ Kointel: CLOSED later the same day.** Re-diagnosed instead of escalated, per the instruction the KTHULHU half produced — and the answer was the same shape. Kointel was *worse* than a frame: its origin sends `X-Frame-Options: DENY`, so the card never reached an iframe at all and degraded to a description and a link. Its documented differentiator (`01_OWNER_DECISIONS.md:22`, `cv-source.md:30`) is **a build-failing CI gate that bans tx-signing from Web3 modules** — a pure rule, needing no API and no product access. `KointelGate.jsx` runs it: paste a module, get a build verdict, with each violation's line and its reason. Labelled on screen as an independent implementation of the rule, **not Kointel's source**, and stating its own blind spot (text matching, not dataflow). **Finding 21 is now fully closed and FR-066 is met for all four flagships.** |
| 22 | P2 | **FIXED (live)** | Both thesis pages carry a driven surface — `ClaimGraphWalk` (`#graph-walk`) and `ClaimsGateDemo` (`#gate-demo`). The spec clicks each and asserts the page **changes**, not merely that it rendered. |
| 23 | ~~P2~~ → **P1** | **CLOSED 2026-08-22 — owner disabled the tag gateway the same day it was correctly diagnosed.** Verified on the apex by `npm run e2e:zone`, 3/3: no tag object, 0 cookies, `_gcl_ls` gone, storage back to wallet-only keys. The re-diagnosis (kept below, because the month it sat misdiagnosed is the lesson): This row said "Cloudflare zone RUM injection", severity P2, remedy "ask for the RUM/insights toggle" — i.e. cosmetic console tidying. What is actually happening: the zone serves **Google Tag Manager (`G-BYN2TE5SEK`) from our own origin** at `/12am/` through Cloudflare's first-party tag proxy. `script-src 'self'` permits it because it *is* self, so **it executes** — `window.dataLayer` is present and `_gcl_ls` is written to localStorage on every route, including `/privacy`. Cookies remain 0, so the posture is half-intact by luck rather than design. **The recorded remedy was the hazard:** the obvious way to clear four CSP console errors is to allow those origins, which would have switched on full Google Analytics against a privacy notice that names no Google service. Our worker never sees `/12am/` (its response carries none of our headers), so this is genuinely un-fixable in code — unlike findings 21's two halves. **Real ask: turn off the zone's Google tag / Zaraz integration.** See P5-GATE in `mas/PLAN.md` for the decision this forces. |
| 24 | P3 | **CLOSED — not ours** | The 401s originate from the embedded products' own origins. Documented; no action. |
| 25 | P1 | **OPEN — owner-gated** | CTF vault is v1-era. **Ask: keystore + gas for a v2 redeploy.** |
| 26 | P1 | **OPEN — owner-gated** | Unlock locks are placeholders, escrow testnet-only. Both flags fail closed and degrade to the hire floor. **Ask: lock provisioning + mainnet funding.** |
| 28 | P2 | **CLOSED — degrades honestly; owner-gated to go live** | Reclassified. XMTP is no longer absent: `@xmtp/browser-sdk` is a dependency, `useXMTP` + `xmtpFlow.js` are implemented, and `/messages` gates on `isEnabled('xmtp') && isEthAddress(XMTP_RECIPIENT)`. The flag is unset in `.env.production`, so the surface degrades rather than selling what it lacks. **Ask: a provisioned XMTP recipient address.** |

---

## ✎ Findings 29–30 — added 2026-08-22, by the sweep that finding 21 forced

Finding 21 turned out to be an endpoint nobody called. The obvious next question was whether it was
the only one, so every Worker route was checked against every client consumer. Two more:

| # | Finding (verified) | Sev | Status |
|---|---|---|---|
| 29 | **`/book-a-call` is answered by the Worker and called by nothing.** The floor submits through `engagementQueue` → `/engagement`, which persists and notifies. W1 added persistence and the Telegram alert to `/book-a-call` as well, and that half has never run. **No visitor impact** — the floor works and is proven live — but the money path has two endpoints for one job and only one of them is real. | P3 | **DECLARED, not deleted.** Recorded in `scripts/reachability-gate.mjs`'s `DECIDED` list with its reason; a deletion candidate, kept because a public endpoint may be referenced externally. |
| 30 | **`/fuzz` is answered by the Worker and called by nothing.** `FuzzTool` builds the harness client-side from `src/lib/fuzzHarness.js` — the generator the Worker imports too — so no round trip is needed. Harmless, and precisely the shape of the bug that `Audit.jsx`'s own header describes ("the Worker's /fuzz route was answering requests nobody could make"): the components were mounted, the route was left. | P3 | **DECLARED** in the same list. |

| 31 | **Every automated gate runs against an origin that does not have the zone layer.** Post-deploy smoke, the console-error budget and the live E2E all target `jw3b-dev-site.agilegypsy.workers.dev`, because the apex challenges GitHub runners. That workaround is right for verifying the deployed code and it means **zone-injected anything is invisible to CI** — which is why finding 23's real content sat unnoticed for a month behind a symptom logged as cosmetic. The workaround was documented; its consequence was not. | P1 | **PARTIALLY MITIGATED** — `e2e/zone-posture.spec.js` (`npm run e2e:zone`) asserts the posture against the real domain and fails today by design. It is a MANUAL gate: a runner would get challenged, and a test that measured the challenge page instead of the site would go green while asserting nothing. Moving it into CI needs apex egress for the runners. |

**The class fix, which matters more than either row.** FR-038 — *nothing ships that a user can't
reach* — has been a requirement since P2 with **no check behind it**, enforced only by whoever
happened to notice. It went unnoticed five times: FuzzTool, TxExplainer, the vuln corpus, the CTF
walkthrough, and the KTHULHU corpus. `scripts/reachability-gate.mjs` now blocks in `verify` on any
Worker route without a client constant, or any constant without a consumer. Red-witnessed by
reproducing the pre-fix state. Its limits are stated in the file: it verifies
`route → constant → source file`, not `transport → component → mounted route`, so the FuzzTool
failure mode itself is still outside its reach.

### Verdict

**✎ Revised 2026-08-22.** The previous verdict read: *"No row is open for an engineering reason …
the gate is green on the work and red on provisioning."* **That was false when written.** Row 21
was open for an engineering reason — an unbuilt UI over a deployed endpoint — and had been recorded
as an owner ask for a month. A register that mistakes an engineering gap for a provisioning gap
sends the owner a bill for work that was already paid for.

**Now: 22 of 29 live findings fixed · 1 retracted · 1 closed as not-ours · 2 newly declared ·
3 open, each owner-gated with a named ask** (23 zone RUM · 25 CTF vault · 26 Unlock/escrow), plus
**Kointel**, which is open and whose cause is *unknown* — it must be re-diagnosed the way KTHULHU
just was, not assumed to need API access.

*Earlier caveat, now resolved:* the Overmind flagship rewrite has since been pushed and deployed;
the table no longer describes a site the deploy does not match.
