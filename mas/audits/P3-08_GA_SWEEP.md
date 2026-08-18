# P3-08 — GA sweep (QA · SEC · CA · PERF) · 2026-08-18

**Overall verdict: PASS with 2 findings — both FIXED and live-re-verified during the sweep.**
Scope: everything built through P3-07 (P3-02/03/04/09 are owner/research-gated and out of scope).
Live target: the v2 preview (`jw3b-dev-site-v2` SPA + `portfolio-agent-v2` worker). Production
was not part of the sweep target (see the incident note — it was touched accidentally and rolled
back within minutes).

| Role | Verdict | Evidence |
|---|---|---|
| **qa-tester** | PASS | 525 vitest (74 files) + 27 forge tests green; coverage thresholds met; lint 0 errors; build 0-warn; claims 28 cleared; secret-scan clean. Re-run green again after the axios override changed the lockfile. |
| **security** | PASS (after fix) | Headers/CSP verified live on `/` **and** `/assets/*` (CSP present, Anthropic absent, mic `self`, correct cache split no-store/immutable); `/hf-models/` mirror allow-list rejects non-listed repos (404); worker CORS returns no ACAO for foreign origins; **FINDING-1 fixed** (below); axios advisory cleared (**FINDING-2**); residual npm audit: 12 (4 high — all in the Node-only `onnxruntime-node`/`sharp`/`adm-zip` chain, stubbed out of every runtime bundle via Vite alias; dev-machine exposure only). |
| **codebase-auditor** | PASS | P3 FR trace: FR-039→P3-01, FR-016→P3-05, FR-055→P3-06, FR-056→P3-07 all committed + live; CodeHawks deep-linked on **4** non-test surfaces (SC-5 needs ≥2: Home, Hero, PersonJsonLd, CodeHawksLink); no orphan modules in the new `proof/`/`thesis/`/voice code — every file maps to a task. |
| **performance-monitor** | PASS | Preview lab trace: **LCP 1107 ms** (NFR-01 ≤2.5 s; TTFB 22 ms — static hero shell intact), CLS 0.10 (boundary-good; watch), render-blocking savings ≈0; concierge **first-token ~230 ms** over 3 runs; heavy runtimes (web3, xmtp, transformers 549 KB) all lazy + code-split off the boot path. |

## FINDING-1 (P1) — rate limiting was silently OFF on the live worker · FIXED

Probe: 13 empty POSTs to `/speech-to-text` (budget 10/min) → **13×200, no 429**.
Root cause chain: the v2 worker reuses v1's D1 database; v1's `rate_limits` table (PK
`(ip, window_start)`, no `endpoint` column) already existed, so v2's
`CREATE TABLE IF NOT EXISTS` migration **no-op'd** over it; every v2 UPSERT
(`ON CONFLICT(ip, endpoint, window_start)`) then threw and the limiter **failed open** by
design (availability-first catch) — zero rate limiting, invisibly.
Fix: v2 now uses its own table `rate_limits_v2` (migration `0002_rate_limits_v2.sql`,
applied `--remote`); v1 production's table and limiter are untouched until promotion.
**Re-verified live: 10×200 then `429 429 429`; concierge streaming unaffected.**
Lesson encoded in the migration file: `IF NOT EXISTS` is not a schema migration — reused
infra needs shape verification, not just presence.

## FINDING-2 (P2) — axios transitive advisories (carried SEC-P2 from P2-GATE) · FIXED

`axios <1.18.0` (10 advisories, DoS/prototype-pollution class) transitive under
`wagmi → @wagmi/connectors → @base-org/account → @coinbase/cdp-sdk`. `npm audit fix`
could not reach it; added `"axios": "^1.18.0"` to the existing `overrides` block.
npm audit high count 5→4 (remainder is the Node-only stub chain above); full gate green
on the new lockfile. The P2-GATE backlog item SEC-P2 is closed.

## Incident note — accidental production deploy (rolled back)

During the sweep, a chained command masked a failing exit (`cmd | tail` reports tail's
status) and a bare `npx wrangler@4 deploy` then resolved the **root** config — whose `name`
was the production worker `jw3b-dev-site` — deploying the v2 build to production jw3b.dev
for **~3–4 minutes**. Rolled back to John's prior version (`721bcb92`, 2026-08-15) and
verified v1 content serving again. Guardrails now in the repo: **both wrangler configs
default to the `-v2` preview names** (production promotion must pass `--name` explicitly —
CI already does), and state-changing chains no longer pipe away exit codes.

## NFR coverage at GA (built scope)

- NFR-01 LCP ≤2.5 s: **1.107 s** lab ✓ · NFR first-token: **~0.23 s** ✓
- NFR-04 CORS allow-list ✓ (no ACAO for foreign origins) · CSP on every path ✓
- FR-051 per-IP/per-endpoint rate limiting: **proven firing live** (the point of a gate) ✓
- SC-5 CodeHawks ≥2 surfaces: 4 ✓ · Claims: 28 cleared, 0 forbidden ✓

## Remaining to full GA (all owner-gated)

P3-02 escrow/Unlock addresses · P3-03/04 consent+terms (legal research) · P3-09 OD-04
ruling + DSAR · `voiceLive` prod default · v2→prod promotion itself (which also resolves
the v1 CSP gap on prod `/`, since the v2 site worker owns headers on every path).
