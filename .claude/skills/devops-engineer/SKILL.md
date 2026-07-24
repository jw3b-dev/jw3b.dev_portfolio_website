---
name: devops-engineer
description: jw3b.dev's deploy and infra — the GitHub Actions CI (lint → coverage → build → deploy), the Cloudflare Pages frontend deploy, and the portfolio-agent Cloudflare Worker (Workers AI + D1 + Anthropic via AI Gateway). Use whenever work touches .github/workflows/ci.yml, workers/portfolio-agent/wrangler.toml, a D1 migration, a wrangler binding, a Worker secret, the build, or a CI failure. Use it before assuming a green local build deploys.
---

You own getting jw3b.dev to prod — the static frontend on Cloudflare Pages and the `portfolio-agent`
Worker behind it. A capable engineer can read wrangler docs; this skill is the account facts and traps
that aren't in the code.

## The pipeline (CI in `.github/workflows/ci.yml`)

- **`verify` job** runs on push to `main`/`v2-upgrade` and PRs to `main`: `npm run lint` →
  `npx vitest run --coverage` → `npm run build`. The coverage step is the **gate** — it runs the
  coverage form, not plain `vitest`. See [test-engineer]; a change that drops coverage fails CI even
  though it builds.
- **Frontend deploys via Cloudflare Pages**, gated on `main`. **Backend (`deploy-backend`)** deploys
  the Worker via `cloudflare/wrangler-action@v3`, `needs: verify`, gated on push to
  `main`/`v2-upgrade`. So a push to `v2-upgrade` **deploys the Worker** — know which branch you're on
  before you push.
- Install is `npm ci` and inherits `.npmrc`'s `legacy-peer-deps=true` (required for the React 19 dep
  graph). Don't drop that flag or CI install breaks.

## The Worker (`workers/portfolio-agent/`)

`wrangler.toml`: `main = src/index.js`, `compatibility_flags = ["nodejs_compat"]` — **required** to
bundle `@anthropic-ai/sdk`; removing it breaks the Worker build. Bindings:
- `AI` — Workers AI (Llama/Whisper/Aura).
- `DB` — D1 `jw3b_analytics` (`database_id 7ed65107-…`). Schema in `workers/portfolio-agent/schema.sql`
  (tables `conversations`, `messages`, `rate_limits`, `ctf_solves`).
- Vars: `ANTHROPIC_BASE_URL` routes Anthropic through the **Cloudflare AI Gateway**
  (`…/04bf3d7c…/jw3b-portfolio-agent/anthropic`), plus `CTF_VAULT_ADDRESS` / `CTF_RPC_URL`
  (Base Sepolia) for the on-chain CTF verification.

## Secrets — the rule you cannot break

- **Worker secrets go through `wrangler secret put`, never `wrangler.toml`.** `ANTHROPIC_API_KEY` and
  `NEON_DATABASE_URL` (RAG) are set that way and **persist across deploys** — a deploy does not need
  to re-set them, and they must never be committed. CI deploy uses repo secrets
  `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
- **Frontend `.env` holds only public `VITE_*` values** (e.g. `VITE_WALLETCONNECT_PROJECT_ID`). Any
  real secret belongs in the Worker, never in frontend code that ships to the browser. See
  [web3-blockchain].

## D1 migrations — verify the live state, not a comment

Before altering the schema, read what's actually applied — a stale comment is not proof:
`wrangler d1 execute jw3b_analytics --remote --command "SELECT name FROM d1_migrations ORDER BY id
DESC;"`. A destructive statement gets an `export`/row-count check first. The account is `04bf3d7c`
(AgileGypsy) — the same account as the Cloudflare AI Gateway and D1.

## What to do

Before claiming a deploy will work: confirm the coverage gate is green (not just the build), the
branch actually triggers the deploy you intend, and any new secret is a Worker secret — not a var and
not a committed value. The AI tag-protocol contract that the Worker and frontend share is an
[architect] seam — changing it touches three files.
