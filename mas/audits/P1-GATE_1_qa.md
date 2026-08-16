# P1-GATE · Role 1/5 — QA gate (qa-tester)

**Phase:** P1 exit gate · **Verdict: PASS**
**Enforces:** NFR-01 (LCP/first-token), coverage thresholds, requirement traceability.
**Repro:** `npx vitest run --coverage` · `npm run lint` (from `jw3b.dev-v2/`).

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Unit + integration suite | **212 passed / 212**, 31 files, 0 fail | vitest run |
| Coverage (gated include-list) | lines **100** · funcs **100** · branch **92.88** (≥85) · stmts 98.8 (≥90) — thresholds met, no threshold error | vitest --coverage |
| Lint | **0 problems** | eslint flat config |
| Traceability | every `describe` names its FR/NFR/BR/SC id (spot-checked: FR-043/046/047, BR-11/12, SC-1/2, NFR-06/07) | grep of describe blocks |
| NFR-01 LCP element | H1 position line asserted present as the LCP element; static shell prerendered by `heroShellPrerender` (P0-11) | `src/pages/Home.test.jsx` |
| Degrade-path journeys | concierge→degraded, audit→offline heuristics, book-a-call→optimistic offline, 404→floor all have tests | HireSpine/ChatWidget/AuditConsole/RouteGate/BookACall tests |

## Baseline

Prior known-good: 212 tests (P1-22, commit fc56f53). This gate run reproduces 212/212 — **maintained**, not restored.

## Scoped note (documented, not a blocker)

- **Browser E2E (Playwright)**: installed but no `.spec` files — the critical journeys are covered at **integration level** in jsdom (hire spine reachable from every route incl. 404, concierge/audit degrade, Mission Control configurator, book-a-call optimistic offline). True in-browser LCP-number and click-through E2E require a running/deployed target and belong to the **post-deploy smoke test John runs** (the gate's terminal step is "John deploys P1"). Recorded here so it is an explicit deferral, not a false green.

**Verdict: PASS** — no production code touched (gate is read-only).
