# Deferred — jw3b.dev

Things intentionally left for John to provide/decide. Not blocking the build;
the site is green (lint/tests/coverage/build) without them.

## Provisioning (to make the AI features live)
- [x] Worker deployed → `portfolio-agent.agilegypsy.workers.dev` (running on Llama fallback).
- [x] Frontend deployed → `jw3b.dev` (Cloudflare Pages `jw3b-dev-portfolio`, production).
- [x] `rate_limits` table created on the live D1 (per-IP limiter now active).
- [x] **Claude is LIVE via the OAuth token** — the Worker injects the Claude Code identity
      as the first system block (required for `sk-ant-oat…` tokens; per KTHULHU gateway.ts),
      so chat + auditor + fuzz + tx run on Claude, with a bounded 429 retry and Llama fallback.
- [ ] (optional) `ANTHROPIC_MODEL` var to override the default `claude-opus-4-8`
      (e.g. `claude-sonnet-4-6` — cheaper, eases the subscription rate limit).
- [x] **Cloudflare AI Gateway LIVE** (KTHULHU RULE-001): gateway `jw3b-portfolio-agent` created via the
      Cloudflare API — rate limiting (60 req / 60s, sliding), 1h response cache, 2× exponential retry,
      and request logging in front of Claude. Worker routes through it via `ANTHROPIC_BASE_URL`
      (wrangler.toml `[vars]`). Verified in the gateway logs (claude-opus-4-8, 200). Tune limits/cache in
      the CF dashboard (AI → AI Gateway → jw3b-portfolio-agent) any time.

## Projects section — assets & links
- [ ] Replace interim card screenshots in `src/assets/projects/` (currently reused old assets):
      KTHULHU→`auditbrave.png` · Kointel→`creatorhub.png` · Art of Zeta→`fluxbrave.png` ·
      Audits→`agilegypsy-audit.png` · Labs→`rentaldeposit.png` · MB-agentic→`devguild.png` ·
      AgileCEO→`project-2.webp`.
- [ ] Confirm `github.com/jw3b-dev/MB-agentic` is **public** (else the card link 404s for visitors).
- [ ] Provide an **AgileCEO** URL (its card currently has no CTA button).
- [ ] Confirm **Art of Zeta** should be public-facing (its own docs call it "internal proprietary").

## Larger roadmap phases (need contracts/infra you deploy)
- [ ] **RAG** over real audit reports → create a Vectorize index + ingest corpus.
- [x] **Milestone escrow** — `contracts/MilestoneEscrow.sol` built + tested (28 forge tests incl. fuzz + invariants, slither-reviewed) and the `useEscrow` Simulate→Write→Wait hook is wired.
  - [ ] Deploy to Base (`forge script`), paste the address into `src/config/wagmi.js` → `CONTRACTS.escrow.address`, and build the escrow UI panel.
  - [ ] `contracts/lib/` is gitignored — run `git clone --depth 1 https://github.com/foundry-rs/forge-std contracts/lib/forge-std` before `forge test`.
- [ ] **EAS audit attestations** → register an EAS schema on Base.
- [ ] **Gasless USDC "hire me"** (ERC-4337) → CDP/Pimlico paymaster policy + funded sponsor.
- [ ] **Testnet CTF** → deploy the vulnerable contract to Base Sepolia + `leaderboard` D1 table.
- [ ] **ZK proof-of-reputation** → deploy the verifier + publish the Merkle root.
- [ ] Replace the dead XMTP "E2E" tab with **Push Protocol** (feature-flag XMTP off first).

## Repo housekeeping
- [ ] `artifacts/` is untracked scratch — commit or gitignore.
- [ ] Orphaned `/projects/:id` route + `PROJECT_DETAILS` are now unused (all projects are external);
      remove if you don't want internal case-study pages.
