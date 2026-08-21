# Infrastructure — one branch, one route, one backend

**Consolidated 2026-08-21.** This file exists because the v1 → v2 → preview versioning left three
of everything, and working out which one was live took a full audit. It is the single answer to
"what is actually running?"

## The whole stack

| Layer | The one thing | Verify it |
|---|---|---|
| **Branch** | `v2` — default, and the only branch | `git ls-remote --heads origin` → one line |
| **Pipeline** | `.github/workflows/ci.yml` — triggers on `v2`, deploys from `v2` | `src/__tests__/deployTargets.test.js` |
| **SPA worker** | `jw3b-dev-site` → **jw3b.dev** | `curl -sI https://jw3b.dev/ \| grep x-served-by` |
| **Agent worker** | `portfolio-agent` | `curl -s https://portfolio-agent.agilegypsy.workers.dev/health` |
| **Database** | D1 `jw3b_analytics` | `npm run schema:check` |
| **Recorded runs** | KV + R2, both `jw3b-recorded-runs` | `npm run seed:kv` |
| **Escrow** | `0xe44A38129A69B94CbdAFe80C71e5A113E46E87F8` (Base Sepolia) | 10/10 selectors — v2 ✓ |
| **CTF vault** | `0x4f72efbe94677E9bd5a3a1741b137e9Ea203C240` (Base Sepolia) | ⚠️ **v1-era, see below** |

There is no preview, no staging, and no second URL. A push to `v2` runs lint → coverage → claims →
secret-scan → build → E2E → contracts, then deploys the worker, then the SPA, then smokes the
result. That pipeline is the only path to the live site.

## What was removed, and where it went

| Removed | Archived as |
|---|---|
| Worker `jw3b-dev-site-v2` (was serving a stale copy on a public URL) | — deleted |
| Worker `portfolio-agent-v2` | — deleted |
| Branch `main` (v1 history, unrelated tree) | tag **`v1-archive`** |
| Branch `v2-upgrade` (59 superseded commits) | tag **`v2-upgrade-archive`** |
| Branch `dependabot/npm_and_yarn/…` | — deleted |
| D1 table `rate_limits` (v1's limiter) | dropped in migration 0004 |

Nothing was destroyed: both deleted branches are recoverable from their tags
(`git checkout -b recovered v1-archive`).

## The trap this cost us, twice — read before touching migrations

D1 `jw3b_analytics` was **created for v1 on 2026-03-15** and inherited by v2. Every v2 migration
uses `CREATE TABLE IF NOT EXISTS`, and against a table that already exists **that is a no-op, not
an upgrade** — so `wrangler d1 migrations apply` reports ✅ while changing nothing.

It bit three tables before anyone noticed, all silently, because analytics writes are best-effort
by design (a D1 blip must never break a visitor's chat, so the `catch` is correct and stays):

- `rate_limits` — no `endpoint` column, so the limiter failed open in production until
  `rate_limits_v2` was introduced under a new name.
- `messages` — no `had_audio` / `source`, so **five days of chat transcripts** were thrown away,
  leaving 279 conversation rows with no messages and inflating the funnel figure P5 planned from.
- `ctf_solves` — no `attacker` / `drained_amount`, so **every CTF solve write failed**. Its "0
  solves" was never evidence nobody solved it; it was evidence no solve could be recorded.

**The rule: adding a column to an existing table needs its own `ALTER TABLE` migration.**

Two checks now cover this, and they answer different questions:

| Check | Compares | Catches | Runs |
|---|---|---|---|
| `workers/portfolio-agent/src/__tests__/schemaParity.test.js` | code ↔ migrations | "you wrote a column no migration declares" | CI, static |
| `npm run schema:check` | **live DB** ↔ migrations | "the migration never reached the database" | on demand, needs network |

Only the second can see an `IF NOT EXISTS` no-op. Nothing in CI ever could — run it after any
migration.

## Open — owner-gated

**The CTF vault is still a v1 deployment.** `contracts/broadcast/DeployCtf.s.sol/84532/` contains
only a *dry-run*: the v2 vault was never broadcast from this repo. The live address matches **3 of
4** v2 selectors (`totalHeld()` is absent from its bytecode).

It does not break the CTF flow — nothing in the client or worker calls `totalHeld`, and the three
functions the flow uses (`balances`, `deposit`, `withdraw`) all match. But it is not the v2
contract, and the vault holds **0.00012 ETH**, so there is nothing to drain even when it works.

Blocked here: no `contracts/.env` keystore on this machine, and the deployer
`0xC6016E351c144CEDb1034E93e64C78d63cc2435F` holds 0.0005 ETH on Base Sepolia. To finish it:

```bash
cd contracts
forge script script/DeployCtf.s.sol --rpc-url base_sepolia --broadcast   # needs the keystore
# then put the new address in src/config/contracts.js (CTF.vaultAddress)
# and set CTF_VAULT_ADDRESS on the worker to match:
npx wrangler@4 secret put CTF_VAULT_ADDRESS --name portfolio-agent --config wrangler.toml
```
