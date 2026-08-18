/*
 * Feature-flag defaults (P1-21 · lead-architect).
 *
 * One source of truth for which surfaces are LIVE. The P1 MVP slice ships the operable
 * thesis — hero, concierge, /audit, four-hat identity, Mission Control, and the
 * book-a-call FLOOR — all ON. The on-chain rails and the XMTP migration are decoupled
 * from launch and stay OFF until John provisions them (OD-03 escrow + Unlock gated on
 * real lock/escrow addresses; CTF = P2; XMTP = P3). A flag is OFF not because the code
 * is missing UI polish but because the honest thing to show a visitor is "not live yet —
 * book a call", never a half-wired dead placeholder (SC-2: 0 hard-broken states).
 *
 * Each flag is overridable per-environment with a `VITE_FEATURE_<NAME>` env var so a
 * preview deploy can light a surface up without a code change — the default is the
 * shipped posture. Booleans only; the env value must be the literal string "true".
 */

// The default posture of every flag on the `v2` MVP. `bookACall` is the guaranteed
// terminal action (BR-11) — it has no OFF state and is listed here only for completeness.
export const FEATURE_DEFAULTS = Object.freeze({
  bookACall: true, // the floor — always available, wallet/chain/Worker-independent
  escrow: false, // P2 · on-chain USDC escrow — needs a deployed escrow address (OD-03)
  unlock: false, // P2 · Unlock Protocol paywall — needs real lock addresses (OD-03)
  ctf: false, // P2 · live on-chain Capture-the-Vault — needs CTF_VAULT_ADDRESS
  xmtp: false, // P3 · @xmtp/browser-sdk E2E messaging migration
  voiceLive: false, // P3 · hands-free real-time voice concierge (on-device Whisper WebGPU→WASM +
  //                    Claude + Aura TTS). $0/no key; each visitor lazy-loads a ~30–75MB ASR model.
  //                    OFF by default; degrades to today's push-to-talk voice.
  consent: false, // P3 · cookie/analytics consent banner (FR-058) — OFF because the site sets NO
  //                 cookies/tracking storage (research: docs/COMPLIANCE_RESEARCH.md Q2). RULE:
  //                 adding any non-essential analytics/marketing storage REQUIRES flipping this ON.
  kointelEmbed: false, // live iframe of kointel.co.za — OFF until the Kointel origin opts jw3b.dev
  //                      in via `frame-ancestors https://jw3b.dev`; else it degrades to the card
  kthulhuEmbed: false, // live iframe of kthulhu.co — the origin already allows `frame-ancestors
  //                      https://jw3b.dev`; turn ON via env on the jw3b.dev deploy (not localhost,
  //                      which the allow-list excludes) to render live; else the recorded card
})

// Resolve one flag: an explicit `VITE_FEATURE_<NAME>=true` env override wins, otherwise
// the shipped default. Anything that is not exactly "true" reads as its default so a
// typo can never silently light up an unprovisioned rail.
export function resolveFlag(name, env = import.meta.env, defaults = FEATURE_DEFAULTS) {
  const snake = name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // book|A, four|Hats
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // A|Call in bookACall
  const key = `VITE_FEATURE_${snake.toUpperCase()}`
  const raw = env?.[key]
  if (raw === 'true') return true
  if (raw === 'false') return false
  return defaults[name] ?? false
}

// The resolved flag set for this build — read once at module load, frozen so no surface
// can mutate another's gate at runtime.
export const FEATURES = Object.freeze(
  Object.fromEntries(Object.keys(FEATURE_DEFAULTS).map((name) => [name, resolveFlag(name)])),
)

// Convenience predicate for route composition and surface gating.
export function isEnabled(name) {
  return FEATURES[name] === true
}
