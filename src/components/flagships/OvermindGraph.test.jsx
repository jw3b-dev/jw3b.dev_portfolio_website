import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OvermindGraph from './OvermindGraph.jsx'
import { OVERMIND_PHASES, OVERMIND_STEPS, TOTAL_STEPS, LANES, laneSteps } from '../../lib/overmindPipeline.js'

/*
 * OvermindGraph (FR-006), rebuilt 2026-08-22 second pass.
 *
 * The property worth pinning is the LANE. A stepper that renders 21 steps and advances through
 * them looks correct while saying nothing a competitor could not also say; what is hard to claim
 * falsely is that half of them execute in containers on self-hosted hardware. So the lane marker
 * is asserted on screen, not just in the model.
 */
describe('OvermindGraph — KTHULHU’s two-lane pipeline (FR-006)', () => {
  const stepBtn = () => screen.getByRole('button', { name: /step the pipeline/i })

  it('attributes the pipeline to KTHULHU, so it cannot read as the other Overmind', () => {
    render(<OvermindGraph />)
    // The heading stays "Overmind" (the flagship IA names it that); the attribution is explicit
    // alongside it. Without this the card silently described a different product for a day.
    expect(screen.getByRole('heading', { name: /^Overmind$/i })).toBeInTheDocument()
    expect(screen.getByText(/KTHULHU.s two-lane audit engine/i)).toBeInTheDocument()
  })

  it('renders all four phases and every step', () => {
    render(<OvermindGraph />)
    for (const p of OVERMIND_PHASES) expect(screen.getByText(p.label)).toBeInTheDocument()
    for (const s of OVERMIND_STEPS) expect(screen.getByText(s.label)).toBeInTheDocument()
  })

  it('SHOWS the lane on every step — the split must be visible, not merely modelled', () => {
    render(<OvermindGraph />)
    const box = screen.getAllByLabelText(/runs on the self-hosted box/i)
    const cloud = screen.getAllByLabelText(/runs on the Cloudflare/i)
    expect(box).toHaveLength(laneSteps(LANES.BOX).length)
    expect(cloud).toHaveLength(laneSteps(LANES.CLOUD).length)
    expect(box.length).toBeGreaterThan(0)
  })

  it('states the lane counts in prose, from the model rather than hardcoded', () => {
    render(<OvermindGraph />)
    expect(screen.getByText(new RegExp(`${laneSteps(LANES.CLOUD).length} orchestrated on Cloudflare`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${laneSteps(LANES.BOX).length} executed in containers`))).toBeInTheDocument()
  })

  it('starts with no gate passed and explains a gate when it is reached', () => {
    render(<OvermindGraph />)
    expect(screen.getByText(/0\/2 gates/)).toBeInTheDocument()

    const killIdx = OVERMIND_STEPS.findIndex((s) => s.id === 'kill-gate-vote')
    for (let i = 0; i < killIdx; i++) fireEvent.click(stepBtn())

    // The gate is not a tick — it says what it does, and what it refuses to do.
    expect(screen.getByText(/dropped_fp/)).toBeInTheDocument()
    expect(screen.getByText(/false negative is far worse/i)).toBeInTheDocument()
  })

  it('marks FV dispatch as async — the verdict may not land', () => {
    render(<OvermindGraph />)
    const fvIdx = OVERMIND_STEPS.findIndex((s) => s.id === 'fv-dispatch')
    for (let i = 0; i < fvIdx; i++) fireEvent.click(stepBtn())
    expect(screen.getByText(/the verdict may not land/i)).toBeInTheDocument()
  })

  it('explains the review gate as DERIVED and holding delivery', () => {
    render(<OvermindGraph />)
    const reviewIdx = OVERMIND_STEPS.findIndex((s) => s.id === 'review-gate')
    for (let i = 0; i < reviewIdx; i++) fireEvent.click(stepBtn())
    // "awaiting_review" appears in BOTH the outcome and the asymmetry line, so match the
    // distinctive half of each rather than the shared token.
    expect(screen.getByText(/report delivery is HELD/i)).toBeInTheDocument()
    expect(screen.getByText(/found something serious/i)).toBeInTheDocument()
  })

  it('runs end to end and resets', () => {
    render(<OvermindGraph />)
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const b = screen.queryByRole('button', { name: /step the pipeline/i })
      if (b) fireEvent.click(b)
    }
    expect(screen.getByText(/both gates passed/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText(/0\/2 gates/)).toBeInTheDocument()
  })
})
