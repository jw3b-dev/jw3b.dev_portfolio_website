import { describe, it, expect } from 'vitest'
import { validateToolCall, toolCallTarget, TOOL_REGISTRY } from './toolCalls.js'

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
