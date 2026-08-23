# jw3b.dev v2 — Project Guide for Claude

Personal portfolio + Web3 service platform for John Wellard (JW3B / AgileGypsy): blockchain
engineer and smart-contract security auditor. Marketing site with an AI concierge, a live audit
console, an on-chain CTF, and a hire flow that reaches John.

**This tree is production.** Branch `v2` is the default branch and deploys to jw3b.dev. The
`-v2` preview instances (`jw3b-dev-site-v2`, `portfolio-agent-v2`) were deleted 2026-08-21 —
there is one target for each half and it is live.

> **Why this file exists.** Until 2026-08-22 this repo had no `CLAUDE.md`, so sessions loaded
> process rules from `jw3b.dev_website` — the v1 tree retired to the `v1-archive` tag. Rules were
> being read from dead code, and several of them were already false here (a `graphify-out/` that
> does not exist, a `docs/PORTFOLIO_REFERENCE.md` that does not exist, an XMTP pin that is not the
> package this repo uses). See `mas/audits/POSTMORTEM_CONCEPT_SHIP.md`.

## Stack

- **Frontend**: React 19, Vite 6, React Router 7, Tailwind 3, Framer Motion,
  `react-helmet-async`. Fonts self-hosted via `@fontsource`.
- **Web3**: wagmi 2 + viem 2 + RainbowKit 2. Chains: Base Sepolia (CTF, live), Base, Mainnet.
- **Messaging**: `@xmtp/browser-sdk` 7.x (the MLS rewrite — *not* the deprecated `@xmtp/xmtp-js`).
- **Backend**: Cloudflare Worker `portfolio-agent` — Workers AI (Whisper STT, Aura TTS) +
  Anthropic Haiku via AI Gateway (concierge) + D1 (`jw3b_analytics`) + KV + R2 (recorded runs) +
  Neon/pgvector (the KTHULHU public finding corpus, read-only).
- **SPA host**: Worker `jw3b-dev-site` with Workers Static Assets. `worker.js` runs on every
  request (`run_worker_first`) because Static Assets does not honor `_headers` — the worker owns
  CSP, security headers, and cache rules.
- **Contracts**: Foundry (`contracts/`) — `ReentrantVault` (CTF, Base Sepolia), `MilestoneEscrow`
  (unfunded), `Attacker`.
