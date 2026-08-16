# P1-GATE · Role 4/5 — Compliance gate (compliance-officer)

**Phase:** P1 exit gate · **Verdict: CONDITIONAL** → (see remediation addendum) · **1× P1**.
**Active regimes (scope check):** GDPR/UK-GDPR (EU/UK visitors) · POPIA (SA, John's base) · EU AI Act transparency (chatbot + AI audit output). PCI/HIPAA N/A (no card/health data; USDC on-chain, no card capture).

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| **AI disclosure** (FR-021, AI Act §52 transparency) | **PASS** | ChatWidget persistent header: "AI-generated · grounded to John's verified record"; toggle labelled "AI"; `aria-label="AI concierge"` |
| **AI audit disclaimer** (FR-014) | **PASS** | `AUDIT_DISCLAIMER` rendered with every finding set: *"Automated AI-assisted first-pass screen… not a substitute for a full manual audit"*; findings labelled "Heuristic pass"; "REPRODUCED" reserved for recorded runs. Verbatim worker parity (BR-10, drift test) |
| **Language policing** | **PASS** | claims-gate: 28 cleared, **no forbidden copy**; forbidden determinism/credential terms (TVL, $ secured, 50+ audits, PMP, PRINCE2 Practitioner, Neo4j GDS, "decades combined") blocked in CI |
| **Data handling — content** | **PASS** | `privacy.md` covers purpose (§contact), retention (§Retention), rights — access/correct/delete via john@agilegypsy.com (§Your choices), contact (§Contact); wallet disclosed as public on-chain identifier |
| **Data handling — legal basis** | **PASS** | email/wallet collected on the visitor's own request to be contacted → contract/legitimate-interest basis; **no consent checkbox required** (flagging one would be a false positive). PII stored via parameterized D1; not logged in plaintext (security-confirmed) |
| **Privacy notice reachability** | **FAIL → P1** | see finding |

## Finding — P1 (must fix or risk-accept before deploy)

**PRIVACY-01 · Privacy notice unreachable from collection points.** The `/privacy` route renders complete content, but **no footer and no `/privacy` link exist anywhere in the rendered UI** (grep: 0 `<footer>`, 0 `to="/privacy"`; `HireSpine.jsx:12` even says "Privacy lives in the page footer" — but no footer component exists). GDPR Art.13 / POPIA §18 require the notice be **reachable from every point PII is collected**. The three collection surfaces — book-a-call form (`BookACall.jsx`: email + wallet), concierge chat (messages → D1), audit console (source → `audit_runs`) — offer no path to it. Binary reachability check → **FAIL**.
**Owner:** frontend-engineer / lead-architect (add a global footer with a privacy link in `RootLayout`, present on every route incl. the collection surfaces). Not fixed by compliance (independence).

**Verdict: CONDITIONAL** — all gates pass except privacy reachability (P1). No clearance until PRIVACY-01 is remediated or formally risk-accepted.

---

## Remediation addendum
See `P1-GATE_4b_compliance-reverify.md` — PRIVACY-01 fixed in-role (frontend-engineer) and re-verified.
