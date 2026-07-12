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
        // Corpus spans Solodit (~6.9k), Sherlock, DeFiHackLabs, and a vulns DB —
        // all in one table, tagged by `source`. Guard NULL embeddings like KTHULHU.
        const rows = await sql`
            SELECT title, description, severity, swc_id, source
            FROM knowledge_base_findings
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${literal}::vector
            LIMIT ${topK}
        `;
        return rows;
    } catch (err) {
        console.error('[rag] knowledge base query failed:', err);
        return [];
    }
}

// Human-readable provenance for each corpus source (raw `source` column values).
const SOURCE_LABELS = {
    solodit_all_findings: 'Solodit',
    sherlock: 'Sherlock',
    defihacklabs: 'DeFiHackLabs',
    vulnerabilities_database: 'Vulns DB',
};

/** Format retrieved findings as an LLM-digestible precedent block for the audit prompt. */
export function formatKnowledgeContext(rows) {
    if (!rows.length) return '';
    const items = rows
        .map((r, i) => {
            const tag = r.swc_id ? ` (${r.swc_id})` : '';
            const src = SOURCE_LABELS[r.source] || r.source || 'KB';
            const desc = (r.description || '').replace(/\s+/g, ' ').slice(0, 320);
            return `${i + 1}. [${r.severity}] ${r.title}${tag} — ${desc} (source: ${src})`;
        })
        .join('\n');
    return (
        `\n\nRELATED KNOWN FINDINGS (retrieved by semantic similarity from a ~9.5k-finding audit ` +
        `knowledge base — Solodit, Sherlock contests, DeFiHackLabs, and a vulnerability database. ` +
        `Treat as precedent, and cite by title/SWC + source when a finding genuinely matches this code):\n${items}\n`
    );
}
