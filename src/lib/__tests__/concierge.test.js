import { describe, it, expect } from 'vitest'
import {
  safeConversationId,
  toAnthropicMessages,
  lastUserText,
  anthropicDelta,
  workersAiDelta,
  anthropicGatewayUrl,
  CONCIERGE_SYSTEM_FALLBACK,
} from '../../../workers/portfolio-agent/src/routes/concierge.js'

describe('safeConversationId', () => {
  it('keeps a well-formed id, mints otherwise', () => {
    expect(safeConversationId('a1b2c3d4-0000-1111-2222-333344445555', 'MINT')).toMatch(/^a1b2/)
    expect(safeConversationId('', 'MINT')).toBe('MINT')
    expect(safeConversationId('spaces not allowed!', 'MINT')).toBe('MINT')
    expect(safeConversationId(42, 'MINT')).toBe('MINT')
  })
})

describe('toAnthropicMessages', () => {
  it('filters non user/assistant turns and clamps content', () => {
    const out = toAnthropicMessages([
      { role: 'system', content: 'ignore me' },
      { role: 'user', content: 'x'.repeat(5000) },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 42 },
    ])
    expect(out).toHaveLength(2)
    expect(out[0].role).toBe('user')
    expect(out[0].content.length).toBe(4000)
    expect(out[1]).toEqual({ role: 'assistant', content: 'ok' })
  })

  it('caps to the last 20 turns and tolerates junk input', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ role: 'user', content: `m${i}` }))
    expect(toAnthropicMessages(many)).toHaveLength(20)
    expect(toAnthropicMessages(null)).toEqual([])
  })
})

describe('lastUserText', () => {
  it('returns the most recent user turn, clamped', () => {
    expect(
      lastUserText([
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
      ]),
    ).toBe('second')
    expect(lastUserText([{ role: 'assistant', content: 'no user' }])).toBe('')
    expect(lastUserText([])).toBe('')
  })
})

describe('anthropicDelta', () => {
  it('extracts text_delta and ignores everything else', () => {
    expect(
      anthropicDelta(JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'hi' } })),
    ).toBe('hi')
    expect(anthropicDelta(JSON.stringify({ type: 'message_stop' }))).toBe('')
    expect(anthropicDelta('[DONE]')).toBe('')
    expect(anthropicDelta('not json')).toBe('')
    expect(anthropicDelta('')).toBe('')
  })
})

describe('workersAiDelta', () => {
  it('reads {response} frames, ignores [DONE] and junk', () => {
    expect(workersAiDelta(JSON.stringify({ response: 'tok' }))).toBe('tok')
    expect(workersAiDelta('[DONE]')).toBe('')
    expect(workersAiDelta('{bad')).toBe('')
  })
})

describe('anthropicGatewayUrl', () => {
  it('builds the gateway URL only when account + gateway are set', () => {
    expect(anthropicGatewayUrl({ CF_ACCOUNT_ID: 'acct', AI_GATEWAY: 'gw' })).toBe(
      'https://gateway.ai.cloudflare.com/v1/acct/gw/anthropic/v1/messages',
    )
    expect(anthropicGatewayUrl({ AI_GATEWAY: 'gw' })).toBeNull()
    expect(anthropicGatewayUrl({})).toBeNull()
  })
})

describe('system prompt seam', () => {
  it('instructs against fabricating claims and carries no stat figures (P1-03 owns the KB)', () => {
    expect(CONCIERGE_SYSTEM_FALLBACK).toMatch(/never invent/i)
    // No hand-authored statistics in the seam prompt (a brand token like "JW3B" is fine).
    expect(CONCIERGE_SYSTEM_FALLBACK).not.toMatch(/\b\d[\d,.]*\b/)
  })
})
