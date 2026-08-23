/*
 * jw3b.dev v2 — portfolio-agent Worker (SKELETON)  ·  backend-specialist (MAS P0-06)
 * All 10 route contracts wired as TYPED STUBS (architecture_design/03 §5): validation + CORS +
 * bindings + the SSE tag-protocol contract are real; live AI/D1/on-chain logic lands in P1/P2.
 * CORS is locked to the origin allowlist (NFR-04) — never "*". Secrets come from env only.
 */
import { checkRateLimit, rateLimitedResponse, routeLimit } from './rateLimit.js'
import { handleConcierge } from './routes/concierge.js'
import { handleAudit } from './routes/audit.js'
import { handleEngagement, handleBookACall } from './routes/engagement.js'
import { handleCtfVerify, handleCtfLeaderboard } from './routes/ctf.js'
import { handleKbSearch, handleKbRelated, handleKbStats } from './routes/kbSearch.js'
import { handleLiveness } from './routes/liveness.js'
import { handleCodehawks } from './routes/codehawks.js'
import { handleFuzz } from './routes/fuzz.js'
import { handleTxExplain } from './routes/txExplain.js'
import { handleStt, handleTts } from './routes/voice.js'
import { track } from './funnel.js'
import { runDigest } from './digest.js'

const TXHASH = /^0x[0-9a-fA-F]{64}$/
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOURCE_CAP = 24000 // FR-013: contract source size cap

// ── CORS (locked to allowlist; dev origin only via the DEV_ORIGIN secret, absent in prod) ──
function allowedOrigin(req, env) {
  const origin = req.headers.get('Origin')
  if (!origin) return null // server-to-server (no browser Origin) — CORS N/A
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (env.DEV_ORIGIN) list.push(env.DEV_ORIGIN)
  return list.includes(origin) ? origin : null
}
function cors(req, env) {
  const origin = allowedOrigin(req, env)
  const h = { Vary: 'Origin' }
  if (origin) {
    h['Access-Control-Allow-Origin'] = origin
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    h['Access-Control-Allow-Headers'] = 'Content-Type'
  }
  return h
}
const json = (data, req, env, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(req, env) },
  })
const bad = (msg, req, env, status = 400) => json({ error: msg }, req, env, status) // safe message only

async function readJson(req) {
  try { return await req.json() } catch { return null }
}

