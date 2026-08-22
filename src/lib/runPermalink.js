/*
 * A shareable run  ·  full-stack-integrator  (brief 05, next-need 2)
 *
 * Export is a local `.md` download — it takes the work away with you but it cannot be sent to a
 * colleague as a thing they can open and check. This makes a run linkable.
 *
 * THE DESIGN DECISION, and it departs from the brief. The brief proposed "source hash + findings,
 * no source stored" — a link carrying the FINDINGS and a hash of the code. That produces a link
 * whose recipient can read a list of claimed findings and verify none of them, on the one surface
 * whose entire argument is that automated results should be reproduced rather than believed.
 *
 * So the link carries the SOURCE, in the URL fragment:
 *   · A fragment is never transmitted to a server — not to ours, not to a proxy, not in a referrer
 *     header. The contract stays between the two people who have the link. Nothing is "stored" in
 *     the brief's sense: there is no row, no id, no retention question, no new data-protection
 *     surface, and the cookieless posture is untouched.
 *   · The recipient's browser RE-RUNS the deterministic screen and derives the findings itself.
 *     The link therefore proves its own claim instead of asserting it, which is the same property
 *     that makes the instant screen trustworthy in the first place.
 *
 * The cost, stated rather than hidden: URL length. Encoding is ~1.37× the source, so the linkable
 * cap is well below the console's own 24k SOURCE_CAP. Past it there is no link and the UI says so
 * and points at the export — an honest refusal, not a truncated contract that would screen
 * differently from the one the sender was looking at.
 */

/** Max SOURCE characters we will put in a link. Keeps the encoded URL comfortably under ~11k. */
export const PERMALINK_CAP = 8000

/** The fragment key, so the reader and writer cannot drift. */
export const PERMALINK_PARAM = 'run'

/** base64url (RFC 4648 §5) — URL-safe, no padding, so nothing needs escaping in a fragment. */
function toBase64Url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Encode a contract for a link.
 * @returns {string|null} the fragment VALUE, or null when the source is absent or too large.
 */
export function encodeRun(source) {
  const src = String(source ?? '')
  if (!src.trim()) return null
  if (src.length > PERMALINK_CAP) return null
  try {
    // TextEncoder, not btoa(src): btoa throws on any character above U+00FF, and Solidity
    // comments legitimately contain them.
    return toBase64Url(new TextEncoder().encode(src))
  } catch {
    return null
  }
}

/**
 * Decode a fragment value back to source.
 * @returns {string|null} null for anything malformed — a bad link must land on an empty console,
 *   never on a half-decoded contract that would screen differently from the sender's.
 */
export function decodeRun(encoded) {
  const e = String(encoded ?? '').trim()
  if (!e) return null
  try {
    const src = new TextDecoder().decode(fromBase64Url(e))
    return src.trim() ? src : null
  } catch {
    return null
  }
}

/**
 * The full URL for a run's source, or null when it cannot be linked.
 * @param {string} source
 * @param {string} base absolute origin+path, e.g. 'https://jw3b.dev/audit'
 */
export function permalinkFor(source, base) {
  const enc = encodeRun(source)
  if (!enc) return null
  return `${String(base || '').replace(/#.*$/, '')}#${PERMALINK_PARAM}=${enc}`
}

/** PURE — pull the encoded run out of a location hash. Tolerates a leading '#' and other keys. */
export function runFromHash(hash) {
  const h = String(hash ?? '').replace(/^#/, '')
  if (!h) return null
  for (const part of h.split('&')) {
    const [k, ...rest] = part.split('=')
    if (k === PERMALINK_PARAM) return decodeRun(rest.join('='))
  }
  return null
}

/** Why a given source cannot be linked — so the UI states a reason instead of hiding a button. */
export function permalinkRefusal(source) {
  const src = String(source ?? '')
  if (!src.trim()) return 'Nothing to link yet.'
  if (src.length > PERMALINK_CAP)
    return `Too large to put in a link (${src.length.toLocaleString()} of ${PERMALINK_CAP.toLocaleString()} characters). Export the report instead.`
  return null
}
