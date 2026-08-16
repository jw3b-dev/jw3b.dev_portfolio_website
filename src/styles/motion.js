/*
 * jw3b.dev v2 — Framer Motion tokens  ·  owner: brand-architect (MAS P0-03)
 * Derived from the single JS source (tokens.js). design-story.md §6: motion = signal, not
 * decoration — things move because state changed (a verdict resolving, a stream arriving).
 * Import these; never hand-author a duration or easing in a component.
 */
import { motion as tk } from './tokens.js'

const sec = (ms) => ms / 1000

// Durations in SECONDS (Framer's unit), mirrored from tokens.css --duration-* (ms).
export const duration = {
  instant: sec(tk.durationMs.instant),
  verdict: sec(tk.durationMs.verdict), // signature: asserted → checking → VERIFIED, then STILL
  normal: sec(tk.durationMs.normal),
  entrance: sec(tk.durationMs.entrance), // one rise/fade per section on scroll-in, ONCE
  slow: sec(tk.durationMs.slow),
}

export const ease = tk.ease
export const stagger = tk.stagger

// prefers-reduced-motion: prefer Framer's <MotionConfig reducedMotion="user">; this covers
// imperative cases (NFR-05, FR-007).
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// The one sanctioned section entrance: small rise + fade, out-expo, ONCE on scroll-in.
export const sectionEntrance = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: duration.entrance, ease: ease.outExpo },
}

// The verdict resolve: a single ≤200ms transition to the settled state, then perfectly still.
export const verdictResolve = { transition: { duration: duration.verdict, ease: ease.standard } }
