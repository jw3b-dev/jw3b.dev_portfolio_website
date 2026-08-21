import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * Every prompt block the concierge file DEFINES must actually reach the model.
 *
 * W2 added SITE_GUIDE_PROMPT — the block that stops the concierge inventing descriptions of this
 * site's own pages — and did not append it to the `system` string. It shipped, CI was green
 * (nothing imports it, so no test noticed), and the live concierge went on confidently telling
 * visitors that /audit "displays John's competitive security-audit record on CodeHawks", which is
 * not what that page is. Caught only by asking the deployed model the same question again.
 *
 * A prompt constant is dead code with consequences: it looks like the fix is in place. This test
 * reads the source and asserts every *_PROMPT / *_GUARD constant is concatenated into `system`,
 * so the next block that gets defined and forgotten fails here instead of in production.
 */
const SRC = resolve(__dirname, '../routes/concierge.js')
const source = readFileSync(SRC, 'utf8')

/** The `const system = …` assignment, however it is line-wrapped. */
function systemAssembly() {
  const start = source.indexOf('const system =')
  expect(start, 'no `const system =` in concierge.js').toBeGreaterThan(-1)
  const rest = source.slice(start)
  // Ends at the first blank line — the assembly is a single expression.
  const end = rest.indexOf('\n\n')
  return end === -1 ? rest : rest.slice(0, end)
}

describe('concierge system prompt — defined blocks must be USED', () => {
  const defined = [...source.matchAll(/^const (\w*(?:PROMPT|GUARD))\s*=/gm)].map((m) => m[1])
  const assembly = systemAssembly()

  it('finds the prompt blocks and the assembly (not vacuously passing)', () => {
    expect(defined.length).toBeGreaterThanOrEqual(3)
    expect(assembly).toContain('PERSONA_GUARD')
  })

  it.each(defined)('%s is concatenated into the system prompt', (name) => {
    expect(
      assembly.includes(name),
      `${name} is defined but never reaches the model. A prompt constant that is not in ` +
        '`const system = …` is dead code that looks like a shipped fix.',
    ).toBe(true)
  })

  it('grounds the concierge in the real audit workflow, not a guess', () => {
    // The prompt is built from concatenated string literals, so a phrase can straddle two lines
    // ("…(2) Instant ' + 'screen — …"). Rejoin them before matching, or the assertion tests the
    // source formatting rather than the prompt.
    const prompt = source.replace(/'\s*\+\s*\n\s*'/g, '')
    // The specific fabrication that prompted this: /audit described as a record showcase.
    expect(prompt).toMatch(/SITE_GUIDE_PROMPT/)
    expect(prompt).toMatch(/Instant screen/)
    expect(prompt).toMatch(/metered at 10 per session/)
    expect(prompt).toMatch(/not certain/i) // instructed to decline rather than invent
  })
})
