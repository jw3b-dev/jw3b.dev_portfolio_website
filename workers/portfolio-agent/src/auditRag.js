/*
 * jw3b.dev v2 — /audit edge-RAG (P2-14 · OD-06)  ·  backend-specialist
 * Grounds the /audit narrative with related known findings retrieved by semantic similarity
 * from the shared pgvector knowledge base on Neon — the ~9.5k-finding corpus reused from the
 * KTHULHU project (Solodit, Sherlock contests, DeFiHackLabs, a vulnerability database). The
 * concierge KB is UNTOUCHED (curated cleared-claims grounding, P1-03); this is /audit-only.
 *
 * Retrieval-safety guard (the load-bearing rule): the KB holds VULNERABILITY knowledge, never
 * John's record. `retrievalSafe` drops any retrieved chunk that trips the forbidden-claims
 * patterns OR looks like a bare portfolio metric, so a polluted corpus can never surface an
 * ungoverned stat into the narrative — the claims-gate framing stays on output.
 *
 * Degrades cleanly: with no NEON_DATABASE_URL / AI binding it returns empty context and the
 * narrative runs exactly as before (unprovisioned = current behaviour).
 *
 * Embedding model: the corpus was embedded with bge-m3 (1024-dim); the query MUST use the same
 * model or the pgvector `<=>` distance is meaningless. `VULN_CORPUS` remains bundled as an
 * offline seed/reference (not the retrieval source — the live corpus lives in Neon).
 */
import { scanTextForForbidden } from '../../../src/lib/claimsValidate.js'
import { VULN_CORPUS } from '../../../src/data/vuln-corpus/index.js'

// MUST match the model the Neon corpus was embedded with (bge-m3 → 1024-dim).
const EMBED_MODEL = '@cf/baai/bge-m3'

// Human-readable provenance for each corpus source (raw `source` column values).
const SOURCE_LABELS = {
  solodit_all_findings: 'Solodit',
  sherlock: 'Sherlock',
  defihacklabs: 'DeFiHackLabs',
  vulnerabilities_database: 'Vulns DB',
}

// A bare portfolio metric — tests/users/EXP/entities/chunks/PRs/findings/audits/plants/etc.
// The /audit narrative retrieves vuln knowledge, never these; this keeps one out if the corpus
// is ever polluted.
const PORTFOLIO_STAT = /\b\d[\d,]*\+?\s*(tests?|users?|exp|entities|chunks?|prs?|findings?|audits?|plants?|countries)\b/i

/** True only if the text carries no forbidden claim and no bare portfolio metric. */
export function retrievalSafe(text) {
  const s = String(text ?? '')
  return scanTextForForbidden(s).length === 0 && !PORTFOLIO_STAT.test(s)
}

/** Drop any retrieved chunk that fails the safety guard (guards title + text). */
export function sanitizeRetrieved(chunks) {
  return (chunks || []).filter((c) => retrievalSafe(`${c?.title ?? ''} ${c?.text ?? ''}`))
}

/** Assemble a bounded, sanitized context block for the narrative prompt. */
export function buildRagContext(chunks, maxChars = 1200) {
  let out = ''
  for (const c of sanitizeRetrieved(chunks)) {
    const line = `- ${c.title ? `${c.title}: ` : ''}${c.text}\n`
    if (out.length + line.length > maxChars) break
    out += line
  }
  return out.trim()
}

/** Map a Neon `knowledge_base_findings` row → a {title, text} chunk. Pure. */
export function mapFindingRow(r) {
  if (!r) return { title: '', text: '' }
  const tag = r.swc_id ? ` (${r.swc_id})` : ''
  const src = SOURCE_LABELS[r.source] || r.source || 'KB'
  const sev = r.severity ? `[${r.severity}] ` : ''
  const desc = String(r.description || '').replace(/\s+/g, ' ').trim()
  return {
    title: `${sev}${r.title ?? ''}${tag}`.trim(),
    text: desc ? `${desc} (source: ${src})` : '',
  }
}

// Lazily create a Neon SQL client. The dynamic import keeps the driver out of the module graph
// for pure-function tests; tests inject `neonClient` to avoid the driver + network entirely.
async function defaultNeonClient(env) {
  const { neon } = await import('@neondatabase/serverless')
  return neon(env.NEON_DATABASE_URL)
}

/**
 * Retrieve top-K related known findings for a contract from the Neon pgvector KB. Returns
 * {context, used, matches}. Fails safe: a missing binding or any upstream error → empty context
 * (the narrative runs unchanged). `neonClient` is injectable for tests.
 */
export async function retrieveAuditContext(env, query, { topK = 4, neonClient } = {}) {
  if (!env?.NEON_DATABASE_URL || !env?.AI) return { context: '', used: false, matches: 0 }
  try {
    const emb = await env.AI.run(EMBED_MODEL, { text: [String(query || '').slice(0, 6000)] })
    const vector = emb?.data?.[0]
    if (!vector?.length) return { context: '', used: false, matches: 0 }
    const sql = neonClient || (await defaultNeonClient(env))
    const literal = `[${vector.join(',')}]`
    // Corpus spans Solodit, Sherlock, DeFiHackLabs, and a vulns DB — one table, tagged by
    // `source`. Guard NULL embeddings; cosine distance (`<=>`) with the bge-m3 query vector.
    const rows = await sql`
      SELECT title, description, severity, swc_id, source
      FROM knowledge_base_findings
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${literal}::vector
      LIMIT ${topK}
    `
    const chunks = (rows || []).map(mapFindingRow).filter((c) => c.text)
    const context = buildRagContext(chunks)
    return { context, used: context.length > 0, matches: chunks.length }
  } catch {
    return { context: '', used: false, matches: 0 }
  }
}

export { VULN_CORPUS }
