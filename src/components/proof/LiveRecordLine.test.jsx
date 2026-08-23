import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveRecordLine from './LiveRecordLine.jsx'

vi.mock('../../config/embeds.js', () => ({ workerOriginAllowed: () => true }))

const RECORD = { xp: 1430.8, high: 8, medium: 5, low: 4, validSubmissions: 17, allTimePosition: 288 }
const fetcher = (out) => () => Promise.resolve(out)

describe('LiveRecordLine', () => {
  it('confirms the register when the live source agrees', async () => {
    render(<LiveRecordLine registerValidSubmissions={17} fetcher={fetcher({ state: 'live', record: RECORD, ageSec: 60 })} />)
    expect(await screen.findByText(/confirmed against codehawks/i)).toBeInTheDocument()
    expect(screen.getByText(/17 valid submissions · 1430.8 EXP/)).toBeInTheDocument()
  })

  it('SAYS SO when the live source has moved past the register', async () => {
    // The least flattering option, deliberately: a site that quietly shows a stale figure while its
    // own worker knows better is the exact failure this line exists to end.
    render(<LiveRecordLine registerValidSubmissions={17} fetcher={fetcher({ state: 'live', record: { ...RECORD, validSubmissions: 19 }, ageSec: 60 })} />)
    expect(await screen.findByText(/now reports 19 valid submissions — the figures above are behind/i)).toBeInTheDocument()
    expect(screen.queryByText(/confirmed against codehawks/i)).not.toBeInTheDocument()
  })

  it('marks a cached record as cached rather than passing it off as live', async () => {
    render(<LiveRecordLine registerValidSubmissions={17} fetcher={fetcher({ state: 'stale', record: RECORD, ageSec: 90000 })} />)
    expect(await screen.findByText(/cached — source unreachable/i)).toBeInTheDocument()
  })

  it('renders NOTHING when the record is unknown', async () => {
    // Not a "status unknown" chip: our probe being down says nothing about the record, and a
    // permanent unknown is noise a reader learns to ignore.
    const { container } = render(<LiveRecordLine registerValidSubmissions={17} fetcher={fetcher({ state: 'unknown', record: null, ageSec: null })} />)
    await Promise.resolve()
    expect(container.textContent).toBe('')
  })

  it('renders nothing before the first answer — no flash of a state that resolves later', () => {
    const { container } = render(<LiveRecordLine registerValidSubmissions={17} fetcher={() => new Promise(() => {})} />)
    expect(container.textContent).toBe('')
  })
})
