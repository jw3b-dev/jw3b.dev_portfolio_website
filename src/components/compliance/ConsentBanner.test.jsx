/*
 * P3-03 — ConsentBanner (FR-058): shows only while unchosen; Accept/Reject persist and hide;
 * consentChoice() exposes the stored state for future analytics gating.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ConsentBanner, { consentChoice } from './ConsentBanner.jsx'

const ui = () =>
  render(
    <MemoryRouter>
      <ConsentBanner />
    </MemoryRouter>,
  )

describe('ConsentBanner (P3-03 · FR-058)', () => {
  beforeEach(() => localStorage.clear())

  it('renders with a privacy link while no choice is stored', () => {
    ui()
    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'privacy notice' })).toHaveAttribute('href', '/privacy')
  })

  it('Accept persists and hides the banner', () => {
    ui()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(consentChoice()).toBe('granted')
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument()
  })

  it('Reject persists and hides the banner; a stored choice suppresses future renders', () => {
    ui()
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(consentChoice()).toBe('denied')
    const second = ui()
    expect(second.container.querySelector('[role="region"]')).toBeNull()
  })
})
