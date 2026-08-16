import { describe, it, expect } from 'vitest'
import {
  buildOutgoing,
  shouldDegrade,
  degradedMessage,
  displayText,
  CONCIERGE_REPLAY_KEY,
  BOOK_A_CALL_FALLBACK,
} from '../conciergeClient.js'

describe('buildOutgoing', () => {
  it('keeps prior user/assistant turns and appends the new user text', () => {
    const out = buildOutgoing(
      [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
      ],
      'next',
    )
    expect(out).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'next' },
    ])
  })
  it('drops degraded/empty/non-conversational turns and tolerates junk history', () => {
    const out = buildOutgoing(
      [
        { role: 'system', content: 'x' },
        { role: 'assistant', content: '', pending: true },
        { role: 'assistant', content: '[Recorded run] ...', degraded: true },
        { role: 'user', content: 'real' },
      ],
      'q',
    )
    expect(out).toEqual([
      { role: 'user', content: 'real' },
      { role: 'user', content: 'q' },
    ])
    expect(buildOutgoing(null, 'q')).toEqual([{ role: 'user', content: 'q' }])
  })
})

describe('shouldDegrade — never blank (FR-020)', () => {
  const hdr = (v) => ({ get: (k) => (k === 'X-Replay-Fallthrough' ? v : null) })
  it('degrades on missing response, 503, fallthrough header, or no body', () => {
    expect(shouldDegrade(null)).toBe(true)
    expect(shouldDegrade({ status: 503, headers: hdr(null), body: {} })).toBe(true)
    expect(shouldDegrade({ status: 200, headers: hdr('tier-2'), body: {} })).toBe(true)
    expect(shouldDegrade({ status: 200, headers: hdr(null), body: null })).toBe(true)
  })
  it('streams a healthy 200 with a body', () => {
    expect(shouldDegrade({ status: 200, headers: hdr(null), body: {} })).toBe(false)
    expect(shouldDegrade({ status: 200, body: {} })).toBe(false) // no headers.get
  })
})

describe('degradedMessage', () => {
  it('returns the labelled bundled run when available', () => {
    const m = degradedMessage(CONCIERGE_REPLAY_KEY)
    expect(m.degraded).toBe(true)
    expect(m.offerCall).toBe(true)
    expect(m.content).toMatch(/^\[Recorded run/)
  })
  it('falls back to a book-a-call message when the key is not bundled', () => {
    const m = degradedMessage('no-such-run')
    expect(m.content).toBe(BOOK_A_CALL_FALLBACK)
    expect(m.offerCall).toBe(true)
  })
})

describe('displayText', () => {
  it('strips protocol tags for display', () => {
    expect(displayText('Hello [AUDIO: "hi"] there')).toBe('Hello there')
  })
})
