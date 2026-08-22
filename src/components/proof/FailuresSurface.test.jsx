import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FailuresSurface from './FailuresSurface.jsx'
import { FAILURES } from '../../data/recorded-runs/failures/index.js'

/*
 * These originally used bare `getByText` over the whole surface, which silently assumed the corpus
 * held exactly ONE artifact — they encoded the very limitation brief 07 was complaining about, and
 * broke the moment a second one landed. Now each assertion is scoped to the article for a specific
 * artifact, and the per-artifact checks run over EVERY entry, so a third costs nothing.
 */
const surfaceEl = () => screen.getByRole('region', { name: /what failed, and why/i })
const articleFor = (f) => within(surfaceEl()).getByText(f.title).closest('article, li, section, div')

describe('FailuresSurface — first-class radical-honesty surface (FR-045 / OBJ-04)', () => {
  it.each(FAILURES.map((f) => [f.id, f]))('%s renders its real log, failure, and fix', (_id, f) => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    const art = within(articleFor(f))
    expect(art.getByText(/Real log/i)).toBeInTheDocument()
    expect(art.getByText(new RegExp(f.log[0].slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument()
    expect(art.getByText('What failed & why')).toBeInTheDocument()
    expect(art.getByText(f.failure)).toBeInTheDocument()
    expect(art.getByText(f.fix)).toBeInTheDocument()
  })

  it('shows every artifact in the corpus — a habit, not an instance (brief 07)', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    expect(FAILURES.length).toBeGreaterThan(1)
    for (const f of FAILURES) expect(within(surfaceEl()).getByText(f.title)).toBeInTheDocument()
  })

  it('exposes a reproducible input for each, so the failure can be checked and not just asserted', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    expect(screen.getAllByText(/Reproduce it/i)).toHaveLength(FAILURES.length)
  })

  it('an OPEN failure says so instead of implying a fix closed it', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    const open = FAILURES.filter((f) => f.status === 'open')
    if (!open.length) return
    for (const f of open) expect(within(articleFor(f)).getByText(/still open/i)).toBeInTheDocument()
  })
})

describe('reproducing a failure is operable, not an instruction', () => {
  it('links EVERY audit failure into the live console to replay its exact input', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    const audits = FAILURES.filter((x) => x.surface === 'audit')
    const links = screen.getAllByRole('link', { name: /run it in \/audit/i })
    expect(links).toHaveLength(audits.length)
    const hrefs = links.map((l) => l.getAttribute('href'))
    for (const f of audits) expect(hrefs).toContain(`/audit?case=${f.id}`)
  })
})
