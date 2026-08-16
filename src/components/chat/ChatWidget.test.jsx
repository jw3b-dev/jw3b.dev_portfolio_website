import { describe, it, expect } from 'vitest'
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
})
