/*
 * jw3b.dev v2 — knowledge-base search (W4)  ·  backend-specialist
 *
 * Searches the Neon pgvector corpus of PUBLIC audit findings — Solodit, Sherlock, DeFiHackLabs
 * and a vulns DB — the same `knowledge_base_findings` table the /audit narrative already
 * retrieves from.
 *
 * WHY NOT PROXY KTHULHU'S /v1/search. It is public and it works, but it sends no
 * `access-control-allow-origin`, so a browser on jw3b.dev cannot call it; it would need
 * proxying regardless. And once you are proxying, the extra hop buys nothing: this Worker already
 * holds the same `AI` binding and the same `NEON_DATABASE_URL`, so it can embed the query at the
 * edge and read the corpus directly. Going direct removes a network hop and a cold-start
 * dependency on another service.
 *
 * WHAT THIS IS NOT. These are public findings from published audits and hack post-mortems. They
 * are NOT John's own audit output, and nothing here may imply that. The client labels every
 * result with its source for exactly that reason.
 *
 * Confidentiality: this route touches ONLY `knowledge_base_findings`. The neighbouring `findings`
 * and `audit_submissions` tables hold client work (org ids, contract code, `embargo_until`) and
 * are never queried from a public surface.
 */
import { retrievalSafe } from '../auditRag.js'

/*
 * The corpus is embedded by a SELF-HOSTED bge-m3 on John's GPU box (KTHULHU box/embed/serve.py,
 * `MODEL_NAME = BAAI/bge-m3`, `EXPECT_DIMS = 1024`), not by Workers AI. Cloudflare serves the same
 * weights, and the two were measured against each other: cosine 0.999688 / 1.000000 / 0.999999 on
 * matched inputs. So queries can be embedded at the edge while the corpus is embedded on the box —
 * which is the whole point, since edge embedding costs ~50ms and needs no box to be awake.
 *
 * The failure mode this guards against has no symptom: vectors from a DIFFERENT model still
 * produce a confident-looking cosine distance, just a meaningless one. No error, no counter, worse
 * results. So the dimension is asserted rather than assumed.
 */
const EMBED_MODEL = '@cf/baai/bge-m3'
const EMBED_DIMS = 1024
const MAX_QUERY = 300
const DEFAULT_LIMIT = 8
const MAX_LIMIT = 20
const CACHE_TTL_SEC = 300

/** Human-readable provenance, mirroring auditRag's map so one corpus reads one way site-wide. */
const SOURCE_LABELS = {
  // Verified against live rows on 2026-08-21, not copied from a doc: the corpus emits `solodit`
  // and `sherlock_judging`, while auditRag's older map expected `solodit_all_findings`/`sherlock`.
  // Both spellings are kept so neither path shows a visitor a raw database enum.
  solodit: 'Solodit',
  solodit_all_findings: 'Solodit',
  sherlock_judging: 'Sherlock',
  sherlock: 'Sherlock',
  defihacklabs: 'DeFiHackLabs',
  vulnerabilities_database: 'Vulns DB',
}

/** PURE — validate the query. Returns {ok, query, limit} or {ok:false, error}. */
export function validateSearch(params) {
  const raw = String(params?.q ?? '').trim()
  if (raw.length < 2) return { ok: false, error: 'query must be at least 2 characters' }
  const limitRaw = Number(params?.limit)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), MAX_LIMIT) : DEFAULT_LIMIT
  return { ok: true, query: raw.slice(0, MAX_QUERY), limit }
}

/**
 * PURE — shape a Neon row for the client.
 *
 * `retrievalSafe` is applied here as well as in the RAG path: the corpus is third-party data, and
 * a poisoned row must not be able to put a forbidden claim or a bare portfolio metric on a page
 * governed by the claims gate. A row that fails is dropped, not sanitised — silently editing
 * someone's finding would misrepresent the source.
 */
