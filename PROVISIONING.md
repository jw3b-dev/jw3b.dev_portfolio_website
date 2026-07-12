# Provisioning Checklist — on-chain & remaining features

Everything buildable without your keys is **already live** (jw3b.dev + the Claude Worker, auto-deploying from every commit). The items below need a key, a deploy, or a decision from **you**. Each is independent — do them in any order. Account: Cloudflare `04bf3d7c95516d3e9a2af68fc8f6619b`; contracts in `contracts/` (Foundry).

---

## 0. One-time: a funded Base deployer (unblocks all contract deploys)
- [ ] Create/choose a deployer wallet. Fund it with a little ETH on **Base Sepolia** (testnet — use a faucet) and/or **Base mainnet**.
- [ ] Load it into Foundry as a keystore (never paste a raw key):
      `cast wallet import jw3b-deployer --interactive`
- [ ] Set an RPC: `export BASE_SEPOLIA_RPC=https://sepolia.base.org` (or a keyed provider).

> With that in place, tell me and I can drive the `forge script` deploys + wire the addresses.

## 1. MilestoneEscrow (defensive showcase) — `contracts/src/MilestoneEscrow.sol`
Built + tested (28 forge tests). It's a **per-engagement** contract (deploy one per client with real params), so there's nothing to "deploy once".
- [ ] When you close a deal: `forge create` (or a small script) with `(client, provider, token=USDC, deadline, milestoneAmounts[])`.
- [ ] Paste the address into `src/config/wagmi.js` → `CONTRACTS.escrow.address`. The `useEscrow` hook (Simulate→Write→Wait) then goes live.
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

## 2. CTF exploit playground (offensive showcase) — `contracts/src/ctf/`
Vulnerable + fixed vaults + a passing exploit PoC. To make it interactive on the site:
- [ ] Deploy `ReentrantVault.sol` to **Base Sepolia** (testnet only — it's a honeypot).
- [ ] Create the D1 leaderboard table (I can do this via the Cloudflare API): `CREATE TABLE ctf_solves (address TEXT, tx_hash TEXT, ts INTEGER, PRIMARY KEY(address))`.
- [ ] I'll add the `/ctf` page + a worker `/ctf/verify` route that confirms a drain on-chain before recording a solve.

## 3. RAG-augmented auditor (cite real audit findings) — ✅ DONE (reuses KTHULHU's KB)
Instead of building a new Vectorize index, the `/audit` route now reuses the **existing**
shared Neon Postgres + pgvector knowledge base from the KTHULHU project — **9,525 real
findings** (6,910 **Solodit** + 1,384 Sherlock + 823 DeFiHackLabs + 408 vulns DB), already
embedded with `@cf/baai/bge-m3` (1024-dim). Sentinel retrieves the top-3 nearest precedents
by cosine distance and cites them by title/SWC + source. Wired in `workers/portfolio-agent/src/rag.js`.
- Access is via the `NEON_DATABASE_URL` **Worker secret** (set; not committed). Fail-open: if the DB is unreachable the audit still runs, just without precedent.
- Nothing needed from you. (Optional later: point at a jw3b-only corpus of *your* published reports if you'd rather not share KTHULHU's table.)

## 4. On-chain audit attestations (EAS on Base) — `sbt` stub
- [ ] Register an EAS schema on Base (e.g. `bytes32 engagementId, string scope, uint8 severityResolved, string reportURI`) → gives a `schemaUID`.
- [ ] I'll wire the issue flow (you sign `attest()`) + a public `/verify/:uid` view; point `CONTRACTS.sbt.address` at EAS.

## 5. Gasless "hire me" (ERC-4337 + paymaster)
- [ ] Choose a paymaster (Coinbase CDP Paymaster on Base, or Pimlico) and create a **sponsorship policy** scoped to USDC `approve`/`transfer` to the lock/escrow only, with per-address caps.
- [ ] Provide the paymaster URL (I'll proxy it through the worker so keys stay server-side); I'll wire EIP-5792 `useSendCalls` with `capabilities.paymasterService`.

## 6. ZK proof-of-reputation (Noir) — heaviest, do last
- [ ] Decide it's worth it; I'll add a `circuits/` Nargo project + an UltraHonk `Verifier.sol`.
- [ ] Deploy the verifier to Base + publish the Merkle root of eligible accounts.

---

## Cloudflare things I can do for you right now (just say go)
- Create the CTF **D1 leaderboard** table and the **Vectorize** index (I have Cloudflare API access).
- Tune the **AI Gateway** rate limits / cache (`jw3b-portfolio-agent`).
- Switch the concierge model to `claude-sonnet-4-6` (cheaper, eases the subscription rate limit) via `ANTHROPIC_MODEL`.

## Also outstanding (no keys needed — I can just do these)
- [ ] Real project **screenshots** in `src/assets/projects/` (see `DEFERRED.md` for the mapping).
- [ ] Remove the now-unused `@xmtp/xmtp-js` dependency.
- [ ] Merge **PR #2** (`v2-upgrade → main`) once you're happy.
