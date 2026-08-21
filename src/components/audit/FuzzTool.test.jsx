import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FuzzTool from './FuzzTool.jsx'

/*
 * Same defect as the audit console: the harness was generated into state by a button, so an edit
 * left a scaffold for the PREVIOUS contract sitting underneath — targeting functions that no
 * longer existed. The generator is pure and offline, so the harness must simply follow the source.
 */
describe('FuzzTool (P2-15) — instant offline harness', () => {
  const editor = () => screen.getByLabelText(/solidity source/i)

  it('renders a Foundry fuzz harness for the preloaded source, client-side, with no click', () => {
    render(<FuzzTool />)
    expect(screen.getAllByText(/is Test/).length).toBeGreaterThan(0) // the fenced Foundry skeleton rendered
    expect(screen.getAllByText(/not a proof/i).length).toBeGreaterThan(0) // honest framing
  })

  it('regenerates the harness as the source is edited — no button press', () => {
    render(<FuzzTool />)
    // The sample is `contract Vault` with withdraw() — the harness targets it by name.
    expect(screen.getByText(/contract VaultFuzzTest/)).toBeInTheDocument()
    expect(screen.getByText(/testFuzz_withdraw/)).toBeInTheDocument()

    fireEvent.change(editor(), {
      target: {
        value: 'pragma solidity 0.8.20;\ncontract Router {\n  function swap(uint256 amountIn) external {}\n}\n',
      },
    })

    // The harness now scaffolds the NEW contract, and the old target is gone.
    expect(screen.getByText(/contract RouterFuzzTest/)).toBeInTheDocument()
    expect(screen.getByText(/testFuzz_swap\(uint256 amountIn\)/)).toBeInTheDocument()
    expect(screen.queryByText(/testFuzz_withdraw/)).not.toBeInTheDocument()
  })
})
