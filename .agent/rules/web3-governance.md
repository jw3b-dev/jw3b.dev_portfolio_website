# Web3 Engineering Standards

## 1. Interaction Layer (Wagmi v2 & Viem)
- **Simulate-First Mandate**: NEVER generate a `writeContract` hook without a preceding `simulateContract` step. The pattern must be: Simulate -> Write -> Wait for Receipt.
- **Tree-Shaking**: Do not import full `viem` objects. Use specific exports (e.g., `import { parseEther } from 'viem'`).
- **Hooks**: Use `useReadContract` for data fetching. Do not use legacy `useContractRead`.

## 2. Security & Compliance
- **Dependencies**: Enforce Next.js versions 15.0.7+ or 16.0.10+ to mitigate CVE-2025-55182.
- **Auditing**: Run `@aderyn-audit` on any new Solidity file before integration.
- **Secrets**: NEVER hardcode private keys or API tokens in frontend code. Use Cloudflare Workers for all secret-handling operations.

## 3. Component Architecture
- **Preservation**: Existing components in `src/components/` (Hero, Navbar) are immutable unless explicitly refactored.
- **Styling**: All new components must use the existing Glassmorphism tokens (`--glass-bg`, `--neon-cyan`) defined in `index.css`.
