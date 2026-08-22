import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ClaimGraphWalk from './ClaimGraphWalk.jsx'

/*
 * W4 — the thesis performs its argument instead of asserting it (PRODUCT_AUDIT #22).
 *
 * The page claims "the surfaces here are consoles, not slideshows … the work is traversing it in
 * front of you" and then traversed nothing. These tests hold it to that: a visitor must be able
 * to stand on a node, see its edges, follow one, and arrive somewhere real.
 */
describe('ClaimGraphWalk — a graph you can actually walk', () => {
  it('starts on a claim and offers at least one edge', () => {
    render(<ClaimGraphWalk />)
    expect(screen.getByText('Claim')).toBeInTheDocument()
    expect(screen.getByText(/edges? from here/i)).toBeInTheDocument()
  })

  it('says how big the graph is, rather than implying it is vast', () => {
    render(<ClaimGraphWalk />)
    // A small graph should admit being small — inflated scale is the failure mode here.
    expect(screen.getByText(/cleared claims across \d+ sources/i)).toBeInTheDocument()
  })

  it('follows an edge from a claim to the source that attests it', () => {
    render(<ClaimGraphWalk />)
    const edge = screen.getByRole('button', { name: /attested by/i })
    fireEvent.click(edge)
    expect(screen.getByText('Source')).toBeInTheDocument()
  })

  it('walks BACK from a source to the other claims resting on it', () => {
    render(<ClaimGraphWalk />)
    fireEvent.click(screen.getByRole('button', { name: /attested by/i }))
    // From a source, every edge leads to a claim it attests.
    const back = screen.getAllByRole('button', { name: /attests/i })
    expect(back.length).toBeGreaterThan(0)
    fireEvent.click(back[0])
    expect(screen.getByText('Claim')).toBeInTheDocument()
  })

  it('shows the path walked, so the traversal is visible and not just its destination', () => {
    render(<ClaimGraphWalk />)
    expect(screen.queryByText(/^path:/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /attested by/i }))
    // Scope to the path line: the edge buttons carry arrows too, so a bare /→/ is ambiguous.
    const path = screen.getByText(/^path:/i)
    expect(path.textContent).toMatch(/→/)
  })

  it('ends at checkable evidence — a walk that proves nothing is decoration', () => {
    // ✎ STRENGTHENED 2026-08-23. This asserted `links[0]` was a URL, which passed only because
    // every pointer happened to be one. The component rendered `current.evidence` into an href
    // unconditionally, so the first ATTESTED pointer turned the walk's payoff into an anchor
    // pointing at a relative path made of a sentence — on the page arguing evidence is checkable.
    // The invariant is now the one that was actually broken: nothing prose-shaped may be a link.
    render(<ClaimGraphWalk />)
    // queryAll, not getAll: the opening node may legitimately be an attested claim with no link,
    // and "there are zero fake links" is a pass, not a missing element.
    const links = screen.queryAllByRole('link')
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https?:\/\//)
      expect(a).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })

  it('walks to a URL-backed claim and offers the receipt as a real link', () => {
    render(<ClaimGraphWalk />)
    const list = screen.getByText(/start from another claim/i).closest('details')
    const target = within(list)
      .getAllByRole('button')
      .find((b) => /Neo4j Certified Professional/i.test(b.textContent))
    expect(target).toBeDefined()
    fireEvent.click(target)
    const links = screen.getAllByRole('link')
    expect(links.some((a) => /^https?:\/\//.test(a.getAttribute('href')))).toBe(true)
  })

  it('walks to an ATTESTED claim and marks it rather than faking a link', () => {
    // The CodeHawks record is attested since its public receipt started contradicting the claim
    // (mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md). The walk must say so, not link to prose.
    render(<ClaimGraphWalk />)
    const list = screen.getByText(/start from another claim/i).closest('details')
    const target = within(list)
      .getAllByRole('button')
      .find((b) => /#124/.test(b.textContent))
    expect(target).toBeDefined()
    fireEvent.click(target)
    expect(screen.getByText(/owner-attested/i)).toBeInTheDocument()
    for (const a of screen.queryAllByRole('link')) {
      expect(a.getAttribute('href')).toMatch(/^https?:\/\//)
    }
  })

  it('lets you jump to any claim, so the walk is not a single guided rail', () => {
    render(<ClaimGraphWalk />)
    const picker = screen.getByText(/start from another claim/i)
    const list = picker.closest('details')
    expect(within(list).getAllByRole('button').length).toBeGreaterThan(5)
  })
})
