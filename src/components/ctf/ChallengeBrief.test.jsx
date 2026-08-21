import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
vi.mock('../../config/embeds.js', () => ({ framingOriginAllowed: () => onSite }))
let onSite = true
const { default: ChallengeBrief } = await import('./ChallengeBrief.jsx')
import { CTF } from '../../config/contracts.js'

/*
 * W4 — the challenge is readable BEFORE the wallet ask (PRODUCT_AUDIT #19).
 *
 * /ctf pre-wallet was a heading, a testnet label, one sentence and a Connect button: 42 lines of
 * accessibility tree. It demanded a wallet connection before telling the visitor what the
 * challenge was, what they would be attacking, or whether anyone had solved it — the cost before
 * any of the value. Everything here already existed in the bundle or on the Worker and was
 * reachable by nobody.
 */
const ok = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })

beforeEach(() => {
  onSite = true
  vi.stubGlobal('fetch', vi.fn(() => ok({ entries: [] })))
})
afterEach(() => vi.unstubAllGlobals())

describe('ChallengeBrief — value before the wallet ask', () => {
  it('explains the vulnerability in words, not just code', () => {
    render(<ChallengeBrief />)
    expect(screen.getByText(/before it zeroes your balance/i)).toBeInTheDocument()
    expect(screen.getByText(/re-enters during that call/i)).toBeInTheDocument()
  })

  it('names the four steps so the visitor knows what they are agreeing to', () => {
    render(<ChallengeBrief />)
    expect(screen.getByText(/Connect a wallet on Base Sepolia/i)).toBeInTheDocument()
    expect(screen.getByText(/Deploy the attacker contract/i)).toBeInTheDocument()
    expect(screen.getByText(/verifies the drain on-chain/i)).toBeInTheDocument()
  })

  it('links the real vault on BaseScan, so the target can be inspected first', () => {
    render(<ChallengeBrief />)
    const link = screen.getByRole('link', { name: CTF.vaultAddress })
    expect(link.getAttribute('href')).toBe(`https://sepolia.basescan.org/address/${CTF.vaultAddress}`)
    // Never let an outbound link hand the opener a window reference.
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('shows the vulnerable source, including the line that causes it', () => {
    render(<ChallengeBrief />)
    expect(screen.getByText(/contract ReentrantVault/)).toBeInTheDocument()
    expect(screen.getByText(/external call happens BEFORE the balance is zeroed/i)).toBeInTheDocument()
  })

  it('keeps testnet honesty in the copy (BR-09)', () => {
    render(<ChallengeBrief />)
    expect(screen.getByText(/no real funds, ever/i)).toBeInTheDocument()
  })
})

describe('ChallengeBrief — the leaderboard tells the truth about itself', () => {
  it('says nobody has solved it rather than rendering an empty table as data', async () => {
    render(<ChallengeBrief />)
    expect(await screen.findByText(/Nobody has captured it yet/i)).toBeInTheDocument()
  })

  it('ranks real solves when there are any', async () => {
    vi.stubGlobal('fetch', vi.fn(() => ok({ entries: [{ address: '0xabc' }, { address: '0xdef' }] })))
    render(<ChallengeBrief />)
    expect(await screen.findByText(/0xabc/)).toBeInTheDocument()
    expect(screen.getByText(/0xdef/)).toBeInTheDocument()
  })

  it('does not attempt the cross-origin fetch off-production — a CORS block is console noise', () => {
    onSite = false
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    render(<ChallengeBrief />)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText(/appears on jw3b\.dev/i)).toBeInTheDocument()
  })

  it('distinguishes "unreachable" from "zero solves" — they are not the same claim', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    render(<ChallengeBrief />)
    await waitFor(() => expect(screen.getByText(/leaderboard is unreachable/i)).toBeInTheDocument())
    expect(screen.queryByText(/Nobody has captured it yet/i)).not.toBeInTheDocument()
  })
})
