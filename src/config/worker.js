/**
 * Portfolio-agent Worker + messaging endpoints.
 *
 * All values here are PUBLIC (no secrets) — the Worker URL and the XMTP
 * recipient are visible in network traffic anyway. Override per-environment
 * via Vite env vars (`VITE_*` in `.env`); the defaults target production.
 */

const DEFAULT_WORKER_URL = 'https://portfolio-agent.agilegypsy.workers.dev';

// Base URL of the Cloudflare Worker (chat, STT, TTS routes hang off this).
export const WORKER_URL = import.meta.env.VITE_PORTFOLIO_AGENT_URL || DEFAULT_WORKER_URL;

export const AGENT_CHAT_URL = WORKER_URL;
export const AGENT_TTS_URL = `${WORKER_URL}/text-to-speech`;
export const AGENT_STT_URL = `${WORKER_URL}/speech-to-text`;
export const AGENT_AUDIT_URL = `${WORKER_URL}/audit`;
export const AGENT_FUZZ_URL = `${WORKER_URL}/fuzz`;
export const AGENT_TX_URL = `${WORKER_URL}/tx-explain`;

// CTF (Capture the Vault) — verify an on-chain reentrancy drain + the leaderboard.
export const AGENT_CTF_VERIFY_URL = `${WORKER_URL}/ctf/verify`;
export const AGENT_CTF_LEADERBOARD_URL = `${WORKER_URL}/ctf/leaderboard`;
