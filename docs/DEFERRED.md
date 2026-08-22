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

## Production promotion — ✅ DONE (John approved, 2026-08-21)

**jw3b.dev now serves v2.** Worker `portfolio-agent` + SPA `jw3b-dev-site` both deployed from
v2 (2026-08-21) and smoke-verified live: CSP/security headers on `/` (closes the old v1 header
gap), apex+www 200, real Claude streaming, CORS allow/deny, TTS `audio/mpeg`, rate limiter
10→429, `/ctf` live + testnet-labelled, TTFB ~48 ms. `voiceLive` ON. GitHub default branch moved
to `v2` (v2 and main have UNRELATED histories — a merge is not possible without a force-replace,
which is the owner's call; changing the default branch achieved the goal and registered the
health check, which now runs green).

Rollback (one command each, still valid):
`wrangler rollback --name jw3b-dev-site --version-id 721bcb92-d253-47f6-8758-91a28408af2b`
`wrangler rollback --name portfolio-agent --version-id c2411c4f-3886-406c-a69d-f6c2e3d28de9`

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

## Still open (owner input required)

1. **Mainnet escrow** — the Base mainnet wallet holds 0 ETH, so no mainnet contract can be
   deployed or funded. The v2 escrow is live on Base Sepolia and fully wired; swapping to
   mainnet = fund the wallet, run `DeployEscrow` against Base, then set `ESCROW.address` +
   `chainId: 8453` in `src/config/contracts.js` and flip the `escrow` flag. A test guards the
   chainId so the TESTNET badge can never silently claim mainnet.
2. **Unlock locks** — still need real lock addresses (`UNLOCK_LOCKS` + `retainer.json`); also
   blocked on mainnet gas. The P3-04 terms gate is already wired in front of both paid rails.
3. ~~**`main` branch** — carries unrelated v1 history and a stale `deploy.yml` targeting the
   deleted Pages project `jw3b-dev-portfolio`. Owner's call.~~ **✎ RESOLVED — already done; this
   entry had rotted (verified 2026-08-22).** `git ls-remote` returns exactly one branch, `v2`.
   `main` is gone, archived as the tag `v1-archive`, so there is no `deploy.yml` and no branch to
   decide about. **There are no Cloudflare Pages deploys at all** — `wrangler pages project list`
   on this account returns only `kointel` and `nano-bot-trader-dash`, different products. The SPA
   has been a Worker (`jw3b-dev-site`, `wrangler.jsonc`) since 2026-08-21. Struck through rather
   than deleted, because an entry that outlived its own resolution is worth seeing once: it sat
   on the owner's decision list asking for a call that had already been made.
4. **Cloudflare bot protection on the `jw3b.dev` zone** 403s datacenter IPs. Harmless for real
   users and verified crawlers (every UA incl. Googlebot returns 200 from a residential IP),
   but worth a Search Console check after the new sitemap is submitted.

## Cloudflare zone settings conflicting with our CSP (found by the P5 E2E layer)

The zone injects an inline bot-detection script (`window.__CF$cv$params` →
`/cdn-cgi/challenge-platform/…`) into every HTML response. Our `script-src` has no
`'unsafe-inline'`, so the browser blocks it and logs a CSP violation on **every page load**.

Consequences: Cloudflare's JavaScript Detections do not actually run on jw3b.dev (the WAF and
IP-reputation rules still do — this is also why datacenter IPs get 403s), and the console is
noisy for anyone who opens devtools on the site.

**Do NOT fix this by adding `'unsafe-inline'` to `script-src`.** That would neuter the CSP the
site advertises, to silence a warning about a script we neither wrote nor need. The real fixes,
in order of preference, are all zone-side and owner-only:

1. Turn **JavaScript Detections** off for the zone (Security → Bots) if the WAF rules suffice.
2. Or enable Cloudflare's **CSP nonce/hash integration** so the injected script is signed.
3. Or accept it: the script is blocked, the site is unharmed, and the E2E suite filters this
   specific noise while still failing on any error we actually own.

Same investigation also observed `googletagmanager`/`cloudflareinsights` requests attributed to
the page. Neither appears in our build or the served HTML — they originate from the flagship
iframes' own origins. Worth confirming during any future consent review, since the site's
"no consent banner required" position depends on **jw3b.dev itself** setting no tracking storage.

## Deploys go straight to production (changed 2026-08-21)

CI previously deployed every push to the isolated `-v2` preview instances, with production
promoted by hand. Running two live copies of the same branch turned out to be its own source
of confusion — "is that fixed?" depended on which URL you had open, and the preview drifted
from prod every time a manual deploy landed between pushes.

**The preview instances are now gone entirely** (worker `jw3b-dev-site-v2` deleted 2026-08-21;
`portfolio-agent-v2` was already retired). Leaving them deployed-but-unused was the worst of both
worlds — a stale copy of the site still answering on a public URL, months behind, with no pipeline
keeping it honest. Both wrangler configs now NAME production, so a bare `wrangler deploy` cannot
recreate one by accident, and `src/__tests__/deployTargets.test.js` fails the build if a `-v2`
target reappears in the deploy surface.

Now: a push to `v2` deploys **the real site**, and it is the only site. The safety that makes that
acceptable:

- the deploy jobs are gated on `verify` **and** `e2e` **and** `contracts` — previously they
  were gated on `verify` alone, so a run with failing E2E still deployed (harmless against a
  preview, unacceptable against production);
- the Worker ships before the SPA that talks to it;
- a post-deploy smoke drives the real site immediately afterwards, so a bad deploy is caught in
  the same run that caused it;
- `wrangler rollback` remains one command (versions listed in `docs/OPS.md`).

The `-v2` workers still exist but are no longer updated, so the scheduled health check stopped
monitoring them — alarming on stale infrastructure teaches people to ignore alarms.
