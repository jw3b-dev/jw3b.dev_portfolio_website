# Ops — jw3b.dev (P4-04 · devops-engineer)

Zero-cost operational surface: an automated liveness check, and the queries for a periodic
analytics review. Nothing here spends AI tokens.

## Health check (`.github/workflows/healthcheck.yml`)

> **Status: ACTIVE.** GitHub only registers `schedule`/`workflow_dispatch` workflows from the
> **default branch**, which is now `v2` — so this runs on schedule and can be triggered manually.
> Verified end-to-end on 2026-08-21: a real run detected a failure, opened alert issue #3, and
> after the fix a re-run went green and auto-closed it.

Runs every 6 hours (and on-demand via **Actions → Health check → Run workflow**). It probes:

| Target | Check |
|---|---|
| `https://jw3b.dev/` | HTTP 200 (the production SPA document) |
| `https://portfolio-agent.agilegypsy.workers.dev/` | responds (any non-5xx) — prod worker liveness |
| `https://portfolio-agent.agilegypsy.workers.dev/health` | HTTP 200 (Worker bindings present) |

Each target is retried 3× with backoff (no false alarm on a blip). On a **state change**:

- **healthy → unhealthy**: opens a single `🔴 Health check failing` issue (label `health-alert`),
  or comments on the existing one; the run also exits non-zero (red X in Actions).
- **unhealthy → healthy**: auto-closes any open `health-alert` issue with a recovery note.

The **probe** job deliberately hits only liveness endpoints. The **live-e2e** job in the same
workflow does drive the concierge and audit streams — a few model calls per run, which is the
price of knowing the AI surfaces actually answer in production rather than assuming they do.

## D1 analytics digest (run periodically)

The worker records first-party, PII-light analytics in D1 (`jw3b_analytics`). Pull a digest with:

```bash
cd workers/portfolio-agent
# 7-day activity across the recorded surfaces:
npx wrangler@4 d1 execute jw3b_analytics --remote --config wrangler.toml --command "
  SELECT 'conversations' AS surface, COUNT(*) AS n FROM conversations WHERE created_at >= datetime('now','-7 days')
  UNION ALL SELECT 'audit_runs', COUNT(*) FROM audit_runs WHERE created_at >= datetime('now','-7 days')
  UNION ALL SELECT 'ctf_solves', COUNT(*) FROM ctf_solves
  UNION ALL SELECT 'engagement_requests', COUNT(*) FROM engagement_requests WHERE created_at >= datetime('now','-7 days');"

# Audit-console usage by tool (which consoles get used):
npx wrangler@4 d1 execute jw3b_analytics --remote --config wrangler.toml --command "
  SELECT tool, COUNT(*) AS runs, ROUND(AVG(duration_ms)) AS avg_ms FROM audit_runs
  WHERE created_at >= datetime('now','-30 days') GROUP BY tool ORDER BY runs DESC;"
```

Note the `--config wrangler.toml` flag: from `workers/portfolio-agent/` wrangler otherwise walks
up to the root `wrangler.jsonc` (the SPA config) and can't find the D1 binding.

Retention: rate-limit rows (raw IPs) self-purge ~10 min; `engagement_requests` PII per the
privacy notice; DSAR/erasure runbook in `docs/COMPLIANCE.md`.

### Dependabot alert dispositions (2026-08-22)

Three open alerts were audited for **reachability in the shipped product**, not just presence in
the lockfile. All three were dismissed as not-exploitable, with the evidence below. A dismissal is
reversible — re-open from the Security tab, or
`gh api -X PATCH repos/<repo>/dependabot/alerts/<n> -f state=open`.

| Package | Sev | Path | Why it cannot be reached |
|---|---|---|---|
| `adm-zip` | high | `@huggingface/transformers` → `onnxruntime-node` | The browser build runs on **onnxruntime-web**. `config/vite.config.js` aliases `onnxruntime-node` to `src/lib/empty.js`. Verified empirically: **0 occurrences** of `adm-zip`/`onnxruntime-node` in `dist/assets/*.js`. |
| `sharp` | high | `@huggingface/transformers` → `sharp` | Native Node image library, aliased to the same stub and impossible to run in a browser. **0 occurrences** in `dist/assets/*.js`. |
| `uuid` | medium | `wagmi` → `@wagmi/connectors` → MetaMask | The advisory is *"missing buffer bounds check in **v3/v5/v6** when `buf` is provided"*. The MetaMask packages import **`uuid.v4`** only — a grep for any v3/v5/v6 usage across them returns nothing. The vulnerable code paths are never called. |

