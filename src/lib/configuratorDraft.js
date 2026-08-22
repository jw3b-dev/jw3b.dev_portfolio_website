/*
 * Survive a reload  ·  full-stack-integrator  (brief 08, next-need 1)
 *
 * The offline queue protects a SUBMITTED request (BR-11). A half-finished configuration was not
 * protected at all: four steps of answers vanished on refresh — and the visitor most likely to
 * reload is the one thinking hardest about spending money.
 *
 * WHY sessionStorage AND WHY THIS IS NOT A CONSENT PROBLEM. ADR-P5-01 keeps the site free of
 * cookies and tracking storage so no consent banner is required. ePrivacy Art 5(3) exempts storage
 * "strictly necessary" for a service the user explicitly requested — which is exactly what a
 * visitor's own in-progress form is. This is the same class as `engagementQueue`, which already
 * writes the visitor's own submission to localStorage under BR-11.
 *
 * It is deliberately weaker than that precedent, though:
 *   · sessionStorage, not localStorage — it dies with the tab, which is the least that solves
 *     "survive a reload". A configuration that outlived the browser would be storing someone's
 *     commercial intent for no reason they asked for.
 *   · answer KEYS only, never contact details. Nothing here identifies a person.
 *   · no identifier of any kind is written, so nothing can correlate two visits.
 *
 * Pure and dependency-injectable; every function fails closed to "no draft" rather than throwing,
 * because a storage error must never take the configurator down.
 */
export const DRAFT_KEY = 'jw3b:configurator-draft'

/** Only these keys are ever persisted. A field not on this list cannot be written by accident. */
export const DRAFT_FIELDS = Object.freeze(['objective', 'engagement', 'assessment', 'step'])

const defaultStorage = () => (typeof sessionStorage !== 'undefined' ? sessionStorage : null)

/** PURE-ish — keep only the allowed fields, and only plain values. */
export function shapeDraft(state = {}) {
  const out = {}
  for (const k of DRAFT_FIELDS) {
    const v = state[k]
    if (v === null || v === undefined) continue
    if (k === 'assessment') {
      if (typeof v !== 'object' || Array.isArray(v)) continue
      // Assessment is a flat map of answer keys; drop anything that is not a string answer.
      const a = {}
      for (const [ak, av] of Object.entries(v)) if (typeof av === 'string') a[ak] = av
      if (Object.keys(a).length) out.assessment = a
      continue
    }
    if (k === 'step') {
      if (Number.isFinite(v)) out.step = Math.max(0, Math.trunc(v))
      continue
    }
    if (typeof v === 'string') out[k] = v
  }
  return out
}

/** Write the draft. No-ops when there is nothing worth keeping, so an empty form stores nothing. */
export function saveDraft(state, storage = defaultStorage()) {
  if (!storage) return false
  const shaped = shapeDraft(state)
  try {
    if (!Object.keys(shaped).length) {
      storage.removeItem(DRAFT_KEY)
      return false
    }
    storage.setItem(DRAFT_KEY, JSON.stringify(shaped))
    return true
  } catch {
    // Private mode, quota, disabled storage — the configurator still works, it just forgets.
    return false
  }
}

/** Read the draft. Always returns a shaped object; `{}` when there is nothing or it is unreadable. */
export function loadDraft(storage = defaultStorage()) {
  if (!storage) return {}
  try {
    const raw = storage.getItem(DRAFT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Re-shape on READ as well as write: a draft written by an older build must not be able to
    // reintroduce a field this version no longer persists.
    return shapeDraft(parsed && typeof parsed === 'object' ? parsed : {})
  } catch {
    return {}
  }
}

/** Forget it — called on successful submit, so a completed request leaves nothing behind. */
export function clearDraft(storage = defaultStorage()) {
  if (!storage) return
  try {
    storage.removeItem(DRAFT_KEY)
  } catch {
    /* nothing to do; the draft expires with the tab regardless */
  }
}
