import { neon } from '@neondatabase/serverless';

// Must match the model the knowledge base was embedded with (KTHULHU lib/engine/rag.ts):
// @cf/baai/bge-m3 → 1024-dim. Query + corpus MUST use the same model.
const EMBEDDING_MODEL = '@cf/baai/bge-m3';

// Embed one query string with Workers AI → a 1024-dim vector.
async function embed(env, text) {
    const res = await env.AI.run(EMBEDDING_MODEL, { text: [text.slice(0, 6000)] });
    return res?.data?.[0] || null;
}

/**
 * Retrieve the top-K historically-similar audit findings from the shared pgvector
 * knowledge base — the ~13k-finding Neon DB reused from the KTHULHU project.
 * Fail-open: any error (no DB URL, embed/query failure) returns [] so the audit
 * still runs without RAG context.
 */
export async function searchKnowledgeBase(env, queryText, topK = 3) {
    if (!env.NEON_DATABASE_URL || !queryText) return [];
    try {
        const vec = await embed(env, queryText);
        if (!vec || !vec.length) return [];
        const literal = `[${vec.join(',')}]`;
        const sql = neon(env.NEON_DATABASE_URL);
        const rows = await sql`
            SELECT title, description, severity, swc_id, source
            FROM knowledge_base_findings
            ORDER BY embedding <=> ${literal}::vector
            LIMIT ${topK}
        `;
        return rows;
    } catch (err) {
        console.error('[rag] knowledge base query failed:', err);
        return [];
    }
}

/** Format retrieved findings as an LLM-digestible precedent block for the audit prompt. */
export function formatKnowledgeContext(rows) {
    if (!rows.length) return '';
    const items = rows
        .map((r, i) => {
            const tag = r.swc_id ? ` (${r.swc_id})` : '';
            const desc = (r.description || '').replace(/\s+/g, ' ').slice(0, 320);
            return `${i + 1}. [${r.severity}] ${r.title}${tag} — ${desc}`;
        })
        .join('\n');
    return (
        `\n\nRELATED KNOWN FINDINGS (retrieved from a ~13k-finding audit knowledge base — treat as ` +
        `precedent, and cite by title/SWC when a finding genuinely matches this code):\n${items}\n`
    );
}
