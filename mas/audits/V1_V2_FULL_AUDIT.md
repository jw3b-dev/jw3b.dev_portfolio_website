# v1 ↔ v2 full audit & gap-test report — codebase + cloud infrastructure

**Auditor role:** codebase-auditor (report-only; independence preserved — no code was changed in this pass).
**Date:** 2026-08-16.
**v1** = `jw3b.dev_website` @ branch `v2-upgrade` (HEAD `39ce4cb`) — the mature, *currently-live-in-production* site.
**v2** = `jw3b.dev-v2` @ branch `v2` (HEAD `02b1b61`) — the from-scratch MAS rebuild, live on the **preview** URLs.
**Method:** static diff of both trees (tracked files only — archives/gitignored excluded), worker source read, **live** Cloudflare enumeration (workers/D1/KV/R2 via MCP), **live** header probes via `curl`, and a full v2 test+coverage run. Every finding cites file:line or a reproducible probe.

> Companion doc: `V1_V2_PARITY_AUDIT.md` (AI-tier feature parity). This report supersedes it in scope: it adds cloud-infra, CI, security-header, and resilience dimensions, and **re-verifies the AI-tier claims against v1 source** (they hold).

---

## 1. Verdict

**v2 is at or above v1 on every functional and quality dimension** — same primary models, superset of endpoints, superset of bindings, 57× the test files, and CI/security governance v1 never had. It is **not** a downgrade.

