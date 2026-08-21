/*
 * REACHABILITY GUARD — every component must be reachable from the app entry.
 *
 * WHY THIS EXISTS: FuzzTool (FR-009) and TxExplainer (FR-010) shipped complete — components,
 * hooks, Worker routes, passing tests — and were mounted on NO page. They had unit tests, so
 * the suite was green and coverage was met while no visitor could reach either feature, and
 * the Worker answered /fuzz requests nobody could make. A phase gate looked for dead buttons
 * and missed dead features.
 *
 * The whole suite is jsdom unit/component tests, which verify a module in isolation. Nothing
 * verified that a module is CONNECTED. This walks the real import graph from src/main.jsx and
 * fails if any component is orphaned — the cheapest possible check for "did we ship something
 * nobody can get to".
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative, extname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(here, '..')
const ENTRY = resolve(SRC, 'main.jsx')

/** Every .jsx/.js file under a directory, excluding tests and fixtures. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === '__tests__' || name === 'archive') continue
      walk(p, out)
    } else if (['.js', '.jsx'].includes(extname(name)) && !/\.(test|spec)\./.test(name)) {
      out.push(p)
    }
  }
  return out
}

/** Resolve an import specifier to a real file path, or null for bare/package imports. */
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null
  const base = resolve(dirname(fromFile), spec)
  const candidates = [base, `${base}.jsx`, `${base}.js`, resolve(base, 'index.jsx'), resolve(base, 'index.js')]
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return c
    } catch {
      /* try the next candidate */
    }
  }
  return null
}

/** Transitive closure of local imports from the entry — static AND dynamic import(). */
function reachableFrom(entry) {
  const seen = new Set()
  const queue = [entry]
  const IMPORT_RE = /(?:import\s[^'"]*from\s*|import\s*\(\s*|export\s[^'"]*from\s*)['"]([^'"]+)['"]/g
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    let src = ''
    try {
      src = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const m of src.matchAll(IMPORT_RE)) {
      const target = resolveSpec(file, m[1])
      if (target && !seen.has(target)) queue.push(target)
    }
  }
  return seen
}

const reachable = reachableFrom(ENTRY)
const rel = (p) => relative(SRC, p).replace(/\\/g, '/')

describe('reachability — nothing ships that a visitor cannot reach', () => {
  it('resolves the import graph from the real entry point', () => {
    expect(reachable.size).toBeGreaterThan(50) // sanity: the walker actually walked
    expect([...reachable].some((f) => rel(f) === 'App.jsx')).toBe(true)
  })

  it('every component under src/components is imported somewhere in the live graph', () => {
    const orphans = walk(resolve(SRC, 'components'))
      .filter((f) => !reachable.has(f))
      .map(rel)
    expect(orphans, `orphaned components — built but unreachable:\n  ${orphans.join('\n  ')}`).toEqual([])
  })

  it('every page under src/pages is routed', () => {
    const orphans = walk(resolve(SRC, 'pages'))
      .filter((f) => !reachable.has(f))
      .map(rel)
    expect(orphans, `orphaned pages — never routed:\n  ${orphans.join('\n  ')}`).toEqual([])
  })

  it('every hook is used by something reachable', () => {
    const orphans = walk(resolve(SRC, 'hooks'))
      .filter((f) => !reachable.has(f))
      .map(rel)
    expect(orphans, `orphaned hooks — dead code:\n  ${orphans.join('\n  ')}`).toEqual([])
  })
})
