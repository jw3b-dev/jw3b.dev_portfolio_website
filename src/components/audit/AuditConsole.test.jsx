import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuditConsole from './AuditConsole.jsx'
import { AUDIT_DISCLAIMER, SOURCE_CAP } from '../../lib/auditClient.js'

/*
 * FR-011 (operable console) · FR-014/BR-10 (disclaimer with every result set) · ADR-P5-02 (the
 * iterative workspace: live screen, rule-derived fixes verified by re-screening, per-run tabs,
 * checkpoints, gated auto-rerun).
 *
 * Assert the RELATIONSHIP, never a snapshot of one run. The console shipped with its findings
 * frozen into state and the whole suite stayed green, because every test clicked the button first
 * and then looked. So: most of these tests never touch the run button at all.
 */

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

const renderConsole = (props) =>
  render(
    <MemoryRouter>
      <AuditConsole {...props} />
    </MemoryRouter>,
  )

const editor = () => screen.getByLabelText(/solidity source/i)
const setSource = (value) => fireEvent.change(editor(), { target: { value } })
const runButton = () => screen.getByRole('button', { name: /run ai analysis/i })

// A minimal SSE body: the transport only needs body.getReader().read(). Hand-rolled rather than a
// real Response so the test doesn't depend on jsdom's stream support.
const sseResponse = (chunks) => {
  const enc = new TextEncoder()
  let i = 0
  return {
    ok: true,
    body: { getReader: () => ({ read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }) }) },
  }
}
const frame = (text) => `data: {"response":${JSON.stringify(text)}}\n\n`
const stubStream = (text) => vi.stubGlobal('fetch', vi.fn(async () => sseResponse([frame(text), 'data: [DONE]\n\n'])))

afterEach(() => vi.unstubAllGlobals())

describe('AuditConsole — the live heuristic screen (FR-011)', () => {
  it('screens the preloaded sample with no button press, and carries the disclaimer (FR-014)', () => {
    renderConsole()
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getAllByText(AUDIT_DISCLAIMER).length).toBeGreaterThan(0)
  })

  it('re-screens live as the source is edited — no button press (the instant-result guard)', () => {
    renderConsole()
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()

    setSource(TX_ORIGIN_CONTRACT)

    expect(screen.queryByText('Reentrancy — external call before state update')).not.toBeInTheDocument()
    expect(screen.getByText('Authorization via tx.origin')).toBeInTheDocument()
    expect(screen.getByText('MED')).toBeInTheDocument()
    expect(screen.queryByText('Floating pragma')).not.toBeInTheDocument()
  })

  it('reports a clean screen when the edit removes every pattern', () => {
    renderConsole()
    setSource('pragma solidity 0.8.20;\ncontract Empty {}\n')
    expect(screen.getByText(/no common-pattern issues/i)).toBeInTheDocument()
  })

  it('empties the findings panel when the editor is emptied', () => {
    renderConsole()
    setSource('   ')
    expect(screen.getByText(/nothing to screen/i)).toBeInTheDocument()
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument()
  })

  it('skips the live screen past the source cap and says so', () => {
    renderConsole()
    setSource('a'.repeat(SOURCE_CAP + 1))
    expect(screen.getByText(/exceeds .* characters/i)).toBeInTheDocument()
  })

  it('rejects empty source with a specific error before any request', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderConsole()
    setSource('   ')
    fireEvent.click(runButton())
    expect(screen.getByText(/Paste a Solidity contract/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('AuditConsole — rule-derived fixes, verified by re-screening (ADR-P5-02 §3)', () => {
  it('labels a fix RULE-DERIVED, never as an AI suggestion (ADR-P5-02 §5.3)', () => {
    // Compliance finding C-2: on a page whose loudest button says "Run AI analysis", an
    // unlabelled "Apply fix" reads as a model-suggested edit to the visitor's own contract.
    renderConsole()
    expect(screen.getAllByTitle(/^rule-derived fix — /i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/rule-derived fix ·/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: /apply fix/i })[0])
    expect(screen.getByText(/applied the rule-derived fix/i)).toBeInTheDocument()
  })

  it('applies the fix to the source and reports that the finding actually cleared', () => {
    renderConsole()
    const before = editor().value
    fireEvent.click(screen.getAllByRole('button', { name: /apply fix/i })[0])

    // The editor really changed...
    expect(editor().value).not.toBe(before)
    // ...and the verdict is the RE-SCREEN result, not a claim.
    expect(screen.getByText(/re-screened, and the finding is gone/i)).toBeInTheDocument()
    // ...which never overstates what a cleared pattern means.
    expect(screen.getByText(/it is not an audit/i)).toBeInTheDocument()
  })

  it('clears the reentrancy finding by hoisting the balance write above the call', () => {
    renderConsole()
    const fixButton = screen
      .getAllByRole('button', { name: /apply fix/i })
      .find((b) => /balance write above the external call/i.test(b.getAttribute('title') || ''))
    fireEvent.click(fixButton)

    expect(screen.queryByText('Reentrancy — external call before state update')).not.toBeInTheDocument()
    const lines = editor().value.split('\n')
    expect(lines.findIndex((l) => /balances\[msg\.sender\] = 0;/.test(l))).toBeLessThan(
      lines.findIndex((l) => /\.call\{value/.test(l)),
    )
  })

  it('offers no fix for a finding it cannot remediate safely', () => {
    renderConsole()
    // A compound pragma range still flags, but has no single right pin — so no button.
    setSource('pragma solidity >=0.8.0 <0.9.0;\ncontract C {}\n')
    expect(screen.getByText('Floating pragma')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apply fix/i })).not.toBeInTheDocument()
  })
})

describe('AuditConsole — checkpoints and restore (ADR-P5-02 §4)', () => {
  it('keeps the Original permanently and restores it after edits', () => {
    renderConsole()
    const original = editor().value

    setSource(TX_ORIGIN_CONTRACT)
    expect(editor().value).toBe(TX_ORIGIN_CONTRACT)

    fireEvent.click(screen.getByRole('button', { name: /^Sample ·/ }))
    expect(editor().value).toBe(original)
    expect(screen.getByText('Reentrancy — external call before state update')).toBeInTheDocument()
  })

  it('records a checkpoint when a fix is applied, and can undo it', () => {
    renderConsole()
    const original = editor().value
    fireEvent.click(screen.getAllByRole('button', { name: /apply fix/i })[0])

    expect(screen.getByRole('button', { name: /^Fix · / })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Sample ·/ }))
    expect(editor().value).toBe(original)
    // Restoring is additive — the fix version is still reachable.
    expect(screen.getByRole('button', { name: /^Fix · / })).toBeInTheDocument()
  })

  it('does not checkpoint on every keystroke', () => {
    renderConsole()
    setSource('a')
    setSource('ab')
    setSource('abc')
    // Only the permanent Original exists; typing is not history.
    expect(screen.getAllByRole('button', { name: /^(Sample|Edit \\d|Fix ·) ·/ })).toHaveLength(1)
  })

  it('states that nothing is persisted — the site stores nothing on the device', () => {
    renderConsole()
    expect(screen.getByText(/nothing is stored on your device or ours/i)).toBeInTheDocument()
  })
})

