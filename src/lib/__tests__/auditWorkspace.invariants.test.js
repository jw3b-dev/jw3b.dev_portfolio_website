import { describe, it, expect } from 'vitest'
import {
  createWorkspace,
  setDraft,
  applyFix,
  restoreVersion,
  startRun,
  updateRun,
  currentVersion,
  isDirty,
  ORIGINAL_LABEL,
  RUN_STATUS,
} from '../auditWorkspace.js'
import {
  evaluateAutoRun,
  CHANGE_ORIGIN,
  AUTO_RUN_REASON,
  AUDIT_BUDGET,
  AUTO_RUN_RESERVE,
  AUTO_RUN_IDLE_MS,
} from '../autoRunPolicy.js'

/*
 * PROPERTY tests over the workspace reducer and the auto-run gate.
 *
 * WHY THESE EXIST. The owner reported six separate bugs in this workspace, and every one of them
 * was a STATE PAIR rather than a broken function:
 *   · restoring an old version triggered a paid re-run
 *   · version buttons "got mixed up and lost" — newer versions disappeared when clicking older
 *   · auto re-run fired with the box unchecked
 *   · the free screen was being counted as an audit
 *   · re-run fired when there had never been a first run
 *   · run tabs 1 and 2 showed the same result
 *
 * Each was fixed with an example test pinning that exact sequence. Example tests kill instances;
 * they cannot kill the class, because the next bug is the pair nobody thought to write down.
 * These drive thousands of RANDOM action sequences and assert properties that must hold after
 * every single step — so an unthought-of ordering fails here rather than in front of a visitor.
 *
 * Deterministic by construction: a seeded PRNG, no wall clock, no randomness from the platform.
 * A failure reprints its seed and its exact action list, so it is reproducible forever.
 */

/** Mulberry32 — small, seeded, and stable across platforms. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SOURCES = [
  'contract A { function f() external {} }',
  'contract A { function f() external { g(); } }',
  'contract B { uint x; }',
  '',
  'contract A { function f() external {} } // edited',
]

/** A fix that is always expressible, so applyFix is genuinely exercised. */
const FIX = { id: 'fx', findingId: 'reentrancy', label: 'Reorder', apply: (src) => `${src}\n// fixed` }

/**
 * Drive one random sequence, asserting the invariants after EVERY step.
 * Returns the trace so a failure can be reproduced exactly.
 */
