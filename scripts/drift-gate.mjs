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
 * SECOND RULE, added 2026-08-23 — STATUS DRIFT. It bit a fourth time and this gate watched it
 * happen. `mas/PLAN.md` P5-06 said "OPEN — owner-gated" while both its surfaces were shipped and
 * tested; `REQUIREMENTS.md` FR-066, the postmortem and the product audit all said met. Rule one
 * could not see it, because the row makes no claim about a FILE — it claims a STATUS, and status
 * drift was listed two paragraphs down under "what it cannot check". Writing a limitation down is
 * not covering it, so the machine-checkable half is now checked: a planning row may not declare
 * OPEN or BLOCKED on the same line as an FR that `REQUIREMENTS.md` marks MET.
 *
 * WHAT IT STILL CANNOT CHECK, stated so nobody trusts it further than it reaches: whether a claim
 * about BEHAVIOUR is still true, whether a "DELIVERED" row really delivered, or whether a brief's
 * next-need has quietly been built. An FR with no MET marker is invisible to rule two — the gate
 * proves a contradiction, never completeness. Those need a reader.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

/*
 * Repo root, derived from this file's location. `new URL(...).pathname` was the obvious way and it
 * is wrong twice: it percent-encodes (a path containing a space becomes `%20`), and under a Vite
 * transform this module is served over http as `/@fs/<path>`, so the root came back as
 * "/@fs/…" and every scan silently found ZERO files while still reporting a pass. A gate that
 * passes because it looked at nothing is worse than no gate, so the derivation is explicit.
 */
function repoRoot(moduleUrl) {
  const dir = new URL('..', moduleUrl)
  if (dir.protocol === 'file:') return fileURLToPath(dir)
  return decodeURIComponent(dir.pathname).replace(/^\/@fs/, '')
}
export const ROOT = repoRoot(import.meta.url)
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

/**
 * PURE — the backticked repo paths this line claims are absent. `exists` is injected so the rule
 * is testable without a filesystem; the runner passes the real one.
 */
export function absenceClaims(line, exists) {
  // A struck-through or explicitly-corrected line is a RECORD of a past claim, not a live one.
  // This project keeps corrections visible on purpose; the gate must not punish that.
  if (line.includes('~~') || line.includes('✎')) return []
  const found = []
  for (const m of line.matchAll(CLAIM)) {
    const token = m[1] ?? m[2]
    if (!isCheckablePath(token)) continue
    if (exists(token)) found.push(token)
  }
  return found
}

/*
 * RULE TWO — status drift.
 *
 * `REQUIREMENTS.md` is the source of truth for whether an FR is met. A planning row that names an
 * FR and calls it OPEN or BLOCKED is asserting the opposite. Both cannot be true.
 *
 * Deliberately narrow, for the same reason rule one is: the status must be BOLD (`**OPEN`,
 * `**BLOCKED`), which is the planning documents' own convention for a status verdict, and the FR
 * must be named on the same line. Prose that merely mentions an FR near the word "blocked" does
 * not match.
 */
const MET_FR = /\*\*FR-(\d+)[^|\n]*\|(.*)$/gm
export function metRequirements(requirementsText) {
  const met = new Set()
  for (const m of String(requirementsText || '').matchAll(MET_FR)) {
    if (/\bMET\b/.test(m[2])) met.add(`FR-${m[1]}`)
  }
  return met
}

/** PURE — does this line declare a bold OPEN/BLOCKED status against one of the met FRs? */
export function statusDrift(line, met) {
  if (line.includes('~~') || line.includes('✎')) return null
  if (!/\*\*(?:OPEN|BLOCKED)\b/.test(line)) return null
  for (const fr of line.match(/FR-\d+/g) || []) {
    if (met.has(fr)) return fr
  }
  return null
}

const REQUIREMENTS_REL = 'mas/REQUIREMENTS.md'

/** Walk the scanned trees applying both rules. Returns the two violation lists. */
export function scan(root = ROOT) {
  const requirements = join(root, REQUIREMENTS_REL)
  const met = existsSync(requirements) ? metRequirements(readFileSync(requirements, 'utf8')) : new Set()
  const violations = []
  const stale = []
  const exists = (token) => existsSync(join(root, token))
  for (const dir of SCAN_DIRS) {
    for (const file of markdownFiles(join(root, dir))) {
      const rel = file.replace(root, '')
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        const snippet = line.trim().slice(0, 120)
        for (const token of absenceClaims(line, exists)) {
          violations.push({ file: rel, line: i + 1, token, snippet })
        }
        if (file === requirements) return
        const fr = statusDrift(line, met)
        if (fr) stale.push({ file: rel, line: i + 1, fr, snippet })
      })
    }
  }
  return { met, violations, stale }
}

// Only run when invoked as a script — the pure rules above are imported by the test suite, and a
// module that scans the repo on import cannot be tested without exiting the test process.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { met, violations, stale } = scan()

  if (stale.length) {
    console.error('✗ drift gate: a planning row calls an FR open or blocked that REQUIREMENTS.md marks MET\n')
    for (const v of stale) {
      console.error(`  · ${v.file}:${v.line} declares OPEN/BLOCKED against ${v.fr}, which is MET`)
      console.error(`    ${v.snippet}\n`)
    }
    console.error('  Correct the row (mark it ✎ — corrections stay visible here), or reopen the FR.')
    process.exit(1)
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

  console.log(
    `✓ drift gate: no planning document claims an existing file is absent, and no row calls a MET requirement open (${SCAN_DIRS.join(', ')}; ${met.size} FR(s) marked MET).`,
  )
}
