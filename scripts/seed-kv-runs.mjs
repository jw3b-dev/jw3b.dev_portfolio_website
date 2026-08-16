#!/usr/bin/env node
/*
 * jw3b.dev v2 — Tier-1 KV seeder for recorded runs (P1-16 · synthetic-data)
 * Seeds the SAME bundled Tier-2 runs into the Worker's Tier-1 KV store under `run:<key>`
 * (the key serveRecordedRun() reads), so a live-inference outage first falls back to KV
 * (Tier-1) and only then to the SPA bundle (Tier-2) — two independent failure domains.
 *
 * OWNER-RUN, not part of CI: it writes remote state via wrangler and needs Cloudflare auth.
 *   node scripts/seed-kv-runs.mjs           # seed the remote (production) KV namespace
 *   node scripts/seed-kv-runs.mjs --local   # seed the local wrangler dev KV
 * Idempotent: `kv key put` overwrites, so re-running is safe and converges to the bundle.
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WRANGLER_CONFIG = join(ROOT, 'workers/portfolio-agent/wrangler.toml')
const local = process.argv.includes('--local')

// The runs to seed → their bundled source files. Keys MUST match the Worker's Tier-1 keys
// (REPLAY_KEY = 'concierge-intro', AUDIT_REPLAY_KEY = 'audit-intro').
const RUNS = [
  { key: 'concierge-intro', file: 'src/data/recorded-runs/concierge/intro.json' },
  { key: 'audit-intro', file: 'src/data/recorded-runs/audit/vault-reentrancy.json' },
]

let seeded = 0
for (const { key, file } of RUNS) {
  const json = readFileSync(join(ROOT, file), 'utf8')
  // Validate it parses and its key matches before pushing anything.
  const parsed = JSON.parse(json)
  if (parsed.key !== key) {
    throw new Error(`${file}: run key "${parsed.key}" != expected "${key}"`)
  }
  const args = [
    'wrangler', 'kv', 'key', 'put',
    `run:${key}`, json,
    '--binding', 'KV',
    '--config', WRANGLER_CONFIG,
    ...(local ? ['--local'] : ['--remote']),
  ]
  console.log(`seeding run:${key} (${local ? 'local' : 'remote'}) …`)
  execFileSync('npx', args, { stdio: 'inherit', cwd: ROOT })
  seeded += 1
}

console.log(`✓ seeded ${seeded} recorded run(s) to Tier-1 KV.`)
