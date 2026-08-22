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

/*
 * The hero → console handoff (brief 01, next-need 1).
 *
 * The hero's instant screen used to end in a result and nothing else, so an interested visitor
 * had to paste their contract a second time. These pin the seam: the source arrives via router
 * STATE (not storage — the no-consent-banner position depends on setting none), and `?case=`
 * still wins, because that link must behave the same wherever the visitor came from.
 */
describe('Audit — hero handoff via router state', () => {
  const CARRIED = 'contract Carried { function f() public {} }'

  it('seeds the console with the source carried from the hero', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[{ pathname: '/audit', state: { source: CARRIED } }]}>
          <Audit />
        </MemoryRouter>
      </HelmetProvider>,
    )
    const box = await screen.findByRole('textbox')
    expect(box).toHaveValue(CARRIED)
  })

  it('?case= WINS over carried state — an explicit URL must not depend on history', async () => {
    const failure = FAILURES.find((f) => f.surface === 'audit')
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[{ pathname: '/audit', search: `?case=${failure.id}`, state: { source: CARRIED } }]}>
          <Audit />
        </MemoryRouter>
      </HelmetProvider>,
    )
    const box = await screen.findByRole('textbox')
    expect(box).toHaveValue(failure.input)
    expect(box).not.toHaveValue(CARRIED)
  })

  it('ignores empty or non-string state rather than seeding a blank console', async () => {
    for (const bad of [{ source: '   ' }, { source: 42 }, {}]) {
      const { unmount } = render(
        <HelmetProvider>
          <MemoryRouter initialEntries={[{ pathname: '/audit', state: bad }]}>
            <Audit />
          </MemoryRouter>
        </HelmetProvider>,
      )
      const box = await screen.findByRole('textbox')
      expect(box.value.trim().length).toBeGreaterThan(0) // fell back to the console default
      unmount()
    }
  })
})
