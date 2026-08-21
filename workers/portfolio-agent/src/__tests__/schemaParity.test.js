import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, join } from 'path'

/*
 * SCHEMA PARITY — the columns the code writes must be columns the migrations declare.
 *
 * This trap has now sprung twice on the same production database, and both times it was silent:
 *
 *   1. `rate_limits` — the v1 table had no `endpoint` column, `CREATE TABLE IF NOT EXISTS` no-op'd
 *      over it, and the limiter failed open in production until `rate_limits_v2` was introduced.
 *   2. `messages` — 0001_init declares `had_audio` and `source`, but this database was created in
 *      March with the older four-column shape, so `IF NOT EXISTS` skipped it again. Every message
 *      INSERT threw "no such column" into the deliberately best-effort catch in appendMessage()
 *      for FIVE DAYS, leaving 279 conversation rows with no messages and inflating the very
 *      funnel figure the P5 planning was reasoning from.
 *
 * Both were invisible because analytics writes are best-effort by design — a D1 blip must never
 * break a visitor's chat, so the catch is correct and must stay. That makes a STATIC check the
 * only place this can be caught: nothing at runtime is ever going to complain.
 *
 * `CREATE TABLE IF NOT EXISTS` against a database that predates the migration is a no-op, not an
 * update. If you add a column to an existing table, it needs its own ALTER migration.
 */

const workerRoot = resolve(__dirname, '../..')
const SRC = resolve(workerRoot, 'src')
const MIGRATIONS = resolve(workerRoot, 'migrations')

/** Every .js file under src/, recursively. */
function jsFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : jsFiles(full)
    return full.endsWith('.js') ? [full] : []
  })
}

/** `INSERT INTO <table> (a, b, c)` → [{ table, columns, file }] */
function insertedColumns() {
  const re = /INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(([^)]*)\)/gi
  const out = []
  for (const file of jsFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    let m
    while ((m = re.exec(text)) !== null) {
      out.push({
        table: m[1],
        columns: m[2]
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        file: file.slice(workerRoot.length + 1),
      })
    }
  }
  return out
}

/** The column set each table ends up with after every migration is applied, in order. */
function declaredColumns() {
  const tables = new Map()
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8').replace(/--[^\n]*/g, '')

    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(([\s\S]*?)\n\s*\);/gi
    let m
    while ((m = createRe.exec(sql)) !== null) {
      const cols = m[2]
        .split('\n')
        .map((l) => l.trim())
        // Skip blanks, table-level constraints, and CONTINUATION lines of a wrapped column
        // definition — a `NOT NULL` that wrapped onto its own line parsed as a column called "NOT".
        .filter((l) => l && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|NOT|NULL|DEFAULT|REFERENCES|ON)\b/i.test(l))
        .map((l) => l.split(/[\s(]/)[0])
        .filter((c) => /^\w+$/.test(c))
      if (!tables.has(m[1])) tables.set(m[1], new Set())
      cols.forEach((c) => tables.get(m[1]).add(c))
    }

    const alterRe = /ALTER\s+TABLE\s+["']?(\w+)["']?\s+ADD\s+COLUMN\s+["']?(\w+)["']?/gi
    while ((m = alterRe.exec(sql)) !== null) {
      if (!tables.has(m[1])) tables.set(m[1], new Set())
      tables.get(m[1]).add(m[2])
    }

    // A dropped table stops being declared — otherwise retired v1 tables look like live ones.
    const dropRe = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?(\w+)["']?/gi
    while ((m = dropRe.exec(sql)) !== null) tables.delete(m[1])
  }
  return tables
}

describe('D1 schema parity — every column the code writes is a column the migrations declare', () => {
  const inserts = insertedColumns()
  const declared = declaredColumns()

  it('finds the INSERT statements and the migrations (the check is not vacuously passing)', () => {
    expect(inserts.length).toBeGreaterThan(0)
    expect(declared.size).toBeGreaterThan(0)
    expect(declared.has('messages')).toBe(true)
  })

  it.each(inserts.map((i) => [`${i.table} (${i.file})`, i]))('%s writes only declared columns', (_label, insert) => {
    const cols = declared.get(insert.table)
    expect(cols, `no migration declares table "${insert.table}"`).toBeDefined()
    const missing = insert.columns.filter((c) => !cols.has(c))
    expect(
      missing,
      `${insert.file} INSERTs into ${insert.table} column(s) no migration declares: ${missing.join(', ')}. ` +
        'If the table predates the migration, CREATE TABLE IF NOT EXISTS silently skipped it — add an ALTER migration.',
    ).toEqual([])
  })

  it('covers the columns that were missing from the LIVE v1-inherited database', () => {
    // `messages` cost five days of chat transcripts; `ctf_solves` meant no solve could ever be
    // recorded, so its "0 solves" was a write failure wearing the costume of a usage statistic.
    for (const col of ['had_audio', 'source']) expect(declared.get('messages').has(col)).toBe(true)
    for (const col of ['attacker', 'drained_amount']) expect(declared.get('ctf_solves').has(col)).toBe(true)
  })

  it('stops declaring a table once a migration drops it', () => {
    // v1's `rate_limits` was superseded by `rate_limits_v2` and dropped in 0004.
    expect(declared.has('rate_limits')).toBe(false)
    expect(declared.has('rate_limits_v2')).toBe(true)
  })
})
