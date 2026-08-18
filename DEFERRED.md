# Deferred by owner decision — jw3b.dev v2

Items formally deferred by John, with the date and the standing posture. Each was DESIGNED
for deferral: the affected surface degrades to the book-a-call floor (SC-2: zero
hard-broken states), and flipping it live later is provisioning + a flag — no re-architecture.

## P3-02 — Escrow + Unlock + CTF on-chain activation · deferred to post-GA (John, 2026-08-18)

- **What it needs when picked up:** a deployed `MilestoneEscrow` address (Base) → `src/config/contracts.js`;
  real Unlock lock addresses → `contracts.js` + `src/data/retainer.json`; a funded Base Sepolia
  deployer key to broadcast `contracts/script/DeployCtf.s.sol` → `CTF_VAULT_ADDRESS`.
- **Until then:** `escrow`/`unlock`/`ctf` flags stay OFF; every checkout path terminates at
  book-a-call; the CTF page shows the labelled recorded solve. The P3-04 terms gate is already
  wired in front of both paid rails and activates with them.
- **With this deferral the P-series build scope is complete** (P3-08 GA sweep passed; P3-09
  closed by the OD-04 ratification).

## Production promotion — held by owner (John, 2026-08-18: "not yet")

v2 remains on the preview URLs (`jw3b-dev-site-v2` / `portfolio-agent-v2`); production jw3b.dev
serves v1 until John gives the explicit go. Promotion note: deploy the v2 build to
`--name jw3b-dev-site` and v2 worker code to `--name portfolio-agent` (defaults are the -v2
names on purpose), apply worker migrations against prod bindings, smoke-test, keep
`wrangler rollback` one command away. `voiceLive` ships ON at promotion (owner decision,
2026-08-18).

## P4-01 findings (2026-08-18) — testnet rails activation

**ABI compatibility check** (viem selector-vs-runtime-bytecode against the live Base Sepolia
deployments): the v2 ground-up rebuild REWROTE the contracts, so the old deployments are
**incompatible** — MilestoneEscrow shares only 2/10 selectors (calling it would revert).
Dispositions:

- **CTF vault** `0x4f72…C240`: COMPATIBLE (v2 attack calls deposit/withdraw — identical
  selectors; only unused totalHeld differs; worker verifies by raw eth_getBalance). **ACTIVATED
  on the preview** (VITE_FEATURE_CTF=true) — live challenge verified in-browser: testnet-labeled,
  wallet-connect ready, vault armed (~0.00002 ETH bait). NOT made the shipped default: the bait
  is too small to survive a prod default (first drain empties it); prod activation needs John to
  (a) decide and (b) top up the vault so it survives multiple solves.
- **MilestoneEscrow**: must be REDEPLOYED from the v2 Foundry source (build + 27 tests green;
  `forge script DeployEscrow` dry-run clean). Owner broadcast, exact ask:
  `cd contracts && USDC_ADDRESS=<base-usdc> ESCROW_OWNER=<john-wallet> forge script
  script/DeployEscrow.s.sol --rpc-url <base-rpc> --broadcast --account jw3b-deployer` → paste the
  address into `ESCROW.address` + `PROVIDER_WALLET` in `src/config/contracts.js`, flip `escrow` ON.
  Decision needed: mainnet USDC (real money) vs a testnet-USDC demo.
- **Unlock**: still needs real deployed lock addresses → `UNLOCK_LOCKS` + `retainer.json`.
