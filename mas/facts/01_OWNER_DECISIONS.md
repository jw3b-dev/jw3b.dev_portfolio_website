# jw3b.dev v2 — OWNER DECISIONS (John, 2026-08-16)

**Authoritative & binding.** These resolve the `[REQUIRES JOHN]` / `[REQUIRES_RESOLUTION]` opens
raised in `mas/business_analysis/03` & `05`. **Where this file and the BA docs disagree, THIS FILE
WINS** — the BA docs were written before these rulings; Phase 2 (requirements-architect) folds these
in when it consolidates `REQUIREMENTS.md`. Every downstream role reads this alongside `00_FACTS_BRIEF.md`.

---

## OD-01 — The flagship systems → **RESOLVED — UPDATED to FOUR (+Kointel, 2026-08-16)**
The site features **exactly these four, shown operably** (not screenshots). *(John added Kointel as a
4th — "kointel flagship too". This relaxes OBJ-04 / K4.1 **"exactly 3" → "exactly 4"**; spirit intact
= a curated few deep systems, not a 20-project wall. requirements-architect updates that KPI in Phase 2.)*
1. **KTHULHU** (kthulhu.co) — autonomous smart-contract auditor; nothing reaches a report until an
   agent reproduces it as an executable exploit on an ephemeral Anvil fork. Live, paying users. *(Auditor + AI + Founder)*
2. **The live on-site AI** — the concierge + `/audit` console + on-chain CTF running **on this site**,
   treated as ONE self-demonstrating system. This is the purest expression of proof-as-interface:
   the visitor operates it directly. *(AI + Engineer)*
3. **Overmind GenAI Engine** — the 13-phase graph-validated pipeline beneath the products; the
   "systems are graphs, verification is a first-class step" thesis made concrete. **Overmind IS
   cleared to appear on jw3b.dev** (this ruling resolves that half of OD-01). *(Engineer + AI)*
4. **Kointel** (kointel.co.za) — a shipped compliance-first product: a build-failing CI gate that bans
   tx-signing from Web3 modules; carries an EU AI Act dossier. Reinforces the Auditor/compliance +
   Founder dimensions with a live, external, verifiable URL. *(Engineer + Auditor + Founder)*

Consequences:
- **DevGuild, EcoGraph, Art of Zeta are NOT flagships.** They may appear as supporting
  proof/case-mentions, but the four operable headliners are fixed above. (EcoGraph's metrics still
  surface — see OD-05 — but EcoGraph itself is not a headlined system.)
- The **delivery record** (20+ plants / 7 countries / AgilePM) remains the **separate PM seniority
  anchor** (FR-060), not one of the four slots.
- Four-hat identity still shown together; the four flagships cover Auditor/Engineer/Founder + AI,
  PM via the delivery anchor.

## OD-05 / CR-01…10 — Stat claims → **RESOLVED: CLEAR ALL IN**
John attests all ten are his real numbers → **all move INTO jw3b's own evidence register** and may
ship as fact. Implementation guard (keeps "proof, not promises" honest — a claim still needs a source):
- **Every cleared stat gets an evidence entry** in the v2 register (the PORTFOLIO_REFERENCE successor)
  with a pointer to where it's evidenced (repo, product page, dashboard, or "owner-attested, <system>").
- The **studio-origin figures** — GraphRAG **+18pts** (CR-01), **9,828 entities** (CR-02), **77k
  chunks** (CR-03), **memory-miss >2×** (CR-09), and any **EcoGraph**-derived number — carry an honest
  **provenance note ("AgileGypsy Labs / EcoGraph")**. John owns AgileGypsy Labs, so these are his to
  claim; the note keeps attribution truthful rather than implying they came from a different jw3b system.
- The rest (**192K corpus**, **1,345 tests/100%/2,468 lines**, **13-phase/51 modules**, **112+ PRs**,
  **"paying users"**, **Neo4j Certified Professional**) attach to their systems (Overmind / KTHULHU / cert).
- **Net effect on the claims-gate (BR-01/FR-043/047):** these stats now PASS the gate once their
  register entries + evidence pointers exist. Build task: **seed the v2 evidence register** with all 10
  + links before any surface renders them. Forbidden-claims list is UNCHANGED (still no TVL / $ secured
  / protocols-secured / "50+ audits" / PMP / PRINCE2-Practitioner).
