#!/usr/bin/env node
/*
 * jw3b.dev v2 — BRIEF GATE (CI).
 *
 * Root cause 5 in `mas/audits/POSTMORTEM_CONCEPT_SHIP.md`: no standing role ever re-asked
 * *"what job does the visitor finish?"*, so depth arrived only when the owner personally demanded
 * it. The rerun answered that with a rule in CLAUDE.md — every brief carries a product-owner pass.
 *
 * R4's own falsification check then found the rule was documented and NOT ENFORCED: zero of ten
 * briefs carried the section, and nothing failed. A rule with no gate is the same shape as the
 * defect it was written to prevent, so this is the gate.
 *
 * It checks STRUCTURE, not quality — no script can tell a real next-need from a plausible one.
 * What it can do is make the omission impossible to ship silently, which is the failure mode that
 * actually occurred.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BRIEFS = join(ROOT, 'design/briefs')

const MIN_NEXT_NEEDS = 3
const errors = []

/** The section every brief must carry, and what must be inside it. */
function checkBrief(path) {
  const rel = relative(ROOT, path)
  const src = readFileSync(path, 'utf8')

  const heading = /^##+\s*Product owner\b/im
  if (!heading.test(src)) {
    errors.push(`${rel}: no "## Product owner" section — every brief must state the job the visitor finishes.`)
    return
  }

  // Take the section body: from its heading to the next heading of the same or higher level.
  const start = src.search(heading)
  const rest = src.slice(start)
  const nextHeading = rest.slice(1).search(/^##\s/m)
  const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading + 1)

  if (!/\*\*The job the visitor finishes:\*\*/i.test(body)) {
    errors.push(`${rel}: Product owner section is missing the "**The job the visitor finishes:**" line.`)
  }

  // Next-needs: bullets under a "Next needs" label. Three is the quota from the rerun plan —
  // one is an afterthought, three forces the surface to be thought past its first version.
  const needsBlock = body.match(/\*\*Next needs\b[^:]*:\*\*([\s\S]*)/i)
  if (!needsBlock) {
    errors.push(`${rel}: Product owner section is missing the "**Next needs:**" list.`)
    return
  }
  const bullets = needsBlock[1].split('\n').filter((l) => /^\s*[-*]\s+\S/.test(l))
  if (bullets.length < MIN_NEXT_NEEDS) {
    errors.push(`${rel}: only ${bullets.length} next-need(s); ${MIN_NEXT_NEEDS} required. Depth is designed in, not requested after shipping.`)
  }
}

const files = readdirSync(BRIEFS).filter((f) => f.endsWith('.md'))
if (files.length === 0) errors.push('design/briefs/: no briefs found — the gate would pass vacuously.')
for (const f of files) checkBrief(join(BRIEFS, f))

if (errors.length) {
  console.error(`\n✗ BRIEF GATE FAILED (${errors.length}):`)
  for (const e of errors) console.error(`  · ${e}`)
  console.error('\nEvery brief answers "what job does the visitor finish?" and proposes what comes next.\n')
  process.exit(1)
}
console.log(`✓ brief gate: ${files.length} brief(s), each with a product-owner pass and ≥${MIN_NEXT_NEEDS} next-needs.`)
