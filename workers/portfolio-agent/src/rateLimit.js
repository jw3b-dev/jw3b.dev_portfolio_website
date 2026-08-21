/*
 * jw3b.dev v2 — per-IP fixed-window rate limiting (P1-01, FR-051, ADR-04)  ·  backend-specialist
 * Defense-in-depth BEHIND the AI-Gateway ceiling (which caps model spend gateway-side): this
 * layer bounds per-IP/per-endpoint request rate in D1 so one visitor can't drain the free tier
 * or hammer a route. Heavier-compute endpoints get tighter budgets. Parameterized UPSERT only.
 * Window math is pure + unit-tested; the D1 I/O is isolated and FAILS OPEN (a portfolio site
 * favors availability — a DB blip must not lock everyone out).
 */
import { SSE_HEADERS, sseFrame, SSE_DONE } from './tagProtocol.js'

export const WINDOW_SEC = 60

// Requests per window, per IP, per endpoint. Tune HERE, never inline at a call site.
export const BUDGETS = {
  chat: 20, // concierge SSE
  audit: 10, // heavy: model narrative over a contract
  fuzz: 10,
  tx_explain: 20,
  stt: 10, // Whisper
  tts: 20, // Aura
  ctf: 15, // on-chain verify
  kb_search: 20, // one bge-m3 embedding per call
  light: 60, // leaderboard / engagement / book-a-call — never throttle the conversion floor hard
}
export const DEFAULT_BUDGET = 30

export function budgetFor(endpoint) {
  return Object.prototype.hasOwnProperty.call(BUDGETS, endpoint) ? BUDGETS[endpoint] : DEFAULT_BUDGET
}

/** PURE — the fixed-window bucket start (unix seconds) for a timestamp. */
export function windowStart(nowMs, windowSec = WINDOW_SEC) {
  const nowSec = Math.floor(nowMs / 1000)
  return nowSec - (nowSec % windowSec)
}

/** Client IP from Cloudflare's TRUSTED header — never a client-settable one. */
export function clientIp(req) {
  return req.headers.get('CF-Connecting-IP') || 'unknown'
}

/**
 * Increment + check the per-IP/per-endpoint counter (parameterized D1 UPSERT).
 * @returns {Promise<{limited:boolean, count:number, budget:number, retryAfter:number}>}
 */
export async function checkRateLimit(env, req, endpoint, nowMs) {
  const budget = budgetFor(endpoint)
  // No DB bound (local dev without D1) → don't block; the Gateway ceiling still applies live.
  if (!env || !env.DB) return { limited: false, count: 0, budget, retryAfter: 0 }
  const ip = clientIp(req)
  const ws = windowStart(nowMs)
  try {
    // Table is rate_limits_v2, NOT rate_limits: the reused production D1 still holds v1's
    // table (PK (ip, window_start), no endpoint column) — v2's 3-column UPSERT against it
    // throws and the limiter silently fails OPEN (caught live in the P3-08 GA sweep: 13×200
    // past a budget of 10). A separate table sidesteps the shared-schema fight; v1 prod
    // keeps its limiter until promotion. Migration: 0002_rate_limits_v2.sql.
    const row = await env.DB.prepare(
      `INSERT INTO rate_limits_v2 (ip, endpoint, window_start, count) VALUES (?1, ?2, ?3, 1)
       ON CONFLICT(ip, endpoint, window_start) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
      .bind(ip, endpoint, ws)
      .first()
    const count = (row && row.count) || 1
    // Data minimization (POPIA §14 / GDPR Art. 5(1)(e), docs/COMPLIANCE_RESEARCH.md Q5): rows
    // hold raw IPs, needed only for the current window. Purge stale windows opportunistically —
    // on the FIRST hit of each key's window (bounds it to one DELETE per key per minute), drop
    // everything older than 10 windows. Fire-and-forget; a purge failure must not block.
    if (count === 1) {
      env.DB.prepare('DELETE FROM rate_limits_v2 WHERE window_start < ?1')
        .bind(ws - 10 * WINDOW_SEC)
        .run()
        .catch(() => {})
    }
    const limited = count > budget
    const retryAfter = limited ? ws + WINDOW_SEC - Math.floor(nowMs / 1000) : 0
    return { limited, count, budget, retryAfter }
  } catch {
    return { limited: false, count: 0, budget, retryAfter: 0 } // fail open — never lock out on a DB error
  }
}

/** Uniform 429 — SSE frame for streaming routes, JSON for the rest. Safe message only. */
export function rateLimitedResponse({ retryAfter, sse = false, headers = {} }) {
  const h = { 'Retry-After': String(Math.max(1, retryAfter || WINDOW_SEC)), ...headers }
  if (sse) {
    return new Response(
      sseFrame('Rate limit reached — please wait a moment and try again.') + SSE_DONE,
      { status: 429, headers: { ...SSE_HEADERS, ...h } },
    )
  }
  return new Response(JSON.stringify({ error: 'rate_limited', retryAfter: retryAfter || WINDOW_SEC }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', ...h },
  })
}

// Which endpoints are rate-limited, their budget key, and whether they stream (SSE).
export const ROUTE_LIMITS = {
  'POST /': { endpoint: 'chat', sse: true },
  'POST /audit': { endpoint: 'audit', sse: true },
  'POST /fuzz': { endpoint: 'fuzz', sse: true },
  'POST /tx-explain': { endpoint: 'tx_explain', sse: true },
  'POST /speech-to-text': { endpoint: 'stt', sse: false },
  'POST /text-to-speech': { endpoint: 'tts', sse: false },
  'POST /ctf/verify': { endpoint: 'ctf', sse: false },
  'GET /ctf/leaderboard': { endpoint: 'light', sse: false },
  // Search embeds the query with Workers AI, so it is metered like the other model-touching
  // routes rather than as a 'light' read. Traversal is pure SQL and costs no inference.
  'GET /kb/search': { endpoint: 'kb_search', sse: false },
  'GET /kb/related': { endpoint: 'light', sse: false },
  'GET /kb/stats': { endpoint: 'light', sse: false },
  'GET /health': { endpoint: 'light', sse: false },
  'POST /engagement': { endpoint: 'light', sse: false },
  'POST /book-a-call': { endpoint: 'light', sse: false },
}

export function routeLimit(method, pathname) {
  return ROUTE_LIMITS[`${method} ${pathname}`] || null
}
