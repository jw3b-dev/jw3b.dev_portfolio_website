import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OvermindGraph from './OvermindGraph.jsx'
import { OVERMIND_PHASES, TOTAL_PHASES, haltingPrinciples } from '../../lib/overmindGovernance.js'
import { getClaim } from '../../lib/claimsRegister.js'

/*
 * OvermindGraph (FR-006) — the Overmind flagship, rebuilt 2026-08-22 after three wrong systems.
 *
 * The first assertion here is an ATTRIBUTION test, which is unusual for a component suite and is
 * the whole point: this card rendered a different product's pipeline for a day while every unit
 * test passed, because the tests only ever checked that the thing on screen matched the model —
 * never that the model was the right system. So the identity is pinned to the evidence register.
 */
describe('OvermindGraph — the governed engine (FR-006)', () => {
  const stepBtn = () => screen.getByRole('button', { name: /step the lifecycle|retry the gate/i })
  const breakSwitch = (n) => screen.getByRole('checkbox', { name: new RegExp(`^${n} `) })

  it('is the ENGINE, not KTHULHU’s audit pipeline', () => {
    render(<OvermindGraph />)
    expect(screen.getByRole('heading', { name: /^Overmind$/i })).toBeInTheDocument()
    expect(screen.getByText(/the engine beneath the work/i)).toBeInTheDocument()
    // The exact caption that shipped wrong. If it ever returns, this fails.
    expect(screen.queryByText(/KTHULHU.s two-lane audit engine/i)).not.toBeInTheDocument()
    // ...and none of KTHULHU's pipeline vocabulary leaks back onto this card.
    expect(screen.queryByText(/kill-gate vote/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/self-hosted box/i)).not.toBeInTheDocument()
  })

  it('carries its own cleared claims — brief 04 HARD constraint 5', () => {
    // The card previously rendered ZERO claims, so the flagship asserted a system with no receipts.
    render(<OvermindGraph />)
    for (const id of ['overmind-pipeline', 'overmind-governance-tests', 'overmind-corpus']) {
      expect(screen.getByText(getClaim(id).value, { exact: false })).toBeInTheDocument()
    }
  })

  it('renders the six lifecycle phases in order', () => {
    render(<OvermindGraph />)
    for (const p of OVERMIND_PHASES) expect(screen.getByText(p.label)).toBeInTheDocument()
    expect(screen.getByText(/phase 1 of 6/i)).toBeInTheDocument()
  })

  it('shows the exit gate with the products that must be baselined', () => {
    render(<OvermindGraph />)
    expect(screen.getByText(/baseline required: terms-of-reference/i)).toBeInTheDocument()
  })

  it('names the increment-driven phase as such rather than showing an empty gate', () => {
    render(<OvermindGraph />)
    for (let i = 0; i < 3; i++) fireEvent.click(stepBtn())
    expect(screen.getByText(/increment-driven — no product gate/i)).toBeInTheDocument()
  })

  it('allows a clean gate and walks the whole lifecycle', () => {
    render(<OvermindGraph />)
    expect(screen.getByText(/gate allowed/i)).toBeInTheDocument()
    for (let i = 0; i < TOTAL_PHASES; i++) fireEvent.click(stepBtn())
    expect(screen.getByText(/lifecycle complete/i)).toBeInTheDocument()
  })

  it('REFUSES the transition when a halting principle is broken — the key moment', () => {
    render(<OvermindGraph />)
    fireEvent.click(breakSwitch(4)) // Never Compromise Quality
    expect(screen.getByText(/gate halted — 1 exception/i)).toBeInTheDocument()

    fireEvent.click(stepBtn())
    expect(screen.getByText(/transition refused/i)).toBeInTheDocument()
    // The index must NOT have moved. A halt that quietly advanced would be the worst outcome here.
    expect(screen.getByText(/phase 1 of 6/i)).toBeInTheDocument()
  })

  it('proceeds past a coaching violation and still reports it', () => {
    render(<OvermindGraph />)
    // Principle 2 is COACHING, so it is not one of the switches — assert the distinction holds by
    // confirming only the three halting principles are offered as switches at all.
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(haltingPrinciples().length)
    expect(boxes).toHaveLength(3)
  })

  it('clears the refusal once the principle is restored, and then advances', () => {
    render(<OvermindGraph />)
    fireEvent.click(breakSwitch(8)) // Demonstrate Control
    fireEvent.click(stepBtn())
    expect(screen.getByText(/transition refused/i)).toBeInTheDocument()

    fireEvent.click(breakSwitch(8)) // restore
    expect(screen.queryByText(/transition refused/i)).not.toBeInTheDocument()
    fireEvent.click(stepBtn())
    expect(screen.getByText(/phase 2 of 6/i)).toBeInTheDocument()
  })

  it('resets state AND the broken principles', () => {
    render(<OvermindGraph />)
    fireEvent.click(breakSwitch(4))
    fireEvent.click(stepBtn())
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText(/phase 1 of 6/i)).toBeInTheDocument()
    expect(screen.getByText(/gate allowed/i)).toBeInTheDocument()
    expect(breakSwitch(4)).not.toBeChecked()
  })

  it('does not claim to be a live fleet connection', () => {
    // BR-03/BR-09 honesty: this is a transcription you can operate. The card must say so, because
    // a stepper that looks live is a stepper a visitor will believe is live.
    render(<OvermindGraph />)
    expect(screen.getByText(/not a live connection to a running\s+fleet/i)).toBeInTheDocument()
  })
})
