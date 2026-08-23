#!/usr/bin/env node
/*
 * codehawks-scan — find every VALIDATED finding in official CodeHawks reports.
 *
 * WHY IT EXISTS. Three ranks of evidence get confused constantly, including by the owner's own
 * reference document, and only the third is publishable prose:
 *
 *   SUBMITTED  — what you wrote and sent. Your severity is a PROPOSAL. Not evidence of anything
 *                but effort; the CodeHawks "My Submissions" list is this.
 *   VALIDATED  — a judge accepted it. You appear in that finding's "_Submitted by …_" set, at the
 *                JUDGE'S severity. On First Flight #50 a finding filed as M-01 was published as
 *                L-01: severity moves, and usually downward.
 *   SELECTED   — Cyfrin published YOUR write-up as the canonical version. Only then is the prose
 *                yours to republish (src/lib/findingArtifacts.js enforces this).
 *
 * The scan reads only official reports — identified by the CONTENT signature "Selected submission
 * by", never by filename, because two of five reports were nearly missed by a filename search.
 *
 * WHERE THE REPORTS COME FROM — investigated 2026-08-23 so nobody repeats it:
 *
 *   github.com/orgs/CodeHawks-Contests   Contest SOURCE only. Checked all 39 repos: each holds the
 *                                        codebase under audit plus a README, no findings report,
 *                                        no report branch, zero releases. Not a source of results.
 *   /c/<slug>/results?t=report           LOGIN-GATED. Renders 2.3KB of nav and contest blurb to a
 *                                        logged-out visitor; the only API call is
 *                                        competitions.getContestReadme, which returns the contest
 *                                        README, not the report.
 *   trpc/leaderboard.getLeaderboard      PUBLIC, and already wired up (src/lib/codehawksLive.js).
 *                                        Gives per-researcher xp and H/M/L TOTALS. A contestId
 *                                        param is accepted and silently ignored — no per-contest
 *                                        public cut exists.
 *
 * So the headline numbers need no download at all: the live leaderboard already carries them
 * (17 = 8H + 5M + 4L, confirmed against the owner's authenticated profile). What the reports add
 * is the NAMED findings and the "Selected submission by" attribution — the two things that decide
 * what may be republished. Those still require the owner to download them while signed in.
 *
 * Usage:
 *   node scripts/codehawks-scan.mjs [rootDir] [--handle agilegypsy]
 *
 * Drop a newly downloaded report anywhere under the tree and re-run: it prints the tally and a
 * ready-to-paste block for src/data/codehawks-contests.js.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const args = process.argv.slice(2)
const handleFlag = args.indexOf('--handle')
const HANDLE = handleFlag >= 0 ? args[handleFlag + 1] : 'agilegypsy'
const ROOT = args.find((a) => !a.startsWith('--') && a !== HANDLE) || '/home/agilegypsy/code/projects/audit'

const SIGNATURE = 'Selected submission by'

function* walk(dir) {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.git')) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) yield* walk(p)
    else if (extname(p).toLowerCase() === '.md' && st.size < 5_000_000) yield p
  }
}

const reports = []
for (const file of walk(ROOT)) {
  let text
  try { text = readFileSync(file, 'utf8') } catch { continue }
  if (text.includes(SIGNATURE)) reports.push({ file, text })
}

if (!reports.length) {
  console.log(`No official CodeHawks reports found under ${ROOT}.`)
  console.log('An official report contains the string "Selected submission by".')
  process.exit(0)
}

const rows = []
for (const { file, text } of reports) {
  // A contest with BOTH a preliminary and a final report: the preliminary is not authoritative.
  // On Bid Beasts the preliminary credits this handle on NOTHING and the final on two findings.
  const preliminary = /prelim/i.test(file)
  const findings = []
  for (const sec of text.split(/\n(?=#+ *<a id=)/)) {
    const head = /^#+.*?([HML]-\d+\.?\s*[^<\n]*)$/m.exec(sec)
    const sub = /_Submitted by (.+?)\. Selected submission by: \[([^\]]+)\]/s.exec(sec)
    if (!sub) continue
    if (!sub[1].includes(HANDLE)) continue
    const raw = (head ? head[0] : '?').replace(/<a id=.*?<\/a>/g, '').replace(/^#+\s*/, '').trim()
    const id = (/^([HML]-\d+)/.exec(raw) || [])[1] || '?'
    findings.push({
      id,
      severity: { H: 'High', M: 'Medium', L: 'Low' }[id[0]] || '?',
      title: raw.replace(/^[HML]-\d+\.?\s*/, '').replace(/\s+$/, ''),
      selected: sub[2],
      mine: sub[2] === HANDLE,
    })
  }
  rows.push({ file, preliminary, findings })
}

let total = 0
let selected = 0
for (const r of rows.sort((a, b) => Number(a.preliminary) - Number(b.preliminary))) {
  const tag = r.preliminary ? '  [PRELIMINARY — not authoritative]' : ''
  console.log(`\n${basename(r.file)}${tag}\n  ${r.file}`)
  if (!r.findings.length) {
    console.log(`  (${HANDLE} credited on nothing)`)
    continue
  }
  for (const f of r.findings) {
    console.log(`  ${f.mine ? '★' : '·'} ${f.id.padEnd(5)} ${f.severity.padEnd(7)} ${f.title}`)
    if (!r.preliminary) { total += 1; if (f.mine) selected += 1 }
  }
  if (r.preliminary) console.log('  (excluded from the tally — use the FINAL report)')
}

console.log(`\n── ${total} validated finding(s) across ${rows.filter((r) => !r.preliminary).length} final report(s)`)
console.log(`   ${selected} with the write-up SELECTED for publication (★ — only these may be republished)`)
console.log('\nAny finding above that is NOT in src/data/codehawks-contests.js is unclaimed on the site.')
