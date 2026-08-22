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
 * Only three have Cyfrin's official results on disk, so only those three are stated. The remaining
 * five are not claimed here — an unverified contest is worth less than the space it would take.
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