export function mapSearchRow(r) {
  if (!r) return null
  const title = String(r.title || '').trim()
  const description = String(r.description || '').replace(/\s+/g, ' ').trim()
  if (!title) return null
  if (!retrievalSafe(`${title} ${description}`)) return null
  return {
    id: r.id ?? null,
    title,
    // Enough to judge relevance without reproducing an entire report.
    excerpt: description.length > 400 ? `${description.slice(0, 400)}…` : description,
    severity: r.severity || null,
    protocol: r.protocol || null,
    year: r.year || null,
    swc: r.swc_id || null,
    source: SOURCE_LABELS[r.source] || r.source || 'KB',
    sourceUrl: r.source_url || null,
    similarity: typeof r.similarity === 'number' ? Number(r.similarity.toFixed(4)) : null,
  }
}

async function defaultNeonClient(env) {
  const { neon } = await import('@neondatabase/serverless')
  return neon(env.NEON_DATABASE_URL)
}

/**
 * `GET /kb/search?q=…&limit=…`
 *
 * Degrades to an empty result set with `degraded:true` and HTTP 200 rather than surfacing a 5xx:
 * a failed upstream is not something the visitor can act on, and a proxy that passes through a
 * 500 breaks the page for a problem that is ours.
 *
 * @returns {Promise<{status:number, body:object}>}
 */
export async function handleKbSearch(req, env, ctx, params, { neonClient } = {}) {
  const v = validateSearch(params)
  if (!v.ok) return { status: 400, error: v.error }

  const empty = (reason) => ({
    status: 200,
    body: { query: v.query, results: [], degraded: true, reason },
  })

  if (!env?.NEON_DATABASE_URL || !env?.AI) return empty('search is not provisioned')

  // KV cache: the corpus is static, so an identical query is a pure repeat. Also the cheapest
  // possible defence against someone hammering one term to burn embedding calls.
  const cacheKey = `kb:${v.limit}:${v.query.toLowerCase()}`
  if (env.KV) {
    try {
      const hit = await env.KV.get(cacheKey, 'json')
      if (hit) return { status: 200, body: { ...hit, cached: true } }
    } catch {
      /* cache miss on error — never fatal */
    }
  }

  try {
    const emb = await env.AI.run(EMBED_MODEL, { text: [v.query] })
    const vector = emb?.data?.[0]
    if (!vector?.length) return empty('the query could not be embedded')
    // A width mismatch means the query and the corpus are in different embedding spaces. Ranking
    // would still "work" and be nonsense, so refuse rather than serve confident garbage.
    if (vector.length !== EMBED_DIMS) return empty('the query embedding does not match the corpus')

    const literal = `[${vector.join(',')}]`
    const sql = neonClient || (await defaultNeonClient(env))
    // `1 - (embedding <=> query)` turns cosine DISTANCE into a similarity the UI can show.
    // NULL embeddings are rows the box has not reached yet; they cannot be ranked, so they are
    // excluded. The UI therefore reports what is SEARCHABLE, never the table's row count — those
    // are different numbers while a backfill is running, and only one of them is honest.
    const rows = await sql`
      SELECT id, title, description, severity, protocol, year, source, source_url, swc_id,
             1 - (embedding <=> ${literal}::vector) AS similarity
      FROM knowledge_base_findings
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${literal}::vector
      LIMIT ${v.limit}
    `
    const results = (rows || []).map(mapSearchRow).filter(Boolean)
    const body = { query: v.query, results, degraded: false }

    if (env.KV && results.length) {
      const write = env.KV.put(cacheKey, JSON.stringify(body), { expirationTtl: CACHE_TTL_SEC })
      ctx?.waitUntil ? ctx.waitUntil(write) : await write
    }
    return { status: 200, body }
  } catch {
    // Neon asleep, AI binding unavailable, malformed vector — the visitor can act on none of it.
    return empty('the knowledge base is unreachable right now')
  }
}

