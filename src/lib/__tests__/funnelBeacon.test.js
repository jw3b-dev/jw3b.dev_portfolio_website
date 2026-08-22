/*
 * funnelBeacon (brief 01, next-need 1).
 *
 * On a site whose privacy position is load-bearing, the tests that matter are about what is NOT
 * sent: no identifier, nothing outside the closed vocabularies, nothing written to the device,
 * and nothing at all from an origin the Worker would reject.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportFunnel, shouldSend, resetBeacon, BEACON_SURFACES, BEACON_EVENTS } from '../funnelBeacon.js'

const allow = () => true
const ok = () => vi.fn().mockResolvedValue({ ok: true, status: 204 })

beforeEach(() => resetBeacon())

describe('reportFunnel — the body carries two enums and nothing else', () => {
  it('sends only surface and event', async () => {
    const fetchImpl = ok()
    await reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: allow })
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(Object.keys(body).sort()).toEqual(['event', 'surface'])
    expect(body).toEqual({ surface: 'home', event: 'tool_run' })
  })

  it('drops anything outside the closed vocabularies', async () => {
    const fetchImpl = ok()
    await reportFunnel('evil-surface', 'tool_run', { fetchImpl, originAllowed: allow })
    await reportFunnel('home', 'exfiltrate', { fetchImpl, originAllowed: allow })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('reportFunnel — at most once per page load, and never via storage', () => {
  it('sends once and then stops', async () => {
    const fetchImpl = ok()
    for (let i = 0; i < 5; i++) await reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: allow })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('writes nothing to localStorage or sessionStorage — an identifier is what we refuse to have', async () => {
    const before = [Object.keys(localStorage).length, Object.keys(sessionStorage).length]
    await reportFunnel('audit', 'tool_run', { fetchImpl: ok(), originAllowed: allow })
    expect([Object.keys(localStorage).length, Object.keys(sessionStorage).length]).toEqual(before)
  })

  it('treats different pairs independently', async () => {
    const fetchImpl = ok()
    await reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: allow })
    await reportFunnel('home', 'surface_view', { fetchImpl, originAllowed: allow })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})

describe('reportFunnel — never becomes a dependency of the thing it measures', () => {
  it('sends NOTHING from an origin the Worker would reject', async () => {
    const fetchImpl = ok()
    await reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: () => false })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('resolves false instead of throwing when the request fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: allow })).resolves.toBe(false)
  })

  it('resolves false with NO fetch at all', async () => {
    // `fetchImpl: null` alone does not test this — it falls through to the global, and jsdom
    // provides one. The same trap caught livenessClient's version of this test.
    const real = globalThis.fetch
    globalThis.fetch = undefined
    try {
      await expect(reportFunnel('home', 'tool_run', { fetchImpl: null, originAllowed: allow })).resolves.toBe(false)
    } finally {
      globalThis.fetch = real
    }
  })

  it('uses keepalive, so closing the tab does not lose the event', async () => {
    const fetchImpl = ok()
    await reportFunnel('home', 'tool_run', { fetchImpl, originAllowed: allow })
    expect(fetchImpl.mock.calls[0][1].keepalive).toBe(true)
  })
})

describe('shouldSend', () => {
  it('accepts every declared pair', () => {
    for (const s of BEACON_SURFACES) for (const e of BEACON_EVENTS) expect(shouldSend(s, e, new Set())).toBe(true)
  })
  it('rejects a pair already seen', () => {
    expect(shouldSend('home', 'tool_run', new Set(['home:tool_run']))).toBe(false)
  })
})
