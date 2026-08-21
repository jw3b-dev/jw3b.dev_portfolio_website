/*
 * The central rule: a reachability probe may NEVER produce the word "live". Only a completed
 * exchange proves the model answered. If that line blurs, the site claims something it has
 * not verified — the one failure mode this project treats as unforgivable.
 */
import { describe, it, expect } from 'vitest'
import { AGENT_STATUS, statusFromHealth, statusFromExchange, statusLabel, answerProvenance } from '../agentStatus.js'

describe('statusFromHealth — reachability is not an answer', () => {
  it('never returns LIVE, whatever the probe says', () => {
    for (const h of [{ ok: true, ai: true, model: true }, { ok: true, ai: true }, { ok: false }, null]) {
      expect(statusFromHealth(h)).not.toBe(AGENT_STATUS.LIVE)
    }
  })
  it('reports READY when the worker is reachable with its bindings present', () => {
    expect(statusFromHealth({ ok: true, ai: true, model: true })).toBe(AGENT_STATUS.READY)
    expect(statusFromHealth({ ok: true, ai: true, model: false })).toBe(AGENT_STATUS.READY)
  })
  it('reports OFFLINE for a failed probe, a not-ok body, or absent bindings', () => {
    expect(statusFromHealth(null)).toBe(AGENT_STATUS.OFFLINE)
    expect(statusFromHealth({ ok: false })).toBe(AGENT_STATUS.OFFLINE)
    expect(statusFromHealth({})).toBe(AGENT_STATUS.OFFLINE)
    expect(statusFromHealth({ ok: true, ai: false, model: false })).toBe(AGENT_STATUS.OFFLINE)
  })
})

describe('statusFromExchange — the only source of a proven verdict', () => {
  it('maps a real answer to LIVE and a fallback to RECORDED', () => {
    expect(statusFromExchange(false)).toBe(AGENT_STATUS.LIVE)
    expect(statusFromExchange(true)).toBe(AGENT_STATUS.RECORDED)
  })
})

describe('statusLabel', () => {
  it('marks only exchange-derived states as proven', () => {
    expect(statusLabel(AGENT_STATUS.LIVE).proven).toBe(true)
    expect(statusLabel(AGENT_STATUS.RECORDED).proven).toBe(true)
    expect(statusLabel(AGENT_STATUS.READY).proven).toBe(false)
    expect(statusLabel(AGENT_STATUS.OFFLINE).proven).toBe(false)
  })
  it('never calls an unproven state "live"', () => {
    for (const s of [AGENT_STATUS.READY, AGENT_STATUS.OFFLINE, AGENT_STATUS.CHECKING, AGENT_STATUS.UNKNOWN]) {
      expect(statusLabel(s).text.toLowerCase()).not.toMatch(/\blive\b/)
    }
  })
  it('gives every state readable text and a tone, including an unknown one', () => {
    for (const s of [...Object.values(AGENT_STATUS), 'garbage', undefined]) {
      const l = statusLabel(s)
      expect(l.text.length).toBeGreaterThan(0)
      expect(['verified', 'caution', 'muted']).toContain(l.tone)
    }
  })
})

describe('header labels do not duplicate the message-level fallback copy', () => {
  it('the RECORDED header does not repeat "live agent unavailable"', () => {
    // The bubble already carries that sentence; repeating it in the header is noise.
    expect(statusLabel(AGENT_STATUS.RECORDED).text).not.toMatch(/live agent unavailable/i)
  })
})

describe('answerProvenance — every completed reply is labelled', () => {
  it('labels a live answer and a recorded one differently', () => {
    expect(answerProvenance({ role: 'assistant', content: 'x' }).text).toBe('live')
    expect(answerProvenance({ role: 'assistant', content: 'x', degraded: true }).text).toBe('recorded')
  })
  it('labels nothing that is still streaming, from the user, or absent', () => {
    expect(answerProvenance({ role: 'assistant', pending: true })).toBeNull()
    expect(answerProvenance({ role: 'user', content: 'hi' })).toBeNull()
    expect(answerProvenance(null)).toBeNull()
    expect(answerProvenance(undefined)).toBeNull()
  })
})