- **CR-10 RESOLVED (2026-08-16):** John **holds the Neo4j Certified Professional** credential → ships;
  use its **verifiable credential URL** as the evidence pointer when seeding the register (P0).

## OD-03 — Mission Control checkout posture → **RESOLVED: ALL THREE RAILS, book-a-call PRIMARY**
Build **all three** terminal actions — **book-a-call · on-chain escrow · Unlock** — with **book-a-call
as the guaranteed, prioritized, default path**:
- **Book-a-call is the floor:** always completes, captures the lead server-side, and **never depends**
  on any on-chain primitive. It is the emphasized/default terminal action.
- **Escrow + Unlock are fully built and wired**, but **feature-flagged on provisioning**: they light up
  when John supplies **real Unlock lock addresses** and **deploys/funds the escrow contract**. Until
  then they degrade to book-a-call (no dead-ends, per BR-03/BR-11). *(This supersedes the BA's
  "book-a-call floor + flagged rails" framing only in emphasis — all three are in scope to build now.)*
- **Provisioning John still owes** (tracked): real Unlock lock addresses (replace `0x…` in
  `contracts.js`/`retainer.json`), escrow deployment + funding posture, book-a-call scheduler endpoint.

## OD-02 — XMTP → **RESOLVED: BUILD NOW**
Real E2E encrypted messaging is **in scope for this rebuild** (the retainer "Priority Support in XMTP"
perk becomes real). **Use `@xmtp/browser-sdk`** (the current MLS-based successor) — **NOT** the
deprecated `@xmtp/xmtp-js` (7.x pinned / 13.x deprecated). Treat as a **first-class feature build +
migration**, not a version bump. PM: log as a sizable scope item with its own risk (new SDK, MLS
identity/inbox model, wallet-signature onboarding).

## OD-04 — Jurisdiction (UK vs SA) → **DEFERRED (not design-blocking)**
Surfaced to John at the **compliance phase** (drives which privacy/consumer-law the legal surfaces
cite). John is a UK citizen resident in Benoni, SA (POPIA Information Officer). Still tracked; blocks
no design/build work now.

## `[NEEDS RESEARCH]` compliance items → **DEFERRED to research/compliance roles**
EU AI Act Art. 50 scope · GDPR/POPIA cookie-consent for D1 analytics · wallet-address-as-PII ·
consumer-protection/refund on on-chain checkout · DSAR/erasure mechanism · VAT/invoicing on USDC.
The **clear surfaces ship regardless**: AI disclosure, testnet honesty, privacy notice, audit disclaimer.

## OD-06 — `/audit` edge-RAG → RESOLVED: RE-ADD via Cloudflare Vectorize (2026-08-16; amends SDD ADR-06 / D-08)
The SDD dropped Neon pgvector RAG entirely. John's ruling refines that:
- **Concierge stays on the curated cleared-claims KB** (structural claims-safety — unchanged).
- **`/audit` is grounded in a real vulnerability corpus via Cloudflare Vectorize** (on-stack; **NOT** Neon)
  so **jw3b itself demonstrates "RAG at the edge"** — one of the four shipped AI capabilities + the
  proof-as-interface thesis. This **activates the reserved D-08 path** and **amends ADR-06**.
- **Scope:** add **Vectorize** to the stack; seed a vuln corpus + a retrieval-safety guard; the audit
  *narrative* still must not surface an ungoverned *portfolio* stat (claims-gate framing stays on output).
  Mostly **P2** (deeper `/audit` grounding) — MVP `/audit` may ship heuristics+narrative first, with the
  Vectorize grounding layered in at P2. Neon stays dropped (off-stack); Vectorize is the on-stack replacement.

---

## Downstream scope deltas (for Phase 1.5 PM → charter/risk/roadmap)
- **+ XMTP E2E build** (`@xmtp/browser-sdk`) — new feature + migration; own risk line.
- **+ Escrow + Unlock built now** (all-3 rails) — depends on **provisioning** (Unlock addresses,
  escrow deploy); provisioning-availability is a scheduling risk → book-a-call floor de-risks launch.
- **+ Evidence-register seeding** (10 cleared stats + evidence pointers + studio provenance notes) —
  a build task and a claim-attribution risk line.
- **Flagships fixed** at KTHULHU · on-site AI · Overmind · **Kointel** (4) — removes the "which systems" ambiguity from design.
- **Still-open (non-blocking):** OD-04 jurisdiction; the 6 `[NEEDS RESEARCH]` compliance questions.
