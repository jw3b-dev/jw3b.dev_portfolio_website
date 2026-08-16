import { describe, it, expect } from 'vitest'
import { routeForTicket, ticketSize, TICKET_THRESHOLD_UNITS } from '../checkoutRouting.js'

const ESCROW_LIVE = { enabled: true, provisioned: true }
const UNLOCK_LIVE = { enabled: true, available: true }

describe('ticketSize — classify by provisioned price (BR-05)', () => {
  it('unknown when no provisioned price', () => {
    expect(ticketSize(null)).toBe('unknown')
    expect(ticketSize(0n)).toBe('unknown')
    expect(ticketSize(-1n)).toBe('unknown')
  })
  it('low below the threshold, high at/above it', () => {
    expect(ticketSize(TICKET_THRESHOLD_UNITS - 1n)).toBe('low')
    expect(ticketSize(TICKET_THRESHOLD_UNITS)).toBe('high')
    expect(ticketSize(TICKET_THRESHOLD_UNITS + 1n)).toBe('high')
  })
})

describe('routeForTicket — FR-032 ticket-size routing + book-a-call on every branch', () => {
  it('retainer/project → escrow when it is live', () => {
    expect(routeForTicket({ engagement: 'retainer', escrow: ESCROW_LIVE }).primary).toBe('escrow')
    expect(routeForTicket({ engagement: 'project', escrow: ESCROW_LIVE }).primary).toBe('escrow')
  })

  it('low-ticket fixed-price → Unlock when it is live', () => {
    expect(routeForTicket({ engagement: 'fixed', unlock: UNLOCK_LIVE }).primary).toBe('unlock')
    expect(routeForTicket({ engagement: 'membership', unlock: UNLOCK_LIVE }).primary).toBe('unlock')
    // classified low by price, no escrow-grade engagement
    expect(routeForTicket({ engagement: 'other', priceUnits: 500_000000n, unlock: UNLOCK_LIVE }).primary).toBe('unlock')
  })

  it('degrades to book-a-call when the preferred rail is flagged off', () => {
    expect(routeForTicket({ engagement: 'project', escrow: { enabled: false, provisioned: true } }).primary).toBe('book_a_call')
    expect(routeForTicket({ engagement: 'fixed', unlock: { enabled: false, available: true } }).primary).toBe('book_a_call')
  })

  it('degrades to book-a-call when the preferred rail is unprovisioned', () => {
    const r = routeForTicket({ engagement: 'retainer', escrow: { enabled: true, provisioned: false } })
    expect(r.primary).toBe('book_a_call')
    expect(r.reason).toMatch(/not live yet/i)
  })

  it('the DEFAULT (nothing provisioned, no args) is the book-a-call floor', () => {
    expect(routeForTicket().primary).toBe('book_a_call')
    expect(routeForTicket({}).reason).toMatch(/floor/i)
  })

  it('an unroutable engagement with no price → book-a-call', () => {
    expect(routeForTicket({ engagement: 'weird' }).primary).toBe('book_a_call')
  })

  it('book-a-call is offered on EVERY branch (FR-032)', () => {
    for (const args of [
      { engagement: 'retainer', escrow: ESCROW_LIVE },
      { engagement: 'fixed', unlock: UNLOCK_LIVE },
      {},
    ]) {
      expect(routeForTicket(args).offerBookACall).toBe(true)
    }
  })

  it('high-ticket price forces escrow even for a non-standard engagement', () => {
    expect(routeForTicket({ engagement: 'other', priceUnits: 5_000_000000n, escrow: ESCROW_LIVE }).primary).toBe('escrow')
  })
})
