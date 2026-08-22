/*
 * KointelGate — the compliance rule, runnable on the card.
 *
 * The risk here is not a rendering bug. It is that a panel demonstrating a real product's
 * engineering gets mistaken for that product's code, on the site whose argument is that claims
 * should be checkable. So the disclaimers are asserted before any interaction, and the
 * empty-input case is asserted specifically — "compliant" over no input is the false green this
 * whole site exists to argue against.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KointelGate from './KointelGate.jsx'
import { GATE_EXAMPLES, GATE_RULES } from '../../lib/kointelGate.js'

const editor = () => screen.getByLabelText(/a web3 module to check/i)

describe('KointelGate — what it says before it is used', () => {
  it('states it is NOT Kointel’s source code', () => {
    render(<KointelGate />)
    expect(screen.getByText(/not kointel’s\s*source code/i)).toBeInTheDocument()
  })

  it('declares its own blind spot rather than implying full coverage', () => {
    render(<KointelGate />)
    const caveat = screen.getByText(/does not trace dataflow/i)
    expect(caveat).toHaveTextContent(/assembled at\s*runtime would pass/i)
  })

  it('explains WHY the rule exists, not only that it exists', () => {
    render(<KointelGate />)
    expect(screen.getByText(/reading needs no key/i)).toBeInTheDocument()
  })
})

describe('KointelGate — the verdict', () => {
  it('opens on the compliant example and reports a passing build', () => {
    render(<KointelGate />)
    expect(screen.getByRole('status')).toHaveTextContent(/build passes/i)
  })

  it('fails the build when the violating example is loaded, and says how many rules', () => {
    render(<KointelGate />)
    const violating = GATE_EXAMPLES.find((e) => e.id === 'violating')
    fireEvent.click(screen.getByRole('button', { name: violating.title }))
    expect(screen.getByRole('status')).toHaveTextContent(/build fails/i)
    expect(screen.getByRole('status')).toHaveTextContent(/banned capabilit/i)
  })

  it('re-checks live as the module is edited — a gate you must ask for is one you forget', () => {
    render(<KointelGate />)
    fireEvent.change(editor(), { target: { value: 'await wallet.sendTransaction(tx)' } })
    expect(screen.getByRole('status')).toHaveTextContent(/build fails/i)

    fireEvent.change(editor(), { target: { value: 'const x = await client.getBalance({ address })' } })
    expect(screen.getByRole('status')).toHaveTextContent(/build passes/i)
  })

  it('refuses to call an EMPTY module compliant', () => {
    render(<KointelGate />)
    fireEvent.change(editor(), { target: { value: '   ' } })
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/nothing to check/i)
    expect(status).not.toHaveTextContent(/passes/i)
    expect(screen.getByText(/has not been proven compliant/i)).toBeInTheDocument()
  })

  it('names the line and gives the reason for each violation', () => {
    render(<KointelGate />)
    fireEvent.change(editor(), { target: { value: 'const a = 1\nawait signer.signMessage(m)' } })
    expect(screen.getByText(/line 2 · Signs a transaction or message/i)).toBeInTheDocument()
    expect(screen.getByText(/irrevocable authorisation/i)).toBeInTheDocument()
  })
})

describe('KointelGate — the rule list', () => {
  it('is collapsed by default and opens to every rule with its reason', () => {
    render(<KointelGate />)
    expect(screen.queryByText(GATE_RULES[0].why)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`show all ${GATE_RULES.length} rules`, 'i') }))
    for (const r of GATE_RULES) expect(screen.getByText(r.why)).toBeInTheDocument()
  })

  it('toggles closed again', () => {
    render(<KointelGate />)
    const btn = screen.getByRole('button', { name: /show all/i })
    fireEvent.click(btn)
    fireEvent.click(screen.getByRole('button', { name: /hide the rules/i }))
    expect(screen.queryByText(GATE_RULES[0].why)).toBeNull()
  })
})
