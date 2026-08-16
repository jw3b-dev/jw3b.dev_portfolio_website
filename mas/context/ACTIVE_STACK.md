# ACTIVE_STACK.md — jw3b.dev v2 (resolved technology stack)

**Owner:** requirements-architect (Phase 2) · **Date:** 2026-08-16 · **Status:** RESOLVED (single stack — not a menu)

> This is a **fixed given**, not a design choice. It is recorded from `facts/00_FACTS_BRIEF §3`
> (the environment constraint), `facts/01_OWNER_DECISIONS` (OD-02), and the wallet/payment/SEO FRs.
> **Deeper architecture design (module boundaries, route tree, DO/Workflow usage, caching) is Phase 3.**
> This file names *what the code runs on*, so every downstream role reads one answer, not options.

---

## The stack (single resolved answer)

### Frontend — FIXED FLOOR (`00_FACTS_BRIEF §3`)
- **React 19** — UI runtime.
- **Vite** — build/dev server.
- **Tailwind 3** — styling (utility layer; token layer built by brand-architect in P0).
- **Framer Motion** — animation (must honor `prefers-reduced-motion`, NFR-05).
- **React Three Fiber (R3F)** — **optional & budgeted** only: ≥ 30fps mobile / ≥ 50fps desktop, non-3D fallback, **never a decorative-only hero** (NFR-03). Not a default; used only where an operable surface earns it.

### Web3 — FIXED FLOOR (`00_FACTS_BRIEF §3`; hard dependency floor)
- **wagmi 2 — NEVER v3.** RainbowKit has no wagmi-3 release; forcing wagmi 3 breaks the wallet UI + the `buffer` polyfill `main.jsx` depends on. Stay 2.x. <!-- dependency constraint: CLAUDE.md + facts -->
- **viem 2** — import **named exports** only (tree-shake), never whole objects.
- **RainbowKit 2** — the custom connect button (FR-040). <!-- entailed by FR-040 + "no RainbowKit for wagmi 3" -->
- **Unlock Protocol** — checkout via `window.unlockProtocol` (loaded via `<script>`), driven only by **real deployed** lock addresses (FR-041/034).
- **Chains:** **Base** primary (id 8453); **Base Sepolia** for the testnet demos (CTF + escrow demo); label testnet↔mainnet honestly everywhere (FR-042, BR-09).
- **Payments:** **USDC on Base**, **6-decimal BigInt** precision (BR-06, DE-03).
- **Web3 pattern:** simulate-first — `useSimulateContract` → write → `useWaitForTransactionReceipt`; `useReadContract` (never legacy `useContractRead`) (BR-04).

### XMTP — OWNER-RESOLVED (OD-02)
- **`@xmtp/browser-sdk`** (the current **MLS-based** successor) for real E2E encrypted messaging — **BUILD NOW**.
- **NOT** `@xmtp/xmtp-js` (7.x pinned / 13.x deprecated). Treat as a **first-class feature build + migration** (new SDK, MLS identity/inbox model, wallet-signature onboarding), **not** a version bump. Sequenced off the conversion critical path (P3). <!-- OWNER: OD-02 -->

### Backend — FIXED FLOOR (`00_FACTS_BRIEF §3`)
- **Cloudflare Worker** (the `portfolio-agent` successor) — full rebuild.
- **Workers AI** — chat/audit inference, **Whisper STT**, TTS.
- **Anthropic via AI Gateway** — reasoning where required (through Cloudflare AI Gateway, not direct).
- **D1** — analytics, CTF leaderboard, engagement requests (FR-049).
- **Rate-limiting** on all AI endpoints (FR-051, NFR-08).
- **Secrets server-side only** — `wrangler secret put`; never in the client bundle or `.env`-public (FR-050). `.env` holds public values only (e.g. `VITE_WALLETCONNECT_PROJECT_ID`).
- **Tag protocol** (`[AUDIO]` / `[TOOL_CALL]` / `[RENDER_CARD]`) owned server-side, kept in sync with the frontend parser (FR-052/017).

### Smart contracts — entailed by the on-chain FRs
- **Foundry** (forge/cast/anvil) for the **MilestoneEscrow** (USDC-on-Base escrow, FR-033) and the **CTF reentrancy vault + attacker** (Base Sepolia, FR-022/027). Authored/deployed by smart-contract-engineer in P2; **deploy/fund is owner-provisioned**. <!-- INFERRED from FR-022/027/033 + charter §7 (smart-contract-engineer) -->

### Tests / tooling
- **Vitest + Testing Library + jsdom** (unit/component). **Playwright** for E2E (installed; used by the verify roles).
- **ESLint** flat config; **`.npmrc` `legacy-peer-deps=true`** (required for the React 19 peer graph — install via `npm ci`/`npm install`).
- **Polyfills:** Buffer/global polyfilled in `main.jsx`; Vite defines `global: globalThis` and mocks `process.env` — Web3 libs depend on this; change with care.

### Directly-entailed companions (tier: INFERRED from the FRs + stack floor; confirm in Phase 3/4)
- **Routing:** a React client router with **lazy-loaded routes behind `<Suspense>`** (supports LCP ≤ 2.5s via lazy proof surfaces, NFR-01) — React Router is the incumbent choice; confirm in Phase 3. <!-- INFERRED -->
- **SEO:** a `react-helmet-async`-class head manager for per-route title/meta/OG + **Person structured data** (FR-053/054, NFR-06). <!-- INFERRED from FR-053/054 -->
- **Provider order:** Wagmi → React Query → RainbowKit → Helmet → Router. <!-- INFERRED from Web3 stack + charter P0 -->

---

## Hard prohibitions (do not "upgrade" these)
- ❌ **wagmi 3.x** — breaks RainbowKit + the buffer polyfill.
- ❌ **`@xmtp/xmtp-js`** for the new build — deprecated; the target is `@xmtp/browser-sdk` (OD-02).
- ❌ **Secrets in the frontend / `.env`-public / `wrangler.toml`** — Worker-only.
- ❌ **A `writeContract` without a preceding successful `useSimulateContract`** (BR-04).
- ❌ **Deploy or push** — build on branch `v2` only; John owns all deploys (`WORKSPACE_CONTEXT.md`).

## Deferred to Phase 3 (architecture design — NOT decided here)
Module/route decomposition · Worker route contract shapes + D1 schema DDL · Durable Objects / Cloudflare Workflows usage · caching/replay-artifact storage (KV/R2/D1) · CSP specifics for embedded live surfaces · model-routing (which model per endpoint) within the rate/cost budget.
