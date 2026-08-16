/*
 * jw3b.dev v2 — portfolio-agent Worker (SKELETON)  ·  backend-specialist (MAS P0-06)
 * All 10 route contracts wired as TYPED STUBS (architecture_design/03 §5): validation + CORS +
 * bindings + the SSE tag-protocol contract are real; live AI/D1/on-chain logic lands in P1/P2.
 * CORS is locked to the origin allowlist (NFR-04) — never "*". Secrets come from env only.
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from './tagProtocol.js'
import { checkRateLimit, rateLimitedResponse, routeLimit } from './rateLimit.js'

const TXHASH = /^0x[0-9a-fA-F]{64}$/
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOURCE_CAP = 24000 // FR-013: contract source size cap
const OBJECTIVES = ['security', 'engineering', 'pm']
const ENGAGEMENTS = ['project', 'retainer']
const ROUTES = ['book_a_call', 'escrow', 'unlock']

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

// Stub SSE: proves the wire contract end-to-end; real inference replaces the body in P1.
function sseStub(label, req, env) {
  const body =
    sseFrame(`[skeleton] ${label} route is wired — live inference lands in P1.`) + SSE_DONE
  return new Response(body, { headers: { ...SSE_HEADERS, ...cors(req, env) } })
}

async function readJson(req) {
  try { return await req.json() } catch { return null }
}

export default {
  async fetch(req, env) {
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
        return sseStub('concierge', req, env)
      }
      // ── AI security console ─────────────────────────────────────────────────────────────
      if (pathname === '/audit' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.source !== 'string') return bad('source required', req, env)
        if (b.source.length > SOURCE_CAP) return bad(`source exceeds ${SOURCE_CAP} chars`, req, env, 413)
        return sseStub('audit', req, env)
      }
      if (pathname === '/fuzz' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.source !== 'string') return bad('source required', req, env)
        if (b.source.length > SOURCE_CAP) return bad(`source exceeds ${SOURCE_CAP} chars`, req, env, 413)
        return sseStub('fuzz', req, env)
      }
      if (pathname === '/tx-explain' && method === 'POST') {
        const b = await readJson(req)
        if (!b || !TXHASH.test(b.txHash || '')) return bad('valid 0x txHash (64 hex) required', req, env)
        return sseStub('tx-explain', req, env)
      }
      // ── Voice ───────────────────────────────────────────────────────────────────────────
      if (pathname === '/speech-to-text' && method === 'POST') {
        return json({ text: '' }, req, env) // stub; Whisper via Workers AI in P2
      }
      if (pathname === '/text-to-speech' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.text !== 'string') return bad('text required', req, env)
        return json({ audio: null }, req, env) // stub; Aura TTS in P2
      }
      // ── CTF ───────────────────────────────────────────────────────────────────────────
      if (pathname === '/ctf/verify' && method === 'POST') {
        const b = await readJson(req)
        if (!b || !ADDRESS.test(b.address || '') || !TXHASH.test(b.txHash || ''))
          return bad('address (40 hex) + txHash (64 hex) required', req, env)
        return json({ solved: false, rank: null, reason: 'skeleton — on-chain verify lands in P2' }, req, env)
      }
      if (pathname === '/ctf/leaderboard' && method === 'GET') {
        return json({ entries: [] }, req, env)
      }
      // ── Conversion ──────────────────────────────────────────────────────────────────────
      if (pathname === '/engagement' && method === 'POST') {
        const b = await readJson(req)
        if (!b) return bad('body required', req, env)
        if (!OBJECTIVES.includes(b.objective)) return bad('invalid objective', req, env)
        if (!ENGAGEMENTS.includes(b.engagement)) return bad('invalid engagement', req, env)
        if (!ROUTES.includes(b.route)) return bad('invalid route', req, env)
        if (typeof b.contact !== 'string' || !b.contact.trim() || b.contact.length > 200)
          return bad('contact required', req, env)
        if (b.contact.includes('@') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.contact))
          return bad('invalid email', req, env)
        if (b.wallet && !ADDRESS.test(b.wallet)) return bad('invalid wallet', req, env)
        return json({ id: crypto.randomUUID(), status: 'submitted' }, req, env) // stub; D1 insert in P1
      }
      if (pathname === '/book-a-call' && method === 'POST') {
        const b = await readJson(req)
        if (!b || typeof b.contact !== 'string' || !b.contact.trim())
          return bad('contact required', req, env)
        return json({ ok: true, scheduler_url: null }, req, env) // stub; scheduler owner-provisioned
      }

      return json({ error: 'not found' }, req, env, 404)
    } catch {
      return json({ error: 'internal error' }, req, env, 500) // never leak internals
    }
  },
}
