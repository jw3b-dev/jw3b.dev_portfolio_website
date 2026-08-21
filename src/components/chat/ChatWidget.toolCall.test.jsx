import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
let hook
vi.mock('../../hooks/usePortfolioAgent.js', () => ({ usePortfolioAgent: () => hook }))
const { default: ChatWidget } = await import('./ChatWidget.jsx')

/*
 * FR-019 — the concierge OFFERS Mission Control; it never takes the visitor there.
 *
 * The shipped behaviour navigated the moment the tag arrived and closed the widget with it.
 * Reproduced live on 2026-08-21: asking "How do I use the audit page?" produced a hire tool-call,
 * the client obeyed, and the answer — still streaming — was never seen. Two independent things
 * now have to be true before anything moves: the visitor asked about hiring, and the visitor
 * clicked. These tests pin both.
 */
const userTurn = (content) => ({ role: 'user', content })
const base = (over = {}) => ({
  messages: [],
  streaming: false,
  status: 'unknown',
  checkStatus: vi.fn(),
  send: vi.fn(),
  toolCall: null,
  clearToolCall: vi.fn(),
  ...over,
})

/** Mount with the panel OPEN — the state a visitor is in whenever a tool-call can arrive. */
const mount = () => {
  const out = render(<MemoryRouter><ChatWidget /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: /open concierge chat/i }))
  return out
}

describe('ChatWidget — hire-routing tool-call dispatch (FR-019)', () => {
  it('never navigates on its own, even for a valid tool-call on a hire question', () => {
    navigate.mockClear()
    const clearToolCall = vi.fn()
    hook = base({
      messages: [userTurn('what does an audit cost?')],
      toolCall: { action: 'openModal', type: 'pricing' },
      clearToolCall,
    })
    mount()
    expect(navigate).not.toHaveBeenCalled()
    expect(clearToolCall).toHaveBeenCalled() // consumed, so it cannot re-fire
    expect(screen.getByRole('button', { name: /open mission control/i })).toBeInTheDocument()
  })

  it('navigates only when the visitor clicks the offer', () => {
    navigate.mockClear()
    hook = base({
      messages: [userTurn('how much do you charge?')],
      toolCall: { action: 'openModal', type: 'pricing' },
    })
    mount()
    fireEvent.click(screen.getByRole('button', { name: /open mission control/i }))
    expect(navigate).toHaveBeenCalledWith('/hire-me#pricing')
  })

  it('shows NO offer when the visitor asked something informational', () => {
    navigate.mockClear()
    // The exact live failure: an audit-page question that produced a hire tool-call.
    hook = base({
      messages: [userTurn('How do I use the audit page?')],
      toolCall: { action: 'openModal', type: 'contact' },
    })
    mount()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /open mission control/i })).not.toBeInTheDocument()
  })

  it('lets the visitor dismiss the offer without leaving the chat', () => {
    navigate.mockClear()
    hook = base({
      messages: [userTurn('can I book a call?')],
      toolCall: { action: 'openModal', type: 'contact' },
    })
    mount()
    fireEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByRole('button', { name: /open mission control/i })).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('an unknown tool-call is ignored (no navigation, no offer)', () => {
    navigate.mockClear()
    hook = base({ messages: [userTurn('what are your rates?')], toolCall: { action: 'evil' } })
    mount()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /open mission control/i })).not.toBeInTheDocument()
  })

  it('probes agent status on mount, so the launcher never just says "unknown"', () => {
    const checkStatus = vi.fn()
    hook = base({ checkStatus })
    mount()
    expect(checkStatus).toHaveBeenCalled()
  })
})