describe('AuditConsole — per-run tabs (ADR-P5-02 §5)', () => {
  it('accumulates one tab per analysis, each pinned to the source it analysed', async () => {
    stubStream('## Summary\nFirst analysis.')
    renderConsole()
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 1/ })).toBeInTheDocument())

    setSource(TX_ORIGIN_CONTRACT)
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 2/ })).toBeInTheDocument())

    expect(screen.getByText(/AI analyses \(2\)/)).toBeInTheDocument()
    // Run 1 analysed the Original; run 2 analysed the edit that followed.
    expect(screen.getByRole('tab', { name: /Run 1 · Sample/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Run 2 · Edit 1/ })).toBeInTheDocument()
  })

  it('labels each run with ITS OWN provenance and carries the disclaimer per run', async () => {
    stubStream('## Summary\nA live answer.')
    renderConsole()
    fireEvent.click(runButton())

    await waitFor(() => expect(screen.getByText(/a live answer/i)).toBeInTheDocument())
    const panel = screen.getByRole('tabpanel', { name: /Run 1/ })
    expect(within(panel).getByTitle(/generated by the live model/i)).toBeInTheDocument()
    expect(within(panel).getByText(AUDIT_DISCLAIMER)).toBeInTheDocument()
  })

  it('labels a run recorded when the model returns nothing, and still stands by the findings', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, body: null })))
    renderConsole()
    fireEvent.click(runButton())

    await waitFor(() => expect(screen.getByTitle(/bundled fallback/i)).toBeInTheDocument())
    expect(screen.getByText(/recorded fallback/i)).toBeInTheDocument() // says the whole thing
    expect(screen.getByText(/findings are real regardless/i)).toBeInTheDocument()
    // Listed twice by design — once live for the editor, once inside the run that analysed it.
    expect(screen.getAllByText('Reentrancy — external call before state update').length).toBeGreaterThan(0)
  })

  it('marks a run stale the moment the editor moves past it, and offers that version back', async () => {
    stubStream('## Summary\nAnalysed the original.')
    renderConsole()
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByText(/analysed the original/i)).toBeInTheDocument())

    const panel = () => screen.getByRole('tabpanel', { name: /Run 1/ })
    expect(within(panel()).queryByTitle(/editor has changed since this analysis ran/i)).not.toBeInTheDocument()

    setSource(TX_ORIGIN_CONTRACT)

    expect(within(panel()).getByTitle(/editor has changed since this analysis ran/i)).toBeInTheDocument()
    expect(within(panel()).getByText(/not what.s in the editor now/i)).toBeInTheDocument()
    // ...and the live panel has already moved on to the new source.
    expect(screen.getByText('Authorization via tx.origin')).toBeInTheDocument()

    fireEvent.click(within(panel()).getByRole('button', { name: /restore this version/i }))
    expect(editor().value).toMatch(/contract Vault/)
  })
})

