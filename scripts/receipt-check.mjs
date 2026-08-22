#!/usr/bin/env node
/*
 * receipt-check — does a clickable receipt actually EVIDENCE its claim?
 *
 * `claims-gate` proves a rendered figure matches the register. `claims-lock` proves the register
 * has not drifted. Neither can tell you that the URL a claim cites shows the claim — and on
 * 2026-08-23 that gap was live: three CodeHawks claims linked a Cyfrin profile reading
 * "Ranking: Unranked · Total Findings High 0 Med 0 Low 0", and four KTHULHU ledger figures linked
 * a marketing homepage that displays none of them. Eight receipts, all returning HTTP 200, none
 * evidencing anything. A 200 is not a receipt.
 *
 * The register's own contract (claimsRegister.js evidenceKind) is what makes this load-bearing:
 * an http(s) pointer renders a "View the receipt" link, and the doc comment promises it is
 * "a URL the reader can open and check".
 *
 * TWO MODES, on purpose:
 *
 *   default (offline, deterministic, CI-blocking)
 *     Every verified-tier claim MUST have an entry in EXPECTATIONS declaring the text its page has
 *     to contain. Adding a URL pointer without one FAILS — so "is this really checkable?" gets
 *     answered when the pointer is written, not a month later by a visitor.
 *
 *   --net (fetches, renders, asserts)
 *     Loads each URL in a real browser (these are SPAs; curl sees an empty shell) and asserts the
 *     expected text is present. Not in the blocking path: a third party's outage is not our
 *     regression. Run it before a release and whenever a receipt is added.
 *
 * Usage:  node scripts/receipt-check.mjs [--net]
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const register = JSON.parse(readFileSync(resolve(root, 'src/data/evidence-register.json'), 'utf8'))

/**
 * What each receipt must show. Keyed by claim id.
 *   `mustContain` — every string must appear in the rendered page text (case-insensitive).
 * An empty array is not allowed: a receipt that need show nothing is not a receipt.
 */
const EXPECTATIONS = {
  // The product is plainly live at its own origin: the page states it, and sells it.
  // NOTE the deliberate scope — this receipt evidences "live", and the "paying users" half rests on
  // the owner's attestation. That is why the four NUMERIC KTHULHU claims are attested, not linked.
  'kthulhu-paying-users': { mustContain: ['KTHULHU', 'Pricing'] },

  // GraphAcademy certificates render the course title and the holder's name.
  'neo4j-certified-professional': { mustContain: ['Neo4j Certified Professional', 'Wellard'] },
  'neo4j-genai-certification': { mustContain: ['Wellard'] },
  'neo4j-genai-fundamentals': { mustContain: ['Wellard'] },
  'neo4j-fundamentals': { mustContain: ['Neo4j Fundamentals', 'Wellard'] },
  'cypher-fundamentals': { mustContain: ['Cypher Fundamentals', 'Wellard'] },
  'neo4j-mcp-tools': { mustContain: ['Wellard'] },
}

const claims = []
;(function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk)
  if (o && typeof o === 'object') {
    if (o.id && o.value && o.status) claims.push(o)
    Object.values(o).forEach(walk)
  }
})(register)

const isUrl = (p) => typeof p === 'string' && /^https?:\/\//i.test(p.trim())
const linked = claims.filter((c) => c.status === 'cleared' && isUrl(c.evidence_pointer))

const problems = []

// ── Mode 1: structural ───────────────────────────────────────────────────────
for (const c of linked) {
  const e = EXPECTATIONS[c.id]
  if (!e) {
    problems.push(
      `${c.id}: cites ${c.evidence_pointer} as a clickable receipt but declares nothing it must show.\n` +
      `    Add an EXPECTATIONS entry, or make the pointer attested prose if the page cannot show the claim.`,
    )
  } else if (!Array.isArray(e.mustContain) || e.mustContain.length === 0) {
    problems.push(`${c.id}: EXPECTATIONS entry is empty — a receipt that shows nothing is not a receipt.`)
  }
}
for (const id of Object.keys(EXPECTATIONS)) {
  if (!linked.some((c) => c.id === id)) {
    problems.push(`${id}: has an EXPECTATIONS entry but is no longer a cleared URL-backed claim — remove it.`)
  }
}

if (problems.length) {
  console.error('✗ receipt check (structure):\n' + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log(`✓ receipt check (structure): ${linked.length} linked receipt(s), each declaring what it must show.`)

// ── Mode 2: network ──────────────────────────────────────────────────────────
if (!process.argv.includes('--net')) {
  console.log('  (run with --net to actually fetch and verify each receipt)')
  process.exit(0)
}

const { chromium } = await import('playwright')
const browser = await chromium.launch()
const failures = []

for (const c of linked) {
  const page = await browser.newPage()
  let text = ''
  try {
    const res = await page.goto(c.evidence_pointer, { waitUntil: 'networkidle', timeout: 45000 })
    if (!res || !res.ok()) throw new Error(`HTTP ${res ? res.status() : 'no response'}`)
    await page.waitForTimeout(2500)
    text = (await page.innerText('body')).replace(/\s+/g, ' ')
  } catch (err) {
    failures.push(`${c.id}: ${c.evidence_pointer} — ${err.message.split('\n')[0]}`)
    await page.close()
    continue
  }
  const missing = EXPECTATIONS[c.id].mustContain.filter(
    (n) => !text.toLowerCase().includes(n.toLowerCase()),
  )
  if (missing.length) {
    failures.push(
      `${c.id}: ${c.evidence_pointer} loaded (${text.length} chars) but does not show ${missing.map((m) => `"${m}"`).join(', ')}\n` +
      `    The claim reads "${c.value}". A reader clicking through would not find it.`,
    )
  } else {
    console.log(`  ✓ ${c.id} — receipt shows its claim`)
  }
  await page.close()
}
await browser.close()

if (failures.length) {
  console.error(`\n✗ receipt check (network): ${failures.length} receipt(s) do not evidence their claim:\n` +
    failures.map((f) => `  - ${f}`).join('\n'))
  process.exit(1)
}
console.log(`\n✓ receipt check (network): all ${linked.length} receipts show their claims.`)
