import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import KthulhuEmbed, { KTHULHU_URL } from './KthulhuEmbed.jsx'
import { RECORDED_RUNS } from '../../data/recorded-runs/index.js'

/*
 * KthulhuEmbed test (P2-10 · ADR-08). kthulhu.co opts jw3b.dev in to framing, so with the
 * `kthulhuEmbed` flag on we embed the live product in a sandboxed iframe; the flag fails closed
 * (default = recorded walkthrough), and with the flag on it still degrades to the walkthrough if
 * the framing origin isn't allow-listed (e.g. localhost). The live link is always present.
 */
afterEach(() => vi.useRealTimers())

describe('KthulhuEmbed — flag-gated live embed + recorded fallback (ADR-08)', () => {
  it('fails closed: with the embed flag OFF (default) it shows the recorded walkthrough, no iframe', () => {
    const { container } = render(<KthulhuEmbed />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getAllByText(/recorded walkthrough/i).length).toBeGreaterThan(0)
  })

  it('with the embed flag ON, embeds the live product in a minimum-privilege sandboxed iframe', () => {
    render(<KthulhuEmbed embed />)
    const frame = screen.getByTitle(/kthulhu/i)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', KTHULHU_URL)
    const sandbox = frame.getAttribute('sandbox')
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-top-navigation') // minimum privilege
    expect(sandbox).not.toContain('allow-forms')
  })

  it('stays live once the iframe loads (allow-listed origin)', () => {
    render(<KthulhuEmbed embed />)
    fireEvent.load(screen.getByTitle(/kthulhu/i))
    expect(screen.queryByText(/recorded walkthrough/i)).toBeNull()
  })

  it('degrades to the recorded walkthrough if the frame never loads (origin not allow-listed)', () => {
    vi.useFakeTimers()
    render(<KthulhuEmbed embed blockTimeoutMs={100} />)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByTitle(/kthulhu/i)).toBeNull()
    expect(screen.getAllByText(/recorded walkthrough/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /open the live kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
  })

  it('always presents a link to the live product', () => {
    render(<KthulhuEmbed />)
    expect(screen.getByRole('link', { name: /open kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
  })

  it('the recorded walkthrough is labelled and dated', () => {
    render(<KthulhuEmbed />)
    const run = RECORDED_RUNS['kthulhu-intro']
    expect(screen.getByText(new RegExp(run.capturedAt))).toBeInTheDocument()
  })
})