/*
 * ── The graph layer ────────────────────────────────────────────────────────────────────────────
 *
 * Vector search finds an entry point by MEANING. This expands it by RELATIONSHIP, which is the
 * half cosine distance cannot do: two findings can describe the same bug class in such different
 * words that they never rank near each other, and still be one edge apart.
 *
 * The edges are already in the corpus — no Neo4j, no tunnel, no client data:
 *
 *     Finding ──swc_id────▶ SWC class  ──▶ sibling findings
 *        ├─────protocol───▶ Protocol   ──▶ other findings against the same protocol
 *        └─────source─────▶ Solodit / Sherlock / DeFiHackLabs
 *
 * Retrieve by meaning, expand by relationship: that is what GraphRAG actually means, and it runs
 * here on public audit history in plain SQL.
 */

/** PURE — the edges a row exposes, as {kind, value} pairs. Empty when the row is unlinked. */
export function edgesFor(row) {
  if (!row) return []
  const out = []
  if (row.swc_id) out.push({ kind: 'swc', value: String(row.swc_id) })
  if (row.protocol) out.push({ kind: 'protocol', value: String(row.protocol) })
  if (row.source) out.push({ kind: 'source', value: String(row.source), label: SOURCE_LABELS[row.source] || row.source })
  return out
}

/** PURE — validate a traversal request. */
export function validateRelated(params) {
  const id = String(params?.id ?? '').trim()
  if (!id || id.length > 64) return { ok: false, error: 'a finding id is required' }
  /*
   * `protocol` is the default, not `swc`. Sampling the live corpus on 2026-08-21: swc_id was
   * populated on 0 of 6 rows, protocol and year on 6 of 6. Defaulting to an edge that is almost
   * never present would make traversal look broken when it is the DATA that is sparse — and the
   * SWC edge stays available for the rows that do carry one.
   */
  const kind = String(params?.edge ?? 'protocol').trim()
  if (!['swc', 'protocol', 'source'].includes(kind)) return { ok: false, error: 'unknown edge kind' }
  const limitRaw = Number(params?.limit)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), MAX_LIMIT) : DEFAULT_LIMIT
  return { ok: true, id, kind, limit }
}

/**
 * `GET /kb/related?id=…&edge=swc|protocol|source&limit=…`
 *
 * One hop from a finding along a named edge. Returns the origin (so the UI can render where you
 * are), the edges available from it, and the neighbours along the chosen one.
 *
 * Degrades exactly like the search route: empty + `degraded` at HTTP 200, never a 5xx the visitor
 * cannot act on.
 */
export async function handleKbRelated(req, env, ctx, params, { neonClient } = {}) {
  const v = validateRelated(params)
  if (!v.ok) return { status: 400, error: v.error }

  const empty = (reason) => ({ status: 200, body: { origin: null, edges: [], results: [], degraded: true, reason } })
  if (!env?.NEON_DATABASE_URL) return empty('search is not provisioned')

  try {
    const sql = neonClient || (await defaultNeonClient(env))
    const originRows = await sql`
      SELECT id, title, description, severity, protocol, year, source, source_url, swc_id
      FROM knowledge_base_findings
      WHERE id = ${v.id}
      LIMIT 1
    `
    const originRow = (originRows || [])[0]
    if (!originRow) return empty('that finding is no longer in the corpus')

    const origin = mapSearchRow(originRow)
    const edges = edgesFor(originRow)
    const edge = edges.find((e) => e.kind === v.kind)
    // An unlinked finding is a real answer, not an error: plenty of corpus rows carry no SWC id.
    if (!edge) return { status: 200, body: { origin, edges, results: [], degraded: false, reason: `no ${v.kind} edge` } }

    // One query per edge kind rather than dynamic column interpolation — the column name is never
    // taken from user input, only the VALUE is parameterised.
    const rows =
      v.kind === 'swc'
        ? await sql`
            SELECT id, title, description, severity, protocol, year, source, source_url, swc_id
            FROM knowledge_base_findings
            WHERE swc_id = ${edge.value} AND id <> ${v.id}
            ORDER BY severity NULLS LAST, year DESC NULLS LAST
            LIMIT ${v.limit}`
        : v.kind === 'protocol'
          ? await sql`
            SELECT id, title, description, severity, protocol, year, source, source_url, swc_id
            FROM knowledge_base_findings
            WHERE protocol = ${edge.value} AND id <> ${v.id}
            ORDER BY year DESC NULLS LAST
            LIMIT ${v.limit}`
          : await sql`
            SELECT id, title, description, severity, protocol, year, source, source_url, swc_id
            FROM knowledge_base_findings
            WHERE source = ${edge.value} AND id <> ${v.id}
            ORDER BY year DESC NULLS LAST
            LIMIT ${v.limit}`

    const results = (rows || []).map(mapSearchRow).filter(Boolean)
    return { status: 200, body: { origin, edges, edge, results, degraded: false } }
  } catch {
    return empty('the knowledge base is unreachable right now')
  }
}

