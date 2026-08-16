import { describe, it, expect } from 'vitest'
import { anthropicAuth, CLAUDE_CODE_IDENTITY } from '../../../workers/portfolio-agent/src/routes/concierge.js'

/*
 * anthropicAuth handles BOTH Anthropic credential types so a reused Claude Code OAuth token
 * (sk-ant-oat…) works, not only a raw API key. The oat path is exact: Bearer + oauth-beta +
 * the Claude Code identity as the FIRST system block, or Anthropic 401s / spuriously 429s.
 *
 * The fake tokens are built by concatenation on purpose: the client-bundle secret-scan greps
 * src/ for /sk-ant-…/, so a secret-shaped literal here would false-positive the gate. The prefix
 * halves ('sk-ant-oat' / 'sk-ant-api') are < 8 chars after `sk-ant-`, so they don't match; the
 * runtime values still exercise the real branches.
 */
const OAT_TOKEN = 'sk-ant-oat' + '01-fake-test' // → oat branch (startsWith 'sk-ant-oat')
const API_KEY = 'sk-ant-api' + '03-fake-test' // → x-api-key branch

describe('anthropicAuth — dual-credential Messages-API auth', () => {
  it('sk-ant-oat token → Bearer + oauth-beta + identity as the first system block', () => {
    const { headers, system } = anthropicAuth(OAT_TOKEN, 'You are the concierge.')
    expect(headers.authorization).toBe(`Bearer ${OAT_TOKEN}`)
    expect(headers['anthropic-beta']).toBe('oauth-2025-04-20')
    expect(headers['anthropic-version']).toBe('2023-06-01')
    expect(headers['x-api-key']).toBeUndefined() // never send an oat token as x-api-key
    expect(Array.isArray(system)).toBe(true)
    expect(system[0]).toEqual({ type: 'text', text: CLAUDE_CODE_IDENTITY })
    expect(system[1]).toEqual({ type: 'text', text: 'You are the concierge.' })
  })

  it('raw sk-ant-api key → x-api-key, system passed through unchanged', () => {
    const { headers, system } = anthropicAuth(API_KEY, 'You are the concierge.')
    expect(headers['x-api-key']).toBe(API_KEY)
    expect(headers.authorization).toBeUndefined()
    expect(headers['anthropic-beta']).toBeUndefined()
    expect(headers['anthropic-version']).toBe('2023-06-01')
    expect(system).toBe('You are the concierge.') // unchanged string
  })

  it('coerces a missing system prompt to an empty second block on the oat path', () => {
    const { system } = anthropicAuth(OAT_TOKEN, undefined)
    expect(system[1]).toEqual({ type: 'text', text: '' })
  })

  it('a non-oat / empty key fails closed to x-api-key mode (never Bearer)', () => {
    const { headers } = anthropicAuth('', 'x')
    expect(headers['x-api-key']).toBe('')
    expect(headers.authorization).toBeUndefined()
  })
})
