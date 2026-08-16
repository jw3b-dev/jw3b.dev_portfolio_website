import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CTF_LABEL } from '../../lib/ctfFlow.js'

/*
 * CtfChallenge test (P2-09). Stubs useCtf to drive each phase and asserts (a) the honest
 * testnet label appears on EVERY surface (FR-024), and (b) the right control/message renders
 * per phase, including the recorded-solve degrade (FR-026). No wagmi/chain needed.
 */
let ctfState
vi.mock('../../hooks/useCtf.js', () => ({ useCtf: () => ctfState }))
vi.mock('../wallet/ConnectButton.jsx', () => ({ default: () => <button type="button">Connect wallet</button> }))

const { default: CtfChallenge } = await import('./CtfChallenge.jsx')

const mk = (over) => ({ phase: 'ready', reason: null, deploy: vi.fn(), attack: vi.fn(), runVerify: vi.fn(), attackerAddress: null, rank: null, txHash: null, ...over })

beforeEach(() => {
  ctfState = mk()
})

describe('CtfChallenge — testnet label + state set (FR-023/024/026)', () => {
  it('shows the "Base Sepolia · no real funds" label (FR-024)', () => {
    render(<CtfChallenge />)
    expect(screen.getByText(CTF_LABEL)).toBeInTheDocument()
  })

  it('ready + no attacker → Deploy; with attacker → Drain', () => {
    ctfState = mk({ phase: 'ready', attackerAddress: null })
    const { rerender } = render(<CtfChallenge />)
    expect(screen.getByRole('button', { name: /deploy attacker/i })).toBeInTheDocument()
    ctfState = mk({ phase: 'ready', attackerAddress: '0xatt' })
    rerender(<CtfChallenge />)
    expect(screen.getByRole('button', { name: /drain the vault/i })).toBeInTheDocument()
  })

  it('solved shows the rank; already-solved is handled', () => {
    ctfState = mk({ phase: 'solved', rank: 3 })
    const { rerender } = render(<CtfChallenge />)
    expect(screen.getByText(/#3/)).toBeInTheDocument()
    ctfState = mk({ phase: 'already-solved', rank: 1 })
    rerender(<CtfChallenge />)
    expect(screen.getByText(/already captured/i)).toBeInTheDocument()
  })

  it('recorded phase degrades to a labelled recorded solve (FR-026)', () => {
    ctfState = mk({ phase: 'recorded' })
    render(<CtfChallenge />)
    expect(screen.getAllByText(/recorded solve/i).length).toBeGreaterThan(0)
    expect(screen.getByText(CTF_LABEL)).toBeInTheDocument() // still labelled testnet
  })

  it('auto-verifies once a drain tx exists', () => {
    const runVerify = vi.fn()
    ctfState = mk({ phase: 'verifying', txHash: '0xtx', runVerify })
    render(<CtfChallenge />)
    expect(runVerify).toHaveBeenCalled()
  })
})
