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

// Wallet that receives XMTP "E2E" messages sent from the site.
export const XMTP_RECIPIENT =
  import.meta.env.VITE_XMTP_RECIPIENT || '0x937666986F9F588A6EAcD68Cb417937A082fCBA4';
