/*
 * jw3b.dev v2 — knowledge-base transport (KTHULHU on-site corpus)  ·  full-stack-integrator
 *
 * The client half of `workers/portfolio-agent/src/routes/kbSearch.js`. The Worker embeds a query
 * at the edge with bge-m3 and ranks it against the ~9.5k-finding public corpus on Neon, then
 * expands a chosen finding by RELATIONSHIP (SWC class, protocol, source) — retrieve by meaning,
 * traverse by edge.
 *
 * WHY THIS EXISTS AND WHY IT IS NOT A KTHULHU API CLIENT. The flagship was reported for weeks as
 * "blocked on read-only API access to KTHULHU". It never was. The Worker already holds the same
 * `AI` binding and the same `NEON_DATABASE_URL` the product uses, so it reads the corpus directly
 * — no product API, no key, no CORS proxy, no dependency on another service being awake. The
 * block was mine, not the owner's.
 *
 * NEVER THROWS. Every failure the Worker can hand us — unreachable, non-200, malformed JSON, an
 * unprovisioned database — resolves to an empty result set with `degraded: true` and a reason the
 * UI can show. The Worker itself already degrades this way at HTTP 200 (a 5xx a visitor cannot act
 * on is worse than an honest empty), so this mirrors its contract rather than inventing a second
 * one.
 *
 * WHAT THIS CORPUS IS NOT: published findings from other people's audits and public hack
 * post-mortems. It is NOT John's own audit output and nothing built on it may imply otherwise —
 * which is why every result carries its source label, and why `sourceLabel` refuses to invent one.
 */
import { AGENT_KB_SEARCH_URL, AGENT_KB_RELATED_URL, AGENT_KB_STATS_URL } from '../config/worker.js'

/** The edge kinds the Worker's `validateRelated` accepts. Mirrored, not re-derived. */
export const EDGE_KINDS = Object.freeze(['protocol', 'swc', 'source'])

/**
 * PURE — how an edge kind reads to a person.
 *
 * "swc" is a registry id, not a word; "protocol" and "source" are near-English but ambiguous on
 * their own ("source" of what?). The UI never shows the raw enum.
 */
export function edgeLabel(kind) {
  if (kind === 'swc') return 'Same weakness class'
  if (kind === 'protocol') return 'Same protocol'
  if (kind === 'source') return 'Same source'
  return String(kind || '')
}

/**
 * PURE — a display label for a corpus source.
 *
 * The Worker maps the sources it knows (`solodit` → Solodit) and falls through to the raw column
 * value for the ones it does not — the live corpus emits at least one (`x23`) that is in no map.
 * A raw database enum on screen is a small lie about how finished something is, so an unmapped
 * value is labelled as unattributed rather than dressed up as a brand.
 */
export function sourceLabel(source) {
  const s = String(source || '').trim()
  if (!s) return 'Unattributed'
  // Anything the Worker already resolved arrives in Title Case with a space or a known brand.
  if (/^(Solodit|Sherlock|DeFiHackLabs|Vulns DB|KB)$/i.test(s)) return s
  // A bare lowercase token is an unresolved database value, not a name anyone would recognise.
  return /^[a-z0-9_]+$/.test(s) ? `Unattributed (${s})` : s
}

/**
 * PURE — normalise a severity into one of the site's tone buckets.
 *
 * The corpus severities are third-party and inconsistent (`High`, `UNSPECIFIED`, null, `info`).
 * An unknown severity must render as unknown, never silently as "low" — under-reporting someone
 * else's finding is the failure mode that matters here.
 */
export function severityTone(severity) {
  const s = String(severity || '').trim().toLowerCase()
  if (s === 'critical' || s === 'high') return 'high'
  if (s === 'medium') return 'medium'
  if (s === 'low' || s === 'info' || s === 'gas') return 'low'
  return 'unknown'
}

/** Shared no-throw JSON GET. Returns the parsed body, or null on any failure whatsoever. */
async function getJson(url, { fetchImpl, signal } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return null
  try {
    const res = await doFetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal })
    if (!res || !res.ok) return null
    return await res.json()
  } catch {
    // Offline, aborted, CORS, malformed JSON — none of it is actionable by the visitor.
    return null
  }
}

const UNREACHABLE = 'the knowledge base is unreachable right now'

/**
 * Search the corpus by meaning.
 *
 * @param {string} query
 * @param {{limit?:number, fetchImpl?:typeof fetch, url?:string, signal?:AbortSignal}} [opts]
 * @returns {Promise<{query:string, results:Array, degraded:boolean, reason?:string, cached?:boolean}>}
 */
export async function searchKb(query, { limit = 8, fetchImpl, url = AGENT_KB_SEARCH_URL, signal } = {}) {
  const q = String(query ?? '').trim()
  // Mirrors the Worker's own floor. Asking for a result on one character wastes a round trip to
  // be told the same thing.
  if (q.length < 2) return { query: q, results: [], degraded: true, reason: 'type at least two characters' }

  const href = `${url}?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`
  const body = await getJson(href, { fetchImpl, signal })
  if (!body) return { query: q, results: [], degraded: true, reason: UNREACHABLE }

  return {
    query: body.query ?? q,
    results: Array.isArray(body.results) ? body.results : [],
    degraded: Boolean(body.degraded),
    reason: body.reason,
    cached: Boolean(body.cached),
  }
}

/**
 * Walk one edge from a finding.
 *
 * Returns the origin as well as the neighbours, because the UI has to render WHERE YOU ARE — a
 * traversal that only shows the destination is a search with extra steps.
 *
 * @param {string} id
 * @param {{edge?:string, limit?:number, fetchImpl?:typeof fetch, url?:string, signal?:AbortSignal}} [opts]
 * @returns {Promise<{origin:object|null, edges:Array, edge?:object, results:Array, degraded:boolean, reason?:string}>}
 */
export async function relatedKb(id, { edge = 'protocol', limit = 8, fetchImpl, url = AGENT_KB_RELATED_URL, signal } = {}) {
  const key = String(id ?? '').trim()
  if (!key) return { origin: null, edges: [], results: [], degraded: true, reason: 'a finding id is required' }
  const kind = EDGE_KINDS.includes(edge) ? edge : 'protocol'

  const href = `${url}?id=${encodeURIComponent(key)}&edge=${encodeURIComponent(kind)}&limit=${encodeURIComponent(limit)}`
  const body = await getJson(href, { fetchImpl, signal })
  if (!body) return { origin: null, edges: [], results: [], degraded: true, reason: UNREACHABLE }

  return {
    origin: body.origin ?? null,
    edges: Array.isArray(body.edges) ? body.edges : [],
    edge: body.edge,
    results: Array.isArray(body.results) ? body.results : [],
    degraded: Boolean(body.degraded),
    reason: body.reason,
  }
}

/**
 * Pipeline aggregates.
 *
 * Counts only, by construction — the Worker's SQL takes no input and selects no column that could
 * identify a client, a protocol or a contract. Exposed here so a surface CAN use it; whether the
 * site should publish another party's operational volume is the owner's call, not this module's.
 */
export async function kbStats({ fetchImpl, url = AGENT_KB_STATS_URL, signal } = {}) {
  const body = await getJson(url, { fetchImpl, signal })
  if (!body || typeof body !== 'object') return { degraded: true, reason: UNREACHABLE }
  return { ...body, degraded: Boolean(body.degraded) }
}