function drive(seed, steps = 40) {
  const rand = rng(seed)
  const pick = (arr) => arr[Math.floor(rand() * arr.length) % arr.length]
  let ws = createWorkspace(SOURCES[0])
  const trace = []

  // Properties that must hold for ANY workspace, at ANY point in its life.
  const check = (action) => {
    const where = () => `seed=${seed} after ${trace.length} steps [${trace.join(' → ')}]`

    // 1. Version history only ever grows. This is the "newer versions disappeared" bug: a
    //    checkpoint that can vanish makes the history untrustworthy for comparison.
    expect(ws.versions.length, `versions shrank — ${where()}`).toBeGreaterThanOrEqual(seen.versions)
    seen.versions = ws.versions.length

    // 2. "Original" is permanent and is always the first entry — the one thing you can always
    //    get back to.
    expect(ws.versions[0].label, `Original moved or was renamed — ${where()}`).toBe(ORIGINAL_LABEL)
    expect(ws.versions[0].source, `Original's source changed — ${where()}`).toBe(SOURCES[0])

    // 3. Version ids are unique. Duplicates are how restore targets the wrong snapshot.
    const vids = ws.versions.map((v) => v.id)
    expect(new Set(vids).size, `duplicate version ids — ${where()}`).toBe(vids.length)

    // 4. The current version always exists in the list.
    expect(currentVersion(ws), `currentVersionId points at nothing — ${where()}`).toBeTruthy()

    // 5. Runs only ever grow, ids are unique, and sequence numbers are strictly increasing.
    expect(ws.runs.length, `runs shrank — ${where()}`).toBeGreaterThanOrEqual(seen.runs)
    seen.runs = ws.runs.length
    const rids = ws.runs.map((r) => r.id)
    expect(new Set(rids).size, `duplicate run ids — ${where()}`).toBe(rids.length)
    const seqs = ws.runs.map((r) => r.seq)
    expect([...seqs].sort((a, b) => a - b), `run seqs not increasing — ${where()}`).toEqual(seqs)

    // 6. THE BIG ONE — "run 1 and run 2 show the same result". Every run pins the exact source
    //    it read, and that pinned source is immutable for the life of the run. If two runs read
    //    different sources they must keep different sources, forever.
    for (const r of ws.runs) {
      expect(typeof r.source, `run ${r.id} lost its pinned source — ${where()}`).toBe('string')
      const pinnedAtStart = pinned.get(r.id)
      expect(r.source, `run ${r.id}'s pinned source MUTATED — ${where()}`).toBe(pinnedAtStart)
      const v = ws.versions.find((x) => x.id === r.versionId)
      expect(v, `run ${r.id} references a version that does not exist — ${where()}`).toBeTruthy()
      expect(r.source, `run ${r.id} disagrees with the version it claims — ${where()}`).toBe(v.source)
    }

    trace.push(action)
  }

  const seen = { versions: ws.versions.length, runs: ws.runs.length }
  const pinned = new Map()

  for (let i = 0; i < steps; i++) {
    const action = pick(['setDraft', 'applyFix', 'restore', 'startRun', 'updateRun'])
    switch (action) {
      case 'setDraft':
        ws = setDraft(ws, pick(SOURCES))
        break
      case 'applyFix':
        ws = applyFix(ws, FIX)
        break
      case 'restore':
        ws = restoreVersion(ws, pick(ws.versions).id)
        break
      case 'startRun': {
        const [next, run] = startRun(ws)
        ws = next
        pinned.set(run.id, run.source)
        break
      }
      case 'updateRun': {
        if (!ws.runs.length) break
        const r = pick(ws.runs)
        ws = updateRun(ws, r.id, {
          narrative: `${r.narrative}chunk`,
          status: rand() > 0.5 ? RUN_STATUS.DONE : r.status,
        })
        break
      }
    }
    check(action)
  }
  return { ws, trace }
}

describe('auditWorkspace — invariants under random action sequences', () => {
  // 200 sequences × 40 steps = 8,000 transitions, all deterministic.
  const seeds = Array.from({ length: 200 }, (_, i) => i + 1)

  it.each(seeds.map((s) => [s]))('seed %i holds every invariant for 40 random actions', (seed) => {
    expect(() => drive(seed)).not.toThrow()
  })

  it('restore is NAVIGATION — it never creates a version and never loses one', () => {
    let ws = createWorkspace('a')
    ws = setDraft(ws, 'b')
    const [afterRun] = startRun(ws) // pins 'b' as Edit 1
    ws = afterRun
    const before = ws.versions.length
    for (const v of ws.versions) ws = restoreVersion(ws, v.id)
    expect(ws.versions.length, 'restoring created or destroyed a version').toBe(before)
  })

  it('a version that has been checkpointed is never mutated afterwards', () => {
    let ws = createWorkspace('a')
    ws = setDraft(ws, 'b')
    ws = applyFix(ws, FIX) // checkpoints 'b'
    const snapshot = ws.versions.map((v) => `${v.id}:${v.source}`)
    ws = setDraft(ws, 'c')
    ws = setDraft(ws, 'd')
    expect(ws.versions.slice(0, snapshot.length).map((v) => `${v.id}:${v.source}`)).toEqual(snapshot)
  })

  it('isDirty is exactly "the draft differs from the current version"', () => {
    let ws = createWorkspace('a')
    expect(isDirty(ws)).toBe(false)
    ws = setDraft(ws, 'b')
    expect(isDirty(ws)).toBe(true)
    ws = setDraft(ws, 'a')
    expect(isDirty(ws)).toBe(false)
  })
})

