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
 *
 * ✎ 2026-08-23 — the owner supplied the #43 and #53 official reports, so six of the eight are now
 * checked. #43 yielded ONE validated finding (L-03). **#53 RebateFi Hook yielded ZERO** — he does
 * not appear in any of its seven submitter lists — and that is recorded deliberately: "checked and
 * found nothing" is a different fact from "not checked", and only one of them means the record is
 * complete. #53 is therefore absent from CONTESTS rather than present with an empty list, so it
 * cannot inflate the contest count in summary().
 *
 * ✎ 2026-08-23 (later the same day) — #48 One Shot: Reloaded came out of judging and the owner
 * supplied its report, closing the last "still in progress" gap. It adds TWO Highs (H-01, H-04),
 * neither selected. Note what the result is NOT: the "My Submissions" list for #48 showed 3H/1M/1L
 * proposed, and the judge validated two Highs and nothing else. That gap between submitted and
 * validated is the whole reason this file reads reports instead of submission lists.
 *
 * ✎ FULLY REPRODUCIBLE as of 2026-08-23. Every supplied report is in the audit tree and
 * `npm run codehawks-scan` re-derives this table from disk: 14 findings across 8 final reports, 1
 * selected. That run confirmed the hand-read above line for line, which is the only reason to
 * trust a table a human transcribed from a chat window.
 *
 * WHAT IS STILL MISSING, EXACTLY. These rows are 7 High, 4 Medium, 3 Low; the public leaderboard
 * says 8/5/4. The residual is therefore precisely one High, one Medium and one Low — one contest's
 * report that is not on disk, not a vague shortfall. Naming the size of the gap is what stops the
 * count from being quietly rounded up later.
 *
 * The superseded #42 report (1 Jul 2025, selected=nomadic_bear) is retired to a
 * `.2025-07-01.superseded` extension rather than deleted. Two `.md` copies of one contest would
 * double-count exactly the way a preliminary beside a final does — and the difference between the
 * two copies IS the evidence that `selected` is not stable, so deleting it would destroy the
 * finding.
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
      // ✎ `selected` corrected 2026-08-23: the report on disk (1 Jul 2025) says nomadic_bear; the
      // version the owner downloaded today says 0xki. Cyfrin re-issued it and the selected
      // submission changed. No effect on what may be published — it was never his — but it means
      // `selected` is NOT stable over time, so a stale copy can silently misattribute authorship.
      { id: 'H-01', severity: 'High', title: 'Unrestricted NFT Minting in Snowman.sol', selected: '0xki' },
      { id: 'M-01', severity: 'Medium', title: 'DoS to a user trying to claim a Snowman', selected: 'robercano' },
    ],
  },
  {
    flight: 43,
    name: 'OrderBook',
    slug: '2025-07-orderbook',
    ended: 'Jul 2025',
    findings: [
      { id: 'L-03', severity: 'Low', title: 'Missing event indexing degrades dApp integration', selected: 'blee' },
    ],
  },
  {
    flight: 48,
    name: 'One Shot: Reloaded',
    slug: '2025-09-one-shot-reloaded',
    ended: 'Sep 2025',
    findings: [
      // H-01 was reported by twenty researchers; H-04 by two. Credit is credit either way — the
      // count says the finding was real, never that it was rare.
      { id: 'H-01', severity: 'High', title: 'Challenger can exploit the pseudo-randomness of go_on_stage_or_battle()', selected: 'crazycelery' },
      { id: 'H-04', severity: 'High', title: 'Battle arena DoS via non-rapper NFT token injection', selected: '0xrektified' },
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
