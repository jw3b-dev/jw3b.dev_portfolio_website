# jw3b.dev — Project Guide for Claude

Personal portfolio + Web3 service platform for John Wellard (JW3B / AgileGypsy):
a blockchain engineer & smart-contract security auditor. Marketing site with an
on-chain "hire me" flow, an AI concierge chat, and wallet-gated service tiers.

Currently mid-migration on branch `v2-upgrade` (React 18 → 19, adding Web3).

## Stack

- **Frontend**: React 19, Vite 6, React Router 7, Tailwind 3, Framer Motion, `react-helmet-async` (SEO).
- **Web3**: wagmi 2 + viem 2 + RainbowKit 2 (wallet connect), XMTP (`@xmtp/xmtp-js`) for E2E chat, Unlock Protocol (paywall, loaded via `<script>` in `index.html`).
- **Chains**: Base (primary, id 8453), Mainnet, Polygon. Payments = USDC on Base.
- **Backend**: Cloudflare Worker `portfolio-agent` (`workers/portfolio-agent/`) — Workers AI (Llama 3.1 70B chat, Whisper STT, Deepgram Aura TTS) + D1 analytics DB. Deployed at `portfolio-agent.agilegypsy.workers.dev`.
- **Tests**: Vitest + Testing Library + jsdom. Playwright is installed but unused.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # production build → dist/
npm run preview    # preview built site
npm run lint       # eslint (flat config, eslint.config.js)
npx vitest         # run unit tests (config in vitest.config.js, NOT vite.config.js)
npx vitest --coverage
# Worker (from workers/portfolio-agent/):
npx wrangler dev
npx wrangler deploy
```

`.npmrc` sets `legacy-peer-deps=true` — required for the React 19 peer-dep graph.
Install with `npm ci` / `npm install` (they inherit that flag).

## Layout

- `src/components/` — one file per section (Hero, About, Services, Projects, Contact…). Large presentational files; `MissionControl.jsx` (the /hire-me page) is the biggest (~650 lines).
- `src/components/chat/ChatWidget.jsx` — floating AI + XMTP chat, talks to the Worker.
- `src/components/pricing/UnlockPaywall.jsx` — Unlock Protocol checkout wrapper.
- `src/components/wallet/ConnectButton.jsx` — custom RainbowKit connect button.
- `src/hooks/` — `usePortfolioAgent` (Worker chat stream), `useXMTP` (E2E messaging).
- `src/config/` — `wagmi.js` (chains + RainbowKit config), `contracts.js` (Unlock lock addresses, currently placeholders `0x...`).
- `src/constants/index.js` — all site copy/content (personas, projects, services).
- `src/data/retainer.json` — pricing tiers.
- `workers/portfolio-agent/src/` — `index.js` (routes) + `knowledge.js` (the AI system-prompt knowledge base).
- `src/archive/` — old/dev files, **gitignored**. Don't treat as live code.
- `enquirys/`, `development_agent/` — gitignored, private.

## Conventions

- **JSX, not TS.** Files are `.jsx`/`.js`. Types (`@types/react`) are present for editor help only.
- Routes are lazy-loaded in `App.jsx` behind `<Suspense>`. Provider order: Wagmi → React Query → RainbowKit → Helmet → Router.
- Styling: Tailwind utility classes + a cyber/neon glassmorphism aesthetic (cyan `#06b6d4`/`#00f3ff` accents, `backdrop-blur`, dark `bg-black/80`). Match existing tokens when adding UI.
- Buffer/global are polyfilled manually in `main.jsx`; `vite.config.js` defines `global: globalThis` and mocks `process.env`. Be careful changing polyfill setup — Web3 libs depend on it.
- The AI protocol: Worker responses embed `[AUDIO: "..."]` (TTS summary), `[TOOL_CALL: {...}]`, and `[RENDER_CARD: "..."]` tags. `ChatWidget`/`usePortfolioAgent` parse and strip these. Keep the tag contract in sync across `knowledge.js`, `usePortfolioAgent.js`, and `ChatWidget.jsx` if you change it.

## Web3 engineering standards

