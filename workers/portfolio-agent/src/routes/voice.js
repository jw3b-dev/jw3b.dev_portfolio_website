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

/** POST /text-to-speech — { text } in → audio/wav out (Aura). Fail-safe → 204 (widget stays silent). */
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
  if (!env || !env.AI) return new Response(null, { status: 204, headers: corsHeaders })
  try {
    const audio = await env.AI.run(TTS_MODEL, { text, speaker: TTS_SPEAKER })
    return new Response(audio, { headers: { 'Content-Type': 'audio/wav', ...corsHeaders } })
  } catch {
    return new Response(null, { status: 204, headers: corsHeaders }) // client falls back to no audio
  }
}
