import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuditConsole from './AuditConsole.jsx'
import { AUDIT_DISCLAIMER } from '../../lib/auditClient.js'

const renderConsole = () =>
  render(
    <MemoryRouter>
      <AuditConsole />
    </MemoryRouter>,
  )

describe('AuditConsole', () => {
  it('runs the instant heuristic pass and shows real HIGH findings + disclaimer (FR-011/FR-014)', () => {
    renderConsole()
    fireEvent.click(screen.getByRole('button', { name: /run analysis/i }))
    // Deterministic heuristics on the preloaded reentrant sample — no network needed.
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText(AUDIT_DISCLAIMER)).toBeInTheDocument()
  })

  it('rejects empty source with a specific error before any request', () => {
    renderConsole()
    fireEvent.change(screen.getByLabelText(/solidity source/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /run analysis/i }))
    expect(screen.getByText(/Paste a Solidity contract/i)).toBeInTheDocument()
  })
})
