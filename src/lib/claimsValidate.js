/*
 * jw3b.dev v2 — CLAIMS-GATE core (FR-043/046/047, BR-01/02, ADR-09)  ·  domain-engine (P0-07)
 * Pure validation logic for the evidence register (DE-07). No I/O — the CI script
 * (scripts/claims-gate.mjs) and the runtime loader (claimsRegister.js) both call these.
 * THE LAW (design-story §8): a number renders only if it traces to a CLEARED register entry;
 * forbidden claims can never render. This module is what makes that a gate, not a convention.
 */

export const STATUSES = ['cleared', 'requires_resolution', 'forbidden']

// Claims the site must NEVER present as fact (facts/PORTFOLIO_REFERENCE + owner rulings).
/*
 * The blocklist, with REASONS. Each rule carries a `why` written for a reader, because the list of
 * claims this site refuses to make is one of the more persuasive things on it — and it was never
 * shown anywhere (brief 02, next-need 2). The gate demo let a visitor test a phrase; nothing just
 * stated the rules.
 *
 * The `why` text is itself scanned by `claimsValidate.test.js`: a reason that TRIPS its own rule
 * would fail the claims gate the moment it rendered, so every reason is worded around the pattern
 * it explains. That constraint is why some of them read slightly sideways.
 */
export const FORBIDDEN_RULES = Object.freeze([
  { pattern: /\bTVL\b/i, why: 'A total-value figure for anything this work touched. There is no audited number, so there is no number.' },
  { pattern: /total value locked/i, why: 'The same figure, spelled out.' },
  { pattern: /protocols?\s+secured/i, why: 'A count of protocols described as made safe by this work. An audit screens; it does not secure.' },
  { pattern: /\$\s?[\d.,]+\s*[mkb]?\s+(secured|protected|locked|tvl)/i, why: 'A currency amount described as protected or locked. Same reason — unverifiable, so unsaid.' },
  { pattern: /\b\d+\+?\s*audits\s+(completed|done|delivered)/i, why: 'An audit count. The citable record is one public contest, listed in the register; a larger number would be an invention.' },
  { pattern: /\b50\+?\s*audits\b/i, why: 'The specific inflated count that appeared in an early draft.' },
  { pattern: /\bdollar\s+bounties\b/i, why: 'Bounty totals in currency. Register forbidden entry #1.' },
  { pattern: /\bPMP\b/i, why: 'A project-management certification John does not hold. He holds AgilePM Practitioner, which the register cites.' },
  { pattern: /PRINCE2\s+Practitioner/i, why: 'PRINCE2 at the higher level. Foundation is what is held and verified.' },
  { pattern: /\bNeo4j\s+GDS\b/i, why: 'A Neo4j graph-data-science credential that does not exist among the verified GraphAcademy certificates. Register forbidden entry #5.' },
  { pattern: /\bcombined\s+(experience|expertise)\b/i, why: 'Pooled-years inflation — "decades of … experience" summed across people or roles. Register forbidden entry #6.' },
])

/** The patterns alone — the shape every existing caller expects. */
export const FORBIDDEN_PATTERNS = FORBIDDEN_RULES.map((r) => r.pattern)

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