/*
 * ── Aggregates over the CLIENT-WORK tables ─────────────────────────────────────────────────────
 *
 * `findings` and `audit_submissions` hold other people's audits: org ids, contract code, unfixed
 * vulnerability locations, and an `embargo_until` clock that is contractual rather than advisory.
 * Neither table carries a "disclosed" flag, so nothing in the schema can tell a query which rows
 * are safe to publish.
 *
 * This route therefore returns COUNTS ONLY. Not "counts by default", not "counts unless a
 * parameter asks for more" — the SQL is fixed, takes no input, and selects no column that could
 * identify a client, a protocol, or a contract. A severity histogram describes the shape of the
 * work without naming any of it.
 *
 * The counts are portfolio claims, so they route through the evidence register like every other
 * number on the site; this endpoint is the evidence behind them, not a bypass around the gate.
 */
const STATS_CACHE_TTL_SEC = 3600

/** PURE — normalise a severity histogram, dropping anything that is not a plain bucket count. */
export function shapeSeverity(rows) {
  const out = {}
  for (const r of rows || []) {
    const key = String(r?.severity ?? '').trim().toLowerCase()
    const n = Number(r?.n)
    if (!key || !Number.isFinite(n) || n < 0) continue
    out[key] = Math.trunc(n)
  }
  return out
}

/**
 * `GET /kb/stats` — how much audit work exists, and its severity shape. No rows, ever.
 */
