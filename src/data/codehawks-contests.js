/*
 * jw3b.dev v2 — CodeHawks validated findings, read from the official contest reports.
 *
 * WHY THIS FILE EXISTS. The site's audit record was a single aggregate — "#124 · 17 findings" —
 * whose only public receipt broke (see mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md: the Cyfrin
 * profile now reads "Unranked · High 0 Med 0 Low 0" to a logged-out visitor). A rank is a number a
 * reader has to trust. A NAMED finding in a NAMED contest is something they can go and read.
 *
 * PROVENANCE. Every row below was extracted from Cyfrin's own published contest report, by
 * checking whether `agilegypsy` appears in that finding's "_Submitted by …_" list. Nothing here is
 * transcribed from memory or from a CV.
 *
 * THE WORD IS "SUBMITTED", AND IT IS LOAD-BEARING. Each CodeHawks finding is credited to every
 * researcher who validly reported it, and Cyfrin then publishes ONE researcher's write-up as the
 * "Selected submission". `selected` records who that was — it is never John for these, and the UI
 * must never imply otherwise. mas/facts/PORTFOLIO_REFERENCE.md §1b had to be corrected for exactly
 * that error, which nearly put two other researchers' work on this site under John's name.
 *
 * COVERAGE IS PARTIAL, DELIBERATELY. John entered at least eight First Flights (#42, #43, #48–#53).
 * FIVE have Cyfrin's official results on disk; only those five are stated. #43, #48 and #53 hold
 * only his own tooling's output and are not claimed — an unverified contest is worth less than the
 * space it would take.
 *
 * ✎ Two of the five were nearly missed. A first pass searched filenames for "result", "report" and
 * "findings" and turned up three; the reports for #50 and #51 are named after the contest and sit
 * at the directory root. Searching for the CONTENT signature — the string "Selected submission by"
 * — found all five at once. Look for what a document IS, not for what someone named it.
 *
 * ✎ Use FINAL results, never preliminary. Bid Beasts has both: the preliminary report credits
 * agilegypsy on NOTHING, the final on two findings. Reading the wrong file would have silently
 * understated the record.
 */

/** @typedef {{id:string, severity:'High'|'Medium'|'Low', title:string, selected:string}} Finding */

export const CONTESTS = Object.freeze([
  {
    flight: 42,
    name: 'Snowman Merkle Airdrop',
    slug: '2025-06-snowman-merkle-airdrop',
    ended: 'Jun 2025',
    findings: [
      { id: 'H-01', severity: 'High', title: 'Unrestricted NFT Minting in Snowman.sol', selected: 'nomadic_bear' },
      { id: 'M-01', severity: 'Medium', title: 'DoS to a user trying to claim a Snowman', selected: 'robercano' },
    ],
  },
  {
    flight: 49,
    name: 'Bid Beasts',
    slug: '2025-09-bid-beasts',
    ended: 'Sep 2025',
    findings: [
      { id: 'H-01', severity: 'High', title: 'Critical unauthorized withdrawal in withdrawAllFailedCredits()', selected: 'objectplayer' },
      { id: 'L-01', severity: 'Low', title: 'Wrong event emission misleads off-chain systems', selected: 'pxlvre' },
    ],
  },
  {
    flight: 50,
    name: 'Raisebox Faucet',
    slug: '2025-10-raisebox-faucet',
    ended: 'Oct 2025',
    findings: [
      { id: 'H-03', severity: 'High', title: 'Reentrancy in claimFaucetTokens allows double token claims', selected: '0xrafikaji' },
      { id: 'M-01', severity: 'Medium', title: 'burnFaucetTokens() transfers the entire balance instead of the specified amount', selected: 'boobagreen' },
      // THE one. Cyfrin chose John's write-up as the published version of this finding, from 24
      // researchers who reported it. Severity is Cyfrin's (Low) — he submitted it as M-01 and they
      // filed it as L-01; the register renders the judge's call, not the submitter's.
      { id: 'L-01', severity: 'Low', title: 'Incorrect comparison operator in claimFaucetTokens prevents valid claims', selected: 'agilegypsy' },
    ],
  },
  {
    flight: 51,
    name: 'Company Simulator',
    slug: '2025-10-company-simulator',
    ended: 'Oct 2025',
    findings: [
      { id: 'H-02', severity: 'High', title: 'Deposit slips caused investor funds to be accepted without minting shares', selected: 'galer ah' },
    ],
  },
  {
    flight: 52,
    name: 'BriVault',
    slug: '2025-11-brivault',
    ended: 'Nov 2025',
    findings: [
      { id: 'H-01', severity: 'High', title: 'Repeat joinEvent calls inflate totalWinnerShares', selected: 'wojack0x0' },
      { id: 'M-01', severity: 'Medium', title: 'cancelParticipation() leaves ghost state, inflating totalWinnerShares', selected: 'calvinkimani' },
      { id: 'M-02', severity: 'Medium', title: 'joinEvent cannot prevent DoS from excessive participants', selected: 'minos' },
    ],
  },
])

/** Flat list of every validated finding, contest attached. */
export const VALIDATED = Object.freeze(
  CONTESTS.flatMap((c) => c.findings.map((f) => ({ ...f, flight: c.flight, contest: c.name }))),
)

/**
 * The findings Cyfrin published in JOHN'S words. Being credited as a validated submitter means the
 * finding was real; being SELECTED means his write-up was chosen as the canonical one. Those are
 * different claims and the site must not blur them — which is why this is a separate function and
 * a separate register entry rather than a footnote on the count.
 */
export function selectedByJohn(findings = VALIDATED) {
  return findings.filter((f) => f.selected === 'agilegypsy')
}

/** Counts by severity — derived, never typed, so the claim string cannot drift from the rows. */
export function severityTally(findings = VALIDATED) {
  return findings.reduce((acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] || 0) + 1 }), {})
}

/** The one-line summary the register's claim value must match. */
export function summary(findings = VALIDATED, contests = CONTESTS) {
  const t = severityTally(findings)
  const parts = ['High', 'Medium', 'Low'].filter((s) => t[s]).map((s) => `${t[s]} ${s}`)
  return `${findings.length} validated findings across ${contests.length} First Flights — ${parts.join(', ')}`
}