**But the audit found one genuine live defect that affects both stacks** (security headers not reaching the SPA's primary document), plus a minor resilience regression and a few owner's-call content decisions.

| Priority | Count | Blocks a production promotion? |
|---|---|---|
| **P0** (vuln / data-loss / MUST absent) | 0 | — |
| **P1** (security control absent on a primary surface) | 1 | **Yes** — fix `GAP-01` before promoting v2 to prod (and it already affects v1 prod today) |
| **P2** (resilience / perf / process) | 3 | No — fix-forward |
| **P3** (content / docs / owner's-call) | 3 | No |

v2 gate status (live-verified this pass): **64 test files · 400 tests · all pass · coverage 99.07% stmt / 94.92% branch / 100% func / 100% line · exit 0.**

---

## 2. Codebase comparison

| Dimension | v1 (`v2-upgrade`) | v2 (`v2`) | Delta |
|---|---|---|---|
| Tracked files | 149 | 255 | v2 +71% |
| `src/` layout | components(32) · hooks(8) · config(5) · constants(2) · lib(1) · data(1) | components(55) · **lib(50, pure)** · data(15) · config(12) · **pages(11)** · hooks(6) · styles(3) | v2 adds a pure-logic layer + route layer |
| Worker | monolithic `index.js` (462 LOC) + 4 modules | `index.js` (126 LOC) + `routes/`×7 + tagProtocol/rateLimit/replay/auditRag | v2 modularized |
| Test files | 7 | 64 | v2 +57 files |
| Design system | `constants/colors.js` (raw) | `styles/tokens.{css,js}` + `motion.js` (tokenized) | v2 token-governed |
| Content governance | inline copy in `constants/index.js` | `data/evidence-register.json` + `Claim.jsx` + claims-gate | v2 CI-enforced claims discipline |

**Interactive-feature parity — all present in v2:** AI security console (`audit/AuditConsole.jsx` + `FuzzTool.jsx` + `TxExplainer.jsx` — v2 split what v1 had as hooks), concierge chat (`chat/ChatWidget.jsx` + `Markdown.jsx` + `toolCalls.js`), CTF (`ctf/CtfChallenge.jsx`), paywall (`pricing/UnlockPaywall.jsx`), wallet (`wallet/ConnectButton.jsx`), hire flow (`mission-control/` — v1's ~650-line monolith split into MissionControl + BookACall + CheckoutStateMachine + EscrowCheckout + ProgressRail), 4-hats (`identity/FourHats.jsx` = v1 `HatFilter.jsx`). v2 **adds** `flagships/` (Work showcase), `proof/` surfaces, `seo/PersonJsonLd.jsx`, `Claim.jsx`.

**v1 surfaces with no 1:1 in v2 (deliberate IA reconception, per the MAS brief):** `About/Experience/Education/Certifications/Technologies/Services/Contact` sections and the `Background/CyberDNA/CyberNode/StoryLogo/ParticleCanvas` 3D/particle FX (dropped per the design lock "no 3D / anti-spectacle"). Content-survival check (see `GAP-05`): proof content **survives** (CodeHawks ×55, KTHULHU ×70, Overmind ×50, AgilePM ×15, GraphRAG, 192K corpus, "7 countries"); traditional-CV framing **dropped** (Education 0 hits, "13-phase pipeline" 0, Benoni 0).

---

## 3. Backend / worker comparison

### Endpoints (v2 ⊇ v1)
v1 `index.js`: `/audit` `/fuzz` `/tx-explain` `/speech-to-text` `/text-to-speech` `/ctf/verify` `/ctf/leaderboard` + chat (root).
v2 `index.js:69-116`: **all of the above** + `/engagement` + `/book-a-call`. No endpoint regressed.

### Model routing — verified against v1 source (not the prior doc)
| Route | v1 primary → fallback | v2 primary → fallback | Status |
|---|---|---|---|
| concierge chat | haiku-4.5 → **llama-3.1-70b** (`index.js:11,16`) | haiku-4.5 → **llama-3.3-70b-fp8-fast** (`concierge.js:16,19`) | ✅ v2 better fallback |
| `/audit` | **opus-4-8** → llama-3.1-70b (`index.js:225,231`) | **opus-4-8** → **qwen2.5-coder-32b** (`audit.js:16,19`) | ✅ v2 better fallback |
| `/fuzz` | **opus-4-8** → llama-3.1 (`index.js:270,275`) | **opus-4-8** → qwen-coder (`fuzz.js:15`) | ✅ parity (v2 restored Opus this session) |
| `/tx-explain` | **opus-4-8** → llama-3.1 (`index.js:314,319`) | **opus-4-8** → qwen-coder (`txExplain.js:14`) | ✅ parity (restored) |
| STT / TTS | whisper / aura-1 (`index.js:136,160`) | whisper / aura-1 (`voice.js:7,8`) | ✅ parity |

> **Confirms the parity-audit premise:** v1's `/fuzz` and `/tx-explain` *did* use Opus (`index.js:270,314`), so v2's initial Llama-only build *was* a regression, and this session's restoration was correct.

### RAG grounding — parity (both hit the same live corpus)
Both embed with `@cf/baai/bge-m3` (1024-dim) and query the **same Neon pgvector table** `knowledge_base_findings` via `ORDER BY embedding <=> vec` (v1 `rag.js:30-32`; v2 `auditRag.js:86-98`). v2 **adds** a retrieval-safety guard + injectable client for testing. (Comment drift only — see `GAP-07`.)

### Anthropic auth — parity
Both accept `sk-ant-oat…` (Bearer + `oauth-2025-04-20` beta + **Claude-Code identity as the first system block**) and `sk-ant-api…` (x-api-key): v1 `llm.js:8-23,88-96`, v2 `concierge.js anthropicAuth`. Faithful mirror.

---

## 4. Cloud infrastructure comparison (live-enumerated 2026-08-16)

### Deployed workers (both stacks are live)
| Worker | Role | Created / Modified |
|---|---|---|
| `portfolio-agent` | **v1 prod** backend | 2026-03-15 / 2026-08-15 |
| `jw3b-dev-site` | **v1 prod** SPA (jw3b.dev) | 2026-08-15 / 2026-08-15 |
| `portfolio-agent-v2` | **v2 preview** backend | 2026-08-16 |
| `jw3b-dev-site-v2` | **v2 preview** SPA | 2026-08-16 |

### Bindings (v2 worker is a superset of v1)
| Binding | v1 (`wrangler.toml`) | v2 (`wrangler.toml`) | Live? |
|---|---|---|---|
| AI (Workers AI) | ✅ | ✅ | yes |
| D1 `jw3b_analytics` (`7ed65107…`) | ✅ | ✅ **same DB reused** + `migrations_dir` | ✅ exists |
| KV `jw3b-recorded-runs` (`d13bd6d5…`) | ❌ none | ✅ (`wrangler.toml:23-25`) | ✅ exists |
| R2 `jw3b-recorded-runs` | ❌ none | ✅ (`wrangler.toml:29-31`) | ✅ exists (created 2026-08-16) |
| Neon pgvector (`NEON_DATABASE_URL` secret) | ✅ (`rag.js`) | ✅ (`auditRag.js`) | external |
| CORS allowlist var | ❌ (open) | ✅ `ALLOWED_ORIGINS` (`wrangler.toml:41`) | — |
| AI-Gateway routing | full URL var | slug-built (`CF_ACCOUNT_ID`+`AI_GATEWAY`) | same gateway |

**v2's recorded-run tier (KV Tier-1 + R2 media + bundled Tier-2 floor) does not exist in v1.** Both KV and R2 are provisioned and live. *(Owner note: whether the live KV is seeded with Tier-1 runs is a provisioning item — the bundled Tier-2 runs in `src/data/recorded-runs/` are the always-available floor, so an empty KV is non-fatal.)*

---

## 5. CI / CD & quality gates

| Gate | v1 `ci.yml` | v2 `ci.yml` |
|---|---|---|
| lint | ✅ | ✅ |
| test + coverage | ✅ | ✅ |
| **claims-gate** (blocks forbidden/uncleared claims) | ❌ | ✅ `:48-49` |
| **secret-leak scan** (scans shipped `dist/`) | ❌ | ✅ `:55-56` |
| **Foundry contracts** (fmt + fuzz + invariant) | ❌ | ✅ `:61-81` |
| Deploy target on push | **PRODUCTION** (`portfolio-agent` + `jw3b-dev-site`) on `main`/`v2-upgrade` (`:41-106`) | **isolated preview** (`-v2`); prod is owner-manual (`:91-147`) |

v2's pipeline is strictly more rigorous **and** safer (production is never auto-touched). v1 auto-ships to prod from `v2-upgrade` with no claims/secret/contract gate → `GAP-04`.

---

## 6. Gap register (every item reproducible from its citation)

### P1 — fix before any production promotion
**`GAP-01` · Security headers do not reach the SPA's primary document (both stacks; live-verified).**
- **Found:** On the live v2 preview, the site worker's CSP + `x-content-type-options` + `referrer-policy` + `permissions-policy` (`worker.js:14-34`) and cache rules (`:48-52`) apply **only to non-asset SPA-fallback paths**, not to `/` (the actual SPA entry) or hashed `/assets/*`. `run_worker_first: true` (`wrangler.jsonc:19`, compat `2025-05-05`) is **not** producing worker-first behavior for asset-matched paths on the deployed worker, despite the config being deployed (commits `210f4aa`/`5304dbe` predate the last preview deploy and are ancestors of deployed `6b1e490`). Cloudflare docs confirm `run_worker_first: true` *should* run the worker ahead of all asset serving.
- **Reproduce:**
  `curl -sSI https://jw3b-dev-site-v2.agilegypsy.workers.dev/` → **no CSP**, `cache-control: public, max-age=0` (platform default), **no** `x-served-by`.
  `curl -sSI https://jw3b-dev-site-v2.agilegypsy.workers.dev/work` → **CSP present**, `no-store`, `x-served-by`. (Worker runs only on the unmatched path.)
  `curl -sSI https://jw3b.dev/` (v1 prod) → **no CSP at all** (v1 `worker.js:1-20` sets zero security headers, and its config lacks `run_worker_first`).
- **Impact:** the CSP (ADR-08) is absent on the document users actually load, on **v2 preview and v1 production alike**. (Stale-shell risk is largely mitigated anyway by the platform default `max-age=0, must-revalidate`.)
- **Owner:** devops-engineer. **Remediation options:** (a) verify the CI wrangler version honors boolean `run_worker_first` and re-curl `/` after redeploy; (b) switch to the explicit array form `run_worker_first: ["/*"]`; or (c) set the security headers via a zone-level **Transform/Response-Header Rule** (robust against asset-serving bypass — the same mechanism already used for flagship framing). **Re-verify with `curl -sSI …/` showing the CSP.**
- **Test status:** no automated header assertion exists in either repo. A live-header smoke test (assert CSP on `/`) would catch regressions — recommended, owned by qa-tester/devops.
- **Remediation applied (2026-08-16, devops-engineer):** root cause proven = the config is correct but the deploying wrangler ignored `run_worker_first`. Verified locally that `wrangler@4.123.0 dev` applies it (`/` → CSP + `x-served-by` + `no-store`; `/assets/*` → `immutable`). Fix: pinned `wranglerVersion: '4.123.0'` on both `wrangler-action` steps in `ci.yml` (preview backend + SPA), and updated `docs/RUNBOOK.md` to mandate `npx wrangler@4` for the owner's manual **production** SPA deploy + a `curl -sSI /` CSP/`x-served-by` regression check. **Pending confirmation:** a `v2` push (CI preview redeploy) then `curl -sSI …jw3b-dev-site-v2…/`. **v1 prod (jw3b.dev) stays header-less until v2 is promoted with wrangler ≥4** (or a v1-repo hotfix — out of the v2 build's scope).

### P2 — fix-forward
**`GAP-02` · Concierge/console fall back off Claude too eagerly (v2 resilience regression).**
- **Found:** v2's Anthropic calls return `null` on the *first* non-OK response and immediately drop to the Workers-AI fallback (`audit.js:39-59`, `fuzz.js:34-54`, `txExplain.js:28-48`, and the concierge equivalent). v1's `llm.js:96-160` runs a **bounded retry loop (2×, honoring `Retry-After`)** before falling back. Under a transient `429/529` (e.g. the shared oat-token pool momentarily busy), v1 stays on Claude; v2 serves the weaker fallback model.
- **Impact:** occasional lower-quality answers when Claude is briefly throttled — exactly the "token busy" case. Not a failure (degrade is honest), but a quality regression vs v1.
- **Owner:** backend-specialist. **Remediation:** add a small bounded retry (respect `Retry-After`, cap ~3s, only while nothing has streamed) before the Workers-AI fallback, mirroring `llm.js`. **Test status:** untested in both; add a unit test asserting retry-before-fallback.

**`GAP-03` · Hashed `/assets/*` not immutable-cached on the live deploy.** Same root cause as `GAP-01` (worker rule `worker.js:48-49` never runs for asset paths). Live: `/assets/index-*.js` returns `max-age=0, must-revalidate` instead of `immutable` → every asset revalidates each load (a 304 cost, not a break). Resolves when `GAP-01` is fixed. Owner: devops-engineer.

**`GAP-04` · v1 CI auto-deploys to production with no claims/secret/contract gate** (`ci.yml:41-106`). v1-side process risk; informational for v2 (v2 already fixed this). No action needed on v2.

### P3 — owner's-call / docs
**`GAP-05` · Traditional-CV content dropped in v2 (Education, "13-phase pipeline", Benoni location = 0 hits).** Deliberate per the "proof-first, operate-not-read" IA brief; proof content survives. **Decision needed:** confirm formal-education omission is intended. Not a defect.

**`GAP-06` · Two minor v1-only chat affordances (GREENLIT by "yes" this session).** (1) `[RENDER_CARD]` inline pricing card — v2 routes to Mission Control via `[TOOL_CALL]` instead (`chat/toolCalls.js`; parser support exists to restore the inline card). (2) "Download CV" chat link — omitted from v2's proof-first hire path. **These are confirmed decisions, not gaps.** If porting is wanted, it's a separate **frontend/full-stack-integrator** task (out of this auditor pass — independence).

**`GAP-07` · Doc drift.** (a) `auditRag.js:4` says "~9.5k-finding" while v1 `rag.js:15` says "~13k-finding" for the *same* Neon table — cosmetic (retrieval identical). (b) v1's `CLAUDE.md` claims `@xmtp/xmtp-js` 7.x + a `useXMTP` hook, but **v1 ships zero XMTP** (no code, no deps — only marketing strings in `retainer.json`). v2's `/messages` is an honest feature-flagged gate (`xmtp:false`, P3 → book-a-call). Neither ships XMTP; v2 is the more honest of the two.

---

## 7. What v2 does *better* than v1 (not regressions — for the record)
Recorded-run resilience tier (KV+R2+bundled floor) · claims-gate + evidence register (CI-enforced) · client-bundle secret-scan · Foundry contracts CI gate (fmt+fuzz+invariant) · preview-deploy isolation (prod never auto-touched) · full CSP + security headers *(where they reach — see GAP-01)* · retrieval-safety guard on RAG · 400 tests / 99% coverage vs 7 test files · modular worker + pure-logic lib layer · Person JSON-LD / SEO · `/engagement` + `/book-a-call` endpoints · better Workers-AI fallbacks (code-specialized Qwen, general Llama-3.3).

---

## 8. Recommendation on "before continuing P2"
Per `ROLE_LEDGER.md`, **P2-GATE already PASSED** (all P2-01…P2-19 committed; report `P2-GATE_0_SUMMARY.md`) and PROV-01/02/03 are done — so "P2" as a task series is effectively complete; the remaining roadmap is **P3** (XMTP migration, further provisioning) + production promotion.

**Suggested order before resuming the build loop:**
1. **`GAP-01` (P1)** — the only thing that should gate a production promotion, and it's *already live on jw3b.dev*. Route to devops-engineer.
2. **`GAP-02` (P2)** — restore the Claude retry loop (backend-specialist) — directly addresses the "token busy → weaker answer" experience.
3. **`GAP-06`** — port the two greenlit minor items if desired (frontend/full-stack).
4. Then resume the loop toward **P3**.

Nothing here changes v2's core verdict: **it reached and exceeded v1's functionality; the gaps are a header-delivery defect (shared with prod), a resilience nicety, and deliberate IA choices.**
