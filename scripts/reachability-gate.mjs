#!/usr/bin/env node
/*
 * REACHABILITY GATE — FR-038: nothing ships that a visitor cannot reach.
 *
 * WHY THIS EXISTS. FR-038 has been a requirement since P2 and had no automated check, so the rule
 * was enforced by whoever happened to notice. The record of what that cost:
 *
 *   · FuzzTool and TxExplainer shipped with components, hooks, Worker routes and tests, mounted on
 *     no page. Caught by hand, months later (`Audit.jsx`'s header still tells the story).
 *   · `src/data/vuln-corpus` shipped in the bundle, used by no UI (product-audit finding 17).
 *   · The CTF recorded-solve artifact shipped in the bundle, rendered by nobody (finding 19).
 *   · `/kb/search`, `/kb/related` and `/kb/stats` — the KTHULHU corpus — were deployed and
 *     returning real data with ZERO client callers for a month, while the flagship they would
 *     have made operable was reported to the owner as blocked on API access it never needed
 *     (finding 21). That one did not just waste the work; it produced a false blocker and put it
 *     in front of the owner.
 *
 * Every one of those was found by a person reading code, which is precisely the detection method
 * that had already failed four times. So this gate asks the question mechanically, on every push:
 *
 *   1. Does every Worker route have a client URL constant?
 *   2. Does every client URL constant have a consumer that is not a test and not the config file?
 *
 * An intentional exception is DECLARED, with a reason, in `DECIDED` below. That is the point: an
 * unconsumed endpoint stops being an oversight and becomes a recorded decision someone signed.
 *
 * WHAT THIS GATE DOES NOT CATCH — stated plainly, because a gate trusted past its reach is worse
 * than no gate. It verifies the chain as far as `route → constant → some source file`. It does NOT
 * verify `transport module → component → mounted route`. A transport that imports the constant
 * keeps this green even if the component using it is deleted, and a component mounted on no page
 * is invisible to it entirely — which is exactly how FuzzTool and TxExplainer shipped unreachable.
 * Closing that half means walking the import graph from the router down, and it is the natural
 * next iteration of this file, not something it already does.
 *
 * Red-witnessed 2026-08-22: removing `AGENT_KB_SEARCH_URL` — reproducing the exact pre-fix state —
 * turns it red with the finding-21 message; restoring it turns it green.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const WORKER_INDEX = join(ROOT, 'workers/portfolio-agent/src/index.js')
const WORKER_CONFIG = join(ROOT, 'src/config/worker.js')
const SRC = join(ROOT, 'src')

/*
 * Declared exceptions. A route lands here only when someone has decided it should exist without a
 * client caller — and the reason is the deliverable, because "why is this here?" is the question
 * the next reader will actually have.
 */
const DECIDED = {
  '/fuzz': {
    reason:
      'The client generates the fuzz harness locally from `src/lib/fuzzHarness.js` — the same ' +
      'generator the Worker imports — so FuzzTool needs no round trip. The route stays as the ' +
      'server-side half of that shared generator and is covered by the Worker suite.',
    decidedOn: '2026-08-22',
  },
  '/book-a-call': {
    reason:
      'The book-a-call floor submits through `engagementQueue` to `/engagement`, which persists ' +
      'AND notifies. This route duplicates that job and no client calls it. Kept rather than ' +
      'deleted because it is a public endpoint that may be referenced externally; flagged in the ' +
      'product-audit register as a deletion candidate rather than quietly removed.',
    decidedOn: '2026-08-22',
  },
  '/health': {
    reason: 'Consumed by the concierge status probe via AGENT_HEALTH_URL — listed for completeness only.',
    decidedOn: '2026-08-22',
    consumed: true,
  },
}

/** Every `pathname === '/x'` the Worker answers. */
function workerRoutes() {
  const src = readFileSync(WORKER_INDEX, 'utf8')
  const out = new Set()
  for (const m of src.matchAll(/pathname\s*===\s*['"]([^'"]+)['"]/g)) out.add(m[1])
  return [...out]
}

/** Every exported URL constant in the client config, with the path it points at. */
function clientEndpoints() {
  const src = readFileSync(WORKER_CONFIG, 'utf8')
  const out = []
  for (const m of src.matchAll(/export const (\w+URL)\s*=\s*`\$\{WORKER_URL\}([^`]*)`/g)) {
    out.push({ name: m[1], path: m[2] || '/' })
  }
  // AGENT_CHAT_URL is `WORKER_URL` itself (the concierge streams off POST /).
  for (const m of src.matchAll(/export const (\w+URL)\s*=\s*WORKER_URL\s*$/gm)) {
    out.push({ name: m[1], path: '/' })
  }
  return out
}

/** Walk src/ collecting non-test source files. */
function sourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'archive') continue
      sourceFiles(full, acc)
      continue
    }
    if (!['.js', '.jsx'].includes(extname(entry))) continue
    if (/\.(test|spec)\.[jt]sx?$/.test(entry)) continue
    if (full === WORKER_CONFIG) continue
    acc.push(full)
  }
  return acc
}

const files = sourceFiles(SRC).map((f) => ({ f, text: readFileSync(f, 'utf8') }))
const routes = workerRoutes()
const endpoints = clientEndpoints()
const errors = []

// 1 — every route reachable from a named client constant.
const knownPaths = new Set(endpoints.map((e) => e.path))
for (const route of routes) {
  if (knownPaths.has(route)) continue
  if (DECIDED[route]) continue
  errors.push(
    `Worker answers ${route} but no constant in src/config/worker.js points at it — ` +
      `no client code can call it. Wire it, or declare it in DECIDED with a reason.`,
  )
}

// 2 — every constant actually consumed by something a visitor can reach.
for (const { name, path } of endpoints) {
  const consumers = files.filter(({ text }) => text.includes(name))
  if (consumers.length > 0) continue
  const decided = DECIDED[path]
  if (decided) continue
  errors.push(
    `${name} (${path}) is defined and consumed by NOTHING — the endpoint exists and no visitor ` +
      `can reach it. This is the finding-21 shape. Build the surface, or declare it in DECIDED.`,
  )
}

if (errors.length) {
  console.error('✗ reachability gate (FR-038): nothing ships that a user cannot reach\n')
  for (const e of errors) console.error(`  · ${e}\n`)
  process.exit(1)
}

const declared = Object.keys(DECIDED).filter((p) => !DECIDED[p].consumed).length
console.log(
  `✓ reachability gate: ${routes.length} Worker route(s), ${endpoints.length} client endpoint(s), ` +
    `every one reachable or declared (${declared} declared exception(s)).`,
)
