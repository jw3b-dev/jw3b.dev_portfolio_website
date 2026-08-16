# jw3b.dev v2 — Release & Disaster-Recovery Runbook

Owner: John (AgileGypsy). **CI never deploys** — every production change is applied by
the owner with `wrangler` / the hosting dashboard. This runbook is the procedure.

## 1. Release (owner-gated)

Preconditions: `ci` green on the branch (lint · coverage · claims-gate · build ·
secret-scan). Then, from the owner's authenticated machine:

**SPA (static site)**
1. `npm ci && npm run build` → `dist/`.
2. From the repo root: `wrangler deploy --config wrangler.jsonc` → the `jw3b-dev-site` Workers
   Static-Assets site (served on jw3b.dev + www). `dist/_headers` ships the cache rules (shell
   `no-store`, hashed assets `immutable`) + CSP — verify the shell responds
   `Cache-Control: no-store` after deploy (stale-shell rule, ADR-07).

> **Config discovery (wrangler v4):** the root `wrangler.jsonc` (SPA) is an ancestor of
> `workers/portfolio-agent/`, and wrangler walks up — so EVERY worker command MUST pass
> `--config wrangler.toml`, or it silently deploys the SPA config instead. The CI preview jobs
> already do this.

**Worker (`workers/portfolio-agent/`)**
1. `cd workers/portfolio-agent`.
2. Resources — ALREADY PROVISIONED (ids live in `wrangler.toml`, reused/created 2026-08-16):
   - D1 `jw3b_analytics` `7ed65107-5531-4f6b-a0b8-ac9c30ec8fb4` — reused from the prior deploy; v2 schema (8 tables + indexes) already applied.
   - KV `jw3b-recorded-runs` `d13bd6d5e09241cba4962521d02cd6ae` — Tier-1 recorded-run store.
   - R2 bucket `jw3b-recorded-runs` — recorded-run media/blobs.
   - CTF vault + RPC + `CF_ACCOUNT_ID` + WalletConnect id — all set (public, in-repo).
3. Secrets (never in `wrangler.toml`, never in git) — OWNER must set before first deploy:
   - `wrangler secret put ANTHROPIC_API_KEY` — Anthropic via the AI Gateway (concierge/audit narrative).
   - `wrangler secret put NEON_DATABASE_URL` — pgvector KB for the /audit RAG (has a password → secret).
   - `wrangler secret put DEV_ORIGIN` (optional; local dev origin only — absent in prod).
4. Migration is already applied to `jw3b_analytics`; to re-run/track via wrangler it is idempotent:
   `wrangler d1 migrations apply jw3b_analytics --config wrangler.toml` (add `--local` to rehearse first).
5. `wrangler deploy --config wrangler.toml` (the `--config` is REQUIRED — see the config-discovery note above).

### Preview deploy (isolated test URLs — `v2` branch)
Pushing the `v2` branch runs the CI **preview** jobs (gated on `verify`), which deploy isolated
instances — **never** production:
- Worker → `portfolio-agent-v2` → `https://portfolio-agent-v2.agilegypsy.workers.dev`
- SPA → `jw3b-dev-site-v2` → `https://jw3b-dev-site-v2.agilegypsy.workers.dev` (the test URL)

One-time owner step (per-worker secrets don't carry from production):
```
wrangler secret put ANTHROPIC_API_KEY  --name portfolio-agent-v2 --config workers/portfolio-agent/wrangler.toml
wrangler secret put NEON_DATABASE_URL  --name portfolio-agent-v2 --config workers/portfolio-agent/wrangler.toml
```
The preview shares the production D1/KV/R2 bindings (fine for a test). Flagship embeds show their
fallback on the `*.workers.dev` origin (the origin gate only fires the live iframe on `jw3b.dev`).

## 2. Data seeding (re-seedable from the repo — this is the DR guarantee)

Everything the site treats as truth is **in git**, so recovery is a re-run, not a restore:

- **Evidence register (DE-07):** `src/data/evidence-register.json` is authoritative and
  version-controlled. The claims-gate re-validates it on every CI run. No external store
  to lose.
- **Tier-2 recorded runs:** `src/data/recorded-runs/` is bundled into the SPA — recovered
  automatically by rebuilding. Nothing to seed.
- **Tier-1 recorded runs (KV/R2):** re-seed from the repo's recorded-run sources:
  - Transcripts → KV: for each run key, `wrangler kv key put --binding=KV "run:<key>" "$(cat <source>.json)"`.
  - Media → R2: `wrangler r2 object put jw3b-recorded-runs/<mediaKey> --file <asset>`.
  A helper seed script is added when SD lands the real recorded-run corpus (P2); until
  then Tier-2 (bundled) is the always-available floor, so Tier-1 loss is non-fatal.

## 3. Disaster recovery (SDD 04 §8)

| Loss | Recovery |
|---|---|
| D1 data corruption / bad write | **D1 Time-Travel** — `wrangler d1 time-travel restore jw3b_analytics --timestamp <ISO>` (30-day window). D1 holds analytics/leaderboard/engagements — none of it authorizes claim rendering, so a restore never risks a false claim. |
| KV/R2 recorded runs lost | Re-seed from repo (§2). Site stays up on Tier-2 bundled runs meanwhile. |
| Evidence register questioned | It is in git + CI-validated; `git log` is the audit trail. Roll back the file, CI re-checks. |
| Bad deploy / stale shell | Redeploy previous `dist/`; confirm shell `no-store`. Hashed assets are immutable so old chunks never collide. |
| Secret suspected leaked | Rotate via `wrangler secret put` (invalidates the old value); `npm run secret-scan` proves the bundle is clean. |

## 4. Post-deploy verification (smoke)

- Shell: `curl -I https://jw3b.dev` → `Cache-Control: no-store`, CSP present, no
  `anthropic` host in `connect-src`.
- Worker: each route returns its typed contract; CORS `Access-Control-Allow-Origin`
  echoes an allowlisted origin (never `*`); no secret in any client response.
- Claims: every rendered number traces to a cleared register entry (spot-check the
  auditor/PM surfaces).
