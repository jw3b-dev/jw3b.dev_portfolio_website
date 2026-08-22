/*
 * Flagship liveness — client half  ·  full-stack-integrator  (brief 04, next-need 3)
 *
 * Reads the Worker's `/liveness` verdict. Degrades to "unknown" on every failure: a card that
 * cannot reach our own probe must say it does not know, never that the flagship is down. Guessing
 * "offline" from our own outage would put a false claim on someone else's product.
 *
 * The labels keep `agentStatus.js`'s distinction, which matters more here than anywhere: the probe
 * establishes REACHABILITY. "Responding" is the strongest honest word for a 200 from a homepage —
 * it is not "working", and no copy on the card may upgrade it.
 */
import { AGENT_LIVENESS_URL } from '../config/worker.js'

export const LIVENESS = Object.freeze({
  UNKNOWN: 'unknown',
  REACHABLE: 'reachable',
  ERRORING: 'erroring',
  UNREACHABLE: 'unreachable',
})

/** PURE — the words and tone for a verdict. Reachability language only, by design. */
export function livenessLabel(state) {
  switch (state) {
    case LIVENESS.REACHABLE:
      return { text: 'Responding', tone: 'verified' }
    case LIVENESS.ERRORING:
      return { text: 'Erroring', tone: 'caution' }
    case LIVENESS.UNREACHABLE:
      return { text: 'Not responding', tone: 'caution' }
    default:
      // Includes our own probe being down — which says nothing about the flagship.
      return { text: 'Status unknown', tone: 'muted' }
  }
}

/**
 * Fetch every flagship verdict.
 * @returns {Promise<{targets:Record<string,{state:string,status:number|null}>, checkedAt:string|null, degraded:boolean}>}
 */
export async function fetchLiveness({ fetchImpl, url = AGENT_LIVENESS_URL, signal } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  const empty = { targets: {}, checkedAt: null, degraded: true }
  if (!doFetch) return empty
  try {
    const res = await doFetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal })
    if (!res || !res.ok) return empty
    const body = await res.json()
    if (!body || typeof body !== 'object' || typeof body.targets !== 'object' || !body.targets) return empty
    return { targets: body.targets, checkedAt: body.checkedAt ?? null, degraded: false }
  } catch {
    return empty
  }
}

/** PURE — one target's state, defaulting to unknown for anything absent or malformed. */
export function stateFor(liveness, key) {
  const t = liveness?.targets?.[key]
  const s = t && typeof t.state === 'string' ? t.state : null
  return Object.values(LIVENESS).includes(s) ? s : LIVENESS.UNKNOWN
}
