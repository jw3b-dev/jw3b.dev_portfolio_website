/*
 * jw3b.dev v2 — application motion system (P1-12 · FR-007 / NFR-05)  ·  frontend-engineer
 * Layered ON the brand token source (styles/motion.js, P0-03): this is the reusable Framer
 * PRESET + BUDGET layer every animated surface imports, so motion stays uniform and within a
 * stated budget. Reduced motion is honored two ways, both structural (→ 100% of surfaces):
 *   1. Framer: <MotionConfig reducedMotion="user"> mounted app-wide (App.jsx) neutralises
 *      transform/layout animation for every motion component beneath it.
 *   2. CSS: the `motion-safe:` variant gates every hand-written transition/animation class.
 * `motionSafe()` is the imperative escape hatch for the few surfaces that branch in JS.
 */
import { duration, ease, stagger, prefersReducedMotion } from '../styles/motion.js'

export { duration, ease, stagger, prefersReducedMotion }

// The stated motion budget (OBJ-06 / FR-007). Presets and reviews are checked against this;
// anything outside it is a design question, not a new preset.
export const MOTION_BUDGET = Object.freeze({
  // Only cheap, compositor-friendly properties animate — never layout (width/height/top/left).
  allowedProperties: ['opacity', 'transform'],
  // Entrances rise at most this far; motion is a signal, not a journey.
  maxTranslatePx: 12,
  // Nothing animates longer than the 'slow' token…
  maxDurationSec: duration.slow,
  // …except the single sanctioned looping element: the liveness tick.
  loopExceptions: ['liveness-pulse'],
  // One rise/fade per section on scroll-in, once — never a cascade of concurrent entrances.
  concurrentSectionEntrances: 1,
})

// Reusable presets — props objects spread onto <motion.*>. All bound to tokens, all within
// budget (opacity + ≤12px rise, ≤ slow). Never hand-author a duration/easing in a component.

// The one sanctioned section entrance: small rise + fade, out-expo, ONCE on scroll-in.
export const fadeRise = {
  initial: { opacity: 0, y: MOTION_BUDGET.maxTranslatePx },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: duration.entrance, ease: ease.outExpo },
}

// Plain cross-fade for mount/enter of small elements (no transform).
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: duration.instant },
}

// The verdict resolve: a single ≤200ms settle, then perfectly still.
export const verdictResolve = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.verdict, ease: ease.standard },
}

/*
 * Imperative reduced-motion guard for surfaces that branch in JS rather than lean on
 * <MotionConfig>. Given the user's preference, returns props that hold the FINAL (animate/
 * whileInView) state with zero transform and zero duration — motion removed, content intact.
 * Pass `reduced = prefersReducedMotion()` at the call site (kept as a param so it's pure/testable).
 */
export function motionSafe(reduced, preset) {
  if (!reduced) return preset
  const settled = preset.animate ?? preset.whileInView ?? {}
  // Strip any translate/scale from the settled state so nothing "jumps" into place either.
  const { x: _x, y: _y, scale: _scale, ...visualRest } = settled
  return { initial: false, animate: visualRest, transition: { duration: 0 } }
}
