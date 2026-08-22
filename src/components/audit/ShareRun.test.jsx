/*
 * ShareRun (brief 05, next-need 2).
 *
 * The claim on the button's tooltip — "a fragment is never sent to any server" — is the reason
 * this feature is allowed to carry someone's contract at all. So the tests pin that the URL puts
 * the payload after '#' and nowhere else, and that an unlinkable source produces a stated REASON
 * rather than a dead disabled button.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShareRun from './ShareRun.jsx'
import { PERMALINK_CAP, PERMALINK_PARAM } from '../../lib/runPermalink.js'

const ORIGIN = 'https://jw3b.dev/audit'
const SRC = 'contract A { function f() external {} }'

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

describe('ShareRun', () => {
  it('copies a URL whose payload is entirely in the fragment', async () => {
    render(<ShareRun source={SRC} origin={ORIGIN} />)
    fireEvent.click(screen.getByRole('button', { name: /copy link to this run/i }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())

    const url = navigator.clipboard.writeText.mock.calls[0][0]
    const [before, frag] = url.split('#')
    expect(before).toBe(ORIGIN) // nothing in the path or query, where a server would log it
    expect(frag.startsWith(`${PERMALINK_PARAM}=`)).toBe(true)
  })

  it('confirms the copy, then returns to the resting label', async () => {
    vi.useFakeTimers()
    render(<ShareRun source={SRC} origin={ORIGIN} />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument())
    vi.advanceTimersByTime(2100)
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /copy link to this run/i })).toBeInTheDocument())
    vi.useRealTimers()
  })

  it('does NOT claim success when the clipboard is denied', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'))
    render(<ShareRun source={SRC} origin={ORIGIN} />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /link copied/i })).toBeNull()
  })

  it('replaces the button with a REASON when the source is too big to link', () => {
    render(<ShareRun source={'a'.repeat(PERMALINK_CAP + 1)} origin={ORIGIN} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/too large to put in a link/i)).toBeInTheDocument()
    expect(screen.getByText(/export the report instead/i)).toBeInTheDocument()
  })

  it('says there is nothing to link for an empty run', () => {
    render(<ShareRun source="" origin={ORIGIN} />)
    expect(screen.getByText(/nothing to link yet/i)).toBeInTheDocument()
  })
})
