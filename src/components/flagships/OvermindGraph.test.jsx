import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OvermindGraph from './OvermindGraph.jsx'
import { OVERMIND_STAGES } from '../../lib/overmindPipeline.js'

/*
 * OvermindGraph test (P2-11). Proves it's an OPERABLE pipeline, not a static diagram: stepping
 * advances the zero-trust gate progress and eventually validates end-to-end, and reset returns
 * it to the start. Non-3D (design lock) so it renders plainly in jsdom.
 */
describe('OvermindGraph — steppable validated pipeline (FR-006)', () => {
  it('renders every stage and starts un-validated', () => {
    render(<OvermindGraph />)
    for (const s of OVERMIND_STAGES) expect(screen.getByText(s.label)).toBeInTheDocument()
    expect(screen.getByText(/0\/\d+ gates passed/)).toBeInTheDocument()
  })

  it('stepping advances the gate progress (operable, not static)', () => {
    render(<OvermindGraph />)
    const before = screen.getByText(/gates passed/).textContent
    fireEvent.click(screen.getByRole('button', { name: /step the pipeline/i }))
    fireEvent.click(screen.getByRole('button', { name: /step the pipeline/i }))
    expect(screen.getByText(/gates passed/).textContent).not.toBe(before)
  })

  it('validates end-to-end after stepping through, and reset restarts it', () => {
    render(<OvermindGraph />)
    for (let i = 0; i < OVERMIND_STAGES.length; i++) {
      const btn = screen.queryByRole('button', { name: /step the pipeline/i })
      if (btn) fireEvent.click(btn)
    }
    expect(screen.getByText(/validated end-to-end/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText(/step the pipeline/i)).toBeInTheDocument()
  })
})
