/*
 * On-device Whisper (transformers.js) loader — P3 live voice.  full-stack-integrator
 * Kept in its own module so the heavy @huggingface/transformers runtime (onnxruntime-web WASM +
 * WebGPU) is a DYNAMIC import: code-split off the boot path, fetched only when the visitor starts a
 * live-voice call. $0/no key — ASR runs on the visitor's device (audio never leaves the browser),
 * and unlike the Web Speech API it works in Brave. Falls back WebGPU → WASM automatically.
 */

// Small, fast English ASR model — good accuracy at a ~tens-of-MB download (cached after first load).
export const WHISPER_MODEL = 'onnx-community/whisper-base'

/** Lazily load the ASR pipeline. `device`: 'webgpu' (fast) or 'wasm' (universal). Never bundled eagerly. */
export async function loadTranscriber({ device = 'wasm', model = WHISPER_MODEL } = {}) {
  const { pipeline } = await import('@huggingface/transformers')
  return pipeline('automatic-speech-recognition', model, { device })
}
