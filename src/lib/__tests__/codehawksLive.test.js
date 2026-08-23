import { describe, it, expect } from 'vitest'
import {
  PROFILES_ID,
  MAX_PAGES,
  leaderboardUrl,
  rowsFrom,
  findRow,
  toRecord,
  fetchLiveRecord,
} from '../codehawksLive.js'

/*
 * The live CodeHawks record.
 *
 * The failure this replaces: a hand-copied "#124" that stayed on the homepage for months after the
 * real number moved. The failure this must not introduce: a third party's outage becoming a wrong
 * number on the site. So every test below is about degrading honestly.
 */
const row = (over = {}) => ({
  position: 88,
  highCount: 8,
  mediumCount: 5,
  lowCount: 4,
  xp: 1430.8,
  user: { profilesId: PROFILES_ID, username: null },
  ...over,
})
const envelope = (rows) => [{ result: { data: { leaderboard: rows } } }]
const res = (payload, ok = true, status = 200) => ({ ok, status, json: async () => payload })
const pad = (n, over = {}) => Array.from({ length: n }, (_, i) => row({ position: i + 1, user: { profilesId: `other-${i}` }, ...over }))

describe('leaderboardUrl', () => {
  it('asks for the xp-ordered all-time board', () => {
    const u = new URL(leaderboardUrl(3))
    const input = JSON.parse(decodeURIComponent(u.searchParams.get('input')))
    expect(input['0']).toMatchObject({ page: 3, pageSize: 100, orderBy: 'xp', range: 'all-time' })
  })
})

describe('rowsFrom — tolerate every shape the envelope might not be', () => {
  it('reads a tRPC batch envelope', () => {
    expect(rowsFrom(envelope([row()]))).toHaveLength(1)
  })
  it('reads an unbatched envelope', () => {
    expect(rowsFrom({ result: { data: { leaderboard: [row()] } } })).toHaveLength(1)
  })
  it('returns [] for junk rather than throwing', () => {
    for (const junk of [null, undefined, {}, [], [{}], 'nope', 42, { result: {} }]) {
      expect(rowsFrom(junk)).toEqual([])
    }
  })
})

describe('findRow — the key is profilesId, NOT username', () => {
  it('finds the row by profilesId', () => {
    expect(findRow([row({ user: { profilesId: 'x' } }), row()])).not.toBeNull()
  })

  it('finds it even though the username is null — the bug that hid him', () => {
    // His leaderboard row carries username: null. A username search finds nothing and looks like
    // a clean "not present" answer, which is precisely how the first search concluded he was absent.
    const r = findRow([row({ user: { profilesId: PROFILES_ID, username: null } })])
    expect(r).not.toBeNull()
    expect(r.user.username).toBeNull()
  })

  it('returns null when absent, and survives malformed rows', () => {
    expect(findRow([])).toBeNull()
    expect(findRow([null, {}, { user: null }, row({ user: { profilesId: 'nope' } })])).toBeNull()
  })
})

describe('toRecord', () => {
  it('derives valid submissions from the severity counts', () => {
    expect(toRecord(row(), 3)).toEqual({
      xp: 1430.8, high: 8, medium: 5, low: 4, validSubmissions: 17, allTimePosition: 288,
    })
  })

  it('computes the ABSOLUTE position — the API position is page-relative', () => {
    // Every page reports position 1-100. Reading it as absolute would have said rank 88, not 288.
    expect(toRecord(row({ position: 1 }), 1).allTimePosition).toBe(1)
    expect(toRecord(row({ position: 1 }), 4).allTimePosition).toBe(301)
  })

  it('omits the position when the page is unknown rather than guessing', () => {
    expect(toRecord(row())?.allTimePosition).toBeNull()
  })

  it('refuses a row with no usable xp instead of publishing a zero', () => {
    expect(toRecord(row({ xp: null }), 1)).toBeNull()
    expect(toRecord(row({ xp: 'abc' }), 1)).toBeNull()
    expect(toRecord(null, 1)).toBeNull()
  })

  it('treats missing severity counts as zero, not NaN', () => {
    const r = toRecord(row({ highCount: undefined, mediumCount: null, lowCount: 4 }), 1)
    expect(r).toMatchObject({ high: 0, medium: 0, low: 4, validSubmissions: 4 })
  })
})

describe('fetchLiveRecord — never throws, never half-answers', () => {
  it('finds the record on a later page and reports how far it walked', async () => {
    const pages = [pad(100), pad(100), [...pad(99), row()]]
    const fetchImpl = async (u) => res(envelope(pages[JSON.parse(decodeURIComponent(new URL(u).searchParams.get('input')))['0'].page - 1]))
    const out = await fetchLiveRecord({ fetchImpl })
    expect(out.ok).toBe(true)
    expect(out.pagesRead).toBe(3)
    expect(out.record.validSubmissions).toBe(17)
  })

  it('reports no-fetch rather than reaching for a global', async () => {
    // A null fetchImpl falling through to jsdom's global fetch has produced false passes on this
    // codebase twice. Assert the refusal explicitly.
    expect(await fetchLiveRecord({ fetchImpl: null })).toEqual({ ok: false, reason: 'no-fetch' })
    expect(await fetchLiveRecord()).toEqual({ ok: false, reason: 'no-fetch' })
  })

  it('reports the HTTP status on a bad response', async () => {
    expect(await fetchLiveRecord({ fetchImpl: async () => res(null, false, 503) }))
      .toEqual({ ok: false, reason: 'http-503' })
  })

  it('reports unreachable when the network throws or the body is not JSON', async () => {
    expect(await fetchLiveRecord({ fetchImpl: async () => { throw new Error('dns') } }))
      .toEqual({ ok: false, reason: 'unreachable' })
    expect(await fetchLiveRecord({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('html') } }) }))
      .toEqual({ ok: false, reason: 'unreachable' })
  })

  it('stops at a short page instead of hammering the end of the board', async () => {
    let calls = 0
    const fetchImpl = async () => { calls += 1; return res(envelope(pad(7))) }
    expect(await fetchLiveRecord({ fetchImpl })).toEqual({ ok: false, reason: 'not-found' })
    expect(calls).toBe(1)
  })

  it('stops on an empty page', async () => {
    let calls = 0
    const fetchImpl = async () => { calls += 1; return res(envelope([])) }
    expect(await fetchLiveRecord({ fetchImpl })).toEqual({ ok: false, reason: 'not-found' })
    expect(calls).toBe(1)
  })

  it('gives up after MAX_PAGES rather than walking forever', async () => {
    let calls = 0
    const fetchImpl = async () => { calls += 1; return res(envelope(pad(100))) }
    expect(await fetchLiveRecord({ fetchImpl })).toEqual({ ok: false, reason: 'not-found' })
    expect(calls).toBe(MAX_PAGES)
  })

  it('honours a different profilesId', async () => {
    const fetchImpl = async () => res(envelope([row({ user: { profilesId: 'someone-else' } })]))
    const out = await fetchLiveRecord({ fetchImpl, profilesId: 'someone-else' })
    expect(out.ok).toBe(true)
  })
})
