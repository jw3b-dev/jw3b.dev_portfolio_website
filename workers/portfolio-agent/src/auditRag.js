/*
 * jw3b.dev v2 — /audit edge-RAG (P2-14 · OD-06)  ·  backend-specialist
 * Retrieves relevant vulnerability knowledge from Cloudflare Vectorize to ground the /audit
 * narrative — "RAG at the edge". The concierge KB is UNTOUCHED (it stays the curated
 * cleared-claims grounding, P1-03); this is /audit-only.
 *
 * Retrieval-safety guard (the load-bearing rule): the /audit index holds VULNERABILITY
 * knowledge, never John's record. `retrievalSafe` drops any retrieved chunk that trips the
 * forbidden-claims patterns OR looks like a bare portfolio metric, so a polluted index can
 * never surface an ungoverned stat into the narrative — claims-gate framing stays on output.
 *
 * Degrades cleanly: with no Vectorize/AI binding it returns empty context and the narrative
 * runs exactly as before (unprovisioned = current behaviour).
 */
import { scanTextForForbidden } from '../../../src/lib/claimsValidate.js'
import { VULN_CORPUS } from '../../../src/data/vuln-corpus/index.js'

const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5'

// A bare portfolio metric — tests/users/EXP/entities/chunks/PRs/findings/audits/plants/etc.
// The /audit narrative retrieves vuln knowledge, never these; this keeps one out if the index
// is ever polluted.
const PORTFOLIO_STAT = /\b\d[\d,]*\+?\s*(tests?|users?|exp|entities|chunks?|prs?|findings?|audits?|plants?|countries)\b/i

/** True only if the text carries no forbidden claim and no bare portfolio metric. */
export function retrievalSafe(text) {
  const s = String(text ?? '')
  return scanTextForForbidden(s).length === 0 && !PORTFOLIO_STAT.test(s)
}

/** Drop any retrieved chunk that fails the safety guard. */
export function sanitizeRetrieved(chunks) {
  return (chunks || []).filter((c) => retrievalSafe(c?.text))
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

/**
 * Retrieve top-K vuln context for a contract. Returns {context, used, matches}. Fails safe:
 * missing binding or any upstream error → empty context (the narrative runs unchanged).
 */
export async function retrieveAuditContext(env, query, { topK = 4 } = {}) {
  if (!env?.VECTORIZE || !env?.AI) return { context: '', used: false, matches: 0 }
  try {
    const emb = await env.AI.run(EMBED_MODEL, { text: [String(query || '').slice(0, 4000)] })
    const vector = emb?.data?.[0]
    if (!vector) return { context: '', used: false, matches: 0 }
    const res = await env.VECTORIZE.query(vector, { topK, returnMetadata: true })
    const chunks = (res?.matches || [])
      .map((m) => ({ title: m?.metadata?.title, text: m?.metadata?.text }))
      .filter((c) => c.text)
    const context = buildRagContext(chunks)
    return { context, used: context.length > 0, matches: chunks.length }
  } catch {
    return { context: '', used: false, matches: 0 }
  }
}

export { VULN_CORPUS }
