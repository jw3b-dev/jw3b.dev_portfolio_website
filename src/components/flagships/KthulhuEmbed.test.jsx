import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KthulhuEmbed, { KTHULHU_URL } from './KthulhuEmbed.jsx'
import { RECORDED_RUNS } from '../../data/recorded-runs/index.js'

/*
 * KthulhuEmbed test (P2-10 · ADR-08). KTHULHU hard-refuses framing (X-Frame-Options: DENY +
 * frame-ancestors 'none', verified live), so the surface is a LINKED launch card with the
 * recorded walkthrough shown inline as an honest preview — never an always-failing iframe.
 */
describe('KthulhuEmbed — linked launch card + recorded preview (ADR-08)', () => {
  it('does NOT embed the product in an iframe (framing is refused by the remote)', () => {
    const { container } = render(<KthulhuEmbed />)
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('always presents a link to the live product', () => {
    render(<KthulhuEmbed />)
    expect(screen.getByRole('link', { name: /open kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
    expect(screen.getByRole('link', { name: /open the live kthulhu/i })).toHaveAttribute('href', KTHULHU_URL)
  })

  it('shows the recorded walkthrough inline, labelled and dated', () => {
    render(<KthulhuEmbed />)
    expect(screen.getAllByText(/recorded walkthrough/i).length).toBeGreaterThan(0)
    const run = RECORDED_RUNS['kthulhu-intro']
    expect(screen.getByText(new RegExp(run.capturedAt))).toBeInTheDocument()
    // every recorded frame renders as its own paragraph
    run.frames.forEach((f) => {
      const snippet = f.response.trim().slice(0, 24)
      const hits = screen.getAllByText((_, node) => node?.tagName === 'P' && node.textContent?.includes(snippet))
      expect(hits.length).toBeGreaterThan(0)
    })
  })
})
