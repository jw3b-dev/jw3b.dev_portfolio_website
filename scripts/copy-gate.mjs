#!/usr/bin/env node
/*
 * jw3b.dev v2 — COPY GATE (CI).
 *
 * Product-audit findings 12, 13 and 14 were all one defect: a rename that swept the console but
 * not the surfaces describing it, leaving the old vocabulary on the hero, on /work and in the home
 * page's prose. They were fixed by hand, and nothing stopped them coming back. A rename is only
 * finished when re-introducing the old name FAILS A BUILD.
 *
 * Scans RENDERED copy only. Comments are stripped first and deliberately so: the code comments
 * that explain *why* a term is banned necessarily contain it, and a gate that cannot tell those
 * from shipped copy would either fail on its own documentation or force the documentation out.
 *
 * The banned list is DERIVED from src/components/audit/consoleCopy.js — the module that owns the
 * names owns the bans. Restating them here would fork the source, which is the same mistake the
 * claims gate made when it hardcoded forbidden phrases and then failed on itself.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { BANNED_VOCABULARY } from '../src/components/audit/consoleCopy.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// The file that DEFINES the ban necessarily contains every banned phrase. Excluding it is not a
// loophole — it holds no rendered copy but the one bridge sentence, which is the sanctioned use.
const EXCLUDE_FILES = ['src/components/audit/consoleCopy.js']
const EXCLUDE_DIRS = ['__tests__', 'node_modules', 'dist']
// Colocated tests too: a test asserting a phrase is ABSENT necessarily contains it
// (consoleCopy.test.js does exactly that for Audit.jsx). Tests ship to nobody.
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/

const errors = []

/**
 * Strip comments so only rendered copy is scanned. Handles block and line comments, and skips
 * string literals so a `//` or `/*` inside a string is not mistaken for a comment opener.
 * Deliberately simple: it errs toward KEEPING text (scanning more), never toward hiding it.
 */
export function stripComments(src) {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    const next = src[i + 1]
    // String / template literal — copy verbatim, honouring escapes.
    if (c === '"' || c === "'" || c === '`') {
      const quote = c
      out += c
      i++
      while (i < n) {
        if (src[i] === '\\') { out += src[i] + (src[i + 1] ?? ''); i += 2; continue }
        out += src[i]
        if (src[i] === quote) { i++; break }
        i++
      }
      continue
    }
    if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2)
      const skipped = src.slice(i, end === -1 ? n : end + 2)
      // Preserve newlines so reported line numbers stay true to the file.
      out += skipped.replace(/[^\n]/g, ' ')
      i = end === -1 ? n : end + 2
      continue
    }
    if (c === '/' && next === '/') {
      const end = src.indexOf('\n', i)
      i = end === -1 ? n : end
      continue
    }
    out += c
    i++
  }
  return out
}

function scanFile(path) {
  const rel = relative(ROOT, path)
  if (EXCLUDE_FILES.includes(rel)) return
  const stripped = stripComments(readFileSync(path, 'utf8'))
  const lines = stripped.split('\n')
  for (const { phrase, why } of BANNED_VOCABULARY) {
    const needle = phrase.toLowerCase()
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(needle)) {
        errors.push(`${rel}:${idx + 1}: banned copy "${phrase}" — ${why}`)
      }
    })
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const rel = relative(ROOT, p)
    if (EXCLUDE_DIRS.some((x) => rel.split('/').includes(x))) continue
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(jsx?|tsx?)$/.test(name) && !TEST_FILE.test(name)) scanFile(p)
  }
}

walk(join(ROOT, 'src'))

if (errors.length) {
  console.error(`\n✗ COPY GATE FAILED (${errors.length}):`)
  for (const e of errors) console.error(`  · ${e}`)
  console.error('\nA rename is unfinished until every surface naming the thing is swept.\n')
  process.exit(1)
}
console.log(`✓ copy gate: ${BANNED_VOCABULARY.length} banned phrase(s), none in rendered copy.`)
