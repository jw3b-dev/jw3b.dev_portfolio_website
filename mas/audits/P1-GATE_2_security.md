# P1-GATE · Role 2/5 — Security gate (security / DevSecOps)

**Phase:** P1 exit gate · **Verdict: PASS** (no in-context P0/P1 blocker) · 1×P2, 4×P3 logged.
**Enforces:** FR-050 (Anthropic server-only), FR-051 (rate-limit + spend ceiling), NFR-04 (CORS allowlist).
**Scope note:** static SAST + config audit done now; live DAST (429 probing, headers on the deployed origin, CORS from a real browser) is the **post-deploy smoke** John's deploy enables.

## SAST — CLEAN

| Check | Result |
|---|---|
| Hardcoded secrets in `src/`/`workers/` | **0** (secret-scan clean; all secrets via `env.*` / `wrangler secret`) |
| `eval` / `new Function` / `dangerouslySetInnerHTML` / `innerHTML=` | **0** |
| SQL injection | **0** — every D1 call is `.prepare().bind(...)` parameterized (concierge, audit, engagement, rateLimit) |
| Input validation at boundary | ✓ concierge requires `messages[]`; audit/fuzz require `source` + `SOURCE_CAP` (413 over-cap); tx-explain validates `0x`+64-hex |
| Client-bundle secret leak | **0** server secrets in the shipped bundle (secret-scan) |

## CORS / CSP / headers

- **CORS (NFR-04):** strict allowlist — `allowedOrigin()` returns the origin only if in `env.ALLOWED_ORIGINS`, else `null`. **Never `*`.** No-Origin (server-to-server) → CORS N/A; dev origin only via `DEV_ORIGIN` secret, absent in prod.
- **CSP (FR-050):** **Anthropic is ABSENT from `connect-src`** — the browser can reach only the Worker origin; Anthropic is Worker-only. `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. `anthropic` appears nowhere in the client.
- **Headers:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (mic=self for STT, camera/geo/payment off). X-Frame-Options is covered by CSP `frame-ancestors 'none'`.

## Rate-limit (FR-051)

Enforced **before any handler** in `index.js`: `routeLimit(method,path)` → `checkRateLimit` (per-IP/per-endpoint D1 fixed-window UPSERT, parameterized) → `rateLimitedResponse` **429** with `Retry-After` (SSE + JSON variants). Heavier endpoints get tighter budgets. Backstopped by the AI-Gateway spend ceiling.

## Findings

- **P2 · axios transitive DoS** (`axios 1.0.0–1.17.0`, GHSA-42h9-826w-cgv3 / pmv8-rq9r-6j72 / jqh4-m9w3-8hp9). Pulled in **transitively by the wallet stack**; our own code (Worker + client) uses `fetch`, never axios — the vulnerable `formDataToJSON`/`maxBodyLength` paths are **dormant, not in our request path**, and the class is **DoS, not RCE**. No safe fix via majors (wagmi/wallet majors are pinned — CLAUDE.md). **Recommended remedy (owner's call, not applied by gate):** add an `axios` entry to the `overrides` block pinning a patched line, mirroring the existing `elliptic`/`tar-fs`/`ws` overrides, then re-run `npm audit`. Does not block the P1 gate given low in-context exploitability; logged to the security backlog.
- **P3 · HSTS** not in `public/_headers` — Strict-Transport-Security is a Cloudflare **edge/zone** setting; verify it's enabled on the zone post-deploy.
- **P3 · `style-src 'unsafe-inline'`** — required by Tailwind/inline styles; low risk (no `script-src 'unsafe-inline'`).
- **P3 · rate-limit fails open on D1 error** — deliberate availability choice (never lock a visitor out on a DB hiccup); the hard cost backstop is the AI-Gateway spend ceiling.
- **P3 · live DAST deferred** — 429 past budget, headers on the live origin, and CORS from a real browser are verifiable only against the deployed target (post-deploy smoke).

**Verdict: PASS** — 0 P0, 0 in-context P1. No feature code or fixes touched (independence preserved).
