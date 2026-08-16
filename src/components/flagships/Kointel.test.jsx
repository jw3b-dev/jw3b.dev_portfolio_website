import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Kointel, { KOINTEL_URL } from './Kointel.jsx'

/*
 * Kointel test (P2-12). The flagship embeds the live product in a sandboxed iframe ONLY when the
 * `kointelEmbed` flag is on (it fails closed — the deployed default shows the launch card, never
 * a broken "refused to connect" frame). With the flag on it still degrades if framing is refused.
 * The link + dimensions + no-unbacked-stat (proof, not promises) hold in every state.
 */
afterEach(() => vi.useRealTimers())

describe('Kointel flagship (P2-12)', () => {
  it('fails closed: with the embed flag OFF (deployed default) there is no iframe', () => {
    render(<Kointel />)
    expect(screen.queryByTitle(/kointel/i)).toBeNull()
    expect(screen.getByRole('link', { name: /open kointel/i })).toHaveAttribute('href', KOINTEL_URL)
  })

  it('with the embed flag ON, embeds the live product in a minimum-privilege sandboxed iframe', () => {
    render(<Kointel embed />)
    const frame = screen.getByTitle(/kointel/i)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', KOINTEL_URL)
    const sandbox = frame.getAttribute('sandbox')
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-top-navigation') // minimum privilege
    expect(sandbox).not.toContain('allow-forms')
  })

  it('always links to the live external product', () => {
    render(<Kointel />)
    const link = screen.getByRole('link', { name: /open kointel/i })
    expect(link).toHaveAttribute('href', KOINTEL_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('carries the Auditor + Founder dimensions', () => {
    render(<Kointel />)
    const dims = screen.getByRole('list', { name: /dimensions/i })
    expect(dims).toHaveTextContent(/auditor/i)
    expect(dims).toHaveTextContent(/founder/i)
  })

  it('degrades to the launch card (no frame) if the remote refuses framing after the flag is on', () => {
    vi.useFakeTimers()
    render(<Kointel embed blockTimeoutMs={100} />)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByTitle(/kointel/i)).toBeNull()
    // still not a dead-end: the live product is reachable and the dimensions remain.
    expect(screen.getByRole('link', { name: /open kointel/i })).toHaveAttribute('href', KOINTEL_URL)
    expect(screen.getByRole('list', { name: /dimensions/i })).toBeInTheDocument()
  })

  it('shows no numeric stat (no cleared Kointel claim → proof, not promises)', () => {
    const { container } = render(<Kointel />)
    expect(container.textContent).not.toMatch(/\b\d[\d,]*\s*(tests?|users?|phase|audits?)\b/i)
  })
})
