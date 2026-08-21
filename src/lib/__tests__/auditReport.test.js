import { describe, it, expect } from 'vitest'
import { buildAuditReport, reportFilename, lineRange } from '../auditReport.js'
import { AUDIT_DISCLAIMER } from '../auditClient.js'
import { auditSolidity, SAMPLE_CONTRACT } from '../auditHeuristics.js'

/*
 * W3 — the console must produce something you can leave with (PRODUCT_AUDIT #18).
 *
 * The workspace deliberately persists nothing: a reload starts clean. That is the right privacy
 * posture and it also meant a visitor could screen a contract, iterate versions, and spend model
 * calls, then walk away with nothing at all.
 *
 * The honesty rules matter MORE in a file than on screen, because the file outlives the context
 * that explained it. A report that says "clean" without saying what clean means is the exact
 * failure this whole console is built to argue against.
 */
const AT = '2026-08-21T12:40:00.000Z'
const findings = auditSolidity(SAMPLE_CONTRACT).findings

const report = (over = {}) =>
  buildAuditReport({
    source: SAMPLE_CONTRACT,
    findings,
    versions: [{ id: 'v1', label: 'Original', source: SAMPLE_CONTRACT }],
    runs: [],
    generatedAt: AT,
    ...over,
  })

describe('buildAuditReport — the takeaway artifact', () => {
  it('is pure: the same input always produces the same output', () => {
    expect(report()).toBe(report())
  })

  it('carries the disclaimer VERBATIM, never a paraphrase (BR-10)', () => {
    expect(report()).toContain(AUDIT_DISCLAIMER)
  })

  it('reports the findings with severity, line and reasoning', () => {
    const md = report()
    expect(md).toContain('HIGH · Reentrancy')
    expect(md).toMatch(/Line \d+\./)
    expect(md).toContain('re-enter')
  })

  it('orders findings by severity, worst first', () => {
    const md = report({
      findings: [
        { id: 'a', severity: 'low', title: 'Low thing', line: 2, detail: 'x' },
        { id: 'b', severity: 'high', title: 'High thing', line: 9, detail: 'y' },
      ],
    })
    expect(md.indexOf('High thing')).toBeLessThan(md.indexOf('Low thing'))
  })

  it('never reports a clean screen as "safe"', () => {
    const md = report({ findings: [] })
    expect(md).toMatch(/No known patterns matched/i)
    expect(md).toMatch(/not a statement that the contract is safe/i)
    // Every sentence that mentions safety must be a DENIAL of it. A naive /is safe/ ban fails on
    // the honest sentence itself ("not a statement that the contract is safe"), so check the
    // actual rule: no sentence asserts safety without negating it.
    const safetyClaims = md
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => /\bsafe\b/i.test(sentence))
      .filter((sentence) => !/\b(not|never|no)\b/i.test(sentence))
    expect(safetyClaims, `report asserts safety: ${safetyClaims.join(' | ')}`).toEqual([])
  })

  it('labels every analysis with its provenance', () => {
    const md = report({
      runs: [
        { id: 'r1', seq: 1, versionLabel: 'Original', narrative: 'Live take.', degraded: false },
        { id: 'r2', seq: 2, versionLabel: 'Edit 1', narrative: 'Recorded take.', degraded: true },
      ],
    })
    expect(md).toContain('Run 1 — live model')
    expect(md).toContain('Run 2 — recorded fallback')
  })

  it('says which version each analysis actually read', () => {
    const md = report({ runs: [{ id: 'r1', seq: 1, versionLabel: 'Edit 2', narrative: 'n', degraded: false }] })
    expect(md).toContain('Read version: Edit 2.')
  })

  it('states plainly when no analysis was run', () => {
    expect(report({ runs: [] })).toContain('None were run.')
  })

  it('notes an empty narrative rather than pretending there was one', () => {
    const md = report({ runs: [{ id: 'r1', seq: 1, versionLabel: 'Original', narrative: '   ', degraded: false }] })
    expect(md).toContain('_No narrative was returned._')
  })

  it('lists every version with its size', () => {
    const md = report({
      versions: [
        { id: 'v1', label: 'Original', source: 'a\nb' },
        { id: 'v2', label: 'Edit 1', source: 'a\nb\nc' },
      ],
    })
    expect(md).toContain('**Original** — 2 lines')
    expect(md).toContain('**Edit 1** — 3 lines')
  })

  it('embeds the contract in a fenced solidity block', () => {
    expect(report()).toContain('```solidity')
    expect(report()).toContain('contract Vault')
  })

  it('survives an entirely empty workspace without throwing', () => {
    const md = buildAuditReport()
    expect(md).toContain('# Contract screening report')
    expect(md).toContain(AUDIT_DISCLAIMER)
  })
})

describe('reportFilename', () => {
  it('names the file after the contract and the day', () => {
    expect(reportFilename(SAMPLE_CONTRACT, AT)).toBe('Vault-screening-2026-08-21.md')
  })

  it('falls back sensibly when there is no contract or no date', () => {
    expect(reportFilename('', '')).toBe('contract-screening-report.md')
  })
})

/*
 * W3 — a finding's line number becomes navigation (PRODUCT_AUDIT #18).
 *
 * The line was printed and nothing more, so the reader had to count lines by eye in their own
 * contract. Clamping rather than throwing matters here: a detector can report a line past the end
 * of a source that has since been edited down, and a stale finding must not crash the editor.
 */
describe('lineRange — select the line a finding points at', () => {
  const src = 'alpha\nbravo\ncharlie'

  it('returns the exact character span of a 1-based line', () => {
    expect(src.slice(...Object.values(lineRange(src, 1)))).toBe('alpha')
    expect(src.slice(...Object.values(lineRange(src, 2)))).toBe('bravo')
    expect(src.slice(...Object.values(lineRange(src, 3)))).toBe('charlie')
  })

  it('clamps a stale line number instead of throwing', () => {
    expect(src.slice(...Object.values(lineRange(src, 999)))).toBe('charlie')
    expect(src.slice(...Object.values(lineRange(src, 0)))).toBe('alpha')
    expect(src.slice(...Object.values(lineRange(src, -5)))).toBe('alpha')
  })

  it('handles empty and non-string sources without throwing', () => {
    expect(lineRange('', 1)).toEqual({ start: 0, end: 0 })
    expect(lineRange(null, 3)).toEqual({ start: 0, end: 0 })
    expect(lineRange(undefined, 1)).toEqual({ start: 0, end: 0 })
  })

  it('handles a non-numeric line as line 1', () => {
    expect(src.slice(...Object.values(lineRange(src, 'x')))).toBe('alpha')
  })
})
