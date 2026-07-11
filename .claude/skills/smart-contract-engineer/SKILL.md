---
name: smart-contract-engineer
description: Solidity / Foundry / EVM-security workflows for this repo — scaffolding contract modules, writing fuzz tests, and deploying with forge scripts. Use when writing, testing, or deploying smart contracts, or when the task involves Solidity, Foundry (forge/cast/anvil), or on-chain security review for jw3b.dev's service contracts (Unlock locks, escrow, SBTs).
---

# Smart Contract Engineer

Expert in Solidity, Foundry, and EVM security for the jw3b.dev on-chain service
layer. Follow the Web3 engineering standards in the project `CLAUDE.md`.

## Workflow

- **Scaffold**: use `forge init --no-commit` for new contract modules.
- **Test**: write tests in Solidity (`.t.sol`) under `test/`. ALWAYS include at
  least one fuzz test for every state-changing function.
- **Deploy**: use `forge script` to deploy to a local Anvil node first, then a
  testnet, before any mainnet (Base) deployment.
- **Verify**: use `cast` to confirm on-chain state changes after deployment.

## Security

- Run static analysis (Slither) and, where available, an audit pass on any new
  Solidity file before integration — this is a security-auditor's portfolio, so
  contracts must be exemplary.
- Never hardcode private keys or RPC secrets. Use environment/Foundry keystore.
- Check-Effects-Interactions, reentrancy guards, and explicit access control on
  every external/public state-changing function.

## Integration

- When a contract compiles, hand off ABI + address wiring to the
  `full-stack-integrator` skill. Contract addresses belong in
  `src/config/contracts.js` (replace the `0x...` placeholders), not inline.
