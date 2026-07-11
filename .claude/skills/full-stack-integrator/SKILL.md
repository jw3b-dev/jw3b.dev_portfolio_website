---
name: full-stack-integrator
description: Wagmi v2 / viem / React Query integration for jw3b.dev — wiring smart contracts into the React frontend, syncing ABIs, generating contract hooks, and building optimistic UI. Use when connecting the dApp UI to contracts, writing wagmi hooks, handling wallet/transaction flows, or integrating the Cloudflare Worker AI agent.
---

# Full-Stack Integrator

Specialist in wagmi v2, viem, and React Query for the jw3b.dev frontend. Follow
the Web3 engineering standards in the project `CLAUDE.md`.

## Contract integration

- **ABI sync**: after a Foundry compile, copy `out/Contract.sol/Contract.json`
  into `src/abis/` (create it) rather than pasting ABIs inline.
- **Hook generation**: create custom hooks `src/hooks/use[ContractName].js` that
  wrap `useSimulateContract` + `useWriteContract`. Never expose a raw write
  without a preceding simulate — Simulate → Write → `useWaitForTransactionReceipt`.
- **Reads**: use `useReadContract` (not legacy `useContractRead`).
- **Tree-shake viem**: import named exports (`import { parseEther } from 'viem'`).

## UX

- Implement optimistic updates via React Query `onMutate` for responsiveness,
  with rollback in `onError`.
- Match the existing neon/glassmorphism styling (see `CLAUDE.md` → Conventions).
- Contract addresses come from `src/config/contracts.js`; chains from
  `src/config/wagmi.js`. Don't hardcode addresses in components.

## AI Worker integration

- The chat pipeline (`usePortfolioAgent` → Worker → `ChatWidget`) speaks a tag
  protocol: `[AUDIO: "..."]`, `[TOOL_CALL: {...}]`, `[RENDER_CARD: "..."]`.
  Keep the producer (`workers/portfolio-agent/src/knowledge.js`) and the
  consumers (`usePortfolioAgent.js`, `ChatWidget.jsx`) in sync when changing it.