describe('AuditConsole — gated auto-rerun (ADR-P5-02 §2)', () => {
  it('is off by default and says how to get an analysis', () => {
    renderConsole()
    expect(screen.getByRole('checkbox', { name: /re-run on edit/i })).not.toBeChecked()
    expect(screen.getByText(/auto re-run is off/i)).toBeInTheDocument()
  })

  it('states its COST in its own section header (brief §4 hard constraint)', () => {
    // Compliance finding C-1 + the owner's "which of these costs me something?". Every section
    // header carries a cost line; a section that does not say what it costs does not ship.
    renderConsole()
    expect(screen.getByText(/no network, no cost/i)).toBeInTheDocument() // 2 · Instant screen
    expect(screen.getByText(/one model call per run, metered at 10 per session/i)).toBeInTheDocument() // 3 · AI analysis
  })

  it('never calls the free tier "live" — that word is reserved for model provenance (brief §2)', () => {
    // The owner's core confusion: "Heuristic pass · live" meant updates-as-you-type while a run
    // badge reading "live" meant from-the-model-not-a-recording. One word, two meanings, one screen.
    renderConsole()
    const screenSection = screen.getByText(/instant screen/i).closest('section')
    expect(screenSection.textContent).not.toMatch(/\blive\b/i)
  })

  it('names the run history with the button’s own noun phrase (brief §2)', async () => {
    stubStream('## Summary\nx')
    renderConsole()
    expect(screen.getByRole('button', { name: /run ai analysis/i })).toBeInTheDocument()
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByText(/AI analyses \(1\)/i)).toBeInTheDocument())
  })

  it('shows the analyses left against the budget the Worker enforces', () => {
    renderConsole()
    expect(screen.getByText(/10 of 10 AI analyses left/i)).toBeInTheDocument()
  })

  it('will not spend the FIRST call on its own — "re-run" needs something to re-run', async () => {
    // Owner-reported: armed on a fresh page, an edit fired an analysis nobody had asked for.
    const fetchMock = vi.fn(async () => sseResponse([frame('nope'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 10 })
    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    expect(screen.getByText(/nothing to re-run yet/i)).toBeInTheDocument()

    setSource(TX_ORIGIN_CONTRACT)
    await new Promise((r) => setTimeout(r, 120))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/10 of 10 AI analyses left/i)).toBeInTheDocument()
  })

  it('re-runs on an edit once a baseline analysis exists', async () => {
    stubStream('## Summary\nAuto-run analysis.')
    renderConsole({ idleMs: 10 })
    fireEvent.click(runButton()) // the deliberate first press establishes the baseline
    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 1/ })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    expect(screen.getByText(/armed — your next edit/i)).toBeInTheDocument()
    setSource(TX_ORIGIN_CONTRACT)

    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 2/ })).toBeInTheDocument())
    expect(screen.getByText(/8 of 10 AI analyses left/i)).toBeInTheDocument()
  })

  it('does NOT spend an analysis when you look back at an older version', async () => {
    // Owner-reported: with re-run-on-edit enabled, clicking a checkpoint to compare it fired a
    // fresh Opus call every time. A restore moves the draft exactly as typing does, so only the
    // ORIGIN of the change can tell reading from writing.
    const fetchMock = vi.fn(async () => sseResponse([frame('## Summary\nrun'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 10 })

    // Arm FIRST — switching the toggle on must not retroactively analyse what you typed before
    // deciding to arm it.
    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    fireEvent.click(runButton()) // baseline
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    setSource(TX_ORIGIN_CONTRACT)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    fireEvent.click(screen.getByRole('button', { name: /^Sample ·/ }))
    await waitFor(() => expect(screen.getByText(/looking back through your own history/i)).toBeInTheDocument())
    await new Promise((r) => setTimeout(r, 60)) // well past the idle window
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT re-buy an analysis for a source that already has a run tab', async () => {
    const fetchMock = vi.fn(async () => sseResponse([frame('## Summary\nrun'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 10 })

    const original = editor().value
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 1/ })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    setSource(TX_ORIGIN_CONTRACT)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    // Type the analysed source back in by hand: an authored edit, but to text already covered.
    setSource(original)
    await waitFor(() => expect(screen.getByText(/already has an analysis/i)).toBeInTheDocument())
    await new Promise((r) => setTimeout(r, 60))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('never fires on its own while the box is unchecked — edit, fix, or restore', async () => {
    // Owner-reported. The auto-run path is the only thing that may spend a call without a press,
    // so this walks every action that moves the draft and asserts the network stays silent.
    const fetchMock = vi.fn(async () => sseResponse([frame('nope'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 5 })
    expect(screen.getByRole('checkbox', { name: /re-run on edit/i })).not.toBeChecked()

    setSource(TX_ORIGIN_CONTRACT)
    fireEvent.click(screen.getAllByRole('button', { name: /apply fix/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /^Sample ·/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /apply fix/i })[0])
    await new Promise((r) => setTimeout(r, 120)) // many idle windows

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/10 of 10 AI analyses left/i)).toBeInTheDocument()
  })

  it('stops an already-armed run when the box is unchecked mid-countdown', async () => {
    const fetchMock = vi.fn(async () => sseResponse([frame('nope'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 400 })

    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    setSource(TX_ORIGIN_CONTRACT) // countdown starts
    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i })) // ...and is called off

    await new Promise((r) => setTimeout(r, 600)) // past when it would have fired
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('runs nothing while paused, and says that is why', async () => {
    const fetchMock = vi.fn(async () => sseResponse([frame('nope'), 'data: [DONE]\n\n']))
    vi.stubGlobal('fetch', fetchMock)
    renderConsole({ idleMs: 10 })
    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))

    setSource(TX_ORIGIN_CONTRACT)
    await waitFor(() => expect(screen.getByText(/paused — nothing will run/i)).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('will not spend a model call on an edit the screen cannot see — and says so', async () => {
    stubStream('## Summary\nFirst.')
    renderConsole({ idleMs: 10 })
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByRole('tab', { name: /Run 1/ })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: /re-run on edit/i }))
    // A trailing comment changes the text but not a single finding.
    setSource(editor().value + '\n// just a comment\n')

    await waitFor(() => expect(screen.getByText(/heuristic screen is unchanged/i)).toBeInTheDocument())
    expect(screen.queryByRole('tab', { name: /Run 2/ })).not.toBeInTheDocument()
  })
})

describe('AuditConsole — the analysis follows the version you are viewing', () => {
  it('brings a version’s OWN analysis forward when you move back to it', async () => {
    // Owner-reported: "clicking run 1 or run 2 produces the same result … the final run's results
    // under both versions as well as original". The runs were right; what was wrong is that
    // navigating between versions left the NEWEST run on screen under every one of them, so the
    // analysis of the edited contract sat under "Sample" as though it described it.
    let n = 0
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([frame(`## Summary\nNARRATIVE-${++n}`), 'data: [DONE]\n\n'])))
    renderConsole()

    fireEvent.click(runButton()) // run 1 analyses the sample
    await waitFor(() => expect(screen.getByText(/NARRATIVE-1/)).toBeInTheDocument())

    setSource(TX_ORIGIN_CONTRACT)
    fireEvent.click(runButton()) // run 2 analyses the edit
    await waitFor(() => expect(screen.getByText(/NARRATIVE-2/)).toBeInTheDocument())

    // Move back to the sample: its own analysis should surface, not the edit's.
    fireEvent.click(screen.getByRole('button', { name: /^Sample ·/ }))
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: /Run 1/ })
      expect(within(panel).getByText(/NARRATIVE-1/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/NARRATIVE-2/)).not.toBeInTheDocument()

    // ...and forward again.
    fireEvent.click(screen.getByRole('button', { name: /^Edit 1 ·/ }))
    await waitFor(() => expect(screen.getByText(/NARRATIVE-2/)).toBeInTheDocument())
  })

  it('leaves the last run on screen — marked stale — for a version nothing has analysed', async () => {
    stubStream('## Summary\nOnly analysis.')
    renderConsole()
    fireEvent.click(runButton())
    await waitFor(() => expect(screen.getByText(/only analysis/i)).toBeInTheDocument())

    setSource(TX_ORIGIN_CONTRACT) // never analysed
    const panel = screen.getByRole('tabpanel', { name: /Run 1/ })
    expect(within(panel).getByTitle(/editor has changed since this analysis ran/i)).toBeInTheDocument()
  })
})
