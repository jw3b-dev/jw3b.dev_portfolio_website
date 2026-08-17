---
name: portfolio-evidence
description: jw3b.dev v2 claims & evidence integrity — every on-page number/credential must trace to a cleared entry in the sealed evidence register, and forbidden/unprovable claims must be unable to render. Use for seeding/auditing `src/data/evidence-register.json`, the claims gate, verifying credentials, or scrubbing forbidden claims (TVL, $-secured, 50+ audits, PMP, PRINCE2 Practitioner, Neo4j GDS). jw3b-retargeted override of the user-scope portfolio-evidence.
---

# Portfolio Evidence — jw3b.dev v2

Project override. Generic charter ("proof not promises", register = single source, verify-
don't-transcribe, forbidden blocklist, no zero-counters, find-don't-fix) at user scope;
pinned to the repo. See the **Claims discipline** section of the project `CLAUDE.md`.

## This project's evidence machinery

- **Register (authoritative, sealed):** `src/data/evidence-register.json` — **28 cleared
  claims** (CR-01…10 + CodeHawks #124 + certs). Each entry: value, evidence type, pointer,
  status. `<Claim id>` (`src/components/Claim.jsx`) renders a value ONLY if its entry is
  `status: 'cleared'`, else the fallback (null). The UI reads the register, never a literal.
- **Gate:** `scripts/claims-gate.mjs` (CI) — asserts 28 cleared, register valid, and **blocks
  forbidden copy**. `FORBIDDEN_PATTERNS` is exported from `src/lib/claimsValidate.js`
  (`isCleared()` is the same gate the concierge KB uses).
- **KB parity:** `scripts/gen-knowledge.mjs` serializes the register into the Worker's
  `knowledge.js`; a drift test keeps the concierge's grounding == the cleared claims.
- **Guard:** `src/components/proof/claimsRender.test.jsx` freezes the "every figure is
  `<Claim>`-routed" invariant.

## The forbidden list (hard — never let these render or the KB assert them)

Aggregate TVL / $-secured / protocols-secured / $50M+ · 50+ audits · **PMP** (the artifact
is an ITU exam-prep course, NOT the PMI credential) · **PRINCE2 Practitioner** (holds
Foundation only) · **Neo4j GDS** cert (no such credential among the verified GraphAcademy
certs) · "decades of combined experience". The citable audit record is **CodeHawks #124 · 17
findings (8 High) · 1,430 EXP**. Studio-origin stats (+18pts, 9,828 entities, 77k chunks,
192,000+, 1,345 tests, memory-miss>2×) carry an "AgileGypsy Labs" owner-attested provenance.

## Do / don't

Verify at source (public record URL / exact credential / attested-with-provenance — a
course-completion ≠ a certification; Foundation ≠ Practitioner). Do NOT invent/round a
number, write marketing copy, or fix the UI — report which figures aren't gated. If nothing
is out of compliance, freeze a regression guard, don't manufacture a diff. Prices come from
`src/data/retainer.json` (BR-12), NOT the register. Log the row in `mas/ROLE_LEDGER.md`.
