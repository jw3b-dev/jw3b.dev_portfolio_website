/*
 * On-device Whisper (transformers.js) loader — P3 live voice.  full-stack-integrator
 * Kept in its own module so the heavy @huggingface/transformers runtime (onnxruntime-web WASM +
 * WebGPU) is a DYNAMIC import: code-split off the boot path, fetched only when the visitor starts a
 * live-voice call. $0/no key — ASR runs on the visitor's device (audio never leaves the browser),
 * and unlike the Web Speech API it works in Brave. Falls back WebGPU → WASM automatically.
 */

// Small, fast English ASR model — good accuracy at a ~tens-of-MB download (cached after first load).
export const WHISPER_MODEL = 'onnx-community/whisper-base'

// Configure the transformers.js runtime exactly once (idempotent). We do NOT probe a local /models
// path (there is none — the model is remote-fetched + cached in the browser), and we keep ORT on the
// main thread rather than its proxy worker: utterances are short (< 15s) so inference is a few
// hundred ms, and one fewer worker keeps the CSP surface (worker-src/blob:) simple for the first cut.
let configured = false
function configureEnv(env) {
  if (configured || !env) return
  configured = true
  try {
    env.allowLocalModels = false // remote-only: skip 404 probes to a non-existent local model dir
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.proxy = false // ORT on the main thread
  } catch {
    /* env shape drift across versions is non-fatal — defaults still work */
  }
}

/** Lazily load the ASR pipeline. `device`: 'webgpu' (fast) or 'wasm' (universal). Never bundled eagerly. */
export async function loadTranscriber({ device = 'wasm', model = WHISPER_MODEL } = {}) {
  const { pipeline, env } = await import('@huggingface/transformers')
  configureEnv(env)
  return pipeline('automatic-speech-recognition', model, { device })
}
