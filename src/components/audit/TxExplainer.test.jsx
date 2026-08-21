import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { render, screen, fireEvent } from '@testing-library/react'

let state
vi.mock('../../hooks/useTxExplain.js', () => ({ useTxExplain: () => state }))
const { default: TxExplainer } = await import('./TxExplainer.jsx')

beforeEach(() => { state = { decoded: null, narrative: '', running: false, error: null, explain: vi.fn() } })

describe('TxExplainer (P2-16)', () => {
  it('calls explain with the entered hash', () => {
    const explain = vi.fn(); state = { ...state, explain }
    render(<TxExplainer />)
    fireEvent.change(screen.getByLabelText(/transaction hash/i), { target: { value: '0xabc' } })
    fireEvent.click(screen.getByRole('button', { name: /explain/i }))
    expect(explain).toHaveBeenCalledWith('0xabc')
  })
  it('shows the client-side decode (floor) and the streamed explanation', () => {
    state = { ...state, decoded: { summary: 'Plain ETH transfer of 1 ETH', functionName: null, selector: null }, narrative: 'it sends ether' }
    render(<TxExplainer />)
    expect(screen.getByText(/plain eth transfer/i)).toBeInTheDocument()
    expect(screen.getByText(/it sends ether/i)).toBeInTheDocument()
  })
  it('surfaces a validation error', () => {
    state = { ...state, error: 'Enter a valid transaction hash (0x… 64 hex).' }
    render(<TxExplainer />)
    expect(screen.getByText(/valid transaction hash/i)).toBeInTheDocument()
  })
})

/*
 * W3 — the tool must be TRIABLE (PRODUCT_AUDIT #16).
 *
 * It shipped as a bare hash field and an "Explain" button: no examples, and no statement of what
 * came back. A visitor does not carry a Base transaction hash around, so in practice nobody could
 * run it. The examples are real Base mainnet transactions, verified against the public RPC — the
 * recorded-run artifact for this surface only ever held a literal "0x…" placeholder, which is
 * exactly the kind of stand-in this test exists to keep out.
 */
describe('TxExplainer — examples a visitor can actually click', () => {
  it('offers three example transactions with real, well-formed hashes', () => {
    render(<TxExplainer />)
    const chips = ['ERC-20 transfer', 'No calldata', 'Unknown contract call']
    for (const label of chips) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('says what the tool returns before you run it', () => {
    render(<TxExplainer />)
    expect(screen.getByText(/decoded in your browser/i)).toBeInTheDocument()
    expect(screen.getByText(/Base mainnet/i)).toBeInTheDocument()
  })

  it('every example hash is a real 32-byte tx hash, never a placeholder', () => {
    const source = readFileSync(resolve(__dirname, 'TxExplainer.jsx'), 'utf8')
    const hashes = [...source.matchAll(/hash: '(0x[0-9a-f]+)'/g)].map((m) => m[1])
    expect(hashes).toHaveLength(3)
    for (const h of hashes) {
      expect(h, `${h} is not a full 32-byte hash`).toMatch(/^0x[0-9a-f]{64}$/)
    }
    expect(new Set(hashes).size, 'the examples must be three different transactions').toBe(3)
  })
})
