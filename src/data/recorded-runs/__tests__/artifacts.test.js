import { describe, it, expect } from 'vitest'
import { RECORDED_RUNS, RECORDED_RUN_KEYS, CTF_LEADERBOARD_FIXTURE } from '../index.js'
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

describe('P2-18 recorded-run artifacts — every P2 live surface has a dated, labelled run (FR-026/BR-03)', () => {
  it('bundles fuzz / tx / CTF / KTHULHU recorded runs, dated + labelled + non-empty', () => {
    for (const key of ['fuzz-intro', 'tx-intro', 'ctf-intro', 'kthulhu-intro']) {
      const run = RECORDED_RUNS[key]
      expect(run, key).toBeTruthy()
      expect(run.label).toBe('Recorded run')
      expect(run.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(run.frames.length).toBeGreaterThan(0)
      expect(run.surface).toBeTruthy()
    }
  })

  it('the fuzz/tx keys align with the Worker replay keys (Tier-1↔Tier-2)', () => {
    expect(RECORDED_RUN_KEYS).toEqual(expect.arrayContaining(['fuzz-intro', 'tx-intro', 'ctf-intro', 'kthulhu-intro']))
  })

  it('the CTF surfaces are honestly labelled testnet / recorded (no real on-chain claim)', () => {
    expect(runText(RECORDED_RUNS['ctf-intro']).toLowerCase()).toMatch(/testnet|no real funds|recorded solve/)
    expect(runText(RECORDED_RUNS['kthulhu-intro']).toLowerCase()).toContain('recorded walkthrough')
  })

  it('the leaderboard fixture is ranked, dated, and synthetic (no PII)', () => {
    expect(CTF_LEADERBOARD_FIXTURE.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const ranks = CTF_LEADERBOARD_FIXTURE.entries.map((e) => e.rank)
    expect(ranks).toEqual([1, 2, 3])
    for (const e of CTF_LEADERBOARD_FIXTURE.entries) {
      expect(e.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(e.tx_hash).toMatch(/^0x[0-9a-fA-F]{64}$/)
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

describe('failure artifacts — open/closed is explicit, never implied by the presence of a fix', () => {
  it('every failure declares a status', () => {
    for (const f of FAILURES) expect(['open', 'closed']).toContain(f.status)
  })
  it('a CLOSED failure must actually carry its fix — closed-with-no-fix is the implied lie this removes', () => {
    for (const f of FAILURES.filter((x) => x.status === 'closed')) expect(String(f.fix || '').trim()).not.toBe('')
  })
})

/*
 * Every failure artifact must STILL FAIL the way it says it does.
 *
 * This corpus documents blind spots in a detector that is under active development. An artifact
 * claiming "0 findings — clean pass" against source the screen has since learned to catch would be
 * a false confession: it would advertise a weakness that no longer exists, which is its own kind
 * of dishonesty on a page whose whole subject is being accurate about limits.
 */
describe('failure artifacts still reproduce', () => {
  it.each(FAILURES.filter((f) => f.surface === 'audit').map((f) => [f.id, f]))(
    '%s: the screen still produces what the artifact claims',
    (_id, f) => {
      const findings = auditSolidity(f.input).findings
      if (/0 findings/.test(f.result)) {
        expect(findings, `${f.id} says "0 findings" but the screen now raises [${findings.map((x) => x.id)}]`).toHaveLength(0)
      }
    },
  )

  it('the corpus demonstrates a habit, not an instance', () => {
    // Brief 07's next-need: one entry made a section about a practice into a single anecdote.
    expect(FAILURES.length).toBeGreaterThan(1)
  })

  it('distinct ids, and every one is reproducible from its own file', () => {
    expect(new Set(FAILURES.map((f) => f.id)).size).toBe(FAILURES.length)
    for (const f of FAILURES) expect(String(f.reproduce || '').trim()).not.toBe('')
  })
})
