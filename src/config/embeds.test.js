import { describe, it, expect } from 'vitest'
import { framingOriginAllowed } from './embeds.js'
import { SITE } from '../constants/index.js'

/*
 * The flagship products allow-list jw3b.dev only; a blocked cross-origin frame fires load for
 * its own error page, so we must gate the embed on the ACTUAL page origin, not a runtime check.
 */
describe('framingOriginAllowed — flagship embed origin gate', () => {
  it('is true only on the deployed jw3b.dev origin', () => {
    expect(framingOriginAllowed({ location: { origin: SITE.domain } })).toBe(true)
  })

  it('is false on localhost / preview / staging origins', () => {
    expect(framingOriginAllowed({ location: { origin: 'http://localhost:5173' } })).toBe(false)
    expect(framingOriginAllowed({ location: { origin: 'https://jw3b-dev.pages.dev' } })).toBe(false)
    expect(framingOriginAllowed({ location: { origin: 'https://jw3b.dev.evil.com' } })).toBe(false)
  })

  it('is false when there is no window (SSR-safe)', () => {
    expect(framingOriginAllowed(undefined)).toBe(false)
  })
})
