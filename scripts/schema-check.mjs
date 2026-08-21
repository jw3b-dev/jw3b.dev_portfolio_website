#!/usr/bin/env node
/*
 * schema:check — does the LIVE D1 database actually match the v2 migrations?
 *
 * This is a different question from the one `schemaParity.test.js` answers, and the difference is
 * what cost five days of chat transcripts and every CTF solve record.
 *
 *   schemaParity.test.js   CODE  vs MIGRATIONS   (static, runs in CI, catches "you wrote a column
 *                                                 no migration declares")
 *   schema:check (here)    LIVE  vs MIGRATIONS   (needs the network, run on demand, catches
 *                                                 "the migration never actually reached the DB")
 *
 * The second one matters because this database was created for v1 in March and inherited by v2.
 * Every v2 migration uses `CREATE TABLE IF NOT EXISTS`, which against an existing table is a
 * NO-OP rather than an upgrade — so a migration can report ✅ applied while changing nothing at
 * all. Nothing in CI can see that; only asking the live database can.
 *
 * Usage:  npm run schema:check
 * Exit 1 on drift, so it can gate a release step if we ever want it to.
 */
import { readdirSync, readFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORKER = join(root, 'workers/portfolio-agent')
const MIGRATIONS = join(WORKER, 'migrations')
const DB = 'jw3b_analytics'

/** Columns each table ends up with after every migration is applied in order. */
function declaredSchema() {
  const tables = new Map()
  const add = (t, c) => {
    if (!tables.has(t)) tables.set(t, [])
    if (!tables.get(t).includes(c)) tables.get(t).push(c)
  }

  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8').replace(/--[^\n]*/g, '')

    const create = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(([\s\S]*?)\n\s*\);/gi
    let m
    while ((m = create.exec(sql)) !== null) {
      for (const line of m[2].split('\n')) {
        const l = line.trim()
        // Skip blanks, table-level constraints, and CONTINUATION lines of a wrapped column
        // definition (`NOT NULL …`, `DEFAULT …`, `REFERENCES …`) — a wrapped `NOT NULL` used to
        // be reported as a column literally named "NOT".
        if (!l || /^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|NOT|NULL|DEFAULT|REFERENCES|ON)\b/i.test(l)) continue
        const col = l.split(/[\s(]/)[0]
        if (/^\w+$/.test(col)) add(m[1], col)
      }
    }

    const alter = /ALTER\s+TABLE\s+["']?(\w+)["']?\s+ADD\s+COLUMN\s+["']?(\w+)["']?/gi
    while ((m = alter.exec(sql)) !== null) add(m[1], m[2])

    const drop = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(\w+)["']?/gi
    while ((m = drop.exec(sql)) !== null) tables.delete(m[1])
  }
  return tables
}

/** Ask the live database what it actually has. */
function liveSchema() {
  const sql =
    "SELECT m.name AS tbl, group_concat(p.name, ',') AS cols FROM sqlite_master m " +
    "JOIN pragma_table_info(m.name) p WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%' " +
    "AND m.name NOT LIKE '_cf%' GROUP BY m.name ORDER BY m.name;"
  const out = execFileSync(
    'npx',
    ['wrangler@4', 'd1', 'execute', DB, '--remote', '--config', 'wrangler.toml', '--json', '--command', sql],
    { cwd: WORKER, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 },
  )
  const json = JSON.parse(out.slice(out.indexOf('[')))
  return new Map(json[0].results.map((r) => [r.tbl, r.cols.split(',')]))
}

const declared = declaredSchema()
const live = liveSchema()
let drift = 0

console.log(`\nD1 \`${DB}\` — live schema vs the v2 migrations\n${'─'.repeat(72)}`)
for (const [table, cols] of declared) {
  const actual = live.get(table)
  if (!actual) {
    console.log(`❌ ${table.padEnd(22)} absent from the live database`)
    drift++
    continue
  }
  const missing = cols.filter((c) => !actual.includes(c))
  if (missing.length) {
    console.log(`❌ ${table.padEnd(22)} missing: ${missing.join(', ')}`)
    drift++
  } else {
    const extra = actual.filter((c) => !cols.includes(c))
    console.log(`✅ ${table.padEnd(22)}${extra.length ? `  (extra, harmless: ${extra.join(', ')})` : ''}`)
  }
}
for (const table of live.keys()) {
  if (!declared.has(table) && table !== 'd1_migrations') {
    console.log(`⚠️  ${table.padEnd(22)} present live, declared by no migration — v1 residue?`)
  }
}
console.log('─'.repeat(72))
if (drift) {
  console.log(`\n${drift} table(s) drifted. Remember: CREATE TABLE IF NOT EXISTS does NOT add a`)
  console.log('column to a table that already exists — drift needs its own ALTER migration.\n')
  process.exit(1)
}
console.log('\nNo drift — the live database matches every v2 migration.\n')
