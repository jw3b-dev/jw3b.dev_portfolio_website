/*
 * P5 / brief 05 — the loadable examples.
 *
 * These are the tests that make the examples honest. Each one claims to demonstrate a specific
 * detector, and that claim is CHECKED against the real engine rather than trusted: an example
 * that stopped tripping its own detector would be a demo of nothing, on the surface whose entire
 * argument is that automated screening finds real patterns.
 *
 * Both directions matter. An example must raise what it advertises, AND must not quietly raise
 * something it does not mention — a "reentrancy example" that also trips two other detectors
 * teaches the wrong lesson about what the tool just found.
 */
import { describe, it, expect } from 'vitest'
import { auditSolidity } from '../auditHeuristics.js'
import { AUDIT_EXAMPLES, exampleById } from '../auditExamples.js'

const idsFor = (source) => [...new Set((auditSolidity(source).findings || []).map((f) => f.id))].sort()

describe('auditExamples — every example demonstrates what it claims', () => {
  it.each(AUDIT_EXAMPLES.map((e) => [e.id, e]))('%s raises its advertised finding', (_id, ex) => {
    const raised = idsFor(ex.source)
    for (const want of ex.detects) {
      expect(raised, `${ex.id} advertises ${want} but raised [${raised}]`).toContain(want)
    }
  })

  it.each(AUDIT_EXAMPLES.map((e) => [e.id, e]))('%s raises NOTHING it does not advertise', (_id, ex) => {
    const raised = idsFor(ex.source)
    const unexpected = raised.filter((r) => !ex.detects.includes(r))
    expect(unexpected, `${ex.id} also raised [${unexpected}] — the lesson would be muddled`).toEqual([])
  })
})

describe('auditExamples — the set itself', () => {
  it('has unique ids and no empty fields', () => {
    const ids = AUDIT_EXAMPLES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of AUDIT_EXAMPLES) {
      expect(e.title.trim()).not.toBe('')
      expect(e.blurb.trim()).not.toBe('')
      expect(e.source.trim()).not.toBe('')
      expect(e.detects.length).toBeGreaterThan(0)
    }
  })

  it('covers every detector the engine can raise — a gap here is a detector nobody can try', () => {
    // Derived from the engine, not hand-listed: adding a detector without an example fails this.
    const advertised = new Set(AUDIT_EXAMPLES.flatMap((e) => e.detects))
    const engineIds = new Set(AUDIT_EXAMPLES.flatMap((e) => idsFor(e.source)))
    for (const id of engineIds) expect(advertised.has(id)).toBe(true)
    expect(advertised.size).toBeGreaterThanOrEqual(3)
  })

  it('no example title collides with a finding title the console renders', () => {
    // The chips sit a few centimetres from the findings panel. A chip reading exactly like a
    // finding heading is ambiguous on screen — which is how this surfaced, as a duplicate-text
    // failure in the console's own tests rather than as a design review.
    for (const e of AUDIT_EXAMPLES) {
      const findingTitles = (auditSolidity(e.source).findings || []).map((f) => f.title)
      expect(findingTitles).not.toContain(e.title)
    }
  })

  it('every example is real Solidity with a pinned or explicit pragma line', () => {
    for (const e of AUDIT_EXAMPLES) {
      expect(e.source).toMatch(/^\/\/ SPDX-License-Identifier:/)
      expect(e.source).toMatch(/pragma solidity/)
      expect(e.source).toMatch(/contract \w+/)
    }
  })

  it('exampleById finds one, and returns null rather than throwing', () => {
    expect(exampleById('reentrancy').title).toBe('Vault (reentrancy)')
    expect(exampleById('nope')).toBeNull()
    expect(exampleById()).toBeNull()
  })
})
