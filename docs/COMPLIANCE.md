# Compliance dispositions — jw3b.dev v2 (P3-09 · NFR-07)

`compliance-officer` · 2026-08-18 · Research basis: `docs/COMPLIANCE_RESEARCH.md` (all 6
`[NEEDS RESEARCH]` items resolved at HIGH confidence). **Status: dispositions ENCODED; one
owner decision open (OD-04 below).**

## Dispositions of the 6 research items

| # | Item | Disposition | Where encoded |
|---|---|---|---|
| 1 | EU AI Act Art. 50 (in force 2 Aug 2026) | COMPLIANT — persistent AI disclosure on the concierge (chat + live voice), recorded runs labelled | `ChatWidget.jsx` (FR-021), regression-tested |
| 2 | Cookie consent (GDPR ePrivacy / POPIA) | NOT REQUIRED while cookieless — banner shipped as flag-off contingency; **RULE: any future non-essential analytics/marketing storage requires flipping `consent` ON first** | `ConsentBanner.jsx` + `consent` flag (P3-03) |
| 3 | Wallet address = personal data (EDPB 02/2025 v2.0) | YES — treated as PII; nothing directly identifying ever written on-chain | privacy notice; escrow design; this file |
| 4 | Consumer/refund duties on paid USDC engagements | B2B scope stated; consumer cooling-off + early-performance waiver clause; terms un-bypassable before ANY paid checkout | `terms.md` + `CheckoutTerms.jsx` gate (P3-04) |
| 5 | DSAR / erasure | 30-day (one-month) response commitment published; runbook below; IP retention fixed (~10-min purge in the rate limiter) | privacy notice; `rateLimit.js` purge |
| 6 | VAT on USDC | VAT attaches to the underlying service; prices fiat-denominated, USDC-settled; invoice in ZAR. **Owner bookkeeping duty, not a site change** (applies if/when VAT-registered) | `terms.md` pricing clause |

## DSAR runbook (POPIA s23/s24 · GDPR Arts. 15/17 — 30 days / one month)

1. Intake: requests arrive at john@agilegypsy.com (published in the privacy notice). Log the
   date — the clock starts on receipt.
2. Verify identity: reply from the address/handle tied to the stored request (or for wallet
   data, a signed message from the wallet in question).
3. Locate: D1 `engagement_requests` (contact + message), `conversations` (opaque ids only),
   XMTP inbox copy (John's device), booking emails. Rate-limit rows self-purge (~10 min) —
   nothing to fetch.
4. Export (access request): `SELECT * FROM engagement_requests WHERE contact LIKE ?` → send as
   a readable copy.
5. Erase (deletion request): `DELETE FROM engagement_requests WHERE id = ?`; delete the XMTP
   thread and any email copies. Confirm to the requester.
6. On-chain data: by design never directly identifying (EDPB-aligned) — state this in the
   response rather than claiming impossible on-chain erasure.
7. Record each request + outcome (date, type, action) in a private log.

## OD-04 — jurisdiction lead · **RATIFIED by John, 2026-08-18**

**Ruling: "comply-with-strictest"** — POPIA as the operator baseline + GDPR/UK-GDPR for
EU/UK visitors; where the regimes differ, the stricter rule is followed. This is what every
shipped surface implements and what the privacy notice states. With this ratification the
six research dispositions above are final and **P3-09 is closed** (NFR-07 finalized).

## Standing rules encoded by this phase

- No non-essential device storage (cookies/analytics/pixels) without flipping `consent` ON.
- No paid checkout reachable without the terms gate (enforced structurally + by test).
- Nothing directly identifying on-chain, ever.
- Every AI surface carries the AI-disclosure line (Art. 50 is now in force).
- New personal-data stores must state retention here and in the privacy notice.
