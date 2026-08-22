import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OvermindGraph from './OvermindGraph.jsx'
import { OVERMIND_PHASES } from '../../lib/overmindPipeline.js'

/*
 * OvermindGraph (FR-006). Rewritten 2026-08-22 with the model.
 *
 * The old surface stepped through thirteen invented stages and advancing ALWAYS worked — which
 * demonstrated nothing, because a gate that cannot refuse is decoration. These tests pin the
 * opposite property: the gate genuinely blocks, it names what is missing, and baselining those
 * products is what unblocks it.
 */
describe('OvermindGraph — a governance gate you can watch refuse (FR-006)', () => {
  const leave = () => screen.getByRole('button', { name: /leave this phase/i })

  it('renders every DSDM phase and starts with no gate cleared', () => {
    render(<OvermindGraph />)
    for (const p of OVERMIND_PHASES) expect(screen.getByText(p.label)).toBeInTheDocument()
    expect(screen.getByText(/0\/3 gates cleared · phase 1 of 6/)).toBeInTheDocument()
  })

  it('REFUSES to leave a gated phase, and names the missing product', () => {
    render(<OvermindGraph />)
    fireEvent.click(leave()) // pre-project is ungated → into Feasibility
    expect(screen.getByText(/phase 2 of 6/)).toBeInTheDocument()

    fireEvent.click(leave()) // Feasibility IS gated and nothing is baselined
    expect(screen.getByRole('status')).toHaveTextContent(/cannot leave/i)
    expect(screen.getByRole('status')).toHaveTextContent('feasibility-assessment')
    expect(screen.getByText(/phase 2 of 6/)).toBeInTheDocument() // did not move
  })

  it('baselining the gate product is what unblocks it', () => {
    render(<OvermindGraph />)
    fireEvent.click(leave())
    fireEvent.click(screen.getByRole('button', { name: /baseline feasibility-assessment/i }))
    fireEvent.click(leave())
    expect(screen.getByText(/1\/3 gates cleared · phase 3 of 6/)).toBeInTheDocument()
  })

  it('states WHY an ungated phase has no gate, so absent never reads as forgotten', () => {
    render(<OvermindGraph />)
    expect(screen.getByText(/No governance gate/i)).toBeInTheDocument()
  })

  it('shows the timebox cycle only inside evolutionary development', () => {
    render(<OvermindGraph />)
    expect(screen.queryByText(/Investigation → Refinement → Consolidation/)).toBeNull()
    // pre-project → feasibility (baseline) → foundations (baseline ×3) → evolutionary
    fireEvent.click(leave())
    fireEvent.click(screen.getByRole('button', { name: /baseline feasibility-assessment/i }))
    fireEvent.click(leave())
    for (const p of ['foundations-summary', 'prl', 'delivery-plan']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`baseline ${p}`, 'i') }))
    }
    fireEvent.click(leave())
    expect(screen.getByText(/Investigation → Refinement → Consolidation/)).toBeInTheDocument()
  })

  it('runs the whole lifecycle, and reset restarts it', () => {
    render(<OvermindGraph />)
    // Walk it: baseline whatever the current phase's gate wants, then leave.
    for (let i = 0; i < OVERMIND_PHASES.length; i++) {
      const btn = screen.queryByRole('button', { name: /leave this phase/i })
      if (!btn) break
      for (const p of OVERMIND_PHASES[i].gateProducts) {
        const b = screen.queryByRole('button', { name: new RegExp(`baseline ${p}`, 'i') })
        if (b) fireEvent.click(b)
      }
      fireEvent.click(screen.getByRole('button', { name: /leave this phase/i }))
    }
    expect(screen.getByText(/Lifecycle complete · every gate cleared/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText(/0\/3 gates cleared · phase 1 of 6/)).toBeInTheDocument()
  })
})
