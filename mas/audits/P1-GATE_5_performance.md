# P1-GATE · Role 5/5 — Performance gate (performance-monitor)

**Phase:** P1 exit gate · **Verdict: PASS** (weighted 4.65/5; no P0) · 1 WARN-level improvement.
**Enforces:** NFR-01 (LCP / first-token). Report only — nothing fixed.

## LCP posture (NFR-01) — STRONG

- Built `dist/index.html` (**2,281 bytes**) ships the LCP element — the `<h1>` position line ("…survive production") — **plus an inline `<style>` critical-CSS block**. The LCP paints from static HTML with **zero JS/network dependency** (`heroShellPrerender`, ADR-07). Running the build *is* the prerender.
- The operable hero (audit console) imports **no** wallet deps → interactive on `auditHeuristics.js` (2 kB) + recorded runs, independent of the heavy web3 chunk.

## Bundle budgets — bounded & code-split

| Chunk | raw | gzip | On boot path? |
|---|---|---|---|
| entry `index-BtW…` | 332 kB | 108 kB | yes |
| `core` (react/query) | 210 kB | 59 kB | yes |
| `Home` (lazy route) | 155 kB | 49 kB | on `/` |
| `web3` (wagmi/viem) | 3,010 kB | **623 kB** | yes (eager provider) |
| `metamask` | 564 kB | 173 kB | yes |
| `walletconnect` | 764 kB | 220 kB | yes |

Wallet stack is deliberately split into 3 independently-cacheable chunks (`manualChunks` in `vite.config.js`) so no single chunk beyond `web3` is monstrous and they cache/update apart from app core. Route code is lazy (`lazy(() => import(...))` per page). The split boundary is the documented budget guard.

## Blue team (strengths)

1. **LCP fully decoupled from JS** — static shell + inline CSS in `dist/index.html`; the heaviest possible dependency (1 MB gz wallet stack) cannot delay first paint.
2. **Honest, bounded heavy chunk** — `vite.config.js` comments the web3 size as expected and enforces the split rather than hiding it behind a raised warning limit.
3. **Operable hero needs no wallet** — the thesis surface works on 2 kB of heuristics; wallet is only for opt-in on-chain flows.

## Red team

1. *Not addressed:* **eager wagmi provider** — `WagmiProvider`/`RainbowKitProvider` mount at App root (App.jsx:86–99), so ~**1 MB gzip** of wallet JS downloads on **every** first load, including visitors who only read the hero or use the book-a-call floor (which need no wallet). **(WARN / P2 improvement)**
2. *Assumption:* LCP is proven structurally (element in shell) but the **numeric** LCP/first-token is unmeasured until deployed (needs a real browser/Lighthouse) — post-deploy smoke.
3. *Constraint:* none violated — provider order is the SDD-fixed Wagmi→Query→RainbowKit→Helmet→Router.
4. *Cascade:* if the eager-provider cost is ignored, mobile TTI on slow links degrades even though LCP stays fast — a perceived-vs-measured gap.
5. *Next consumer:* P2 wallet flows will lean on this provider; deferring it is easier to design **now** (before escrow/unlock wire in) than to retrofit.

## Improvement items

| Priority | Target | Location | Suggestion |
|---|---|---|---|
| P2 (WARN) | architecture (lead-architect) | `src/App.jsx:86–99` | Defer `WagmiProvider`/`RainbowKitProvider` behind wallet-gated surfaces (hire/escrow/unlock) so the ~1 MB gz wallet stack leaves the boot path for hero/book-a-call visitors. Provider order stays fixed; only its mount point moves. Best done before P2 rails wire in. |
| P3 | post-deploy | live target | Capture real LCP/first-token via Lighthouse on the deployed origin to confirm the structural LCP win numerically. |

**Verdict: PASS** — LCP protected, budgets bounded and split, one P2 boot-path optimization logged. Not a blocker.