/*
 * The auto-run gate spends the visitor's metered budget, so its properties are about money.
 * Three of the six reported bugs were this gate firing when it must not.
 */
describe('autoRunPolicy — the gate never spends what it should not', () => {
  const base = {
    enabled: true,
    valid: true,
    draft: 'x',
    changeOrigin: CHANGE_ORIGIN.EDIT,
    analysedSources: ['prev'],
    lastAnalysedSource: 'prev',
    fingerprint: 'f2',
    lastFingerprint: 'f1',
    idleMs: AUTO_RUN_IDLE_MS + 1,
    runsUsed: 0,
  }

  it('the happy path does run — so the negative tests below are not vacuous', () => {
    expect(evaluateAutoRun(base).run).toBe(true)
  })

  // Exhaustive over the blocking flags: no combination may ever produce a run.
  const blockers = ['enabled', 'paused', 'running', 'valid']
  for (const mask of Array.from({ length: 16 }, (_, i) => i)) {
    const state = {
      enabled: !(mask & 1) ? false : true,
      paused: Boolean(mask & 2),
      running: Boolean(mask & 4),
      valid: !(mask & 8),
    }
    const blocked = !state.enabled || state.paused || state.running || !state.valid
    if (!blocked) continue
    it(`never runs when ${blockers.filter((k) => (k === 'valid' ? !state.valid : state[k])).join('+') || 'blocked'} (mask ${mask})`, () => {
      expect(evaluateAutoRun({ ...base, ...state }).run).toBe(false)
    })
  }

  it('never spends the FIRST call on its own — a re-run needs something to re-run', () => {
    const r = evaluateAutoRun({ ...base, analysedSources: [], lastAnalysedSource: null })
    expect(r.run).toBe(false)
    expect(r.reason).toBe(AUTO_RUN_REASON.AWAITING_FIRST_RUN)
  })

  it('never fires on a restore — reading your own history is navigation, not authoring', () => {
    const r = evaluateAutoRun({ ...base, changeOrigin: CHANGE_ORIGIN.RESTORE })
    expect(r.run).toBe(false)
    expect(r.reason).toBe(AUTO_RUN_REASON.RESTORED)
  })

  it('never pays twice for a source already analysed, however you arrive back at it', () => {
    const r = evaluateAutoRun({ ...base, draft: 'seen', analysedSources: ['prev', 'seen'] })
    expect(r.run).toBe(false)
    expect(r.reason).toBe(AUTO_RUN_REASON.ALREADY_ANALYSED)
  })

  it('always leaves the reserve, so a manual run is possible at every budget level', () => {
    for (let used = 0; used <= AUDIT_BUDGET; used++) {
      const r = evaluateAutoRun({ ...base, runsUsed: used, draft: `d${used}`, analysedSources: ['prev'] })
      const spendable = AUDIT_BUDGET - AUTO_RUN_RESERVE
      if (used >= spendable) {
        expect(r.run, `auto-run consumed the reserve at ${used}/${AUDIT_BUDGET}`).toBe(false)
      }
    }
  })

  it('waits for the idle threshold rather than firing mid-keystroke', () => {
    expect(evaluateAutoRun({ ...base, idleMs: 0 }).run).toBe(false)
    expect(evaluateAutoRun({ ...base, idleMs: AUTO_RUN_IDLE_MS - 1 }).run).toBe(false)
  })

  it('every refusal explains itself — a silent decline is indistinguishable from a bug', () => {
    const refusals = [
      { enabled: false },
      { paused: true },
      { running: true },
      { valid: false },
      { analysedSources: [] },
      { changeOrigin: CHANGE_ORIGIN.RESTORE },
      { idleMs: 0 },
      { runsUsed: AUDIT_BUDGET },
    ]
    for (const over of refusals) {
      const r = evaluateAutoRun({ ...base, ...over })
      expect(r.run).toBe(false)
      expect(r.explain, `no explanation for ${JSON.stringify(over)}`).toBeTruthy()
      expect(String(r.explain).length).toBeGreaterThan(8)
    }
  })
})
