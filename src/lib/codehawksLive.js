/*
 * jw3b.dev v2 — the LIVE CodeHawks record  ·  full-stack-integrator
 *
 * WHY. The audit record shipped as a hand-copied snapshot and rotted in public: "#124" stayed on
 * the homepage for months after the real rank moved to #152, because a CodeHawks rank is RELATIVE
 * and drifts when other researchers earn EXP. A number a human has to remember to update is a
 * number that will be wrong (mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md).
 *
 * THE SOURCE, traced from the browser. `codehawks.cyfrin.io/trpc/leaderboard.getLeaderboard` is
 * PUBLIC — no cookie, no key, no account. It returns per-researcher `xp`, `highCount`,
 * `mediumCount`, `lowCount`. Verified against the owner's authenticated profile: xp 1430.8 and
 * H8/M5/L4 match exactly.
 *
 * THE KEY IS `profilesId`, NOT the username. His leaderboard row carries `username: null` — the
 * CodeHawks handle is not exposed there — so a username lookup silently finds nothing, which is
 * exactly how the first search "proved" he was absent. `profilesId` is the id in his own profile
 * page's tRPC call: public, stable, and the only thing that actually identifies the row.
 *
 * WHAT IS DELIBERATELY NOT TAKEN FROM HERE: rank. "Rank" is three different numbers depending on
 * which board you read — #152 First Flights (his profile), #155 rankFor12 (getAppStats), #288
 * all-time combined (this endpoint). Publishing one without saying which is how an ambiguous figure
 * becomes a wrong one. EXP and the H/M/L counts are unambiguous and monotonic, so those are the
 * live claims.
 *
 * Pure + injectable: no I/O of its own beyond the fetch you hand it. Never throws — a third party's
 * outage must degrade to "unknown", never to a wrong number or a crash.
 */

/** The owner's Cyfrin profiles id. Public — it appears in his own profile page's API calls. */
export const PROFILES_ID = 'cm2e9us23000nr9xxufv4v9jq'

const ENDPOINT = 'https://codehawks.cyfrin.io/trpc/leaderboard.getLeaderboard'
const PAGE_SIZE = 100

/** Pages to try before giving up. He sat at absolute 288 (page 3) when this was written; the
 *  ceiling is generous because rank drifts downward as newer researchers out-earn older ones. */
export const MAX_PAGES = 12

export function leaderboardUrl(page, pageSize = PAGE_SIZE) {
  const input = JSON.stringify({ 0: { page, pageSize, orderBy: 'xp', range: 'all-time' } })
  return `${ENDPOINT}?batch=1&input=${encodeURIComponent(input)}`
}

/** Pull the rows out of a tRPC batch envelope, tolerating every shape it might not be. */
export function rowsFrom(payload) {
  const data = Array.isArray(payload) ? payload[0]?.result?.data : payload?.result?.data
  const rows = data?.leaderboard
  return Array.isArray(rows) ? rows : []
}

/** The one row that is his, or null. Matched on profilesId — username is null on this board. */
export function findRow(rows, profilesId = PROFILES_ID) {
  return rows.find((r) => r && r.user && r.user.profilesId === profilesId) || null
}

/** Shape a leaderboard row into the record the site renders. */
export function toRecord(row, page) {
  if (!row) return null
  const high = Number(row.highCount) || 0
  const medium = Number(row.mediumCount) || 0
  const low = Number(row.lowCount) || 0
  // Number(null) and Number('') are BOTH 0, which is finite — so a null xp would sail through a
  // bare isFinite check and publish "0 EXP" on the homepage as though it were measured. Reject the
  // empty values explicitly first. (Found by the test that asked for exactly this.)
  if (row.xp === null || row.xp === undefined || row.xp === '') return null
  const xp = Number(row.xp)
  if (!Number.isFinite(xp)) return null
  return {
    xp,
    high,
    medium,
    low,
    validSubmissions: high + medium + low,
    // Absolute position on THIS board only, and labelled as such so it can never be mistaken for
    // the First Flights rank the profile shows.
    allTimePosition: page != null && Number.isFinite(Number(row.position))
      ? (page - 1) * PAGE_SIZE + Number(row.position)
      : null,
  }
}

/**
 * Walk the public leaderboard until his row appears.
 * @returns {Promise<{ok:true, record:object, pagesRead:number} | {ok:false, reason:string}>}
 *   Never throws and never returns a partial number: either the whole record or an honest reason.
 */
export async function fetchLiveRecord({
  fetchImpl,
  profilesId = PROFILES_ID,
  maxPages = MAX_PAGES,
} = {}) {
  const doFetch = fetchImpl
  if (typeof doFetch !== 'function') return { ok: false, reason: 'no-fetch' }

  for (let page = 1; page <= maxPages; page += 1) {
    let payload
    try {
      const res = await doFetch(leaderboardUrl(page))
      if (!res || !res.ok) return { ok: false, reason: `http-${res ? res.status : 'none'}` }
      payload = await res.json()
    } catch {
      return { ok: false, reason: 'unreachable' }
    }
    const rows = rowsFrom(payload)
    // A short page is the end of the board: stop rather than hammering empty pages.
    if (rows.length === 0) return { ok: false, reason: 'not-found' }
    const record = toRecord(findRow(rows, profilesId), page)
    if (record) return { ok: true, record, pagesRead: page }
    if (rows.length < PAGE_SIZE) return { ok: false, reason: 'not-found' }
  }
  return { ok: false, reason: 'not-found' }
}
