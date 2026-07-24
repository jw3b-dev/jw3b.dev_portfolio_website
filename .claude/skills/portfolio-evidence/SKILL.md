---
name: portfolio-evidence
description: What jw3b.dev may claim and must not claim — the verified evidence register (docs/PORTFOLIO_REFERENCE.md) governing every number, credential, metric, and boast on the site. Use whenever work touches site copy, a stat counter, a credential list, a case-study claim, a CV/resume file, an audit-record number, or hero/About/Services text — even when the request looks like pure UI styling, because a counter value and a badge label ARE claims. Use it before writing any number the site presents as fact.
---

You hold the line between what jw3b.dev *says* and what John can *prove*. The site sells trust
(security auditing, delivery discipline) — one inflated number costs more credibility than ten
missing features. The evidence hierarchy is counter-intuitive: the impressive-sounding claim is
usually the unsupportable one, and the mundane-sounding verified fact is the one that sells.

## The register is the source of truth

`docs/PORTFOLIO_REFERENCE.md` (handoff 2026-07-24; master register in
`~/code/projects/agilegypsy-website/docs/venture-inventory.md`). Every item there was verified
against a real artifact. **Anything not listed is not cleared for publication.** When copy and
register disagree, the register wins; when the register is silent, the claim waits.

## The claims that are TRUE and citable (use these)

- **CodeHawks/Cyfrin record: rank #124 · 17 findings (8 High / 5 Medium / 4 Low) · 1,430 EXP**
  (Jan 2026, rising trend) — profile `agilegypsy` at codehawks.cyfrin.io. A full written contest
  report is on file (First Flight #42, H-01 + M-01) and is publishable as a sample audit.
- **20+ industrial water/wastewater plants delivered across 7 countries** (HK, Saudi, Botswana,
  Seychelles, Uganda, Mauritius, SA) over ~2 decades — the site's strongest, most under-used asset.
- **Verified credentials with IDs**: AgilePM v2 Practitioner + Foundation, PRINCE2 *Foundation*,
  APM PFQ, ClickUp ×3, five Cyfrin certs, Chainlink Fundamentals, Dapp University Bootcamp 2.0.
- Press: *"Featured in the July/August 2015 Water & Sanitation Africa panel discussion"* — exactly
  that phrasing; not "published author".
- Shipped products: KTHULHU, Kointel, Art of Zeta, MB-agentic, AgileCEO, AgileGypsy Labs/Audits.

## The claims that are FALSE or unsupported (kill on sight)

- **The AuditStats counters** (`src/components/AuditStats.jsx`): `50,000+ lines audited · 25+
  protocols secured · 100M+ TVL` — no artifact supports any of them. Replace with the real record
  above; neither zeros nor inflation.
- **Aggregate TVL secured, dollar bounties, "50+ audits", "$50M+ secured"** — never.
- **"PRINCE2 Practitioner"** (Foundation only) · **"PMP certified"** (it's a 2014 ITU Online *prep
  course*; safe copy is "PMP exam-preparation course (ITU Online, 2014)") · Neo4j Certified · ABC
  Business Agility — no artifacts.
- **KTHULHU case-study specifics**: Halmos (disabled in repo), TridentSVM / 12,000 tx/s (zero code
  refs), Fly.io (superseded).
- The seven empty audit-platform links (Sherlock, Cantina, Immunefi, HackerOne, HackenProof,
  AuditOne, Hats) — keep only CodeHawks/Cyfrin + Code4rena, the two with real records.
- Skill %-bars ("Solidity 33%") — they undersell a ranked auditor; replace with artifacts.

## NEVER publish (hard privacy line)

SA ID number / ID scans · DOB · OU/HESA personal identifiers · UK home address · Student Finance
reference · personal mobile · the `bets` repo (`evasion.py`) · DecentX by name (anonymise as "a
decentralised creator-economy platform" if its tokenomics work is ever needed). Specifics live in
the gitignored register, not here. Open question: SA-vs-UK location line is unresolved — flag it,
don't guess it.

## How to apply

Before shipping copy: name the artifact behind each number ("register §1b" beats "sounds right").
If a claim has no artifact, either cut it or rewrite to the verifiable adjacent fact — "ranked
#124 with 8 High findings" is stronger than a fabricated TVL anyway. The honest framing that sells:
lead with delivery credibility (plants, 7 countries, AgilePM), present Web3 as the current chapter
with a real scoreboard. `public/resume.pdf` carries several unsupported metrics — rewriting or
unpublishing it is in scope whenever the counters are fixed.
