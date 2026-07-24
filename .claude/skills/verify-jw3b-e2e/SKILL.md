---
name: verify-jw3b-e2e
description: Run jw3b.dev's end-to-end verification — drive the real site flows in a browser (landing render + all-4-hats visible, AI chat round-trip with tag stripping, /audit console, /ctf page, hire-me pricing) plus a console-error sweep across routes. Use after changing the chat pipeline, the tag protocol, a route, the wallet provider tree, or any section — and whenever someone asks to "test the frontend end to end", "check the site really works", or suspects broken flows. run-jw3b only launches and screenshots; THIS skill asserts behaviour.
---

# verify-jw3b-e2e

Drives the real site (Vite dev server, port 5173) with Playwright — either the MCP browser tools or
`node` scripts using the repo's installed `playwright`. Playwright is a dev dependency but the repo
has **no committed e2e suite yet**; this skill is the working verification list, and specs written
here should graduate to `tests/e2e/` when stable.

## What to verify, in order

1. **Landing renders + identity is intact** — `/` returns 200, `<title>` contains "John Wellard",
   and **all four hat tags are simultaneously visible** in the Hero (ENGINEER, AUDITOR, PM, FOUNDER)
   and About renders 4 role cards. The four-hats-visible invariant is the point of the redesign —
   treat its regression as a failure, not a style choice.
2. **Console sweep across routes** — visit `/`, `/hire-me`, `/audit`, `/ctf`; collect console
   errors. **Known + expected:** `Received true for a non-boolean attribute jsx` (pre-existing
   `<style jsx>` usage). Anything else is a finding. 401s from the production Worker when testing
   without it are environmental noise — note, don't chase.
3. **Chat round-trip + tag stripping** — open the ChatWidget, send a message, and assert:
   a reply streams in, AND **no raw protocol tag** (`[AUDIO:`, `[TOOL_CALL:`, `[RENDER_CARD:`)
   appears in the visible transcript. The tags are the Worker↔frontend contract
   ([architect] seam); leaking one into the DOM is the classic silent break. Requires the Worker
   (production default, or local `wrangler dev` + `VITE_PORTFOLIO_AGENT_URL`).
4. **/audit console** — page renders, the heuristics path accepts pasted Solidity and returns
   findings (the `auditHeuristics` engine — [audit-heuristics-engineer]).
5. **/ctf** — page renders the vault UI with the Base Sepolia address
   (`0x4f72efbe94677E9bd5a3a1741b137e9Ea203C240`) and doesn't crash without a wallet.
6. **/hire-me (MissionControl)** — pricing tiers render from `src/data/retainer.json`; the Unlock
   paywall button exists. A real checkout needs a wallet — assert presence, not purchase.

## What headless CANNOT verify (say so, don't fake it)

- **Real wallet connection / transactions** — no extension in headless. Assert the Connect button
  renders and the modal opens; stop there and say the rest needs a manual pass.
- **XMTP E2E chat** — needs a connected wallet identity. Out of headless scope.
- **Voice (TTS/STT)** — audio in headless is a stub; verify the request fires, not the sound.

## Gotchas (real ones from this repo)

- Framer `whileInView` content is `opacity:0` until scrolled into view — scroll before asserting
  visibility or use `scrollIntoView` on the target section ([run-jw3b] has the pattern).
- The ChatWidget lazy-mounts — wait for its toggle button before interacting.
- `prefers-reduced-motion: reduce` intentionally stills the particle canvas — don't read a still
  background as a render failure ([creative-technologist]).
- Coverage note: e2e runs do NOT feed the vitest coverage gate ([test-engineer]) — passing e2e does
  not exempt a change from `npx vitest run --coverage`.

## Reading results

Report per-flow: what was exercised, what was asserted, what was environmental noise, and what was
**not** covered (wallet, XMTP, voice). "The site loads" and "the flows work" are different claims —
make only the one you verified.
