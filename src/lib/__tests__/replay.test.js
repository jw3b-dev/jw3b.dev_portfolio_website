import { describe, it, expect } from 'vitest'
import {
  getRecordedRun,
  isReplayAvailable,
  replayLabel,
  toReplayFrames,
  loadReplay,
} from '../replay.js'
import {
  buildReplayBody,
  runKvKey,
  serveRecordedRun,
  getReplayMedia,
} from '../../../workers/portfolio-agent/src/replay.js'

const RUN = {
  key: 'demo',
  surface: 'concierge',
  label: 'Recorded run',
  capturedAt: '2026-08-16',
  frames: [{ response: 'first. ' }, { response: 'second.' }],
}
const RUNS = { demo: RUN }

describe('Tier-2 client replay (SPA bundle)', () => {
  it('resolves a bundled run and reports availability', () => {
    expect(getRecordedRun('demo', RUNS)).toBe(RUN)
    expect(getRecordedRun('missing', RUNS)).toBeNull()
    expect(isReplayAvailable('demo', RUNS)).toBe(true)
    expect(isReplayAvailable('missing', RUNS)).toBe(false)
  })

  it('always produces a visible, dated label (BR-03)', () => {
    expect(replayLabel(RUN)).toBe('Recorded run · captured 2026-08-16')
    expect(replayLabel({ frames: [] })).toBe('Recorded run') // default label, no date
    expect(replayLabel(null)).toBeNull()
  })

  it('normalizes frames as cached_replay / tier 2', () => {
    expect(toReplayFrames(RUN)).toEqual([
      { response: 'first. ', source: 'cached_replay', tier: 2 },
      { response: 'second.', source: 'cached_replay', tier: 2 },
    ])
    expect(toReplayFrames(null)).toEqual([])
    expect(toReplayFrames({ frames: 'nope' })).toEqual([])
  })

  it('worker-unreachable → labelled Tier-2 payload, null when unavailable', () => {
    const payload = loadReplay('demo', RUNS)
    expect(payload.tier).toBe(2)
    expect(payload.source).toBe('cached_replay')
    expect(payload.label).toBe('Recorded run · captured 2026-08-16')
    expect(payload.frames).toHaveLength(2)
    expect(loadReplay('missing', RUNS)).toBeNull()
  })

  it('the shipped seed run is bundled and loads', async () => {
    const { RECORDED_RUNS } = await import('../../data/recorded-runs/index.js')
    const seed = loadReplay('concierge-intro', RECORDED_RUNS)
    expect(seed).not.toBeNull()
    expect(seed.label).toContain('Recorded run')
    expect(seed.capturedAt).toBeTruthy()
  })
})

describe('Tier-1 worker replay (KV/R2)', () => {
  it('buildReplayBody: labelled first frame + [DONE], pure', () => {
    const body = buildReplayBody(RUN)
    expect(body).toContain('data: ')
    expect(body).toContain('[Recorded run · captured 2026-08-16] first.')
    expect(body).toContain('second.')
    expect(body.endsWith('data: [DONE]\n\n')).toBe(true)
  })

  it('buildReplayBody: null for malformed / empty runs', () => {
    expect(buildReplayBody(null)).toBeNull()
    expect(buildReplayBody({ frames: 'x' })).toBeNull()
    expect(buildReplayBody({ frames: [{ response: 5 }, {}] })).toBeNull() // no usable text
  })

  it('runKvKey namespaces by key', () => {
    expect(runKvKey('demo')).toBe('run:demo')
  })

  it('upstream-down → serves a labelled Tier-1 recorded run from KV', async () => {
    const env = { KV: { get: async (k) => (k === 'run:demo' ? JSON.stringify(RUN) : null) } }
    const res = await serveRecordedRun(env, 'demo')
    expect(res).toBeInstanceOf(Response)
    expect(res.headers.get('X-Replay-Tier')).toBe('1')
    expect(res.headers.get('X-Replay-Source')).toBe('cached_replay')
    const text = await res.text()
    expect(text).toContain('[Recorded run · captured 2026-08-16] first.')
    expect(text.endsWith('data: [DONE]\n\n')).toBe(true)
  })

  it('unknown key / malformed JSON / no bindings → null (signals Tier-2)', async () => {
    expect(await serveRecordedRun({ KV: { get: async () => null } }, 'nope')).toBeNull()
    expect(await serveRecordedRun({ KV: { get: async () => '{bad json' } }, 'demo')).toBeNull()
    expect(await serveRecordedRun(null, 'demo')).toBeNull()
    expect(await serveRecordedRun({}, 'demo')).toBeNull()
  })

  it('getReplayMedia: reads R2 when present, null otherwise', async () => {
    const obj = { body: 'audio' }
    const env = { R2: { get: async (k) => (k === 'media/demo.mp3' ? obj : null) } }
    expect(await getReplayMedia(env, 'media/demo.mp3')).toBe(obj)
    expect(await getReplayMedia(env, 'missing')).toBeNull()
    expect(await getReplayMedia(null, 'media/demo.mp3')).toBeNull()
  })
})
