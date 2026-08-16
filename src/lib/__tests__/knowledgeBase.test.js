import { describe, it, expect } from 'vitest'
import {
  buildKnowledgeBase,
  toFact,
  factLine,
  assembleSystemPrompt,
} from '../knowledgeBase.js'
import register from '../../data/evidence-register.json'
import { FORBIDDEN_PATTERNS } from '../claimsValidate.js'
import { KNOWLEDGE_BASE, conciergeSystemPrompt } from '../../../workers/portfolio-agent/src/knowledge.js'

const kb = buildKnowledgeBase(register)

describe('buildKnowledgeBase — grounding derivation (FR-018, BR-01)', () => {
  it('includes ONLY cleared claims, withholds uncleared/forbidden', () => {
    const fixture = {
      claims: [
        { id: 'ok', label: 'Fine', value: '3 things', status: 'cleared', evidence_pointer: 'https://x' },
        { id: 'pending', label: 'Pending', value: '9 things', status: 'requires_resolution', evidence_pointer: 'https://y' },
        { id: 'nopointer', label: 'No ptr', value: '5 things', status: 'cleared', evidence_pointer: '' },
      ],
      forbidden: ['never say this'],
    }
    const out = buildKnowledgeBase(fixture)
    expect(out.facts.map((f) => f.id)).toEqual(['ok'])
    expect(out.systemPrompt).toContain('3 things')
    expect(out.systemPrompt).not.toContain('9 things') // requires_resolution withheld
    expect(out.systemPrompt).not.toContain('5 things') // cleared-but-no-pointer withheld
  })

  it('tolerates a malformed register', () => {
    expect(buildKnowledgeBase(null)).toEqual({ facts: [], forbidden: [], systemPrompt: expect.any(String) })
    expect(buildKnowledgeBase({}).facts).toEqual([])
  })

  it('every fact value appears verbatim in the grounding (no paraphrase drift)', () => {
    for (const f of kb.facts) expect(kb.systemPrompt).toContain(f.value)
  })
})

describe('toFact / factLine — attribution', () => {
  it('marks owner-attested facts and carries provenance', () => {
    const f = toFact({
      id: 'x', label: 'GraphRAG uplift', value: '+18 pts',
      evidence_pointer: 'owner-attested — EcoGraph benchmark', provenance_note: 'AgileGypsy Labs / EcoGraph',
      source_system: 'EcoGraph / GraphRAG',
    })
    expect(f.ownerAttested).toBe(true)
    expect(f.provenance).toBe('AgileGypsy Labs / EcoGraph')
    const line = factLine(f)
    expect(line).toContain('owner-attested')
    expect(line).toContain('AgileGypsy Labs / EcoGraph')
    expect(line).toContain('+18 pts')
  })

  it('URL-evidenced facts are not marked owner-attested and default source', () => {
    const f = toFact({ id: 'y', label: 'Rank', value: '#124', evidence_pointer: 'https://profiles.cyfrin.io/u/agilegypsy' })
    expect(f.ownerAttested).toBe(false)
    expect(f.source).toBe('owner-attested') // no source_system → default label
    expect(factLine(f)).not.toContain(', owner-attested')
  })
})

describe('red-team — no forbidden or unverified figure is assertable (BR-02)', () => {
  it('every register forbidden claim is present as an explicit negative constraint', () => {
    for (const f of register.forbidden) expect(kb.systemPrompt).toContain(f)
  })

  it('the grounding facts contain no forbidden pattern', () => {
    const groundingValues = kb.facts.map((f) => `${f.label} ${f.value}`).join(' ')
    for (const re of FORBIDDEN_PATTERNS) expect(re.test(groundingValues)).toBe(false)
  })

  it('the prompt instructs refusal of ungrounded numbers', () => {
    expect(kb.systemPrompt).toMatch(/Never state any number/i)
    expect(kb.systemPrompt).toMatch(/NEVER make any of these claims/i)
    expect(kb.systemPrompt).toMatch(/AI assistant/i) // AI disclosure (compliance)
  })
})

describe('drift — committed knowledge.js is in sync with the sealed register (CI gate)', () => {
  it('KNOWLEDGE_BASE deep-equals a fresh generation', () => {
    expect(KNOWLEDGE_BASE).toEqual({ facts: kb.facts, forbidden: kb.forbidden })
  })
  it('conciergeSystemPrompt matches a fresh generation', () => {
    expect(conciergeSystemPrompt).toBe(kb.systemPrompt)
  })
  it('assembleSystemPrompt is deterministic', () => {
    expect(assembleSystemPrompt(kb.facts, kb.forbidden)).toBe(kb.systemPrompt)
  })
})