- **Tests**: Vitest + Testing Library + jsdom (unit/component), Playwright (E2E, real browser).

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # production build → dist/
npm run lint           # eslint (flat config)
npm test               # full vitest run (107 files / 1,263 tests, 2026-08-22)
npm run test:coverage  # core coverage gate
npm run coverage:worker# worker coverage gate (separate include-list + thresholds)
npm run claims-gate    # evidence-register + forbidden-phrase gate — see Claims discipline
npm run secret-scan    # client-bundle secret-leak scan
npm run schema:check   # recorded-run / register schema check
npm run e2e            # Playwright against a local production build
npm run e2e:prod       # Playwright against https://jw3b.dev
npm run telegram:setup # set the lead-alert secrets (reads a gitignored token file)
# Worker: cd workers/portfolio-agent && npx wrangler dev | deploy
```

**Every config lives in `config/`** — `vite.config.js`, `vitest.config.js`, `eslint.config.js`,
`tailwind.config.js`, `postcss.config.js`. The npm scripts pass `--config` explicitly; running a
bare `vitest`/`vite` from the root will not pick them up.

`.npmrc` sets `legacy-peer-deps=true` for the React 19 peer-dep graph.

## Layout

- `src/pages/` — one file per route. `src/pages/thesis/` holds the two thesis pages.
- `src/components/<domain>/` — grouped by surface: `audit`, `chat`, `ctf`, `flagships`, `hero`,
  `identity`, `mission-control`, `messages`, `pricing`, `proof`, `thesis`, `wallet`, `compliance`,
  `layout`, `seo`.
- `src/lib/` — **pure logic, no I/O.** Reducers, state machines, policies, parsers, formatters.
  This is where the coverage gate lives and where new logic belongs by default.
- `src/hooks/` — the impure layer that wires `src/lib` to network/wallet/DOM.
- `src/constants/index.js` — site copy, personas, projects, services, `HATS`.
- `src/data/` — `evidence-register.json` (+ schema), `retainer.json`, `recorded-runs/`,
  `vuln-corpus/`.
- `src/content/` — `privacy.md`, `terms.md` (rendered in full; never stub legal text) and
  `notes/` (the P5-04 publishing pipeline).

**Publishing a note is adding a file.** Drop `src/content/notes/<slug>.md` with frontmatter
(`title` required; `date`, `description`, `draft` optional) and it gains `/notes/<slug>`, an index
entry, SEO and JSON-LD with **no component edit**. Two rules the pipeline enforces rather than
documents: a file with no title, no body, or `draft: true` is dropped rather than half-published;
and with **zero** notes the `/notes` routes are not registered at all, so there is never an empty
section advertising an absence. `src/__tests__/sitemap.test.js` fails if a published note has no
`<loc>` in `public/sitemap.xml` — that entry is the one step still done by hand.
- `workers/portfolio-agent/src/` — `index.js` (routing + CORS + rate limit) and `routes/*.js`
  (one file per endpoint), plus `knowledge.js` (concierge KB), `notify.js` (Telegram lead
  alerts), `auditRag.js`, `tagProtocol.js`, `rateLimit.js`, `replay.js`.
- `mas/` — the pipeline record: `REQUIREMENTS.md`, `PLAN.md`, `ROLE_LEDGER.md`,
  `architecture_design/` (ADRs), `audits/` (gates + postmortems), `facts/`.
- `design/` — `design-story.md`, `tokens-contrast.md`, and `briefs/` (one per surface).
- `docs/` — `INFRASTRUCTURE.md`, `OPS.md`, `RUNBOOK.md`, `COMPLIANCE.md`, `DEFERRED.md`,
  `WEB3_REVIEW_CHECKLIST.md`.
- `e2e/` — `journeys.spec.js`, `interactions.spec.js`, `layout-and-assets.spec.js`,
  `live.spec.js`.

---

# The rules this project runs on

These are not style preferences. Each one exists because its absence shipped a defect that passed
every gate. The evidence is in `mas/audits/POSTMORTEM_CONCEPT_SHIP.md` and
`mas/audits/PRODUCT_AUDIT_2026-08-21.md`.

## 1. Ask the running system — and read its adjudications

**Before asserting what a deployed system does, ask the system**: the live API, the running
process, the deployed endpoint, the actual database. A file, a grep, or a green pipeline is
evidence about *the repo*; it is evidence about *production* only once something has proven the
two agree. Five recorded instances of this failing are tabled in the postmortem's addendum.

**And before recommending a change to a system, read that system's own record of itself** — its
ticket board, decision log, or ADRs. The discriminator is whether an artifact was written to
*explain* the system or to *decide about* it: descriptive comments rot silently, adjudications
do not. (KTHULHU keeps both: `tickets/KTH-NNNN.md` and `docs/factory-queue.md`.)

**State confidence per fact, not per document.** "Confirmed (live API)", "confirmed to exist,
value unreadable", and "plausible, unverified" are three different claims; collapsing them is how
a report becomes wrong while every sentence still feels true. `mas/audits/KTHULHU_INFRA_AUDIT.md`
§3 has the format.

## 2. Requirements name outcomes, not capture

Every product loop carries an outcome and the test that drives it on the **deployed** target. The
canonical failure: FR-036 asked for "engagement-request capture + confirmation", the builders
built exactly that, every gate verified exactly that — and no requirement anywhere said *a lead
reaches John*, so for months none did.

Current loop outcomes:

| Loop | Outcome |
|---|---|
| Hire | a submitted lead reaches John's Telegram in ≤ 60s; the visitor can talk to the agent |
| Concierge | an informational question gets a true in-chat answer; navigation only on consent |
| Audit | the workflow is legible before any spend; a report artifact is exportable |
| CTF | the challenge is readable — brief, source, address, leaderboard — before any wallet |
| Flagships / theses | the page does something on-site, or its copy stops implying it does |

## 3. Degradation is a floor, not a product

Honest labelling of a fallback is necessary and not sufficient — the floor must also *work end to
end*. Escrow degrading to Unlock degrading to book-a-call degrading to an unread table is four
honest labels and zero delivered outcomes. Flags fail closed; a closed flag degrades to a path
that is itself verified.

## 4. Task scope is a route and a journey, never a component

A rename is unfinished until every surface naming the thing is swept: wrappers, hero, nav, SEO
strings, the concierge KB, recorded prose, and tests. Where two components share a protocol
(the tag protocol, the tool-call target, `consoleCopy`), the contract has **one** source and a
drift test that fails when a mirror diverges.

## 5. Claims discipline — the gate is CI, not a convention

`npm run claims-gate` fails the build if the evidence register is invalid, a `<Claim id="…">`
points at a missing or non-cleared entry, or a forbidden phrase appears in rendered copy.

- The register is `src/data/evidence-register.json` (31 cleared claims). **The UI reads the
  register; it never hardcodes a figure.**
- The forbidden list is *in the register* — never hardcode a forbidden phrase in a component or a
  test, derive it from `register.forbidden` (a component that illustrated the blocklist with
  literal examples failed the gate on itself).
- Blocked outright: aggregate TVL / value-secured, dollar bounties, "50+ audits completed",
  "decades of combined experience", and two credential inflations (PMP — the artifact is an exam-
  prep course; PRINCE2 Practitioner — Foundation only).
- Citable audit record: **1,430 EXP · 17 valid submissions (8 High · 5 Medium · 4 Low)**, of which
  **11 are reproduced from official contest reports** and **1 write-up Cyfrin selected for
  publication** (`/findings/50-L-01`). **Lead with these — they are John's own and monotonic.**
  The leaderboard RANK is relative and moves without him: #137 (Nov 2025) → #124 (Jan 2026) →
  #152 (Aug 2026). It shipped as "#124" for months after it stopped being true, so it is now
  date-stamped in the register value. Never state a rank without its as-of.
- **No zero-value theater.** A surface shows a proven figure or shows nothing.
- **Attribute on the evidence pointer, never on the name.** Where two systems share a word, the
  register's `evidence_pointer` / `source_system` decides which one a surface is about — settle
  that *before* reading any code. "Overmind" names three things here: the governed agent engine
  (**the** engine, what CR-04/05/06 attest to), a Cloudflare Worker inside KTHULHU called
  `kthulhu-overmind`, and an FSM module inside the first. Discriminating on the name instead
  shipped the wrong system on the `/work` flagship **three times**. `overmindGovernance.js` is the
  engine; `kthulhuPipeline.js` is the Worker's namesake — the filenames are part of the fix.
- **A claim's own source system is the check `claims-gate` cannot run.** The gate catches value
  drift; it cannot tell you a cleared number is unsupported. CR-06 shipped as "13-phase pipeline"
  for a month — flagged `[REQUIRES_RESOLUTION]` in business analysis, cleared without
  reconciliation, and rendered on the homepage; the source system has **6 phases and 13 products**.
  When a figure can be resolved by arithmetic or a grep against its source, resolve it.

## 6. Client audit data is never published

`findings`, `audit_submissions`, and the Neo4j graph hold client work. Public routes expose
**aggregates only** — `/kb/*` selects no column that could identify a client or a contract, and a
test asserts the public routes never name those tables. Keep it that way when adding routes.

## 7. The 4-hat IA rule

Engineer = cyan · Auditor = purple · PM = green · Founder = orange (`HATS` in
`src/constants/index.js`). Identity surfaces show all four at once; filters **dim** cards, never
hide them.

## 8. Gates that must stay blocking

CI (`.github/workflows/ci.yml`) runs `verify` (lint → core coverage → worker coverage → claims
gate → build → secret scan), `e2e` (Playwright on a production build), `contracts` (forge fmt +
test), then `deploy-backend` / `deploy-frontend` gated on `v2`, then `smoke` (Playwright against
the deployed site).

Coverage thresholds are strict (100% lines/functions on the `src/lib` include-list) but
**scoped**: a file joins `include` only when it lands *with* its tests. Adding a covered file to
the list without tests breaks the gate for everyone.

The three gates the pipeline lacked are now wired (W5, 2026-08-22):

| Gate | Where | Runs |
|---|---|---|
| First-visitor walkthrough — walletless, empty state, mobile | `e2e/first-visit.spec.js` | blocking, `e2e` job |
| Zero same-origin console errors, every route | `e2e/journeys.spec.js` | blocking, `e2e` job |
| Live-model behavioural smoke | `e2e/live.spec.js` | post-deploy `smoke` job |
| Permanent naming ban (banned vocabulary in rendered copy) | `scripts/copy-gate.mjs` | blocking, `verify` job |
| Product-owner pass in every brief (job + ≥3 next-needs) | `scripts/brief-gate.mjs` | blocking, `verify` job |
| Lead route deployed, validating, alert channel present | `e2e/lead-path.spec.js` | post-deploy `smoke` job |

The console budget filters noise by the **originating URL**, not by message text: a bare "Failed
to load resource" from our own origin is our defect and must fail the gate. Do not re-broaden it.

The live smoke asserts *behaviour*, not reachability — that an informational question is answered
in the chat without navigating, and that the answer carries a fact only the KB supplies. Mocked
tests structurally cannot catch model-behaviour or deployment-reality failures, which is why the
concierge fabricated page descriptions through a fully green pipeline.

---

## Conventions

- **JSX, not TS.** `.jsx`/`.js`; `@types/react` is for editor help only.
- Routes lazy-load in `App.jsx` behind `<Suspense>`. Provider order is fixed (SDD 02 §4):
  Wagmi → React Query → RainbowKit → Helmet → **MotionConfig** → Router. `MotionConfig
  reducedMotion="user"` is the structural reduced-motion guard for every Framer surface beneath
  it — paired with the CSS `motion-safe:` convention. Do not reorder or remove it.
- Styling: Tailwind utilities over the design tokens in `config/tailwind.config.js`. No raw hex
  outside the token layer.
- Pure logic goes in `src/lib/` and gets exhaustive tests; hooks wire it to the world. State
  machines and reducers are preferred over ad-hoc `useState` webs — the audit workspace has a
  seeded-sequence invariant suite (`src/lib/__tests__/auditWorkspace.invariants.test.js`) because
  a family of state-pair bugs shipped without one.
- **The AI tag protocol**: worker responses embed `[AUDIO: "…"]`, `[TOOL_CALL: {…}]`, and
  `[RENDER_CARD: "…"]`. One definition (`tagProtocol.js`), mirrored client-side with a drift
  test. Changing it means changing `knowledge.js`, both `tagProtocol.js` copies, and the chat
  client together.
- Any browser fetch that runs off-production must be gated on the origin allowlist
  (`framingOriginAllowed()`), or it CORS-fails into the console-error budget. This has been
  written twice and caught twice.

## Web3 standards

- **Simulate-first is law**: `useSimulateContract` → `writeContract` → `useWaitForTransactionReceipt`.
  A write with no simulate in front of it is a finding. Helpers in `src/lib/web3Guards.js`;
  checklist in `docs/WEB3_REVIEW_CHECKLIST.md`.
- Token amounts are integer base units end to end — `parseUnits(x, 6)` for USDC, never a float,
  never `* 1e6`.
- Label testnet vs mainnet on **every** on-chain surface. The CTF vault is Base Sepolia.
- Tree-shake viem/wagmi with named imports.
- Unprovisioned rails (escrow, Unlock) stay behind flags that default **off** and degrade to the
  hire path.

## Secrets and deploy

- All secrets via `wrangler secret put` — never committed, never printed, never a `VITE_` var.
  `.env.production` holds **public** values only (WalletConnect project id, feature flags).
- A new secret needs the full set: worker code reference, a comment in `wrangler.toml` marking it
  store-provided, the production value set, and a CI reference where relevant.
- CI on `v2` is the only path to the live site. `wrangler.jsonc` names production explicitly
  because a bare `wrangler deploy` once created a second live site from the preview default.
- Never fix a CSP problem by adding `'unsafe-inline'`.
- Do not broadcast mainnet contract deploys without explicit owner authorization. The keystore
  password lives in a gitignored `contracts/.env` and is never printed.

## Dependency constraints

- **Do not upgrade wagmi to 3.x.** RainbowKit peer-requires `wagmi ^2.9.0` and has no wagmi-3
  release; forcing it breaks the wallet UI and drops the transitive `buffer` polyfill.
- `overrides` pins `axios`/`elliptic`/`tar-fs`/`ws` to patched versions. Residual audit items need
  majors with no safe fix yet.
- XMTP is `@xmtp/browser-sdk`. The old `@xmtp/xmtp-js` is deprecated — do not reintroduce it.

## Working style

- **No subagent delegation on this project** — do the work directly in-session.
- **Role-first**: load the task's role Skill *before* touching a file, and record the hop in
  `mas/ROLE_LEDGER.md`. Project-scope skills in `.claude/skills/` (`audit-heuristics-engineer`,
  `devops-engineer`, `full-stack-integrator`, `portfolio-evidence`, `smart-contract-engineer`,
  `web3-blockchain`) are jw3b.dev-retargeted and take precedence over the user-scope versions.
- **Pipe bulky output to disk, then grep it.** Vitest/build/Playwright logs go to a scratch file
  and get queried — never dumped raw into the conversation.
- Suggest `/compact` at task boundaries (a landed feature, a passed verification) with a focus
  hint, rather than letting auto-compact fire mid-task.
- Every design brief carries a product-owner section: *the job the visitor finishes* plus **≥ 3
  proposed next-needs**. Depth is designed in, not requested by the owner after shipping.
- Verification chains use `&&`, not `;` — a `;` once masked a red claims gate behind a green
  build.

## Owner-gated (do not attempt unattended)

CTF vault v2 redeploy (keystore + gas) · Unlock lock provisioning and escrow mainnet funding ·
the Cloudflare zone RUM/insights toggle (source of the CSP console errors) · KTHULHU and Kointel
API access for the on-site demos.
