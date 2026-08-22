/**
 * portfolio-agent Worker endpoints (v2).
 *
 * Every value here is PUBLIC — the Worker URL is visible in network traffic.
 * Override per-environment with the `VITE_PORTFOLIO_AGENT_URL` Vite env var; the
 * default targets production. This module is the single source of truth for the
 * Worker origin + route paths: hooks/components import these, they never
 * re-hardcode the origin. (The XMTP recipient is centralized here too when the
 * P3-01 messaging feature lands.)
 */

const DEFAULT_WORKER_URL = 'https://portfolio-agent.agilegypsy.workers.dev'

export const WORKER_URL = import.meta.env.VITE_PORTFOLIO_AGENT_URL || DEFAULT_WORKER_URL

// Concierge chat streams off the Worker root (POST /).
export const AGENT_CHAT_URL = WORKER_URL

// AI security console + tools.
export const AGENT_AUDIT_URL = `${WORKER_URL}/audit`
export const AGENT_FUZZ_URL = `${WORKER_URL}/fuzz`
export const AGENT_TX_URL = `${WORKER_URL}/tx-explain`

// Liveness for the concierge status indicator — cheap, no model call.
export const AGENT_HEALTH_URL = `${WORKER_URL}/health`

// Voice (Whisper STT / Aura TTS).
export const AGENT_STT_URL = `${WORKER_URL}/speech-to-text`
export const AGENT_TTS_URL = `${WORKER_URL}/text-to-speech`

// Capture-the-Vault CTF.
export const AGENT_CTF_VERIFY_URL = `${WORKER_URL}/ctf/verify`
export const AGENT_CTF_LEADERBOARD_URL = `${WORKER_URL}/ctf/leaderboard`

/*
 * Knowledge base — the public audit corpus (Solodit, Sherlock, DeFiHackLabs, a vulns DB),
 * semantically searchable and traversable by relationship.
 *
 * These three routes shipped in the Worker, deployed and returning real data, and NOTHING in the
 * client called them — not even these constants existed. That is the same failure the site keeps
 * finding elsewhere (a lead written to a table nobody read, a walkthrough artifact rendered by
 * nobody): a capability that exists and is unreachable is indistinguishable, to a visitor, from
 * one that was never built.
 */
export const AGENT_KB_SEARCH_URL = `${WORKER_URL}/kb/search`
export const AGENT_KB_RELATED_URL = `${WORKER_URL}/kb/related`
export const AGENT_KB_STATS_URL = `${WORKER_URL}/kb/stats`

// Flagship reachability (brief 04). Probed Worker-side: the flagship origins send no CORS
// headers, so the browser cannot read a status from them directly.
export const AGENT_LIVENESS_URL = `${WORKER_URL}/liveness`

// Conversion capture (book-a-call floor + engagement requests).
export const AGENT_ENGAGEMENT_URL = `${WORKER_URL}/engagement`
export const AGENT_BOOK_A_CALL_URL = `${WORKER_URL}/book-a-call`

// XMTP (P3-01 · FR-039): John's inbox recipient for the E2E encrypted `/messages` channel — an
// EOA address (0x…). PUBLIC. Empty until John provisions it, so even with the `xmtp` flag ON the
// channel degrades to the book-a-call floor rather than dead-ending. Override: VITE_XMTP_RECIPIENT.
export const XMTP_RECIPIENT = import.meta.env.VITE_XMTP_RECIPIENT || ''
