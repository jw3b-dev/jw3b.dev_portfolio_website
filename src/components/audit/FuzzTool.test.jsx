import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FuzzTool from './FuzzTool.jsx'

describe('FuzzTool (P2-15) — instant offline harness', () => {
  it('generates a Foundry fuzz harness from the source, client-side', () => {
    render(<FuzzTool />)
    fireEvent.click(screen.getByRole('button', { name: /generate harness/i }))
    expect(screen.getAllByText(/is Test/).length).toBeGreaterThan(0) // the fenced Foundry skeleton rendered
    expect(screen.getAllByText(/not a proof/i).length).toBeGreaterThan(0) // honest framing
  })
})