**Why these cannot simply be upgraded.** All three are transitive dependencies of majors this
project pins on purpose (`@huggingface/transformers`, and the wagmi 2.x / RainbowKit 2.x wallet
stack — see CLAUDE.md's dependency constraints). Forcing them via `overrides` risks the wallet UI
for vulnerabilities that no shipped code path can reach.

**Re-audit this when** the wallet stack majors move, or when transformers is used from Node rather
than the browser — that second condition is the one that would make `adm-zip` and `sharp` live.

### Funnel digest (P5-02 · ADR-P5-01)

Aggregate counters only — `(day, surface, event, count)`, no identifier of any kind, so there is
nothing here to subject-access or erase.

```bash
# Last 14 days, by surface and event.
npx wrangler@4 d1 execute jw3b_analytics --remote --config wrangler.toml --command \
  "SELECT day, surface, event, count FROM funnel_counters
    WHERE day >= date('now','-14 day') ORDER BY day DESC, surface, event;"

# Conversion shape: tool runs vs requests submitted, per day.
npx wrangler@4 d1 execute jw3b_analytics --remote --config wrangler.toml --command \
  "SELECT day,
          SUM(CASE WHEN event='tool_run'       THEN count ELSE 0 END) AS tool_runs,
          SUM(CASE WHEN event='request_submit' THEN count ELSE 0 END) AS submits
     FROM funnel_counters GROUP BY day ORDER BY day DESC LIMIT 30;"
```

**What is counted today, and what is not — read this before drawing a conclusion.**
`tool_run` and `request_submit` are recorded **server-side**, so they are unforgeable: each one
required someone to actually run a tool or submit a lead. `surface_view` and `cta_click` are
declared in the vocabulary but **nothing emits them yet**, because they can only come from the
browser, and a public counter-increment endpoint is trivially inflatable — a forgeable denominator
is worse than no denominator, since it makes every ratio derived from it quietly wrong.

So these numbers answer *"how much real activity happened"*, **not** *"what fraction of visitors
converted"*. For the denominator use the zone's own request analytics (observability is enabled on
the SPA worker) rather than trusting a client beacon. Wiring one properly needs an abuse-resistant
design; it is scoped, not assumed.

## Rollback (prod)

Worker: `npx wrangler@4 rollback --name jw3b-dev-site --version-id <prev>` (SPA) /
`--name portfolio-agent` (agent). List versions: `wrangler deployments list --name <worker>`.
Full promotion + rollback notes: `docs/DEFERRED.md`.

## Why the post-deploy smoke targets `*.workers.dev`, not `jw3b.dev`

The apex sits behind the zone's Cloudflare bot protection, which serves **datacenter IPs — every
GitHub runner — a managed-challenge page instead of the site**. The first production-deploying
run proved it: the smoke reported Cloudflare's own CSP
(`script-src 'nonce-…' 'unsafe-eval' https://challenges.cloudflare.com`) rather than ours,
because it never reached our worker at all.

So CI smokes `https://jw3b-dev-site.agilegypsy.workers.dev` — the SAME deployed worker and the
same code, reached without the zone layer in the way. The scheduled health check still probes
the apex (accepting 403 as "the edge is up and deciding"), so between them both layers are
covered. Running `npm run e2e:prod` from an ordinary connection tests the apex end to end.

**✎ 2026-08-22 — the consequence of that workaround, which was never written down.** The
workers.dev origin has **no zone layer**, so anything Cloudflare injects at the zone is invisible
to every automated gate. That is precisely where a real finding was living: the apex serves Google
Tag Manager from its own origin (`/12am/`), which no CI check could ever see. `npm run e2e:zone`
(`e2e-zone/`, its own config) exists to cover that blind spot and must be run by a **person from a
normal connection** — a runner would measure the challenge page and pass while asserting nothing.

## Cloudflare credentials: what each one can and cannot do

Established by direct probe on 2026-08-22, not inferred from names — after finding 23 turned out
to need a zone change nobody had the rights to make.

| Credential | Where | Verified scope | Can it change zone settings? |
|---|---|---|---|
| wrangler OAuth (`john@agilegypsy.com`) | `~/.config/.wrangler/` | `wrangler whoami`: workers/d1/kv/pages/queues **write**, `zone` **read** | **No** — zone read only |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secret | token verify `active`; `GET /zones?name=jw3b.dev` **200**; `GET /zones/{id}/settings` **`Unauthorized to access requested resource`**; `GET /zones/{id}/settings/zaraz/config` **403** | **No** — it is a deploy token: enough to find the zone, not to read or edit its settings |
| Cloudflare MCP (`Cloudflare Developer Platform`) | session | Workers, D1, KV, R2, Hyperdrive, docs | **No** — exposes no zone/account settings tool at all |

Zone: `jw3b.dev` = `a8c04dc89ab52c84845a005e1d2f9bb9`. Account: `AgileGypsy` =
`04bf3d7c95516d3e9a2af68fc8f6619b`.

**✎ 2026-08-23 — a fourth credential exists, and this table not naming it cost most of a session.**

| Credential | Where | Verified scope | Can it change zone settings? |
|---|---|---|---|
| **zone token** (`cfat_…3e30`) | free text inside `/home/agilegypsy/code/projects/jw3b.dev_website/.env` — the **v1 repo**, not this one, and not on a `KEY=` line | sees 5 zones incl. `jw3b.dev`; `GET /zones/{id}/settings` **200**; `PATCH settings/challenge_ttl` (no-op, same value) **200** | **Yes** |

