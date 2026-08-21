/*
 * jw3b.dev v2 — Concierge tool-call registry + router (P2-17 · FR-019)  ·  full-stack-integrator
 * The concierge may emit a single [TOOL_CALL] (parsed by the shared tag protocol, P0-04) to
 * route the visitor into Mission Control. This is the CLIENT half: validate the tool-call
 * against a closed registry (unknown/malformed → ignored, never throws) and map it to a route.
 * The model never states a price — pricing lives in Mission Control, sourced from retainer.json
 * (BR-12); the tool-call only OPENS it.
 */

// Closed registry of what the concierge is allowed to trigger. Anything else is ignored.
export const TOOL_REGISTRY = Object.freeze({
  openModal: { types: ['pricing', 'contact'] },
})

/** Return the validated {action, type}, or null for anything unknown/malformed. */
export function validateToolCall(tc) {
  if (!tc || typeof tc !== 'object') return null
  const spec = TOOL_REGISTRY[tc.action]
  if (!spec || !spec.types.includes(tc.type)) return null
  return { action: tc.action, type: tc.type }
}

/**
 * Map a valid tool-call to a client route. Mission Control lives at /hire-me; the type rides
 * as a hash so the configurator can focus the right intent (pricing vs contact).
 * @returns {{path:string, hash:string}|null}
 */
export function toolCallTarget(tc) {
  const v = validateToolCall(tc)
  return v ? { path: '/hire-me', hash: `#${v.type}` } : null
}

/*
 * Did the VISITOR ask for this?
 *
 * The only thing stopping the concierge routing someone to the hire page was a sentence of
 * prompt ("only when it clearly helps"). A small model reads that generously: asked "How do I
 * use the audit page?", it emitted a hire tool-call, and the client navigated. Model judgment is
 * now advisory — this deterministic check on the visitor's own words decides whether the offer
 * is even shown.
 *
 * Deliberately narrow, and deliberately about MONEY AND TIME, not enthusiasm: "this is great" is
 * not a request to be sold to.
 */
const HIRE_INTENT =
  /\b(pric(e|es|ing)|costs?|quotes?|rates?|budgets?|fees?|charges?|hire|hiring|engage|engagement|retainers?|book(ing)?|schedule|calls?|consult\w*|packages?|tiers?|available|availability|work with|working with|start a project)\b/i

/** @returns {boolean} true when the visitor's message is plausibly about buying John's time. */
export function visitorAskedToHire(text) {
  return typeof text === 'string' && HIRE_INTENT.test(text)
}

/**
 * The gate the UI uses: a route offer survives only if BOTH the model proposed it and the
 * visitor's last message actually asked about hiring.
 * @returns {{path:string, hash:string}|null}
 */
export function offerFromToolCall(tc, lastVisitorMessage) {
  return visitorAskedToHire(lastVisitorMessage) ? toolCallTarget(tc) : null
}
