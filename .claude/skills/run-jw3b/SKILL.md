---
name: run-jw3b
description: Build, launch, and drive the jw3b.dev site locally — run the Vite dev server, screenshot pages, and inspect the running UI. Use whenever you need to start the site, see what a page actually looks like, take a screenshot, or verify a UI change in the running app rather than by reading code.
---

jw3b.dev is a **React 19 + Vite 6 SPA** (no SSR). It is driven headlessly with **Playwright**
(installed as a dev dependency; also available via the Playwright MCP browser tools) using
`.claude/skills/run-jw3b/driver.mjs`.

Paths below are relative to the repo root.

## Prerequisites

`node_modules` present (`npm install` — `.npmrc` already sets `legacy-peer-deps`), Node ≥ 20, and
Playwright's chromium (`npx playwright install chromium` if `~/.cache/ms-playwright` is empty).

## Run (agent path) — this is the one you want

1. **Start the dev server in the background** (Vite, port 5173):

```bash
nohup npm run dev > /tmp/jw3b-dev.log 2>&1 &
until grep -qE "Local:.*5173" /tmp/jw3b-dev.log; do sleep 1; done
grep -m1 "Local:" /tmp/jw3b-dev.log      # confirms http://localhost:5173
```

2. **Drive it** — `check` prints status/title/console errors, `shoot` writes a full-page screenshot:

```bash
node .claude/skills/run-jw3b/driver.mjs check /
node .claude/skills/run-jw3b/driver.mjs shoot / out/landing.png
node .claude/skills/run-jw3b/driver.mjs shoot /hire-me out/hire-me.png
```

3. **Actually open the PNG and look at it.** `status: 200` is not proof the page rendered right.

Routes worth driving (all render without a wallet): `/` (Hero→About→Services→Projects→Contact),
`/hire-me` (MissionControl), `/audit` (AI console), `/ctf` (Capture-the-Vault).

Override the base URL if Vite picked another port: `JW3B_BASE=http://localhost:5174 node …`.

## Gotchas (things that cost real time)

- **Framer `whileInView` sections start at `opacity:0`.** A full-page capture that never scrolls
  photographs mid/lower sections as dark gaps — the page is fine. Scroll before shooting
  (`page.evaluate(() => window.scrollTo(0, N))` + a settle wait), or screenshot the viewport after
  `scrollIntoView` of the target section.
- **The particle background is Canvas 2D** — no WebGL/swiftshader needed (the flags in the driver
  are harmless leftovers). With `prefers-reduced-motion: reduce` emulated it goes intentionally
  still; that's the a11y guard, not a bug ([creative-technologist]).
- **Wallet UI in headless has no extension** — RainbowKit's connect modal opens but can't complete a
  real connection. Drive non-wallet flows headlessly; wallet flows need a manual pass or a mock.
- **A known console error exists**: `Received true for a non-boolean attribute jsx` (a `<style jsx>`
  usage somewhere in the components). Don't chase it as a new failure; anything *else* in the console
  is a finding.
- **The ChatWidget talks to the production Worker** by default (`src/config/worker.js`). Local UI
  work doesn't need the Worker running; to test against a local Worker, set
  `VITE_PORTFOLIO_AGENT_URL` and run `npx wrangler dev` in `workers/portfolio-agent/`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Executable doesn't exist` | `npx playwright install chromium` |
| screenshot dark below the fold | whileInView reveal — scroll first, not a bug |
| `check` → `status: null` | server not up; wait for `Local:` in the dev log |
| port differs from 5173 | another Vite instance; use `JW3B_BASE` |

## The driver

`.claude/skills/run-jw3b/driver.mjs` — Playwright-based, `shoot`/`check` subcommands. Agent tooling;
extend it (scroll helpers, click, form-fill) as needed. If it grows into something the e2e suite
wants, graduate it to a `tests/e2e/` dir and update this path. Full-journey verification (chat,
CTF, console sweep) is [verify-jw3b-e2e]; this skill is just launch-and-look.
