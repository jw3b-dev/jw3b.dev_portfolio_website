import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuditConsole from './AuditConsole.jsx'
import { AUDIT_DISCLAIMER, SOURCE_CAP } from '../../lib/auditClient.js'

/*
 * The live-screen guard. The console shipped computing its heuristics INSIDE the click handler
 * and freezing them into state, so the findings panel kept describing whatever was in the box
 * when you last pressed the button — you could edit the contract all day and nothing moved.
 * Every test here clicked the button first and asserted the result, which is exactly why the
 * suite stayed green through it: nothing ever typed and then looked.
 *
 * So these tests assert the RELATIONSHIP the page promises — the result follows the input —
 * rather than a snapshot of one run.
 */

// A contract with a completely different heuristic profile to the reentrant sample: no
// value-bearing call at all, one tx.origin auth. Swapping to it must swap the whole panel.
const TX_ORIGIN_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract Admin {
    address public owner;

    function setOwner(address next) external {
        require(tx.origin == owner, "not owner");
        owner = next;
    }
}
`

const renderConsole = () =>
  render(
    <MemoryRouter>
      <AuditConsole />
    </MemoryRouter>,
  )

const editor = () => screen.getByLabelText(/solidity source/i)
const setSource = (value) => fireEvent.change(editor(), { target: { value } })

// A minimal SSE body: the hook only needs body.getReader().read(). Hand-rolled rather than a
// real Response so the test doesn't depend on jsdom's stream support.
const sseResponse = (chunks) => {
  const enc = new TextEncoder()
  let i = 0
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }),
      }),
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('AuditConsole', () => {
  it('shows real HIGH findings + disclaimer for the preloaded sample (FR-011/FR-014)', () => {
    renderConsole()
    // No click: the deterministic pass is a pure function of the source, so it is already done.
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText(AUDIT_DISCLAIMER)).toBeInTheDocument()
  })

  it('re-screens live as the source is edited — no button press (the instant-result guard)', () => {
    renderConsole()
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()

    setSource(TX_ORIGIN_CONTRACT)

    // The old finding is GONE and the new one is present — the panel describes what's in the box.
    expect(screen.queryByText('Reentrancy — external call before state update')).not.toBeInTheDocument()
    expect(screen.getByText('Authorization via tx.origin')).toBeInTheDocument()
    expect(screen.getByText('MED')).toBeInTheDocument()
    // Pinned pragma in the replacement — the floating-pragma LOW must clear too.
    expect(screen.queryByText('Floating pragma')).not.toBeInTheDocument()
  })

  it('reports a clean screen (not a stale finding list) when the edit removes every pattern', () => {
    renderConsole()
    setSource('pragma solidity 0.8.20;\ncontract Empty {}\n')
    expect(screen.queryByText('Reentrancy — external call before state update')).not.toBeInTheDocument()
    expect(screen.getByText(/no common-pattern issues/i)).toBeInTheDocument()
  })

  it('empties the findings panel when the editor is emptied', () => {
    renderConsole()
    setSource('   ')
    expect(screen.getByText(/nothing to screen/i)).toBeInTheDocument()
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument()
  })

  it('rejects empty source with a specific error before any request', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderConsole()
    setSource('   ')
    fireEvent.click(screen.getByRole('button', { name: /analysis/i }))
    expect(screen.getByText(/Paste a Solidity contract/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips the live screen past the source cap and says so, instead of showing nothing', () => {
    renderConsole()
    setSource('a'.repeat(SOURCE_CAP + 1))
    expect(screen.getByText(/exceeds .* characters/i)).toBeInTheDocument()
  })

  it('marks the AI narrative stale once the contract is edited under it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => sseResponse(['data: {"response":"## Summary\\nA reentrancy in withdraw()."}\n\n', 'data: [DONE]\n\n'])),
    )
    renderConsole()
    fireEvent.click(screen.getByRole('button', { name: /run ai analysis/i }))

    await waitFor(() => expect(screen.getByText(/a reentrancy in withdraw/i)).toBeInTheDocument())
    expect(screen.queryByTitle(/edited since this analysis ran/i)).not.toBeInTheDocument()

    setSource(TX_ORIGIN_CONTRACT)

    // The narrative is still readable, but it can no longer pass as a description of the box.
    expect(screen.getByTitle(/edited since this analysis ran/i)).toBeInTheDocument()
    expect(screen.getByText(/describes the earlier version/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /re-run ai analysis/i })).toBeInTheDocument()
    // ...while the heuristics under it have already moved on to the new source.
    expect(screen.getByText('Authorization via tx.origin')).toBeInTheDocument()
  })
})
