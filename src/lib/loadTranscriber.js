/*
 * On-device Whisper (transformers.js) loader — P3 live voice.  full-stack-integrator
 * Kept in its own module so the heavy @huggingface/transformers runtime (onnxruntime-web WASM +
 * WebGPU) is a DYNAMIC import: code-split off the boot path, fetched only when the visitor starts a
 * live-voice call. $0/no key — ASR runs on the visitor's device (audio never leaves the browser),
 * and unlike the Web Speech API it works in Brave. Falls back WebGPU → WASM automatically.
 */

// SELF-HOSTED onnxruntime-web runtime (the exact version transformers.js pins — both live in
// node_modules): without an explicit wasmPaths, ORT dynamically imports its .mjs glue from the
// jsdelivr CDN, which the site CSP rightly blocks (script-src is 'self' + Unlock only). ?url
// imports make Vite emit both files as hashed same-origin assets. Relative node_modules paths
// on purpose: the package's `exports` map does not expose ./dist/*, so the bare specifier
// ('onnxruntime-web/dist/…') is unresolvable — a direct file import bypasses the map.
import ortMjsUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm?url'

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
    // Model files come SAME-ORIGIN through the site worker's /hf-models/* mirror (worker.js),
    // not from huggingface.co directly: HF 404s browser requests from *.workers.dev page
    // origins (bot protection), and same-origin needs no CORS and no extra CSP hosts.
    if (typeof window !== 'undefined') env.remoteHost = new URL('/hf-models/', window.location.origin).href
    // With useWasmCache on, transformers wraps the .mjs in a blob: URL and imports THAT —
    // and script-src deliberately has no blob:. Off = a plain same-origin import ('self').
    env.useWasmCache = false
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.proxy = false // ORT on the main thread
      // Same-origin ORT runtime (never the jsdelivr CDN default — CSP blocks it, rightly).
      env.backends.onnx.wasm.wasmPaths = { mjs: ortMjsUrl, wasm: ortWasmUrl }
    }
  } catch {
    /* env shape drift across versions is non-fatal — defaults still work */
  }
}

/** Lazily load the ASR pipeline. `device`: 'webgpu' (fast) or 'wasm' (universal). Never bundled eagerly. */
export async function loadTranscriber({ device = 'wasm', model = WHISPER_MODEL } = {}) {
  const { pipeline, env } = await import('@huggingface/transformers')
  configureEnv(env)
  // WASM: pin fp32. EVERY quantized variant of this repo (default q8/quantized/uint8 — all
  // verified in-browser) ships QDQ-format weights that the pinned onnxruntime-web build fails
  // to load on the wasm EP ("qdq_actions… Missing required scale"). fp32 has no DQ nodes and
  // loads clean. Heavier download — but this is the no-WebGPU FLOOR path only, and the files
  // are edge-cached by the /hf-models/ mirror + browser-cached after the first call. Revisit
  // when the transformers.js ORT pin moves past the QDQ bug.
  const opts = device === 'wasm' ? { device, dtype: 'fp32' } : { device }
  return pipeline('automatic-speech-recognition', model, opts)
}
