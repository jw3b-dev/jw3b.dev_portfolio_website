import { describe, it, expect } from 'vitest'
import { anthropicAuth, CLAUDE_CODE_IDENTITY } from '../../../workers/portfolio-agent/src/routes/concierge.js'

/*
 * anthropicAuth handles BOTH Anthropic credential types so a reused Claude Code OAuth token
 * (sk-ant-oat…) works, not only a raw API key. The oat path is exact: Bearer + oauth-beta +
 * the Claude Code identity as the FIRST system block, or Anthropic 401s / spuriously 429s.
 */
describe('anthropicAuth — dual-credential Messages-API auth', () => {
  it('sk-ant-oat token → Bearer + oauth-beta + identity as the first system block', () => {
    const { headers, system } = anthropicAuth('sk-ant-oat01-abc', 'You are the concierge.')
    expect(headers.authorization).toBe('Bearer sk-ant-oat01-abc')
    expect(headers['anthropic-beta']).toBe('oauth-2025-04-20')
    expect(headers['anthropic-version']).toBe('2023-06-01')
    expect(headers['x-api-key']).toBeUndefined() // never send an oat token as x-api-key
    expect(Array.isArray(system)).toBe(true)
    expect(system[0]).toEqual({ type: 'text', text: CLAUDE_CODE_IDENTITY })
    expect(system[1]).toEqual({ type: 'text', text: 'You are the concierge.' })
  })

  it('raw sk-ant-api key → x-api-key, system passed through unchanged', () => {
    const { headers, system } = anthropicAuth('sk-ant-api03-xyz', 'You are the concierge.')
    expect(headers['x-api-key']).toBe('sk-ant-api03-xyz')
    expect(headers.authorization).toBeUndefined()
    expect(headers['anthropic-beta']).toBeUndefined()
    expect(headers['anthropic-version']).toBe('2023-06-01')
    expect(system).toBe('You are the concierge.') // unchanged string
  })

  it('coerces a missing system prompt to an empty second block on the oat path', () => {
    const { system } = anthropicAuth('sk-ant-oat01-abc', undefined)
    expect(system[1]).toEqual({ type: 'text', text: '' })
  })

  it('a non-oat / empty key fails closed to x-api-key mode (never Bearer)', () => {
    const { headers } = anthropicAuth('', 'x')
    expect(headers['x-api-key']).toBe('')
    expect(headers.authorization).toBeUndefined()
  })
})
