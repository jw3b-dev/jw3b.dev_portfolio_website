import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChatWidget from './ChatWidget.jsx'

const renderWidget = () =>
  render(
    <MemoryRouter>
      <ChatWidget />
    </MemoryRouter>,
  )

describe('ChatWidget', () => {
  it('opens the concierge panel and shows the AI-disclosure indicator (FR-021)', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: /open concierge chat/i }))
    expect(screen.getByRole('dialog', { name: /ai concierge/i })).toBeInTheDocument()
    expect(screen.getByText(/AI-generated/i)).toBeInTheDocument()
  })

  it('locks send until there is a draft', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: /open concierge chat/i }))
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/message the concierge/i), { target: { value: 'hi' } })
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled()
  })

  // The seam's failure ending (full-stack-integrator): when the Worker is unreachable, the
  // widget must render the labelled recorded-run floor + a book-a-call link — never a blank
  // error or a dead panel (FR-020, SC-2). Forcing fetch to reject drives the hook's degrade.
  it('degrades to the recorded-run floor + book-a-call when the worker is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: /open concierge chat/i }))
    fireEvent.change(screen.getByLabelText(/message the concierge/i), { target: { value: 'hi' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/live agent unavailable/i)).toBeInTheDocument()
    const call = screen.getByRole('link', { name: /book a call/i })
    expect(call).toHaveAttribute('href', '/hire-me')
  })

  afterEach(() => vi.unstubAllGlobals())
})
