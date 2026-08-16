import { describe, it, expect, vi, beforeEach } from 'vitest'
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
