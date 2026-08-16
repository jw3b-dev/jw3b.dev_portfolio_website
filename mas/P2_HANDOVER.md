# P2 handover — jw3b.dev v2

**Date:** 2026-08-16 · **Branch:** `v2` · **Preview (test URL):** https://jw3b-dev-site-v2.agilegypsy.workers.dev
**Status: P2 complete + post-P2 audit remediation done and live-verified on the preview.**

This closes P2. P2-GATE had already passed (`mas/audits/P2-GATE_0_SUMMARY.md`); this handover adds a
user-requested full **v1↔v2 codebase + cloud-infra audit** and fixes every genuine defect it found.

## 1. What was audited
Full diff of both trees + both Cloudflare stacks, model routing, RAG, CI, security headers, and
resilience — verified against source and against the **live** deployments, not docs. Report:
[`mas/audits/V1_V2_FULL_AUDIT.md`](audits/V1_V2_FULL_AUDIT.md).

**Verdict: v2 is at or above v1 on every functional and quality dimension** — same primary models,
superset of endpoints (`+/engagement +/book-a-call`), superset of bindings (adds KV+R2 recorded-run
tier), 66 test files vs v1's 7, plus claims-gate + secret-scan + Foundry CI gates v1 never had.
Findings: **0 P0 · 1 P1 · 3 P2 · 3 P3.**

## 2. Fixes implemented (all tested; GAP-01/03 live-verified)

| Gap | Sev | Fix | Verify | Commit |
|---|---|---|---|---|
| **GAP-01** — CSP/security headers absent on the SPA's `/` document | P1 | `wrangler-action` deployed with a wrangler that silently ignores `assets.run_worker_first`, so worker.js never ran on the shell/assets. Pinned `wranglerVersion: '4.123.0'` in CI + `npx wrangler@4` in the RUNBOOK for the owner's manual prod deploy; corrected the stale "`_headers` ships the CSP" note (it's inert). | **Live:** `curl -sSI …/` → `content-security-policy` + `x-served-by` + `no-store`. Root cause proven via `wrangler@4 dev`. | b6ff2fb |
| **GAP-02** — Anthropic fell back to Workers-AI on the first 429 | P2 | Shared `anthropicFetch()` (bounded retry on 429/529 + network, honoring `Retry-After`, capped 3s) wired into concierge/audit/fuzz/tx — restores v1's `llm.js` behavior; retries only the pre-stream response. | 12 unit tests (fetch + sleep injected). | f37978e |
| **GAP-03** — hashed `/assets/*` not immutable-cached | P2 | Same root cause as GAP-01 (worker never ran on asset paths). | **Live:** `/assets/*.js` → `public, max-age=31536000, immutable`. | b6ff2fb |
| **GAP-01 guard** | — | `siteWorkerHeaders.test.js` — CI regression test on worker.js header logic. | 3 tests. | this commit |

## 3. Deferred — owner's-call, NOT defects
- **GAP-05** — v1's Education section/CV framing dropped in v2 (proof content survives). Deliberate
  proof-first IA per the MAS brief; confirm the formal-education omission is intended.
- **GAP-06** — `[RENDER_CARD]` inline pricing card (v2 routes to Mission Control instead) + "Download CV"
  chat link. Design decisions; parser support (`chat/toolCalls.js`) exists if you want the inline card back.
- **GAP-07** — cosmetic: `auditRag.js` comment says "~9.5k" vs v1's "~13k" for the *same* live Neon table.

## 4. Known items for the owner
- **v1 production (jw3b.dev) still ships no CSP** — v1's worker.js sets no headers at all. It closes when
  **v2 is promoted to production with wrangler ≥4** (RUNBOOK §1), or via a separate v1-repo hotfix.
- **Hygiene:** `.claude/skills/` (6 project-scope role skills) is untracked in git — track in a follow-up.
- **Production deploys remain owner-gated** (RUNBOOK). The preview/test URL is auto-deployed by CI on push to `v2`.

## 5. State at handover
Gate **all green**: lint · **66 test files / 415 tests** · coverage **99.07 % stmt / 94.92 % branch /
100 % func / 100 % line** · claims-gate 28 · secret-scan clean · Foundry contracts green. Both preview
instances live; GAP-01/03 confirmed on the deployed preview.

## 6. Next: P3
XMTP E2E messaging migration (`@xmtp/browser-sdk`; `/messages` is an honest feature-flagged gate today),
plus owner provisioning (escrow/Unlock lock addresses, contract deploys) and the eventual production
promotion of v2. Neither v1 nor v2 ships XMTP today — this is net-new, not a regression.
