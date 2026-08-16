import { describe, it, expect } from 'vitest'
import { handleAudit, sha256Hex, recordedFrames } from '../../../workers/portfolio-agent/src/routes/audit.js'
import { AUDIT_DISCLAIMER } from '../../../workers/portfolio-agent/src/auditHeuristics.js'
import { SAMPLE_CONTRACT } from '../auditHeuristics.js'

const req = new Request('https://x/audit', { method: 'POST' })

describe('handleAudit — heuristics-first stream, graceful degrade (FR-013/FR-008)', () => {
  it('emits real findings + disclaimer + graceful note + [DONE] with no upstreams', async () => {
    const res = handleAudit(req, {}, undefined, { source: SAMPLE_CONTRACT })
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    const text = await res.text()
    expect(text).toContain('HIGH') // heuristic severity table is real
    expect(text).toContain('Reentrancy')
    expect(text).toContain(AUDIT_DISCLAIMER) // BR-10 disclaimer present
    expect(text).toContain('briefly unavailable') // narrative degraded gracefully
    expect(text.endsWith('data: [DONE]\n\n')).toBe(true)
  })

  it('falls to a labelled KV recorded narrative when live is down', async () => {
    const env = {
      KV: {
        get: async () =>
          JSON.stringify({ label: 'Recorded run', capturedAt: '2026-08-16', frames: [{ response: 'recorded analysis' }] }),
      },
    }
    const text = await handleAudit(req, env, undefined, { source: SAMPLE_CONTRACT }).text()
    expect(text).toContain('[Recorded run · captured 2026-08-16]')
    expect(text).toContain('recorded analysis')
    expect(text).not.toContain('briefly unavailable')
  })
})

describe('sha256Hex — privacy (only a hash of the source is retained)', () => {
  it('is a stable 64-char hex digest', async () => {
    const a = await sha256Hex('contract A {}')
    const b = await sha256Hex('contract A {}')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await sha256Hex('other')).not.toBe(a)
  })
})

describe('recordedFrames', () => {
  it('returns null when KV is absent or the run is malformed', async () => {
    expect(await recordedFrames({}, 'k')).toBeNull()
    expect(await recordedFrames({ KV: { get: async () => null } }, 'k')).toBeNull()
    expect(await recordedFrames({ KV: { get: async () => '{bad' } }, 'k')).toBeNull()
  })
})
