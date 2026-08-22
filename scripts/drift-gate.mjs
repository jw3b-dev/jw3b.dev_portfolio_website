#!/usr/bin/env node
/*
 * DRIFT GATE — a planning document may not claim a file is absent when it is on disk.
 *
 * WHY THIS EXISTS. This project keeps rediscovering the same failure in a new costume: a record
 * that was true when written, silently stops being true, and then gets acted on.
 *
 *   · `mas/PLAN.md` said P5-02, P5-04 and P5-05 were OPEN — "no `funnel_counters` migration",
 *     "there is no `src/lib/notes.js`" — after all three had shipped. That table existed
 *     specifically to stop an orphaned backlog appearing, and drifted inside a day.
 *   · Design briefs asked for work already done (ten next-needs; a third were wrong).
 *   · Product-audit finding 21 sat in front of the owner for a month asking for API access to a
 *     capability whose endpoints were already deployed.
 *
 * Every one was found by a person reading carefully. That detection method has now failed often
 * enough to stop trusting, so the machine-checkable half is checked by machine.
 *
 * TIGHTENED on first run, by its own output. The first version allowed up to 40 characters
 * between the negation and the backtick, so an unrelated "no" bound to a later path across a
 * table cell — "(no AI spend). `docs/OPS.md`" and "no network … | `src/lib/auditHeuristics.js`"
 * were both reported as drift. Two false positives out of two findings is a gate nobody would
 * keep. The negation must now sit IMMEDIATELY before the path, or the phrase must follow it.
 *
 * WHAT IT CHECKS — deliberately narrow, because a noisy gate gets disabled. Only NEGATIVE
 * EXISTENCE claims about things that are unambiguously repo paths: a backticked token containing
 * a `/` and a known source extension, introduced by a negation ("no", "there is no", "does not
 * exist", "never created"). Prose like "no `writeContract`" names a code symbol, not a path, and
 * is ignored by construction.
 *
 * WHAT IT CANNOT CHECK, stated so nobody trusts it further than it reaches: whether a claim about
 * BEHAVIOUR is still true, whether a "DELIVERED" row really delivered, or whether a brief's
 * next-need has quietly been built. Those need a reader. This closes one specific hole — the one
 * that actually bit, three times.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN_DIRS = ['mas', 'design/briefs', 'docs']
const SOURCE_EXT = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.sql', '.json', '.css', '.md', '.yml', '.yaml'])

/*
 * A negation immediately before a backticked path. The path must contain a slash and end in a
 * source extension, which is what keeps code symbols and prose out of the gate.
 */
const CLAIM =
  /(?:there (?:is|are) no|there was no|there(?:'s| is) still no|\bno\b|never (?:created|written|existed))[ \t]*(?:such[ \t]+)?(?:file[ \t]+)?`([^`\n]+)`|`([^`\n]+)`[ \t]+(?:does not exist|doesn't exist|is absent|was never created)/gi

function markdownFiles(dir, acc = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of entries) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      markdownFiles(full, acc)
      continue
    }
    if (extname(name) === '.md') acc.push(full)
  }
  return acc
}

/** PURE — is this backticked token a repo path we can check? */
export function isCheckablePath(token) {
  const t = String(token || '').trim()
  if (!t.includes('/')) return false // a bare symbol, not a path
  if (/[\s(){}<>*?"']/.test(t)) return false // prose or a glob, not a literal path
  if (t.startsWith('http')) return false
  return SOURCE_EXT.has(extname(t))
}

const violations = []
for (const dir of SCAN_DIRS) {
  for (const file of markdownFiles(join(ROOT, dir))) {
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      // A struck-through or explicitly-corrected line is a RECORD of a past claim, not a live
      // one. This project keeps corrections visible on purpose; the gate must not punish that.
      if (line.includes('~~') || line.includes('✎')) return
      for (const m of line.matchAll(CLAIM)) {
        const token = m[1] ?? m[2]
        if (!isCheckablePath(token)) continue
        if (existsSync(join(ROOT, token))) {
          violations.push({
            file: file.replace(ROOT, ''),
            line: i + 1,
            token,
            snippet: line.trim().slice(0, 120),
          })
        }
      }
    })
  }
}

if (violations.length) {
  console.error('✗ drift gate: a planning document claims a file is absent, and it is on disk\n')
  for (const v of violations) {
    console.error(`  · ${v.file}:${v.line} claims no \`${v.token}\` — but it exists`)
    console.error(`    ${v.snippet}\n`)
  }
  console.error('  Update the claim (strike it through — corrections stay visible here), or delete the file.')
  process.exit(1)
}

console.log(`✓ drift gate: no planning document claims an existing file is absent (${SCAN_DIRS.join(', ')}).`)
