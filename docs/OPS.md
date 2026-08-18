# Ops — jw3b.dev (P4-04 · devops-engineer)

Zero-cost operational surface: an automated liveness check, and the queries for a periodic
analytics review. Nothing here spends AI tokens.

## Health check (`.github/workflows/healthcheck.yml`)

> **Activation:** GitHub only registers `schedule`/`workflow_dispatch` workflows from the
> **default branch**. This file lives on `v2`, so the health check starts running automatically
> when `v2` is promoted to `main` (see `DEFERRED.md`) — no extra step. Its probe logic is
> dry-run-verified green against all four live targets today; it just isn't schedulable from a
> non-default branch. (The `push`-triggered CI workflow is unaffected — that runs from any branch.)

Runs every 6 hours (and on-demand via **Actions → Health check → Run workflow**). It probes:

| Target | Check |
|---|---|
| `https://jw3b.dev/` | HTTP 200 (the production SPA document) |
| `https://portfolio-agent.agilegypsy.workers.dev/` | responds (any non-5xx) — prod worker liveness |
| `https://jw3b-dev-site-v2.agilegypsy.workers.dev/` | HTTP 200 (preview SPA) |
| `https://portfolio-agent-v2.agilegypsy.workers.dev/ctf/leaderboard` | HTTP 200 (preview worker) |

Each target is retried 3× with backoff (no false alarm on a blip). On a **state change**:

- **healthy → unhealthy**: opens a single `🔴 Health check failing` issue (label `health-alert`),
  or comments on the existing one; the run also exits non-zero (red X in Actions).
- **unhealthy → healthy**: auto-closes any open `health-alert` issue with a recovery note.

Deliberately hits only liveness endpoints — never the paid concierge/audit routes.

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

## Rollback (prod)

Worker: `npx wrangler@4 rollback --name jw3b-dev-site --version-id <prev>` (SPA) /
`--name portfolio-agent` (agent). List versions: `wrangler deployments list --name <worker>`.
Full promotion + rollback notes: `DEFERRED.md`.