export async function handleKbStats(req, env, ctx, params, { neonClient } = {}) {
  // KV is eventually consistent, so a deleted key can still serve for a while — which made a
  // freshly deployed field look absent rather than stale. `?fresh=1` skips the read.
  const skipCache = String(params?.fresh ?? '') === '1'
  const empty = (reason) => ({
    status: 200,
    body: { audits: null, findings: null, severity: {}, auditStatus: {}, degraded: true, reason },
  })
  if (!env?.NEON_DATABASE_URL) return empty('stats are not provisioned')

  if (env.KV && !skipCache) {
    try {
      const hit = await env.KV.get('kb:stats', 'json')
      if (hit) return { status: 200, body: { ...hit, cached: true } }
    } catch {
      /* never fatal */
    }
  }

  try {
    const sql = neonClient || (await defaultNeonClient(env))
    // Three fixed aggregate statements. No interpolation, no parameters, no selectable columns.
    const [
      auditRows, findingRows, sevRows, statusRows, deliveredRows, deliveredSevRows, confirmedRows,
      fvRows, dispositionRows, rejectionRows,
    ] = await Promise.all([
      sql`SELECT count(*)::int AS n FROM audit_submissions`,
      sql`SELECT count(*)::int AS n FROM findings`,
      sql`SELECT severity, count(*)::int AS n FROM findings GROUP BY severity`,
      // Status matters for HONESTY, not curiosity: `audit_submissions` includes failed and test
      // runs, so publishing the raw row count as "audits delivered" would overstate the work.
      sql`SELECT status, count(*)::int AS n FROM audit_submissions GROUP BY status`,
      /*
       * Findings from audits that actually RAN. Both terminal statuses count, and the reason is
       * in KTHULHU's lib/db/review-gate.ts: the status is derived from the findings themselves —
       *   an unconfirmed CRITICAL or HIGH finding → 'awaiting_review' (report delivery held)
       *   otherwise                               → 'complete'       (report deliverable)
       * So `awaiting_review` is not a failure. It is the EU AI Act human-oversight gate holding a
       * report that found something serious. Counting only 'complete' would have excluded exactly
       * the audits that found the most, and understated the work by more than half.
       */
      sql`SELECT count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review')`,
      sql`SELECT severity, count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review')
          GROUP BY severity`,
      // Human-CONFIRMED findings. Everything else is automated output awaiting review, and the
      // two must never be published as one number: "found by a tool" and "confirmed by a person"
      // are different claims, and only the second is an audit result.
      sql`SELECT count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review') AND f.confirmed_by IS NOT NULL`,
      /*
       * Formal-verification verdicts: not_attempted | proven | refuted | inconclusive.
       * `proven` means the exploit REPRODUCED — a Foundry proof exists. `refuted` means the
       * pipeline generated the finding and then disproved it by failing to reproduce it, which
       * is the system catching its own false positive. These are categorically different from an
       * unverified automated finding, and only `proven` is "reproduce, don't assert".
       */
      sql`SELECT fv_verdict, count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review')
          GROUP BY fv_verdict`,
      /*
       * The self-policing record. `disposition` is kept|dropped_fp — the engine's own consolidation
       * verdict — and `rejection_stage` names WHICH mechanism disqualified a candidate:
       * kill_gate | consolidation | fv | human. Together they say how many findings the pipeline
       * generated and then threw away itself, which is a far more interesting number than the
       * raw candidate count: it is the system demonstrating it does not just assert.
       */
      sql`SELECT disposition, count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review')
          GROUP BY disposition`,
      sql`SELECT rejection_stage, count(*)::int AS n FROM findings f
          JOIN audit_submissions a ON a.id = f.submission_id
          WHERE a.status IN ('complete', 'awaiting_review')
          GROUP BY rejection_stage`,
    ])
    const body = {
      audits: Number(auditRows?.[0]?.n ?? 0),
      findings: Number(findingRows?.[0]?.n ?? 0),
      severity: shapeSeverity(sevRows),
      auditStatus: shapeSeverity((statusRows || []).map((r) => ({ severity: r.status, n: r.n }))),
      // The only two numbers defensible as delivered work.
      completedAudits:
        Number((statusRows || []).find((r) => r.status === 'complete')?.n ?? 0) +
        Number((statusRows || []).find((r) => r.status === 'awaiting_review')?.n ?? 0),
      findingsInCompleted: Number(deliveredRows?.[0]?.n ?? 0),
      // Severity shape of REAL work only — a chart drawn from failed runs describes an error rate.
      deliveredSeverity: shapeSeverity(deliveredSevRows),
      confirmedFindings: Number(confirmedRows?.[0]?.n ?? 0),
      fvVerdicts: shapeSeverity((fvRows || []).map((r) => ({ severity: r.fv_verdict ?? 'not_recorded', n: r.n }))),
      disposition: shapeSeverity((dispositionRows || []).map((r) => ({ severity: r.disposition ?? 'not_recorded', n: r.n }))),
      rejectionStage: shapeSeverity((rejectionRows || []).map((r) => ({ severity: r.rejection_stage ?? 'not_rejected', n: r.n }))),
      degraded: false,
    }
    if (env.KV) {
      const write = env.KV.put('kb:stats', JSON.stringify(body), { expirationTtl: STATS_CACHE_TTL_SEC })
      ctx?.waitUntil ? ctx.waitUntil(write) : await write
    }
    return { status: 200, body }
  } catch {
    return empty('the audit database is unreachable right now')
  }
}