- **Simulate-first**: never write a `writeContract` without a preceding `useSimulateContract` — pattern is Simulate → Write → Wait for receipt. Use `useReadContract` (not legacy `useContractRead`).
- **Tree-shake viem**: import named exports (`import { parseEther } from 'viem'`), not whole objects.
- **Secrets**: never hardcode private keys / API tokens in frontend code. All secret handling goes through the Cloudflare Worker (use `wrangler secret put`, never commit to `wrangler.toml`). `.env` holds only public values (e.g. `VITE_WALLETCONNECT_PROJECT_ID`).
- When contract addresses land, replace the `0x...` placeholders in `src/config/contracts.js` and `src/data/retainer.json`.

## Gotchas

- Worker URL + XMTP recipient are centralized in `src/config/worker.js` (env-overridable via `VITE_PORTFOLIO_AGENT_URL` / `VITE_XMTP_RECIPIENT`; defaults target production). Don't re-hardcode them in components.
- CI lives in `.github/workflows/ci.yml` — `verify` job (lint → test → build) on push/PR, plus a Cloudflare Pages `deploy` job gated on `main`.
- Coverage thresholds in `vitest.config.js` are high (100% lines/functions) but scoped to a short include-list — adding covered files can break the gate.

## Context discipline (long sessions — these rules must survive compaction)

- **Query the graph, don't read it.** With `graphify-out/` present, answer codebase questions via
  `graphify query|path|explain|affected` (or the `graphify` MCP server registered in `.mcp.json`,
  once approved). Never read `GRAPH_REPORT.md` or `graph.json` wholesale into context — retrieve
  only the nodes/paths the current prompt needs. Rebuilds: `graphify . --code-only` (local AST, no
  key) or `--backend claude-cli` for docs/images (uses Claude Code subscription auth; plain
  `--backend claude` needs `ANTHROPIC_API_KEY` and will fail without it).
- **Pipe bulky output to disk, then grep it.** Forge/vitest/build logs and exploit tracebacks go to
  a scratch file (`cmd > "$LOG" 2>&1`), queried with grep/tail — never dumped raw into chat history.
- **Suggest `/compact` at task boundaries** (a landed feature, a passed verification) with a focus
  hint, rather than letting auto-compact fire mid-task.
- **The 4-hat IA rule.** Engineer=cyan, Auditor=purple, PM=green, Founder=orange (`HATS` in
  `src/constants/index.js`). Identity surfaces show all four hats at once; filters dim cards, never
  hide them.
- **Claims discipline.** Every number/credential the site presents as fact must match
  `docs/PORTFOLIO_REFERENCE.md` (the evidence register). No TVL / protocols-secured / lines-audited
  claims. The citable audit record: CodeHawks #124 · 17 findings (8 High) · 1,430 EXP.
- **Subagent discipline.** Before delegating, do the graph legwork in the parent (`graphify query`
  / `affected`) and hand the subagent surgical coordinates — the exact files and the one task —
  not "go figure out the codebase" (children don't inherit conversation context, but they can
  re-explore expensively). Require digest-only returns: changes written to disk, reply =
  status + files touched + test result, no code blocks or tracebacks. Route mechanical fan-out
  (sweeps, bulk triage) to a cheaper model via the Agent/Workflow `model`/`effort` overrides;
  keep stable reusable agent definitions so child spawns stay prompt-cache-identical.

## Dependency constraints

- **Don't upgrade wagmi to 3.x.** RainbowKit (even latest 2.2.11) peer-requires `wagmi ^2.9.0`; there is no RainbowKit release for wagmi 3. Forcing wagmi 3 breaks the wallet UI and the build (drops the transitive `buffer` polyfill that `main.jsx` imports). Stay on wagmi 2.x / viem 2.x / RainbowKit 2.x until RainbowKit ships wagmi-3 support.
- **`@xmtp/xmtp-js` is pinned at 7.x on purpose.** 13.x is deprecated ("no longer supported"); the real successor is `@xmtp/browser-sdk` (a from-scratch, MLS-based rewrite of `useXMTP`). Treat any XMTP upgrade as a migration project, not a version bump.
- `package.json` has an `overrides` block pinning `elliptic`/`tar-fs`/`ws` to patched versions (clears the critical `elliptic` advisories without touching the wallet-stack majors). Residual `npm audit` items need `secp256k1`/`postcss` majors with no safe fix yet.
- `puppeteer` and `sharp` are in `devDependencies` (only used by an archived CV-generation script) — not runtime deps.
