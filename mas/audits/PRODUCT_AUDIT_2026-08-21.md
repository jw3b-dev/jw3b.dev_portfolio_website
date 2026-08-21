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
| 17 | `src/data/vuln-corpus` ships in the bundle, **used by no UI** | P2 | 5 | W3 |
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
