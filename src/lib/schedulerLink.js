/*
 * jw3b.dev v2 — booking handoff link (P5-01 · FR-036 completion)  ·  full-stack-integrator
 *
 * PURE. Builds the "pick a time" URL shown on the book-a-call confirmation, pre-filling what
 * the visitor already told us so they don't retype it. Kept pure and separate from the
 * component because the confirmation renders OPTIMISTICALLY (BR-11: the floor completes even
 * offline), so this must not depend on a network response — it takes a configured base URL in.
 *
 * Provider-agnostic by design: Cal.com, Calendly and most hosted schedulers accept the same
 * `name`/`email`/`notes` query prefill, and a self-hosted instance later only changes the base
 * URL. `isSchedulerUrl` is the provisioning gate — anything that isn't a real https URL means
 * "not provisioned", and the caller must fall back to the honest floor copy rather than render
 * a dead button.
 */

// Mirrors the validation BookACall.jsx and the Worker already use, so "is this an email?"
// means the same thing on every side. A handle like "@someone" contains an @ but is NOT an
// address — prefilling it would put junk in the booking form.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** True only for a syntactically valid https:// URL — the gate between provisioned and floor. */
export function isSchedulerUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false // not a URL at all
  }
}

/**
 * Build the booking URL with prefill, or null when the scheduler isn't provisioned.
 * Existing query params on the base URL are preserved; ours never clobber a caller's.
 * @returns {string|null}
 */
export function schedulerLink(base, { contact, tier, objective } = {}) {
  if (!isSchedulerUrl(base)) return null
  const url = new URL(base)
  const trimmed = typeof contact === 'string' ? contact.trim() : ''
  const email = EMAIL.test(trimmed) ? trimmed : ''
  if (email && !url.searchParams.has('email')) url.searchParams.set('email', email)

  // Context for John, so the invite arrives already explaining itself. Only include the parts
  // we actually have — an empty or half-built note is worse than none.
  const bits = []
  if (tier) bits.push(String(tier))
  if (objective) bits.push(String(objective))
  if (bits.length && !url.searchParams.has('notes')) {
    url.searchParams.set('notes', `jw3b.dev — ${bits.join(' · ')}`)
  }
  return url.toString()
}
