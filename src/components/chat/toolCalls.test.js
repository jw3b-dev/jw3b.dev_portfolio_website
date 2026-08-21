import { describe, it, expect } from 'vitest'
import { validateToolCall, toolCallTarget, TOOL_REGISTRY, visitorAskedToHire, offerFromToolCall } from './toolCalls.js'

describe('concierge tool-calls (P2-17 · FR-019)', () => {
  it('validates known actions/types', () => {
    expect(validateToolCall({ action: 'openModal', type: 'pricing' })).toEqual({ action: 'openModal', type: 'pricing' })
    expect(validateToolCall({ action: 'openModal', type: 'contact' })).toEqual({ action: 'openModal', type: 'contact' })
  })
  it('rejects unknown/malformed tool-calls (never acts on them)', () => {
    expect(validateToolCall(null)).toBeNull()
    expect(validateToolCall({ action: 'deleteEverything', type: 'pricing' })).toBeNull()
    expect(validateToolCall({ action: 'openModal', type: 'nope' })).toBeNull()
    expect(validateToolCall({ action: 'openModal' })).toBeNull()
    expect(validateToolCall('string')).toBeNull()
  })
  it('maps a valid tool-call to the Mission Control route', () => {
    expect(toolCallTarget({ action: 'openModal', type: 'pricing' })).toEqual({ path: '/hire-me', hash: '#pricing' })
    expect(toolCallTarget({ action: 'openModal', type: 'contact' }).hash).toBe('#contact')
    expect(toolCallTarget({ action: 'x', type: 'y' })).toBeNull()
  })
  it('the registry is closed (only openModal)', () => {
    expect(Object.keys(TOOL_REGISTRY)).toEqual(['openModal'])
  })
})

/*
 * W2 — the visitor's own words decide whether a hire offer appears (PRODUCT_AUDIT #6).
 *
 * Live reproduction of the defect: asking "How do I use the audit page?" made the concierge emit
 * a hire tool-call, which the client obeyed by navigating away mid-answer. Model judgment is now
 * advisory; this deterministic check is the gate.
 */
describe('visitorAskedToHire — deterministic intent gate', () => {
  it.each([
    'what does an audit cost?',
    'How much do you charge for a retainer?',
    'can I book a call',
    'I want to hire John',
    'what are your rates',
    'are you available in March?',
    'I need a quote for a project',
    'what packages do you offer',
  ])('accepts hire intent: %s', (text) => {
    expect(visitorAskedToHire(text)).toBe(true)
  })

  it.each([
    'How do I use the audit page?', // the exact live failure
    'what is reentrancy?',
    'tell me about KTHULHU',
    'who are you?',
    'this site is great',
    'what did you find in my contract?',
  ])('rejects informational questions: %s', (text) => {
    expect(visitorAskedToHire(text)).toBe(false)
  })

  it('is safe on non-strings', () => {
    expect(visitorAskedToHire(null)).toBe(false)
    expect(visitorAskedToHire(undefined)).toBe(false)
    expect(visitorAskedToHire({})).toBe(false)
  })
})

describe('offerFromToolCall — both sides must agree', () => {
  const tc = { action: 'openModal', type: 'contact' }

  it('offers when the model proposed AND the visitor asked about hiring', () => {
    expect(offerFromToolCall(tc, 'how much does an audit cost?')).toEqual({ path: '/hire-me', hash: '#contact' })
  })

  it('withholds the offer when the visitor asked something informational', () => {
    expect(offerFromToolCall(tc, 'How do I use the audit page?')).toBeNull()
  })

  it('withholds the offer for an invalid tool-call even on a hire question', () => {
    expect(offerFromToolCall({ action: 'nope', type: 'contact' }, 'what are your rates?')).toBeNull()
  })

  it('withholds when there is no visitor message at all', () => {
    expect(offerFromToolCall(tc, undefined)).toBeNull()
  })
})
