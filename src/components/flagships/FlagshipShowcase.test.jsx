import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FlagshipShowcase from './FlagshipShowcase.jsx'

/*
 * FlagshipShowcase test (P2-13 · FR-004). Verifies EXACTLY FOUR operable flagships render:
 * KTHULHU, the on-site AI (with the operable /audit console + a link to the CTF), Overmind,
 * and Kointel. The delivery record is intentionally not among them.
 */
const renderShowcase = () => render(<MemoryRouter><FlagshipShowcase /></MemoryRouter>)

describe('FlagshipShowcase — exactly four operable flagships (FR-004)', () => {
  it('renders exactly four flagship headliners', () => {
    renderShowcase()
    const kickers = screen.getAllByText(/^flagship ·/i)
    expect(kickers).toHaveLength(4)
  })

  it('names all four flagships', () => {
    renderShowcase()
    expect(screen.getByText('KTHULHU')).toBeInTheDocument()
    expect(screen.getByText('Overmind')).toBeInTheDocument()
    expect(screen.getByText('Kointel')).toBeInTheDocument()
    expect(screen.getByText(/on-site ai/i)).toBeInTheDocument()
  })

  it('the on-site-AI flagship is operable (embeds the /audit console) and links to the CTF', () => {
    renderShowcase()
    // AuditConsole's editable Solidity input is the operable tell.
    expect(screen.getByLabelText(/solidity source/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ctf/i })).toHaveAttribute('href', '/ctf')
  })
})
