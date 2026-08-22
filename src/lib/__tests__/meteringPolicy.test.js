/*
 * P5-05 — the metered-tool policy.
 *
 * The load-bearing assertions here are about what the policy REFUSES to offer. Metering itself is
 * arithmetic; the part that can ship a lie is the upgrade prompt, because the paid rails are not
 * provisioned and BR-09 forbids lighting a paid path against a testnet contract. So most of this
 * file pins that an unprovisioned rail is never offered, under every combination of flags.
 */
import { describe, it, expect } from 'vitest'
import { AUDIT_BUDGET } from '../autoRunPolicy.js'
import {
  TIERS, UPGRADE_REASON, limitFor, meteringState, meteringLabel, upgradeReasonText,
} from '../meteringPolicy.js'

const OFF = { unlock: { enabled: false, available: false }, escrow: { enabled: false, provisioned: false } }

describe('P5-05: the budget comes from ONE place', () => {
  it('free tier limit is the Worker-mirrored audit budget, not a second copy', () => {
    expect(TIERS.free.limit).toBe(AUDIT_BUDGET)
    expect(limitFor('free')).toBe(AUDIT_BUDGET)
  })

  it('unlocked is unlimited, and an unknown tier fails CLOSED to free', () => {
    expect(limitFor('unlocked')).toBe(Infinity)
    expect(limitFor('nonsense')).toBe(AUDIT_BUDGET)
    expect(meteringState({ tier: 'nonsense', ...OFF }).tier).toBe('free')
  })
})

describe('P5-05: counting', () => {
  it('reports remaining and allows runs until the limit', () => {
    const s = meteringState({ used: 3, ...OFF })
    expect(s).toMatchObject({ allowed: true, used: 3, remaining: AUDIT_BUDGET - 3, exhausted: false })
  })

  it('is exhausted exactly at the limit, and never goes negative', () => {
    expect(meteringState({ used: AUDIT_BUDGET, ...OFF })).toMatchObject({ allowed: false, remaining: 0, exhausted: true })
    expect(meteringState({ used: AUDIT_BUDGET + 99, ...OFF }).remaining).toBe(0)
  })

  it('coerces junk input to a sane count rather than producing NaN', () => {
    expect(meteringState({ used: -5, ...OFF }).used).toBe(0)
    expect(meteringState({ used: 'x', ...OFF }).used).toBe(0)
    expect(meteringState({ used: 2.7, ...OFF }).used).toBe(2)
    expect(meteringState().tier).toBe('free')
  })
})

describe('P5-05: an unprovisioned rail is NEVER offered', () => {
  it('offers nothing when exhausted and both rails are off — the shipped state', () => {
    const s = meteringState({ used: AUDIT_BUDGET, ...OFF })
    expect(s.upgrade.offered).toBe(false)
    expect(s.upgrade.rail).toBeNull()
    expect(s.upgrade.reason).toBe(UPGRADE_REASON.UNPROVISIONED)
    expect(s.upgrade.text).toMatch(/not live yet/i)
  })

  it('a flag ON but the rail UNPROVISIONED still offers nothing — the dangerous combination', () => {
    // escrow's flag can be on in a preview build while the contract behind it is testnet-only.
    const s = meteringState({
      used: AUDIT_BUDGET,
      unlock: { enabled: true, available: false },
      escrow: { enabled: true, provisioned: false },
    })
    expect(s.upgrade.offered).toBe(false)
    expect(s.upgrade.rail).toBeNull()
  })

  it('a rail PROVISIONED but flagged off still offers nothing', () => {
    const s = meteringState({
      used: AUDIT_BUDGET,
      unlock: { enabled: false, available: true },
      escrow: { enabled: false, provisioned: true },
    })
    expect(s.upgrade.offered).toBe(false)
  })

  it('offers only when exhausted AND a rail is both enabled and provisioned', () => {
    const s = meteringState({ used: AUDIT_BUDGET, ...OFF, unlock: { enabled: true, available: true } })
    expect(s.upgrade).toMatchObject({ offered: true, rail: 'unlock', reason: null, text: '' })
  })

  it('prefers unlock over escrow when both are live', () => {
    const s = meteringState({
      used: AUDIT_BUDGET,
      unlock: { enabled: true, available: true },
      escrow: { enabled: true, provisioned: true },
    })
    expect(s.upgrade.rail).toBe('unlock')
  })

  it('falls to escrow when only escrow is live', () => {
    const s = meteringState({
      used: AUDIT_BUDGET,
      unlock: { enabled: false, available: false },
      escrow: { enabled: true, provisioned: true },
    })
    expect(s.upgrade.rail).toBe('escrow')
  })

  it('does not nag before the limit, even with a live rail', () => {
    const s = meteringState({ used: 1, unlock: { enabled: true, available: true }, escrow: { enabled: false, provisioned: false } })
    expect(s.upgrade.offered).toBe(false)
    expect(s.upgrade.reason).toBe(UPGRADE_REASON.NOT_NEEDED)
  })

  it('never offers an upgrade to someone already unlocked', () => {
    const s = meteringState({ tier: 'unlocked', used: 999, unlock: { enabled: true, available: true }, escrow: { enabled: false, provisioned: false } })
    expect(s).toMatchObject({ allowed: true, exhausted: false, remaining: Infinity })
    expect(s.upgrade.reason).toBe(UPGRADE_REASON.ALREADY)
  })

  it('handles missing rail objects without throwing', () => {
    const s = meteringState({ used: AUDIT_BUDGET, unlock: null, escrow: undefined })
    expect(s.upgrade.offered).toBe(false)
  })
})

describe('P5-05: the floor is on every branch', () => {
  it('book-a-call is the floor whether or not an upgrade is offered', () => {
    expect(meteringState({ used: 0, ...OFF }).floor).toBe('book_a_call')
    expect(meteringState({ used: AUDIT_BUDGET, ...OFF }).floor).toBe('book_a_call')
    expect(meteringState({ used: AUDIT_BUDGET, ...OFF, unlock: { enabled: true, available: true } }).floor).toBe('book_a_call')
  })
})

describe('P5-05: the status line never renders a bare dead end', () => {
  it('counts down while runs remain', () => {
    expect(meteringLabel(meteringState({ used: 2, ...OFF }))).toBe(`${AUDIT_BUDGET - 2} of ${AUDIT_BUDGET} AI analyses left this session`)
  })

  it('says what is still free when exhausted with no rail — not just "0 left"', () => {
    const label = meteringLabel(meteringState({ used: AUDIT_BUDGET, ...OFF }))
    expect(label).toMatch(/instant screen stays free/i)
    expect(label).not.toMatch(/^0\b/)
  })

  it('offers the unlock when one is genuinely live', () => {
    expect(meteringLabel(meteringState({ used: AUDIT_BUDGET, ...OFF, unlock: { enabled: true, available: true } })))
      .toMatch(/unlock to continue/i)
  })

  it('reports unlimited for an unlocked tier, and empty for no state', () => {
    expect(meteringLabel(meteringState({ tier: 'unlocked', ...OFF }))).toMatch(/unlimited/i)
    expect(meteringLabel(null)).toBe('')
  })

  it('upgradeReasonText falls back to the honest unprovisioned wording', () => {
    expect(upgradeReasonText('bogus')).toMatch(/not live yet/i)
  })
})
