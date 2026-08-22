import { describe, it, expect, vi, afterEach } from 'vitest'
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

  /*
   * Explicit 30s budget, with the reason measured rather than guessed.
   *
   * This walk is genuinely slow: the file costs ~6.1s of test time in isolation (`vitest run` on
   * this file alone), most of it this one test driving 12 interaction steps through a
   * framer-motion tree in jsdom. That fits inside the 15s global testTimeout when it runs alone,
   * and intermittently does NOT under full-suite parallel contention — it went red in 2 of 3 full
   * runs once 24 tests were added elsewhere, while passing in isolation every time.
   *
   * The budget was wrong, not the test. No assertion is relaxed here, only the clock — and 30s is
   * ~5x the measured cost, so a future failure is a real regression rather than contention.
   */
  it('walks objective → assessment → engagement → loadout and shows a retainer.json tier + price provenance', { timeout: 30_000 }, () => {
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

/*
 * W2 — the concierge's hire hash is actually consumed (PRODUCT_AUDIT #7).
 *
 * `toolCallTarget` has always produced `/hire-me#contact`, and nothing on this page read it. The
 * seam test lives here rather than in toolCalls.test.js because the defect was not in either
 * half: both were correct and tested, and the contract between them was honoured by no one.
 */
describe('MissionControl — arrival hash from the concierge', () => {
  const setHash = (h) => window.history.replaceState(null, '', h)
  afterEach(() => setHash('#'))

  // CheckoutStateMachine is stubbed at the top of this file, so the booking surface renders as
  // "CHECKOUT RAIL" — its presence is what proves the hash was honoured.
  it('#contact opens the booking surface directly — the floor, no configuring required', () => {
    setHash('#contact')
    render(<MissionControl />)
    expect(screen.getByText('CHECKOUT RAIL')).toBeInTheDocument()
  })

  it('#pricing starts the configurator normally', () => {
    setHash('#pricing')
    render(<MissionControl />)
    expect(screen.queryByText('CHECKOUT RAIL')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /configure an engagement/i })).toBeInTheDocument()
  })

  it('no hash starts the configurator normally', () => {
    render(<MissionControl />)
    expect(screen.queryByText('CHECKOUT RAIL')).not.toBeInTheDocument()
  })
})
