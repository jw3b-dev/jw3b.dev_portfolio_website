/*
 * jw3b.dev v2 — concierge voice (STT + TTS)  ·  backend-specialist  ·  ported from v1
 * Whisper STT + Deepgram Aura TTS via Workers AI (env.AI). FAIL-SAFE: a missing AI binding or any
 * upstream error returns an empty transcript / no audio, so the widget silently stays on text-only
 * — never a passed-through 5xx that crashes the client (upstream-integration rule). No secrets.
 */
export const STT_MODEL = '@cf/openai/whisper'
export const TTS_MODEL = '@cf/deepgram/aura-1'
export const TTS_SPEAKER = 'orion'
const TTS_TEXT_CAP = 1200 // clamp spoken text (cost + latency); the widget sends the [AUDIO] summary

/** Clamp/validate the TTS text payload. Pure. */
export function ttsTextFrom(body) {
  return body && typeof body.text === 'string' ? body.text.slice(0, TTS_TEXT_CAP).trim() : ''
}

/** Deterministic R2 object key for a spoken line: `voice/<sha256(text)>.mp3`. Pure (async digest). */
export async function ttsR2Key(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text || '')))
  return 'voice/' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('') + '.mp3'
}

/**
 * R2 recorded-audio fallback (FR-016): when live TTS is unavailable, serve a PRE-RECORDED clip for
 * this exact line if the recorded-run seeding stored one (keyed by the text hash). Returns a
 * Response or null (→ caller sends 204 and the widget stays silent). Never throws.
 */
async function r2FallbackAudio(env, text, corsHeaders) {
  if (!env || !env.R2 || !text) return null
  try {
    const obj = await env.R2.get(await ttsR2Key(text))
    if (!obj || !obj.body) return null
    return new Response(obj.body, { headers: { 'Content-Type': 'audio/mpeg', 'X-Voice-Tier': 'recorded', ...corsHeaders } })
  } catch {
    return null
  }
}

/** POST /speech-to-text — raw audio bytes in → { text } out (Whisper). Fail-safe → { text: '' }. */
export async function handleStt(req, env, corsHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders }
  if (!env || !env.AI) return new Response(JSON.stringify({ text: '' }), { headers })
  try {
    const audio = await req.arrayBuffer()
    const res = await env.AI.run(STT_MODEL, { audio: Array.from(new Uint8Array(audio)) })
    return new Response(JSON.stringify({ text: (res && res.text) || '' }), { headers })
  } catch {
    return new Response(JSON.stringify({ text: '' }), { headers }) // fail-safe: empty transcript
  }
}

/** POST /text-to-speech — { text } in → audio/mpeg out. `@cf/deepgram/aura-1` returns MP3 (MPEG
 * ADTS), so we MUST label it audio/mpeg — audio/wav made browsers fail with NotSupportedError.
 * Fail-safe → R2 recorded clip, else 204 (widget stays silent). */
export async function handleTts(req, env, corsHeaders = {}) {
  let body = null
  try { body = await req.json() } catch { body = null }
  const text = ttsTextFrom(body)
  if (!text) {
    return new Response(JSON.stringify({ error: 'text required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
  if (!env || !env.AI) return (await r2FallbackAudio(env, text, corsHeaders)) || new Response(null, { status: 204, headers: corsHeaders })
  try {
    const audio = await env.AI.run(TTS_MODEL, { text, speaker: TTS_SPEAKER })
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', ...corsHeaders } })
  } catch {
    return (await r2FallbackAudio(env, text, corsHeaders)) || new Response(null, { status: 204, headers: corsHeaders }) // client falls back to no audio
  }
}