How it was missed, so the next sweep does better: every search keyed on the *name*
`CLOUDFLARE_API_TOKEN`, and this one is a bare value on its own line in a different repo's `.env`.
The same trap has now caught two searches — **grep the token SHAPE (`cf[a-z]t_…`) across disk, never
the variable name.** The owner had to point at the file twice.

Two wrong conclusions were published before that, both stated with more confidence than the
evidence carried, and both are corrected here: that no credential on the machine could reach the
zone (one could), and that a token is permanently bound to the account that issued it and so could
never be widened to another (false for **user** tokens — `cfut_` belongs to the user, and its zone
resources may span every account that user can reach).

**Bot Fight Mode cannot be changed through the API on this plan.** With the zone token — which
demonstrably has zone-settings *write* — the bot endpoints answer:

```
GET  /zones/{id}/bot_management        200  {"fight_mode": true, "enable_js": true, …}
PUT  /zones/{id}/bot_management        10400 Bad Request          ← even echoing the object back
PATCH /zones/{id}/bot_management       10405 Method not allowed for this authentication scheme
GET  /zones/{id}/settings/bot_fight_mode  1003 Undefined zone setting
```

`jw3b.dev` is a **Free Website** plan: `bot_management` is readable but the write path belongs to
paid Bot Management. Proven not to be a permissions problem by writing `challenge_ttl` back at its
own value (200) with the same token. **So this toggle is dashboard-only** — Security → Bots.

**`enable_js` is a separate field from `fight_mode`, which contradicts what was assumed earlier.**
Turning off **JavaScript Detections** stops `/cdn-cgi/challenge-platform/…/jsd/…` and the
`cf_clearance` cookie (product-audit finding 32) **while Bot Fight Mode stays on**. That is the
surgical change; disabling Bot Fight Mode entirely is not required and is not recommended.

**To let an agent make a zone change**, mint a token with **Zone → Zone Settings → Edit** scoped to
`jw3b.dev`, plus the **account-level Tag Management** permission (the Google Tag Gateway page lives
at `/:account/tag-management/`, so a zone-only token will not reach it). The deploy token is
deliberately narrow — widen a *new* token instead of that one, so a leaked deploy credential can
never reconfigure the zone. Note that even a fully-scoped token will not fix the bot toggle above:
that limit is the plan, not the permission.

## D1 migrations are NOT applied by CI — apply them by hand, before the code that needs them

Found 2026-08-22, the hard way. `migrations/0006_funnel_counters.sql` was written, committed and
deployed; the **table was never created in production**. The Worker shipped, `recordEvent` threw
`no such table: funnel_counters` on every call, and `track()` swallowed it — it fails open by
design, so the counters silently counted nothing while `mas/PLAN.md` recorded P5-02 as delivered.
Nothing anywhere said a migration needed applying.

**The gap:** `.github/workflows/ci.yml` deploys the Worker and the SPA. It never runs
`wrangler d1 migrations apply`. A migration therefore ships as dead code, and because every
analytics write fails open, there is no symptom to notice.

```bash
cd workers/portfolio-agent

# What is pending? (--config is required: wrangler v4 prefers the repo-root wrangler.jsonc,
# which describes the SPA, not this worker.)
npx wrangler d1 migrations list jw3b_analytics --remote --config wrangler.toml

# Apply, BEFORE deploying code that reads the new schema.
npx wrangler d1 migrations apply jw3b_analytics --remote --config wrangler.toml

# Prove it: send an event and read the counter back.
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"surface":"home","event":"tool_run"}' \
  https://portfolio-agent.agilegypsy.workers.dev/funnel
npx wrangler d1 execute jw3b_analytics --remote --config wrangler.toml \
  --command "SELECT day, surface, event, count FROM funnel_counters ORDER BY count DESC;"
```

**Why this is not automated yet, stated rather than left as a silent omission.** Adding
`migrations apply` to the deploy job is the right fix and needs the `CLOUDFLARE_API_TOKEN` secret
to carry **D1 edit**. That token is a deploy credential whose scopes are documented above as
Workers-only-plus-zone-read; adding a step that mutates production schema on a token whose D1
permission is unverified would trade a silent failure for a broken pipeline. **Owner decision:
confirm (or widen) the token's D1 scope, then the step goes in ahead of `deploy-backend`.**


### The weekly digest (added 2026-08-22)

The queries above are pull — they require remembering to run them, which is how a metric ends up
unread. `workers/portfolio-agent/src/digest.js` pushes a summary every **Monday 08:00 UTC** over
the same Telegram rail the lead alerts use (`[triggers] crons` in `wrangler.toml`).

It fails silent by design: no Telegram secrets, no D1 binding, a missing table, or a week with no
events all send nothing. A cron has nobody waiting on it, and a weekly "0" trains its reader to
ignore the channel.

```bash
# Fire it by hand without waiting for Monday:
cd workers/portfolio-agent && npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=0+8+*+*+1"
```
