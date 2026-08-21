import { describe, it, expect } from 'vitest'
import { isSchedulerUrl, schedulerLink } from '../schedulerLink.js'

describe('isSchedulerUrl — the provisioning gate', () => {
  it('accepts a real https booking URL', () => {
    expect(isSchedulerUrl('https://cal.com/jw3b/intro')).toBe(true)
  })
  it('rejects empty, non-string, non-URL and non-https values', () => {
    for (const bad of ['', '   ', null, undefined, 42, 'not a url', 'cal.com/jw3b']) {
      expect(isSchedulerUrl(bad)).toBe(false)
    }
    expect(isSchedulerUrl('http://cal.com/jw3b')).toBe(false) // plaintext → not provisioned
  })
})

describe('schedulerLink', () => {
  const base = 'https://cal.com/jw3b/intro'

  it('returns null when unprovisioned, so the caller shows the floor instead of a dead button', () => {
    expect(schedulerLink('', { contact: 'a@b.com' })).toBeNull()
    expect(schedulerLink('nonsense')).toBeNull()
  })

  it('prefills the email when the contact is an address', () => {
    const u = new URL(schedulerLink(base, { contact: ' dev@example.com ' }))
    expect(u.searchParams.get('email')).toBe('dev@example.com')
  })

  it('does not prefill email from a non-email handle', () => {
    const u = new URL(schedulerLink(base, { contact: '@someHandle' }))
    expect(u.searchParams.has('email')).toBe(false)
  })

  it('adds a context note from tier and objective', () => {
    const u = new URL(schedulerLink(base, { tier: 'Audit Retainer', objective: 'secure a protocol' }))
    expect(u.searchParams.get('notes')).toBe('jw3b.dev — Audit Retainer · secure a protocol')
  })

  it('includes only the context it actually has, and omits notes entirely when it has none', () => {
    expect(new URL(schedulerLink(base, { tier: 'Sprint' })).searchParams.get('notes')).toBe('jw3b.dev — Sprint')
    expect(new URL(schedulerLink(base, {})).searchParams.has('notes')).toBe(false)
    expect(new URL(schedulerLink(base)).searchParams.has('notes')).toBe(false)
  })

  it('preserves existing query params and never clobbers them', () => {
    const withParams = 'https://cal.com/jw3b/intro?email=keep@me.com&notes=mine&duration=30'
    const u = new URL(schedulerLink(withParams, { contact: 'other@x.com', tier: 'T' }))
    expect(u.searchParams.get('email')).toBe('keep@me.com')
    expect(u.searchParams.get('notes')).toBe('mine')
    expect(u.searchParams.get('duration')).toBe('30')
  })
})
