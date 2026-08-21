import { describe, it, expect } from 'vitest'
import {
  evaluateAutoRun,
  explainAutoRun,
  AUTO_RUN_REASON,
  AUTO_RUN_IDLE_MS,
  AUTO_RUN_RESERVE,
  AUDIT_BUDGET,
  CHANGE_ORIGIN,
} from '../autoRunPolicy.js'
import { BUDGETS } from '../../../workers/portfolio-agent/src/rateLimit.js'

// A decision that WOULD run — each test below spoils exactly one gate.
const ready = {
  enabled: true,
  paused: false,
  running: false,
  valid: true,
  changeOrigin: CHANGE_ORIGIN.EDIT,
  draft: 'edited',
  lastAnalysedSource: 'original',
  fingerprint: 'reentrancy:9:high',
  lastFingerprint: '',
  idleMs: AUTO_RUN_IDLE_MS,
  runsUsed: 0,
}

const reasonOf = (over) => evaluateAutoRun({ ...ready, ...over }).reason

describe('autoRunPolicy', () => {
  it('runs when every gate is satisfied', () => {
    const d = evaluateAutoRun(ready)
    expect(d.run).toBe(true)
    expect(d.reason).toBe(AUTO_RUN_REASON.READY)
    expect(d.explain).toMatch(/re-running/i)
  })

  it('is off unless explicitly enabled — including with no arguments at all', () => {
    expect(evaluateAutoRun().run).toBe(false)
    expect(evaluateAutoRun().reason).toBe(AUTO_RUN_REASON.DISABLED)
    expect(reasonOf({ enabled: false })).toBe(AUTO_RUN_REASON.DISABLED)
  })

  it('reports the reason it declined, for every gate', () => {
    expect(reasonOf({ paused: true })).toBe(AUTO_RUN_REASON.PAUSED)
    expect(reasonOf({ running: true })).toBe(AUTO_RUN_REASON.RUNNING)
    expect(reasonOf({ valid: false })).toBe(AUTO_RUN_REASON.INVALID)
    expect(reasonOf({ changeOrigin: CHANGE_ORIGIN.INIT })).toBe(AUTO_RUN_REASON.AWAITING_EDIT)
    expect(reasonOf({ changeOrigin: CHANGE_ORIGIN.RESTORE })).toBe(AUTO_RUN_REASON.RESTORED)
    expect(reasonOf({ draft: 'original' })).toBe(AUTO_RUN_REASON.UNCHANGED)
    expect(reasonOf({ analysedSources: ['a', 'edited'] })).toBe(AUTO_RUN_REASON.ALREADY_ANALYSED)
    expect(reasonOf({ fingerprint: 'same', lastFingerprint: 'same' })).toBe(AUTO_RUN_REASON.NO_VISIBLE_CHANGE)
    expect(reasonOf({ runsUsed: AUDIT_BUDGET - AUTO_RUN_RESERVE })).toBe(AUTO_RUN_REASON.BUDGET)
    expect(reasonOf({ idleMs: AUTO_RUN_IDLE_MS - 1 })).toBe(AUTO_RUN_REASON.IDLE_WAIT)
  })

  it('every decline explains itself in words a visitor can act on', () => {
    for (const reason of Object.values(AUTO_RUN_REASON)) {
      expect(explainAutoRun(reason).length).toBeGreaterThan(15)
    }
    // Silence would read as "the analysis agrees with your edit" — never that.
    expect(explainAutoRun('something-unknown')).toBe(explainAutoRun(AUTO_RUN_REASON.DISABLED))
  })

  it('states the paused reason ahead of the cosmetic-edit one', () => {
    // Someone who paused deliberately does not also need to be told their edit was cosmetic.
    expect(reasonOf({ paused: true, fingerprint: 'x', lastFingerprint: 'x' })).toBe(AUTO_RUN_REASON.PAUSED)
  })

  it('treats a first-ever analysis as a change worth making', () => {
    expect(evaluateAutoRun({ ...ready, lastAnalysedSource: null, lastFingerprint: null }).run).toBe(true)
  })

  it('runs on an authored change — typing, or a fix that rewrote the source', () => {
    for (const origin of [CHANGE_ORIGIN.EDIT, CHANGE_ORIGIN.FIX]) {
      expect(evaluateAutoRun({ ...ready, changeOrigin: origin }).run).toBe(true)
    }
  })

  it('never runs on NAVIGATION — restoring a version is reading, not writing', () => {
    // The owner-reported bug: clicking back through your own checkpoints to compare them spent a
    // model call each time. A restore moves the draft exactly as typing does, so nothing
    // downstream could tell them apart — only the origin can.
    const d = evaluateAutoRun({ ...ready, changeOrigin: CHANGE_ORIGIN.RESTORE })
    expect(d.run).toBe(false)
    expect(d.reason).toBe(AUTO_RUN_REASON.RESTORED)
    expect(d.explain).toMatch(/earlier version/i)
  })

  it('never runs before the first edit — the control is called "re-run on edit"', () => {
    const d = evaluateAutoRun({ ...ready, changeOrigin: CHANGE_ORIGIN.INIT })
    expect(d.run).toBe(false)
    expect(d.reason).toBe(AUTO_RUN_REASON.AWAITING_EDIT)
  })

  it('refuses to buy the same analysis twice, and points at the tab that has it', () => {
    // Reachable by editing and then undoing back to a source that already has a run.
    const d = evaluateAutoRun({ ...ready, analysedSources: ['something else', 'edited'] })
    expect(d.run).toBe(false)
    expect(d.reason).toBe(AUTO_RUN_REASON.ALREADY_ANALYSED)
    expect(d.explain).toMatch(/run tab/i)
  })

  it('will not spend the last run — the manual button keeps one in hand', () => {
    expect(evaluateAutoRun({ ...ready, runsUsed: AUDIT_BUDGET - AUTO_RUN_RESERVE - 1 }).run).toBe(true)
    expect(evaluateAutoRun({ ...ready, runsUsed: AUDIT_BUDGET - AUTO_RUN_RESERVE }).run).toBe(false)
    expect(evaluateAutoRun({ ...ready, runsUsed: AUDIT_BUDGET + 5 }).reason).toBe(AUTO_RUN_REASON.BUDGET)
  })

  it('honours caller-supplied thresholds over the defaults', () => {
    expect(evaluateAutoRun({ ...ready, idleMs: 50, idleThresholdMs: 40 }).run).toBe(true)
    expect(evaluateAutoRun({ ...ready, runsUsed: 2, budget: 3, reserve: 1 }).reason).toBe(AUTO_RUN_REASON.BUDGET)
  })

  it('fires exactly at the idle threshold, not one tick later', () => {
    expect(evaluateAutoRun({ ...ready, idleMs: AUTO_RUN_IDLE_MS }).run).toBe(true)
  })
})

describe('autoRunPolicy — budget parity with the Worker', () => {
  it('mirrors the rate limiter the server actually enforces', () => {
    // The UI tells a visitor how many analyses are left. That is only honest while this number
    // matches the one the Worker enforces — so a drift in either direction fails here.
    expect(AUDIT_BUDGET).toBe(BUDGETS.audit)
  })
})
