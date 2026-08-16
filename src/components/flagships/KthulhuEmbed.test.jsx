import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import KthulhuEmbed, { KTHULHU_URL } from './KthulhuEmbed.jsx'

/*
 * KthulhuEmbed test (P2-10 · ADR-08). Verifies the sandboxed embed at minimum privilege, the
 * always-present external link, and the degrade: if the frame never loads within the window,
 * the component drops to a labelled recorded walkthrough (never a blank frame).
 */
afterEach(() => vi.useRealTimers())

describe('KthulhuEmbed — sandboxed embed + recorded fallback (ADR-08)', () => {
  it('renders a sandboxed iframe at minimum privilege + an always-present external link', () => {
    render(<KthulhuEmbed />)
    const frame = screen.getByTitle(/kthulhu/i)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', KTHULHU_URL)
    const sandbox = frame.getAttribute('sandbox')
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-top-navigation') // minimum privilege
    expect(sandbox).not.toContain('allow-forms')
    expect(screen.getByRole('link', { name: /open kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
  })

  it('goes live on iframe load (no fallback)', () => {
    render(<KthulhuEmbed />)
    fireEvent.load(screen.getByTitle(/kthulhu/i))
    expect(screen.queryByText(/recorded walkthrough/i)).toBeNull()
  })

  it('degrades to a labelled recorded walkthrough if the frame never loads in time', () => {
    vi.useFakeTimers()
    render(<KthulhuEmbed blockTimeoutMs={100} />)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.getAllByText(/recorded walkthrough/i).length).toBeGreaterThan(0)
    // the real product is still reachable
    expect(screen.getByRole('link', { name: /open the live kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
  })
})
