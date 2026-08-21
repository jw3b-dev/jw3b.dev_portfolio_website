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
    render(<ClaimGraphWalk />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0].getAttribute('href')).toMatch(/^https?:\/\//)
    expect(links[0]).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('lets you jump to any claim, so the walk is not a single guided rail', () => {
    render(<ClaimGraphWalk />)
    const picker = screen.getByText(/start from another claim/i)
    const list = picker.closest('details')
    expect(within(list).getAllByRole('button').length).toBeGreaterThan(5)
  })
})
