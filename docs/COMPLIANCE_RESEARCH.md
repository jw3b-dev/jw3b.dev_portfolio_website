# The 6 `[NEEDS RESEARCH]` compliance answers — research memo (P3-03/04/09 input)

`research-specialist` · 2026-08-18 · **confidence: HIGH overall** (each answer ≥2 source tiers:
official/regulator text + industry legal analysis; currency verified — two governing instruments
changed in the last 6 weeks and are reflected below). Consumed by `compliance-officer` for the
dispositions in `docs/COMPLIANCE.md` and the P3-03/P3-04 builds.

Scope note (OD-04 pending): jw3b.dev is operated from South Africa (POPIA applies to the
operator) by a UK citizen, marketed globally including to EU/UK visitors (GDPR/UK-GDPR apply by
Art. 3(2) targeting; EU AI Act applies to AI output used in the EU). The dispositions below are
therefore written to satisfy the STRICTEST applicable rule so they hold under any OD-04 ruling
("comply-with-strictest" lead — recommended, see the OD-04 brief in `docs/COMPLIANCE.md`).

---

## Q1 — EU AI Act Art. 50 transparency for the AI concierge

**Answer: APPLIES, and is in force NOW.** Art. 50 became applicable/enforceable **2 August
2026** (systems on the market before that date have until 2 Dec 2026 for marking/detection
duties). For a chatbot the duty is: people must be informed they are interacting with AI unless
obvious; AI-generated content must be identifiable. The obligation attaches regardless of
high-risk classification.
**Site status: ALREADY COMPLIANT** — FR-021 ships a persistent "AI-generated · grounded to
John's verified record" disclosure on the concierge (both chat and live-voice modes render it),
and recorded runs are labelled. Voice mode announces itself as an AI concierge in the greeting
persona.
**Disposition:** no new surface needed; keep the disclosure persistent (regression-tested);
note Art. 50 + the 2-Aug-2026 date in `docs/COMPLIANCE.md`.
Sources: [EC digital-strategy FAQ on Art. 50](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act) ·
[EC guidelines on transparency](https://digital-strategy.ec.europa.eu/en/policies/guidelines-transparency-ai-generated-content) ·
[Cooley, 3 Aug 2026](https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026) ·
[artificialintelligenceact.eu practical guide](https://artificialintelligenceact.eu/transparency-rules-article-50/)

## Q2 — GDPR/POPIA cookie-consent for the site's analytics

**Answer: NO CONSENT BANNER REQUIRED for the site as built.** ePrivacy Art. 5(3) (and POPIA's
opt-in model for non-essential trackers) attach to *storing/accessing information on the
user's device*. Verified against the code: the site sets **zero cookies and zero tracking
storage**. The only first-party storage is the `engagementQueue` localStorage offline-retry
queue for the visitor's own submission — squarely "strictly necessary for a service explicitly
requested" (exempt), plus wallet-session storage created only when the visitor connects a
wallet (functional, user-initiated). Server-side D1 analytics store an input *hash*, duration
and an opaque conversation id — no cross-site tracking, no device storage.
**Disposition:** no banner needed **while the site stays cookieless** — this is a *state to
protect*, so: (1) ship `ConsentBanner.jsx` behind the `consent` flag, **default OFF**, as the
ready contingency for any future analytics/marketing pixel; (2) encode "no non-essential
device storage without flipping `consent` ON" as a rule in `docs/COMPLIANCE.md`; (3) privacy
notice already discloses the server-side analytics (P1-20).
Sources: [GDPR.eu on cookies/ePrivacy](https://gdpr.eu/cookies/) ·
[Michalsons — cookie law in South Africa](https://www.michalsons.com/blog/cookie-law-south-africa/15264) ·
[CookieHub POPIA guide](https://www.cookiehub.com/popia) · code audit this repo (grep: no
`document.cookie`, no analytics SDK, one strictly-necessary localStorage queue).

## Q3 — Is a wallet address personal data?

**Answer: YES — treat every wallet address as personal data.** EDPB **Guidelines 02/2025 on
blockchain, final v2.0 adopted 7 July 2026**: wallet addresses/public keys are personal data
wherever a natural person is identifiable (a hiring client's address is linkable to them by
definition); avoid writing personal data on-chain unless strictly necessary; off-chain
personal data follows normal GDPR duties. POPIA's "personal information" definition (unique
identifiers) reaches the same result.
**Site status: aligned** — the site never writes personal data on-chain (escrow holds
addresses+amounts on Base as functionally-necessary transaction data; the CTF is testnet);
off-chain, `engagement_requests` and any stored addresses are covered by the privacy notice.
**Disposition:** record wallet-address-as-PII in `docs/COMPLIANCE.md`; privacy notice already
lists connected-wallet data; DSAR flow (Q5) must cover off-chain wallet records; on-chain
immutability is handled per EDPB by never putting directly-identifying data on-chain.
Sources: [EDPB Guidelines 02/2025 v2.0 (final, Jul 2026)](https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202502_blockchain_v2_en.pdf) ·
[EDPB adoption news](https://www.edpb.europa.eu/news/news/2025/edpb-adopts-guidelines-processing-personal-data-through-blockchains-and-ready_en) ·
[William Fry analysis](https://www.williamfry.com/knowledge/edpb-guidelines-raise-questions-on-how-gdpr-interacts-with-blockchain/)

## Q4 — Consumer-protection / refund duties on paid USDC engagements

**Answer: engagements as sold are B2B professional services — no statutory cooling-off — BUT
the checkout must say so, and a consumer edge-case can exist.** UK: the 14-day distance-selling
cooling-off (CCRs 2013) applies to *consumers*, not businesses; B2B has no automatic
cooling-off. If a natural person outside their trade ever bought (rare for an audit retainer
but possible for a small fixed-price tier), the 14-day right applies unless the service starts
early with express consent + acknowledgment (then pro-rata charging on cancellation). SA CPA:
s16 cooling-off applies to *direct-marketing-solicited* sales (5 business days) — not to
inbound purchases; EU CRD mirrors the UK position (it's the CCRs' source).
**Disposition (P3-04):** `src/content/terms.md` states: business-client scope; payment in USDC
with ZAR/GBP value fixed at invoice; the express-consent-to-begin-early + cooling-off-waiver
acknowledgment for any consumer purchaser; milestone/escrow release = acceptance per milestone;
refunds via escrow refund path. `CheckoutTerms.jsx` requires an explicit terms acknowledgment
**before any paid checkout action is reachable** (escrow AND Unlock branches), gated with the
same rails flags.
Sources: [LegalVision UK — cancellation rights for service providers](https://legalvision.co.uk/commercial-contracts/cancellation-rights-service-provider/) ·
[Sprintlaw — cooling-off periods UK](https://sprintlaw.co.uk/articles/do-all-contracts-have-a-cooling-off-period-in-the-uk/) ·
[Commons Library briefing — distance selling](https://researchbriefings.files.parliament.uk/documents/SN05761/SN05761.pdf)

## Q5 — DSAR / erasure workflow

**Answer: both regimes give access + correction/deletion rights; deadlines differ.** GDPR:
Art. 15/17, respond within **one month** (extendable +2 for complexity). POPIA: s23 access
(via PAIA machinery — **30 days**), s24 correction/destruction "as soon as reasonably
practicable". What the site holds per person: `engagement_requests` (deliberate contact PII),
possible connected-wallet records, XMTP messages (E2E — John's inbox copy), booking emails.
The one-month/30-day clock and a named contact must be in the privacy notice.
**Disposition (P3-09):** encode the DSAR runbook in `docs/COMPLIANCE.md` — intake via the
existing contact email; verify identity; export/delete from D1 (`engagement_requests`,
conversation ids) within 30 days; on-chain data excluded as never-personal by design (Q3);
add the D1 delete queries to the runbook. Retention: **finding fixed this sweep** —
`rate_limits_v2` stored raw IPs indefinitely; stale windows now purged opportunistically
(see `rateLimit.js`); `engagement_requests` retention stated in the privacy notice.
Sources: [POPIA s23](https://popia.co.za/section-23-access-to-personal-information/) ·
[Werksmans — PAIA/POPIA dichotomy](https://www.werksmans.com/legal-updates-and-opinions/the-paia-and-popia-dichotomy-what-information-are-you-requesting/) ·
GDPR Arts. 12(3), 15, 17 (Regulation (EU) 2016/679).

## Q6 — VAT on USDC-denominated services

**Answer: VAT attaches to the UNDERLYING SERVICE, not the crypto.** SA (SARS): supplies *of*
crypto assets are exempt financial services, but a vendor accepting crypto as *payment for
taxable services* must convert to ZAR at the time of payment/invoice (whichever first), issue
the tax invoice in Rand, and charge/remit VAT on the service if VAT-registered (R1m turnover
threshold). UK (HMRC): same structure — the service is taxable normally; the sterling value at
transaction time is the consideration. So: USDC is a settlement rail, not a VAT shelter.
**Disposition:** pricing/terms state amounts as fiat-denominated with USDC settlement at the
prevailing rate; invoice in ZAR (SA operator); VAT line applies only if/when John is
VAT-registered — flag to John as a bookkeeping duty, not a site change. Terms.md carries the
"fiat-denominated, USDC-settled" clause.
Sources: [SARS — crypto assets & tax](https://www.sars.gov.za/individuals/crypto-assets-tax/) ·
[Tax Faculty — crypto compliance](https://taxfaculty.ac.za/events/cryptocurrency-and-taxes-a-guide-to-compliance) ·
[UCT thesis — VAT classification of crypto in SA](https://open.uct.ac.za/items/d17552cf-472f-49b8-84fc-b116b3c22719)

---

## Report contract

- **Remaining flaws / dissenting evidence:** Q2 — a minority reading treats *any* localStorage
  write as consent-triggering; rejected because Art. 5(3)'s strictly-necessary exemption
  explicitly covers service-requested storage (the queue exists only to not lose the visitor's
  own submission), and both ICO and CNIL guidance carve out functional storage. Q4 — "consumer"
  status is fact-specific; mitigated by writing the consumer-case waiver into terms rather than
  assuming pure B2B. Q6 — SARS has not issued a dedicated interpretation note on crypto *as
  consideration*; the ZAR-conversion rule is the practitioner consensus reading of the VAT Act
  + SARS crypto guidance (flagged 💰: several sources are tax-service vendors; cross-checked
  against SARS's own page and an academic source).
- **Information gaps:** OD-04 (which regime *leads* for notices) is an owner decision — the
  dispositions above are strictest-rule-safe under either answer. No CrUX/enforcement data yet
  on Art. 50 penalties (16 days old).
- **Dated sources:** none load-bearing >24 months except statutory texts (stable by nature).
