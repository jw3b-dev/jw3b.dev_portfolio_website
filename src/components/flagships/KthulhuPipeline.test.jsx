import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KthulhuPipeline from './KthulhuPipeline.jsx'
import { KTHULHU_PHASES, KTHULHU_STEPS, TOTAL_STEPS, LANES, laneSteps } from '../../lib/kthulhuPipeline.js'

/*
 * KthulhuPipeline (FR-006) — moved onto the KTHULHU card 2026-08-22.
 *
 * The property worth pinning is the LANE. A stepper that renders 21 steps and advances through
 * them looks correct while saying nothing a competitor could not also say; what is hard to claim
 * falsely is that half of them execute in containers on self-hosted hardware. So the lane marker
 * is asserted on screen, not just in the model.
 */
describe('KthulhuPipeline — KTHULHU’s two-lane pipeline (FR-006)', () => {
  const stepBtn = () => screen.getByRole('button', { name: /step the pipeline/i })

  it('does NOT present itself as Overmind — that was a different system for a day', () => {
    render(<KthulhuPipeline />)
    // The regression this pins: this pipeline shipped captioned "Overmind", which is the name of
    // the governed agent engine, not of KTHULHU's auditor. The word must not head this panel.
    expect(screen.queryByRole('heading', { name: /^Overmind$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how an audit actually runs/i })).toBeInTheDocument()
    expect(screen.getByText(/KTHULHU.s two lanes/i)).toBeInTheDocument()
  })

  it('renders all four phases and every step', () => {
    render(<KthulhuPipeline />)
    for (const p of KTHULHU_PHASES) expect(screen.getByText(p.label)).toBeInTheDocument()
    for (const s of KTHULHU_STEPS) expect(screen.getByText(s.label)).toBeInTheDocument()
  })

  it('SHOWS the lane on every step — the split must be visible, not merely modelled', () => {
    render(<KthulhuPipeline />)
    const box = screen.getAllByLabelText(/runs on the self-hosted box/i)
    const cloud = screen.getAllByLabelText(/runs on the Cloudflare/i)
    expect(box).toHaveLength(laneSteps(LANES.BOX).length)
    expect(cloud).toHaveLength(laneSteps(LANES.CLOUD).length)
    expect(box.length).toBeGreaterThan(0)
  })

  it('states the lane counts in prose, from the model rather than hardcoded', () => {
    render(<KthulhuPipeline />)
    expect(screen.getByText(new RegExp(`${laneSteps(LANES.CLOUD).length} orchestrated on Cloudflare`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${laneSteps(LANES.BOX).length} executed in containers`))).toBeInTheDocument()
  })

  it('starts with no gate passed and explains a gate when it is reached', () => {
    render(<KthulhuPipeline />)
    expect(screen.getByText(/0\/2 gates/)).toBeInTheDocument()

    const killIdx = KTHULHU_STEPS.findIndex((s) => s.id === 'kill-gate-vote')
    for (let i = 0; i < killIdx; i++) fireEvent.click(stepBtn())

    // The gate is not a tick — it says what it does, and what it refuses to do.
    expect(screen.getByText(/dropped_fp/)).toBeInTheDocument()
    expect(screen.getByText(/false negative is far worse/i)).toBeInTheDocument()
  })

  it('marks FV dispatch as async — the verdict may not land', () => {
    render(<KthulhuPipeline />)
    const fvIdx = KTHULHU_STEPS.findIndex((s) => s.id === 'fv-dispatch')
    for (let i = 0; i < fvIdx; i++) fireEvent.click(stepBtn())
    expect(screen.getByText(/the verdict may not land/i)).toBeInTheDocument()
  })

  it('explains the review gate as DERIVED and holding delivery', () => {
    render(<KthulhuPipeline />)
    const reviewIdx = KTHULHU_STEPS.findIndex((s) => s.id === 'review-gate')
    for (let i = 0; i < reviewIdx; i++) fireEvent.click(stepBtn())
    // "awaiting_review" appears in BOTH the outcome and the asymmetry line, so match the
    // distinctive half of each rather than the shared token.
    expect(screen.getByText(/report delivery is HELD/i)).toBeInTheDocument()
    expect(screen.getByText(/found something serious/i)).toBeInTheDocument()
  })

  it('runs end to end and resets', () => {
    render(<KthulhuPipeline />)
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const b = screen.queryByRole('button', { name: /step the pipeline/i })
      if (b) fireEvent.click(b)
    }
    expect(screen.getByText(/both gates passed/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText(/0\/2 gates/)).toBeInTheDocument()
  })
})
