import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import RETAINER from '../../data/retainer.json'

// This suite is about the CONFIGURATOR and its onBook seam — not the checkout rails, which
// have their own tests. Rendering the real CheckoutStateMachine dragged in the whole wallet
// provider stack (WalletConnect core init), which under full-suite parallel load pushed this
// test past its timeout: it passed in isolation and failed in CI. A flaky gate is a gate
// people learn to ignore, so the rails are stubbed here and exercised where they belong.
vi.mock('./CheckoutStateMachine.jsx', () => ({ default: () => <div>CHECKOUT RAIL</div> }))

const { default: MissionControl } = await import('./MissionControl.jsx')

describe('MissionControl — 4-step configurator (P1-17 / FR-028)', () => {
  it('renders a 4-step progress rail with the step-3 label "Engagement", never "Parameters"', () => {
    render(<MissionControl />)
    const rail = screen.getByRole('navigation', { name: /configurator progress/i })
    const steps = within(rail).getAllByRole('button')
    expect(steps).toHaveLength(4)
    expect(within(rail).getByText(/^Engagement$/i)).toBeInTheDocument()
    expect(within(rail).queryByText(/parameters/i)).toBeNull()
  })

  it('gates Continue until the current step has a selection', () => {
    render(<MissionControl />)
    const cont = screen.getByRole('button', { name: /continue/i })
    expect(cont).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /secure what/i }))
    expect(cont).toBeEnabled()
  })

  it('walks objective → assessment → engagement → loadout and shows a retainer.json tier + price provenance', () => {
    const onBook = vi.fn()
    render(<MissionControl onBook={onBook} />)

    // Step 1 — objective
    fireEvent.click(screen.getByRole('button', { name: /secure what/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2 — assessment (all three required to advance)
    fireEvent.click(screen.getByRole('button', { name: /^Idea \/ spec$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Smart contracts$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Urgent$/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3 — engagement (OptionCard accessible name = title + description)
    fireEvent.click(screen.getByRole('button', { name: /project.*defined scope/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4 — loadout: resolved tier is the real (security × project) catalog entry.
    const expected = RETAINER.tiers.find((t) => t.objective === 'security' && t.engagement === 'project')
    expect(screen.getByText(expected.name)).toBeInTheDocument()
    // Unprovisioned price is stated honestly — never a free-typed number.
    expect(screen.getByText(/sized honestly on the call/i)).toBeInTheDocument()

    // Book-a-call CTA (P1-19 seam) fires with the captured configuration.
    fireEvent.click(screen.getByRole('button', { name: /book a call/i }))
    expect(onBook).toHaveBeenCalledWith(
      expect.objectContaining({ objective: 'security', engagement: 'project', tierId: expected.id }),
    )
  })
})
