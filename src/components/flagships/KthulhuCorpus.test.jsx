/*
 * KthulhuCorpus — the on-site corpus console.
 *
 * Two risks, and the tests are weighted to them:
 *
 *  1. MISATTRIBUTION. These are other people's published findings. If this panel ever reads as
 *     John's audit output it is a claims violation on the surface whose whole argument is that
 *     claims here are governed. So the disclaimer is asserted before any interaction.
 *  2. A DEAD END. The panel sits inside a flagship card; if the corpus is unreachable it must say
 *     so in words a visitor can act on, never render an empty box or take the page down.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KthulhuCorpus from './KthulhuCorpus.jsx'

const FINDING = {
  id: 'f1',
  title: 'Reentrancy Lets Relayer Withdraw More than Expected',
  excerpt: 'finalizeWithdrawalBond() could be re-entered to withdraw more than requested.',
  severity: 'High',
  year: 2023,
  swc: 'SWC-107',
  source: 'x23',
  similarity: 0.6959,
}

const hit = (over = {}) => vi.fn().mockResolvedValue({ query: 'q', results: [FINDING], degraded: false, ...over })

describe('KthulhuCorpus — attribution before anything else', () => {
  it('says these are other people’s findings, before a search is run', () => {
    render(<KthulhuCorpus search={hit()} related={vi.fn()} />)
    expect(screen.getByText(/other people’s findings, published by their authors/i)).toBeInTheDocument()
    expect(screen.getByText(/none of them is john’s audit work/i)).toBeInTheDocument()
  })

  it('states no client submission is reachable from here', () => {
    render(<KthulhuCorpus search={hit()} related={vi.fn()} />)
    expect(screen.getByText(/no client submission is reachable/i)).toBeInTheDocument()
  })

  it('labels an unresolved source as unattributed rather than as a brand', async () => {
    render(<KthulhuCorpus search={hit()} related={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    expect(await screen.findByText(/Unattributed \(x23\)/)).toBeInTheDocument()
  })
})

describe('KthulhuCorpus — searching', () => {
  it('offers suggestions so an empty box is not a dead end, and running one searches it', async () => {
    const search = hit()
    render(<KthulhuCorpus search={search} related={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'oracle price manipulation' }))
    await waitFor(() => expect(search).toHaveBeenCalledWith('oracle price manipulation', expect.anything()))
    expect(await screen.findByText(FINDING.title)).toBeInTheDocument()
  })

  it('shows the match score — a ranked result that hides its score asks to be trusted', async () => {
    render(<KthulhuCorpus search={hit()} related={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    expect(await screen.findByText(/match 0\.70/)).toBeInTheDocument()
  })

  it('will not submit a one-character query', () => {
    render(<KthulhuCorpus search={hit()} related={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/search the public audit corpus/i), { target: { value: 'r' } })
    expect(screen.getByRole('button', { name: /^search$/i })).toBeDisabled()
  })

  it('renders the degraded REASON, never a silent empty box', async () => {
    const search = vi.fn().mockResolvedValue({ results: [], degraded: true, reason: 'the knowledge base is unreachable right now' })
    render(<KthulhuCorpus search={search} related={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    expect(await screen.findByText(/unreachable right now/i)).toBeInTheDocument()
  })

  it('distinguishes "nothing matched" from "the corpus is down"', async () => {
    const search = vi.fn().mockResolvedValue({ results: [], degraded: false })
    render(<KthulhuCorpus search={search} related={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    expect(await screen.findByText(/nothing matched that closely/i)).toBeInTheDocument()
  })
})

describe('KthulhuCorpus — traversal, which is the part the thesis page claims', () => {
  it('walks an edge from a result and shows where it is', async () => {
    const related = vi.fn().mockResolvedValue({
      origin: FINDING,
      edges: [{ kind: 'swc', value: 'SWC-107' }],
      edge: { kind: 'swc', value: 'SWC-107' },
      results: [{ ...FINDING, id: 'f2', title: 'A sibling reentrancy finding' }],
      degraded: false,
    })
    render(<KthulhuCorpus search={hit()} related={related} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    fireEvent.click(await screen.findByRole('button', { name: /traverse from here/i }))

    expect(await screen.findByText('A sibling reentrancy finding')).toBeInTheDocument()
    expect(screen.getByText(/traversing from/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Same weakness class · SWC-107/ })).toBeInTheDocument()
  })

  it('explains an unlinked finding instead of showing an empty list', async () => {
    const related = vi.fn().mockResolvedValue({
      origin: FINDING,
      edges: [{ kind: 'swc', value: 'SWC-107' }],
      results: [],
      degraded: false,
      reason: 'no protocol edge',
    })
    render(<KthulhuCorpus search={hit()} related={related} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    fireEvent.click(await screen.findByRole('button', { name: /traverse from here/i }))
    expect(await screen.findByText(/No neighbours along this edge/i)).toBeInTheDocument()
    expect(screen.getByText(/Not every published finding carries a weakness class/i)).toBeInTheDocument()
  })

  it('keeps the anchor when the Worker returns no origin — losing your place is worse', async () => {
    const related = vi.fn().mockResolvedValue({ origin: null, edges: [], results: [], degraded: false })
    render(<KthulhuCorpus search={hit()} related={related} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    fireEvent.click(await screen.findByRole('button', { name: /traverse from here/i }))
    // The clicked finding's title still names where you are.
    expect(await screen.findByText(/traversing from/i)).toBeInTheDocument()
    expect(screen.getAllByText(FINDING.title).length).toBeGreaterThan(0)
  })

  it('goes back to the results it came from', async () => {
    const related = vi.fn().mockResolvedValue({ origin: FINDING, edges: [], results: [], degraded: false })
    render(<KthulhuCorpus search={hit()} related={related} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    fireEvent.click(await screen.findByRole('button', { name: /traverse from here/i }))
    fireEvent.click(await screen.findByRole('button', { name: /back to results/i }))
    expect(await screen.findByRole('button', { name: /traverse from here/i })).toBeInTheDocument()
  })

  it('degrades on traversal too', async () => {
    const related = vi.fn().mockResolvedValue({ origin: null, edges: [], results: [], degraded: true, reason: 'the knowledge base is unreachable right now' })
    render(<KthulhuCorpus search={hit()} related={related} />)
    fireEvent.click(screen.getByRole('button', { name: 'reentrancy in withdraw' }))
    fireEvent.click(await screen.findByRole('button', { name: /traverse from here/i }))
    expect(await screen.findByText(/unreachable right now/i)).toBeInTheDocument()
  })
})
