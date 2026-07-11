# Deferred — jw3b.dev

Things intentionally left for John to provide/decide. Not blocking the build;
the site is green (lint/tests/coverage/build) without them.

## Provisioning (to make the AI features live)
- [ ] `cd workers/portfolio-agent && wrangler secret put ANTHROPIC_API_KEY` — until set, the
      concierge + auditor fall back to Workers AI (Llama) / heuristics-only.
- [ ] (optional) `ANTHROPIC_MODEL` var to override the default `claude-opus-4-8`
      (e.g. `claude-haiku-4-5` for faster/cheaper).
- [ ] Deploy the worker: `wrangler deploy` (bumped to `nodejs_compat`).

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
- [ ] **Milestone escrow** (Foundry) → deploy to Base + paste address into `src/config/wagmi.js`.
- [ ] **EAS audit attestations** → register an EAS schema on Base.
- [ ] **Gasless USDC "hire me"** (ERC-4337) → CDP/Pimlico paymaster policy + funded sponsor.
- [ ] **Testnet CTF** → deploy the vulnerable contract to Base Sepolia + `leaderboard` D1 table.
- [ ] **ZK proof-of-reputation** → deploy the verifier + publish the Merkle root.
- [ ] Replace the dead XMTP "E2E" tab with **Push Protocol** (feature-flag XMTP off first).

## Repo housekeeping
- [ ] `artifacts/` is untracked scratch — commit or gitignore.
- [ ] Orphaned `/projects/:id` route + `PROJECT_DETAILS` are now unused (all projects are external);
      remove if you don't want internal case-study pages.
