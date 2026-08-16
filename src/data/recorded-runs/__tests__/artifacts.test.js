import { describe, it, expect } from 'vitest'
import { RECORDED_RUNS, RECORDED_RUN_KEYS } from '../index.js'
import { FAILURES } from '../failures/index.js'
import { auditSolidity, SAMPLE_CONTRACT } from '../../../lib/auditHeuristics.js'
import { scanTextForForbidden } from '../../../lib/claimsValidate.js'

const runText = (run) => run.frames.map((f) => f.response).join('')

describe('P1-16 recorded-run artifacts — shape + honesty', () => {
  it('bundles a dated, labelled, non-empty run for every P1 live surface', () => {
    for (const key of ['concierge-intro', 'audit-intro']) {
      const run = RECORDED_RUNS[key]
      expect(run, key).toBeTruthy()
      expect(run.label).toBe('Recorded run')
      expect(run.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(run.frames.length).toBeGreaterThan(0)
      expect(run.surface).toBeTruthy()
    }
    // Keys align with the Worker's Tier-1 KV keys.
    expect(RECORDED_RUN_KEYS).toEqual(expect.arrayContaining(['concierge-intro', 'audit-intro']))
  })

  it('no run carries a forbidden claim phrase (BR-02)', () => {
    for (const key of RECORDED_RUN_KEYS) {
      expect(scanTextForForbidden(runText(RECORDED_RUNS[key])), key).toEqual([])
    }
  })
})

describe('P1-16 audit run is VERIFIABLY REAL — matches live detector output (DE-07)', () => {
  it('cites the exact findings auditSolidity(SAMPLE_CONTRACT) produces, not hand-authored copy', () => {
    const real = auditSolidity(SAMPLE_CONTRACT)
    const high = real.findings.find((f) => f.id === 'reentrancy')
    const low = real.findings.find((f) => f.id === 'floating-pragma')
    expect(high).toBeTruthy()
    expect(low).toBeTruthy()

    const text = runText(RECORDED_RUNS['audit-intro'])
    // The run must reference the real severities and the real line numbers.
    expect(text).toContain(`line ${high.line}`) // reentrancy at its actual line
    expect(text).toContain(`line ${low.line}`) // floating pragma at its actual line
    expect(text.toLowerCase()).toContain('reentrancy')
    expect(text.toLowerCase()).toContain('floating pragma')
    // No reproduced-exploit claim in a heuristic replay.
    expect(text.toLowerCase()).not.toContain('reproduced')
  })
})

describe('P1-16 failure artifact is VERIFIABLY REAL — the blind spot reproduces (FR-045)', () => {
  it('the recorded "clean pass" on the vulnerable input reproduces from the detector', () => {
    const blindspot = FAILURES.find((f) => f.id === 'audit-heuristic-blindspot')
    expect(blindspot).toBeTruthy()
    // Re-run the detector on the artifact's own input → still 0 findings (the real miss).
    const rerun = auditSolidity(blindspot.input)
    expect(rerun.clean).toBe(true)
    expect(rerun.findings).toHaveLength(0)
    // The artifact honestly records that clean result + a fix.
    expect(blindspot.result.toLowerCase()).toContain('clean')
    expect(blindspot.fix.toLowerCase()).toContain('onlyowner')
    expect(scanTextForForbidden(`${blindspot.failure} ${blindspot.fix}`)).toEqual([])
  })
})
