# P1-22 — Claims-render integration sweep

**Role:** portfolio-evidence (compliance-officer sub — no such skill) · **Phase:** P1
**Commit:** fc56f53 · **Verdict: CLEARED** (0 violations, 0 production edits required)
**Enforces:** FR-043 (render only if traces to register) · FR-046 (block forbidden) ·
FR-047 (gate uncleared) · SC-3 / OBJ-05 (no zero-value counters).

## Scope

Every on-page numeric/credential across the built P1 surfaces must render through
`<Claim>` (cleared-only), with 0 uncleared/forbidden figures and 0 zero-value counters.
Audited the actual code + rendered output, not the docs.

## Findings (per surface)

| Surface | File | Figures | Routed via `<Claim>`? | Verdict |
|---|---|---|---|---|
| Hero VerdictRail | `hero/Hero.jsx` | CodeHawks #124 (rank/findings/exp), KTHULHU paying-users, Overmind pipeline | Yes — all `<Claim id>`; `"live"` is a status word, not a claim | PASS |
| CodeHawks record | `proof/CodeHawksLink.jsx` | #124 · 17 findings · 1,430 EXP | Yes; whole surface gates on cleared record; profile URL read from evidence pointer (not re-hardcoded) | PASS |
| Delivery anchor | `proof/DeliveryAnchor.jsx` | 20+ plants · 7 countries; AgilePM® Practitioner | Yes — `delivery-plants-countries`, `agilepm-practitioner` | PASS |
| Four-hat identity | `identity/FourHats.jsx` | none (by design — carries no counts) | N/A | PASS |
| Failures surface | `proof/FailuresSurface.jsx` | none | N/A | PASS |
| Mission Control loadout | `mission-control/*`, `lib/loadout.js` | indicative prices | Sourced from `retainer.json` (BR-12), a separate provenance system — correctly NOT evidence-register claims | PASS |

## Cross-cutting checks

- **Raw cleared-value literals** (`1,430`, `9,828`, `192,000`, `#124`, `+18`, `77k`,
  `13-phase`, `Neo4j Certified`, `AgilePM`, `PRINCE2`, …) outside the register/gate:
  **0** rendered — all matches are comments or the forbidden-list regexes in
  `claimsValidate.js`.
- **Zero-value counters** (`0 audits`, `>0<`): **0** — only Framer `opacity:0`/`y:0`
  animation values and a test mock, none rendered as a proof counter.
- **Forbidden copy** (`scripts/claims-gate.mjs`): passes — 28 cleared claims, register
  valid, no forbidden copy. Blocks a forbidden claim in CI (proven P0-07/P0-12).

## Action taken

No production code changed (nothing was out of compliance). The audit is frozen as an
executable regression guard — `src/components/proof/claimsRender.test.jsx` — asserting
every credibility-surface figure carries a `[data-claim]` hook, no `FORBIDDEN_PATTERNS`
term renders, and no bare zero-value counter appears. 212 tests green; coverage 100%
lines/funcs; lint + claims (28 cleared) + build clean. Nothing pushed/deployed; on `v2`.