export default {
  /*
   * Weekly funnel digest. P5-02 was prioritised first on the argument that nobody knew whether
   * the loops converted; the counters then shipped and were read by nobody, which is the same
   * gap wearing a different hat. Push beats pull — a query in a runbook requires remembering.
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigest(env))
  },

  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    const { pathname } = url
    const method = req.method

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req, env) })

    // Per-IP/per-endpoint rate-limit (D1 fixed window) BEFORE any handler — defense-in-depth
    // behind the AI-Gateway spend ceiling (P1-01, FR-051). Fails open on a DB error.
    const limit = routeLimit(method, pathname)
    if (limit) {
      const rl = await checkRateLimit(env, req, limit.endpoint, Date.now())
      if (rl.limited) {
        return rateLimitedResponse({ retryAfter: rl.retryAfter, sse: limit.sse, headers: cors(req, env) })
      }
    }

    try {
      // ── Concierge ──────────────────────────────────────────────────────────────────────
      if (pathname === '/' && method === 'POST') {
        const b = await readJson(req)
        if (!b || !Array.isArray(b.messages)) return bad('messages[] required', req, env)
        return handleConcierge(req, env, ctx, b, cors(req, env))
      }
      // ── AI security console ─────────────────────────────────────────────────────────────
      if (pathname === '/audit' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.source !== 'string' || !b.source.trim()) return bad('source required', req, env)
        if (b.source.length > SOURCE_CAP) return bad(`source exceeds ${SOURCE_CAP} chars`, req, env, 413)
        track(env, ctx, { surface: 'audit', event: 'tool_run' })
        return handleAudit(req, env, ctx, b, cors(req, env))
      }
      if (pathname === '/fuzz' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.source !== 'string' || !b.source.trim()) return bad('source required', req, env)
        if (b.source.length > SOURCE_CAP) return bad(`source exceeds ${SOURCE_CAP} chars`, req, env, 413)
        track(env, ctx, { surface: 'audit', event: 'tool_run' })
        return handleFuzz(req, env, ctx, b, cors(req, env))
      }
      if (pathname === '/tx-explain' && method === 'POST') {
        const b = await readJson(req)
        if (!b || !TXHASH.test(b.txHash || '')) return bad('valid 0x txHash (64 hex) required', req, env)
        track(env, ctx, { surface: 'audit', event: 'tool_run' })
        return handleTxExplain(req, env, ctx, b, cors(req, env))
      }
      // ── Voice ───────────────────────────────────────────────────────────────────────────
      if (pathname === '/speech-to-text' && method === 'POST') {
        return handleStt(req, env, cors(req, env)) // Whisper STT (ported from v1)
      }
      if (pathname === '/text-to-speech' && method === 'POST') {
        return handleTts(req, env, cors(req, env)) // Aura TTS (ported from v1)
      }
      // ── CTF ───────────────────────────────────────────────────────────────────────────
      if (pathname === '/ctf/verify' && method === 'POST') {
        const b = await readJson(req)
        const out = await handleCtfVerify(req, env, ctx, b)
        return json(out.body, req, env, out.status)
      }
      if (pathname === '/ctf/leaderboard' && method === 'GET') {
        const out = await handleCtfLeaderboard(req, env, ctx)
        return json(out.body, req, env, out.status)
      }
      // Semantic search over the PUBLIC audit-finding corpus on Neon. Reads only
      // `knowledge_base_findings`; the client-work tables next to it are never touched here.
      if (pathname === '/kb/search' && method === 'GET') {
        const out = await handleKbSearch(req, env, ctx, Object.fromEntries(url.searchParams))
        return out.error ? bad(out.error, req, env, out.status) : json(out.body, req, env, out.status)
      }
      // One hop along a relationship (SWC class / protocol / source). Vector search finds an entry
      // point by meaning; this expands it by relationship — the half cosine distance cannot do.
      if (pathname === '/kb/related' && method === 'GET') {
        const out = await handleKbRelated(req, env, ctx, Object.fromEntries(url.searchParams))
        return out.error ? bad(out.error, req, env, out.status) : json(out.body, req, env, out.status)
      }
      // Aggregate audit volume + severity shape. COUNTS ONLY — the underlying tables hold client
      // work, and this route selects no column that could identify a client or a contract.
      if (pathname === '/kb/stats' && method === 'GET') {
        const out = await handleKbStats(req, env, ctx, Object.fromEntries(url.searchParams))
        return json(out.body, req, env, out.status)
      }
      // ── Status ──────────────────────────────────────────────────────────────────────────
      // Cheap liveness for the concierge's own status indicator. Deliberately makes NO model
      // call: it reports whether the Worker is reachable and whether the AI bindings and
      // credential EXIST — never that a given answer will be live, which only an actual
      // exchange can prove. Booleans only; no secret value is echoed.
      // Flagship reachability. Probes a CLOSED allowlist of origins server-side, because the
      // flagship products send no CORS headers and a browser `no-cors` probe returns an opaque
      // response whose status cannot be read — which would let a card print "up" for a 500.
      if (pathname === '/liveness' && method === 'GET') {
        const out = await handleLiveness(req, env, ctx)
        return json(out.body, req, env, out.status)
      }
      /*
       * Client-reported funnel events (brief 01, next-need 1).
       *
       * `track()` only ever saw what reached the Worker, so the HERO'S INSTANT SCREEN — the one
       * surface whose whole claim is "a visitor runs a real screen in under 10 seconds" — was the
       * single thing the funnel could not count. The measurement gap sat exactly on the claim.
       *
       * ADR-P5-01 is preserved: the body carries nothing but a surface and an event, both checked
       * against closed vocabularies by `normalizeEvent`. No identifier, no cookie, no free text —
       * a rejected body simply increments nothing.
       */
      // The live competitive-audit record. Cached in KV and STALE-SERVING on an upstream outage:
      // a number with its age attached beats a blank, and beats the zeros Cyfrin's anonymous
      // stats endpoint returns.
      if (pathname === '/codehawks' && method === 'GET') {
        const out = await handleCodehawks(req, env, ctx)
        return json(out.body, req, env, out.status)
      }

      if (pathname === '/funnel' && method === 'POST') {
        let payload = null
        try {
          payload = await req.json()
        } catch {
          payload = null
        }
        // 204 either way: a beacon must never tell a caller whether it counted, and the client
        // must never branch on it.
        track(env, ctx, { surface: payload?.surface, event: payload?.event })
        return new Response(null, { status: 204, headers: cors(req, env) })
      }

      if (pathname === '/health' && method === 'GET') {
        return json(
          {
            ok: true,
            ai: Boolean(env && env.AI),
            model: Boolean(env && env.ANTHROPIC_API_KEY),
            ts: Math.floor(Date.now() / 1000),
          },
          req,
          env,
          200,
        )
      }

      // ── Conversion ──────────────────────────────────────────────────────────────────────
      if (pathname === '/engagement' && method === 'POST') {
        const b = await readJson(req)
        const out = await handleEngagement(req, env, ctx, b)
        if (!out.error) track(env, ctx, { surface: 'hire-me', event: 'request_submit' })
        return out.error ? bad(out.error, req, env, out.status) : json(out.body, req, env, out.status)
      }
      if (pathname === '/book-a-call' && method === 'POST') {
        const b = await readJson(req)
        const out = await handleBookACall(req, env, ctx, b)
        if (!out.error) track(env, ctx, { surface: 'hire-me', event: 'request_submit' })
        return out.error ? bad(out.error, req, env, out.status) : json(out.body, req, env, out.status)
      }

      return json({ error: 'not found' }, req, env, 404)
    } catch {
      return json({ error: 'internal error' }, req, env, 500) // never leak internals
    }
  },
}
