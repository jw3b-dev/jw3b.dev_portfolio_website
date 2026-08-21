/*
 * The failures surface says "reproduce it" — so reproducing it must be a CLICK, not a
 * copy-paste instruction (owner: "cant edit the input??"). ?case=<id> must load that
 * artifact's exact input into the live, editable console.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { FAILURES } from '../data/recorded-runs/failures/index.js'

vi.mock('../components/audit/FuzzTool.jsx', () => ({ default: () => <div>fuzz</div> }))
vi.mock('../components/audit/TxExplainer.jsx', () => ({ default: () => <div>tx</div> }))

const { default: Audit } = await import('./Audit.jsx')

const at = (path) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Audit />
      </MemoryRouter>
    </HelmetProvider>,
  )

const failure = FAILURES.find((f) => f.surface === 'audit')

describe('/audit replay of a captured failure', () => {
  it('loads the failure’s EXACT input into the editable console', () => {
    at(`/audit?case=${failure.id}`)
    const box = screen.getByRole('textbox')
    expect(box).toHaveValue(failure.input)
    expect(box).not.toBeDisabled() // editable — the point of the complaint
    expect(box.hasAttribute('readonly')).toBe(false)
  })

  it('explains what is being replayed, so the clean result reads as the lesson', () => {
    at(`/audit?case=${failure.id}`)
    expect(screen.getByText(/replaying a captured miss/i)).toBeInTheDocument()
  })

  it('falls back to the normal sample for an unknown or absent case', () => {
    at('/audit?case=does-not-exist')
    expect(screen.getByRole('textbox')).not.toHaveValue(failure.input)
    expect(screen.queryByText(/replaying a captured miss/i)).not.toBeInTheDocument()
    at('/audit')
    expect(screen.queryByText(/replaying a captured miss/i)).not.toBeInTheDocument()
  })
})
