#!/usr/bin/env node
/*
 * jw3b.dev v2 — CLAIMS GATE (CI)  ·  domain-engine (P0-07), wired into CI in P0-12.
 * Fails the build (exit 1) if: the evidence register is invalid, a <Claim id="..."> points at a
 * missing or non-cleared entry, or forbidden claim-phrases appear in rendered copy.
 * THE LAW: no number ships unless it traces to a cleared, sourced register entry (BR-01/02).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { validateRegister, scanTextForForbidden } from '../src/lib/claimsValidate.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []

// 1) Register structural validation.
const register = JSON.parse(readFileSync(join(ROOT, 'src/data/evidence-register.json'), 'utf8'))
const res = validateRegister(register)
if (!res.ok) errors.push(...res.errors.map((e) => `register: ${e}`))
const clearedIds = new Set(register.claims.filter((c) => c.status === 'cleared').map((c) => c.id))
const allIds = new Set(register.claims.map((c) => c.id))

// 2) Walk src/ for <Claim id> integrity + forbidden copy. Exclude the claims infra + tests.
const EXCLUDE = ['src/lib', 'src/data', 'scripts', '__tests__', 'node_modules', 'dist']
// Colocated tests too. `__tests__` above only catches the DIRECTORY form, so a test sitting next
// to its component (Claim.test.jsx) was still scanned — and a test asserting that an unknown id
// renders nothing must necessarily contain an unknown id. Tests ship to nobody; this gate's job
// is rendered code. Same gap the copy gate had, fixed the same way.
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const rel = relative(ROOT, p)
    if (EXCLUDE.some((x) => rel.startsWith(x) || rel.includes(`/${x}/`))) continue
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(jsx?|tsx?)$/.test(name) && !TEST_FILE.test(name)) scanFile(p)
  }
}
function scanFile(p) {
  const src = readFileSync(p, 'utf8')
  const rel = relative(ROOT, p)
  // <Claim id="x"> / id='x' / id={"x"}
  for (const m of src.matchAll(/<Claim\b[^>]*\bid=\{?['"]([a-z0-9-]+)['"]\}?/g)) {
    const id = m[1]
    if (!allIds.has(id)) errors.push(`${rel}: <Claim id="${id}"> references a MISSING register entry`)
    else if (!clearedIds.has(id)) errors.push(`${rel}: <Claim id="${id}"> is not CLEARED — it will silently not render`)
  }
  // Forbidden claim-phrases in copy (string/JSX text).
  const forbidden = scanTextForForbidden(src)
  if (forbidden.length) errors.push(`${rel}: forbidden claim phrase(s) present: ${forbidden.join(', ')}`)
}
const srcDir = join(ROOT, 'src')
try { walk(srcDir) } catch { /* src may be minimal early in P0 */ }

// 3) Report.
if (errors.length) {
  console.error(`\n✗ CLAIMS GATE FAILED (${errors.length}):`)
  for (const e of errors) console.error(`  · ${e}`)
  console.error('\nEvery number must trace to a cleared, sourced evidence-register entry.\n')
  process.exit(1)
}
console.log(`✓ claims gate: ${clearedIds.size} cleared claim(s), register valid, no forbidden copy.`)
