#!/usr/bin/env node
/*
 * CLAIMS LOCK — a cleared figure may not change silently.  (brief 02, next-need 1)
 *
 * The evidence register records what is true now. It kept no record of what it said BEFORE, so a
 * number could be edited and neither a reader nor a reviewer would see that it moved — and the
 * claims gate, by design, only ever validated the current state.
 *
 * This is not hypothetical. Commit `4c6f758` ("publish the FV-proven number, not the candidate
 * count") changed a cleared value. That was the RIGHT change; it was also invisible in review
 * unless someone happened to read the register diff carefully.
 *
 * A lockfile is the smallest thing that fixes it. Any change to a cleared claim's value or its
 * evidence pointer must update `src/data/claims-lock.json` in the same commit, which forces the
 * before and after into the diff. It cannot prevent a bad change — nothing mechanical can judge
 * whether a figure is true — but it makes a change impossible to make *quietly*, which is the
 * property the register was missing.
 *
 * Deliberately NOT derived from git: `actions/checkout` fetches depth 1, so HEAD~1 is not
 * reliably present in CI, and a history check that silently no-ops there would be worse than none.
 *
 *   npm run claims-lock              verify (CI)
 *   npm run claims-lock -- --update  accept the current register as the new baseline
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REG = join(ROOT, 'src/data/evidence-register.json')
const LOCK = join(ROOT, 'src/data/claims-lock.json')
const UPDATE = process.argv.includes('--update')

const register = JSON.parse(readFileSync(REG, 'utf8'))
const lockFile = JSON.parse(readFileSync(LOCK, 'utf8'))
const locked = lockFile.claims || {}

const current = Object.fromEntries(
  register.claims
    .filter((c) => c.status === 'cleared')
    .map((c) => [c.id, { value: c.value, evidence_pointer: c.evidence_pointer || '' }]),
)

if (UPDATE) {
  writeFileSync(LOCK, `${JSON.stringify({ ...lockFile, claims: Object.fromEntries(Object.entries(current).sort()) }, null, 2)}\n`)
  console.log(`✓ claims lock updated — ${Object.keys(current).length} cleared claim(s) recorded.`)
  process.exit(0)
}

const problems = []
for (const [id, now] of Object.entries(current)) {
  const was = locked[id]
  if (!was) {
    problems.push(`NEW cleared claim \`${id}\` is not in the lock (value: "${now.value}")`)
    continue
  }
  if (was.value !== now.value) {
    problems.push(
      `\`${id}\` VALUE changed\n      was: "${was.value}"\n      now: "${now.value}"` +
        (was.evidence_pointer === now.evidence_pointer
          ? '\n      …and its evidence pointer did NOT change. A figure moving without new evidence is the case worth looking at.'
          : ''),
    )
  } else if (was.evidence_pointer !== now.evidence_pointer) {
    problems.push(`\`${id}\` evidence pointer changed (value unchanged)\n      was: ${was.evidence_pointer || '(none)'}\n      now: ${now.evidence_pointer || '(none)'}`)
  }
}
for (const id of Object.keys(locked)) {
  if (!current[id]) problems.push(`\`${id}\` was cleared and is no longer — un-clearing is a claim change too`)
}

if (problems.length) {
  console.error(`✗ claims lock: ${problems.length} cleared claim(s) changed without updating the lock\n`)
  for (const p of problems) console.error(`  · ${p}\n`)
  console.error('  If the change is intended, run:  npm run claims-lock -- --update')
  console.error('  and commit the lock alongside it, so the before/after is in the diff.\n')
  process.exit(1)
}
console.log(`✓ claims lock: ${Object.keys(current).length} cleared claim(s), none changed silently.`)
