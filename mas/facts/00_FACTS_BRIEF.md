# jw3b.dev v2 — FACTS BRIEF (curation note for every MAS role)

**This is a total, ground-up rebuild of the ENTIRE app (frontend + Cloudflare Worker backend).**
Reuse NOTHING from the prior site: all components, the IA, the layout, the visual design, and
every prior design doc/decision are **SCRAPPED**. Only *facts* survive as input — they live in
this `mas/facts/` folder. Build against these facts + the Phase 0 market validation, not against
any memory of the old site.

---

## 1. Locked strategic direction (Phase 0 → approved by John, 2026-08-16)

North star: **"A portfolio you OPERATE, not one you read."**

- **Proof-as-interface** — key surfaces are *operable* (run an audit, query the agent, step a
  pipeline), not described in prose. The site *is* the systems.
- **Verification as the visual signature** — "systems are graphs" + the zero-trust validated
  pipeline as an explorable/steppable object. The visual literally *is* the reliability the buyer
  is paying for.
- **Radical honesty** — a first-class "unedited run, failures included" surface. What hiring
  managers screen for; almost no portfolio dares show it.
- **Register:** premium-technical (Linear-precise · Rauno-dense · Anthropic-evidence-forward),
  **dark, fast, one unmistakable hire path.**
- **HARD downstream rule:** every "live" surface needs a cached/replay fallback so live degrades
  to *verifiably real*, never *broken*.
- **Primary audience / persona:** the **building founder/CTO** (seed–Series A) whose #1 fear is
  *"works in demos, fails in production."* See `market_validation/01_personas.md`.
- **AI is THE headline.** John is a **Senior Agentic AI Developer**; agentic AI that survives
  production is his least-contested, highest-value asset. AI leads; delivery is the foundation.
- **Identity = four hats, shown together:** Engineer · Auditor · PM · Founder. Filters may DIM,
  never hide. (This is *identity structure*, an input — NOT the old "Orchestration" visual, which
  is scrapped. Reconceive the IA/layout that carries it from zero.)

Generic clichés Phase 0 says to AVOID (the old site fell into all three): headshot + two-column
hero; a skills/tech-icon grid as a top section; glassmorphism-neon + decorative 3D/WebGL hero
(now the 2026 default, not a differentiator).

## 2. Features that MUST exist end-to-end (functional floor)

1. **AI security console** — Solidity auditor + fuzz-harness generator + tx explainer (streaming).
2. **AI concierge chat** — global streaming assistant (voice STT/TTS + tag protocol), backed by the Worker.
3. **Live on-chain CTF** — real reentrancy challenge on Base Sepolia (deploy → attack → verify → leaderboard).
4. **Wallet-gated hire flow ("Mission Control")** — configure → assess → engagement → service
   loadout that **actually converts** (the old one dead-ends). Must be an operable product surface,
   not a marketing section. Checkout primitives to support: book-a-call floor · on-chain escrow ·
   Unlock paywall.
5. **Wallet connect** (RainbowKit custom button).
6. **Unlock paywall** checkout.

`facts/existing-features-inventory.md` is the *factual* audit of what each of these does today
(flows, states, Built/Partial/Stubbed/Orphan status) — carry the **feature behavior**, ignore its
references to the old `REQUIREMENTS.md`/FR numbers (those docs are scrapped).

## 3. Fixed constraints (given — not choices to make)

- **Stack floor:** React 19 · Vite · Tailwind 3 · Framer Motion · **wagmi 2 (NEVER v3 — no
  RainbowKit for wagmi 3)** · viem 2 · R3F optional & budgeted. Backend = **Cloudflare Worker**
  (Workers AI + D1 + Anthropic via AI Gateway). These are environment constraints; record them,
  don't re-decide them. (Architecture *design* is Phase 3's job; NFR seeds state targets, not stacks.)
- **Web3 pattern:** simulate-first (`useSimulateContract` → write → wait); `useReadContract`.
- **Secrets** never in frontend — only via Worker (`wrangler secret put`). `.env` = public values only.
- **Do NOT deploy or push.** John owns deploys. Build on branch `v2` only.

## 4. Claims discipline (a hard requirement, and an OPEN reconciliation item)

**Proof, not promises.** Every number/credential shown as fact must trace to
`facts/PORTFOLIO_REFERENCE.md` (the evidence register) or `facts/cv-source.md` (John's own CV),
or be dropped. No TVL / $ / protocols-secured claims. The always-citable audit record:
**CodeHawks #124 · 17 findings (8 High) · 1,430 EXP.**

⚠️ **UNRESOLVED — flag as `[REQUIRES_RESOLUTION]`:** `cv-source.md` lists metrics as citable
(e.g. GraphRAG **+18 pts**, **9,828 entities**, **192K corpus**, **1,345 tests/100%**), but
`capability-accuracy.md` warns several of these are the *studio's* register and must NOT appear on
jw3b.dev unless they are in jw3b's OWN register (`PORTFOLIO_REFERENCE.md`). Do not silently pick a
side. Surface every stat that appears in cv-source/capability but NOT in PORTFOLIO_REFERENCE as an
explicit reconciliation list for John to rule on. Also carry the `[REQUIRES JOHN]` items in
`capability-accuracy.md` §"New projects" (DevGuild / EcoGraph / Overmind — jw3b or studio-only?).

## 5. What each facts doc is

- `market_validation/01…05` *(Phase 0, sibling folder)* — **REQUIRED upstream.** Personas,
  competitor teardown, differentiation angle, search intent, master report (go/no-go = PROCEED).
- `cv-source.md` — John's Agentic-AI CV: positioning, citable metrics, timeline, skill clusters,
  certs, four-hat mapping. The identity/content source of truth.
- `capability-accuracy.md` — the **real** language for the AI work (kills the invented "Swarm";
  "Overmind" is real). Four shipped AI capabilities + claims-discipline rules.
- `agilegypsy-reference.md` — reference facts from John's other properties (agilegypsy.com;
  kthulhu.co / kointel.co.za are his too). Framing/voice reference.
- `existing-features-inventory.md` — factual map of the current app's flows/states (see §2).
- `PORTFOLIO_REFERENCE.md` — the evidence register; the arbiter for §4.

## 6. Explicitly SCRAPPED — do NOT reuse or read as design input

The old `src/`, the old IA/layout (two-column headshot hero, stacked-section cards, the
four-column pattern), and every prior design doc: `design-story.md` ("THE ORCHESTRATION"),
the old `REQUIREMENTS.md`, `tokens.md`, `rebuild-audit.md`, `v2-redesign-brief.md`. They read as a
generic portfolio and were rejected. Their *facts* have already been extracted into this folder;
the *design* is dead.
