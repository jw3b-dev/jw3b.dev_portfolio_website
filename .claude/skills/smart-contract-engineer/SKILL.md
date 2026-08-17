---
name: smart-contract-engineer
description: jw3b.dev v2 on-chain contract work — Solidity/Foundry contracts in `contracts/`, their forge tests (fuzz + adversarial), deploy scripts, and ABI export to `src/config/abis/`. Use for the MilestoneEscrow (Base, USDC) and the CTF ReentrantVault/Attacker (Base Sepolia), or any Solidity/forge/cast/anvil task. jw3b-retargeted override of the user-scope smart-contract-engineer — this project's paths and stack win.
---

# Smart Contract Engineer — jw3b.dev v2

Project override. The generic charter (correctness authority, CEI + guard + SafeERC20 +
one-way state + custom errors, exhaustive+adversarial tests, no-mainnet-broadcast) is at
user scope; this file pins it to **this repo's reality**. Follow the Web3 engineering
standards in the project `CLAUDE.md`.

## This project's on-chain layout

- **Foundry project:** `contracts/` (worktree `/home/agilegypsy/code/projects/jw3b.dev-v2`).
  `forge` binary: `/home/agilegypsy/.foundry/bin/forge` (1.7.x). Config: `contracts/foundry.toml`
  (solc **0.8.24**, optimizer 200, `[fuzz] runs=256`, `[profile.ci.fuzz] runs=1000`).
- **Deps** (gitignored, reproducible): `contracts/lib/openzeppelin-contracts` (**OZ v5.6.1** —
  `Ownable(address)` + custom errors) and `contracts/lib/forge-std`. Remappings in foundry.toml.
  A local OZ mirror exists at `/media/D/kthulhu.old/openzeppelin-contracts`; network `git clone`
  also works.
- **Contracts:** `contracts/src/MilestoneEscrow.sol` (P2-01, done) — USDC 6-dec escrow,
  Funded→{Released|Refunded} one-way, matches the D1 `escrow_agreements` state set. Next:
  `ReentrantVault.sol` + `Attacker.sol` (P2-02, Base Sepolia CTF).
- **Tests:** `contracts/test/*.t.sol` + `contracts/test/mocks/` (MockUSDC 6-dec, ReentrantUSDC).
- **Deploy:** `contracts/script/*.s.sol` — env-driven (`USDC_ADDRESS`, `ESCROW_OWNER`),
  dry-runnable, hardcodes nothing.
- **ABI handoff:** `forge inspect src/X.sol:X abi --json > ../src/config/abis/X.json`. That
  file is the contract with the wagmi flow (P2-04/05, web3-blockchain owns the client side).

## Chain / token facts (never assume)

- **Base mainnet** id 8453 · **Base Sepolia** id 84532. USDC on Base = `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, **6 decimals** (not 18). Amounts are integer base units — no floats, ever.
- Escrow deploy/funding is **OWNER-PROVISIONED** (John, at deal close). Rails stay
  feature-flagged (`escrow`/`ctf` = false in `src/config/features.js`) and degrade to
  book-a-call until live. **Do NOT deploy/broadcast — John owns deploys.**

## Verify before done

`cd contracts && forge test` all green (every revert + ≥1 fuzz + an adversarial repro);
`forge fmt --check` clean; deploy script dry-runs; ABI exported + current. Then log the row in
`mas/ROLE_LEDGER.md`. This is a security auditor's own portfolio — the contract must be
exemplary, not merely functional.
