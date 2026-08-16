import { describe, it, expect } from 'vitest'
import { resolveEscrowPhase, escrowSubmission, milestoneHash } from '../escrowFlow.js'

describe('resolveEscrowPhase — the escrow product-state set (FR-035) + simulate-first (FR-027)', () => {
  const base = { provisioned: true, connected: true, correctChain: true }

  it('unprovisioned → degrade to the floor before anything else', () => {
    const r = resolveEscrowPhase({ ...base, provisioned: false, connected: false })
    expect(r).toEqual({ phase: 'unprovisioned', reason: null, degrade: true })
  })

  it('gates on wallet + chain before the tx lifecycle', () => {
    expect(resolveEscrowPhase({ ...base, connected: false }).phase).toBe('disconnected')
    expect(resolveEscrowPhase({ ...base, correctChain: false }).phase).toBe('wrong-chain')
  })

  it('simulate-first: no write phase is reachable until simulation succeeds', () => {
    expect(resolveEscrowPhase({ ...base, sim: { loading: true } }).phase).toBe('simulating')
    expect(resolveEscrowPhase({ ...base, sim: {} }).phase).toBe('simulating') // default: never "ready"
    expect(resolveEscrowPhase({ ...base, sim: { ready: true } }).phase).toBe('ready')
  })

  it('a simulate revert blocks the write and surfaces the reason + floor', () => {
    const r = resolveEscrowPhase({ ...base, sim: { error: { shortMessage: 'insufficient allowance' } } })
    expect(r.phase).toBe('blocked')
    expect(r.reason).toBe('insufficient allowance')
    expect(r.degrade).toBe(true)
  })

  it('walks the write→wait lifecycle', () => {
    expect(resolveEscrowPhase({ ...base, sim: { ready: true }, write: { signing: true } }).phase).toBe('signing')
    expect(resolveEscrowPhase({ ...base, write: { pending: true } }).phase).toBe('pending')
    expect(resolveEscrowPhase({ ...base, receipt: { success: true } }).phase).toBe('funded')
  })

  it('a write/receipt error degrades to retry-or-floor with the reason', () => {
    const r = resolveEscrowPhase({ ...base, write: { error: { message: 'user rejected' } } })
    expect(r.phase).toBe('error')
    expect(r.reason).toBe('user rejected')
    expect(r.degrade).toBe(true)
  })

  it('EDGE: no args → treated as unprovisioned floor (never a blank ready state)', () => {
    expect(resolveEscrowPhase().phase).toBe('unprovisioned')
  })
})

describe('escrowSubmission — route=escrow payload (BR-12: no price on the wire)', () => {
  it('carries route + wallet + tx, resolves the tier id, and never a price', () => {
    const s = escrowSubmission(
      { objective: 'audit', engagement: 'project', tier: { id: 't-pro', name: 'Pro', price: '5000' }, assessment: { a: 1 }, contact: 'x@y.z' },
      { wallet: '0xabc', txHash: '0xdeadbeef' },
    )
    expect(s).toMatchObject({ objective: 'audit', engagement: 'project', tier: 't-pro', route: 'escrow', wallet: '0xabc', txHash: '0xdeadbeef' })
    expect(JSON.stringify(s)).not.toMatch(/5000|price/) // the price never travels
  })

  it('EDGE: normalises missing fields to null (uniform record)', () => {
    const s = escrowSubmission(undefined, {})
    expect(s).toMatchObject({ objective: null, tier: null, wallet: null, txHash: null, route: 'escrow' })
  })

  it('accepts a plain string tier id', () => {
    expect(escrowSubmission({ tier: 't-lite' }).tier).toBe('t-lite')
  })
})

describe('milestoneHash — deterministic bytes32', () => {
  it('is a 32-byte hex hash and stable for the same label', () => {
    const h = milestoneHash('phase-1')
    expect(h).toMatch(/^0x[0-9a-f]{64}$/)
    expect(milestoneHash('phase-1')).toBe(h)
    expect(milestoneHash('phase-2')).not.toBe(h)
  })
  it('EDGE: nullish label falls back to a stable default', () => {
    expect(milestoneHash()).toBe(milestoneHash('engagement'))
  })
})
