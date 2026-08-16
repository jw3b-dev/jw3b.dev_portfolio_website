/*
 * jw3b.dev v2 — CLAIMS-GATE core (FR-043/046/047, BR-01/02, ADR-09)  ·  domain-engine (P0-07)
 * Pure validation logic for the evidence register (DE-07). No I/O — the CI script
 * (scripts/claims-gate.mjs) and the runtime loader (claimsRegister.js) both call these.
 * THE LAW (design-story §8): a number renders only if it traces to a CLEARED register entry;
 * forbidden claims can never render. This module is what makes that a gate, not a convention.
 */

export const STATUSES = ['cleared', 'requires_resolution', 'forbidden']

// Claims the site must NEVER present as fact (facts/PORTFOLIO_REFERENCE + owner rulings).
export const FORBIDDEN_PATTERNS = [
  /\bTVL\b/i,
  /total value locked/i,
  /protocols?\s+secured/i,
  /\$\s?[\d.,]+\s*[mkb]?\s+(secured|protected|locked|tvl)/i, // "$5M secured", "$1.2B protected"
  /\b\d+\+?\s*audits\s+(completed|done|delivered)/i,
  /\b50\+?\s*audits\b/i,
  /\bPMP\b/i, // "PMP certified" — John holds AgilePM Practitioner, NOT PMP
  /PRINCE2\s+Practitioner/i, // holds PRINCE2 Foundation, not Practitioner
]

export function scanTextForForbidden(text) {
  const s = String(text ?? '')
  return FORBIDDEN_PATTERNS.filter((re) => re.test(s)).map((re) => re.source)
}

/** A claim may render iff it is cleared, has an evidence pointer, and its value isn't forbidden. */
export function isCleared(claim) {
  return !!(
    claim &&
    claim.status === 'cleared' &&
    typeof claim.evidence_pointer === 'string' &&
    claim.evidence_pointer.trim().length > 0 &&
    scanTextForForbidden(claim.value).length === 0
  )
}

/**
 * Validate a whole register. Pure → returns {ok, errors[]}. Every rule failure is CI-blocking.
 * @returns {{ok:boolean, errors:string[]}}
 */
export function validateRegister(register) {
  const errors = []
  if (!register || !Array.isArray(register.claims)) {
    return { ok: false, errors: ['register.claims must be an array'] }
  }
  const seen = new Set()
  for (const c of register.claims) {
    const id = c && c.id ? c.id : '(missing id)'
    if (!c || typeof c.id !== 'string' || !c.id) errors.push(`${id}: missing id`)
    if (seen.has(c.id)) errors.push(`${id}: duplicate id`)
    seen.add(c.id)
    if (typeof c.value !== 'string' || c.value === '') errors.push(`${id}: missing value`)
    if (typeof c.label !== 'string' || c.label === '') errors.push(`${id}: missing label`)
    if (!STATUSES.includes(c.status)) errors.push(`${id}: status must be one of ${STATUSES.join('|')}`)
    if (c.status === 'cleared') {
      if (!c.evidence_pointer || !String(c.evidence_pointer).trim()) {
        errors.push(`${id}: cleared claims MUST carry an evidence_pointer (FR-043)`)
      }
      const forbidden = scanTextForForbidden(c.value)
      if (forbidden.length) errors.push(`${id}: cleared value matches a FORBIDDEN pattern (${forbidden.join(', ')}) (BR-02)`)
    }
  }
  return { ok: errors.length === 0, errors }
}
