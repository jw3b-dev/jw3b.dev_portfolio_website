import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookACall from './BookACall.jsx'
import * as queue from '../../lib/engagementQueue.js'

vi.mock('../../lib/engagementQueue.js', () => ({
  enqueue: vi.fn((s) => ({ id: 'eq-test', payload: { ...s }, status: 'queued' })),
  flush: vi.fn().mockResolvedValue({ results: [], remaining: 0 }),
  startAutoFlush: vi.fn(() => () => {}),
}))

const loadout = {
  tier: { id: 'audit-sprint', name: 'Security Audit Sprint' },
  price: { text: 'Sized honestly on the call — no template number.', provisioned: false },
}
const selection = { objective: 'security', engagement: 'project', assessment: { stage: 'idea' } }

beforeEach(() => vi.clearAllMocks())

describe('BookACall — the guaranteed floor (FR-036 / FR-037 / BR-11)', () => {
  it('completes with only a contact — no wallet — and shows optimistic confirmation', () => {
    render(<BookACall selection={selection} loadout={loadout} />)
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: 'john@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))

    // Optimistic confirmation regardless of network (BR-11), echoing what was submitted.
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/sending/i)
    expect(status).toHaveTextContent(/john@example\.com/)

    // Captured with the tier id + contact and NO price field (BR-12).
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        objective: 'security',
        engagement: 'project',
        tier: 'audit-sprint',
        contact: 'john@example.com',
        wallet: null,
      }),
    )
    expect(queue.enqueue.mock.calls[0][0]).not.toHaveProperty('indicative_price')
    expect(queue.flush).toHaveBeenCalled()
  })

  it('blocks an empty contact with an inline error and does not enqueue', () => {
    render(<BookACall selection={selection} loadout={loadout} />)
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/reach you/i)
    expect(queue.enqueue).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', () => {
    render(<BookACall selection={selection} loadout={loadout} />)
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: 'bad@' } })
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/email/i)
    expect(queue.enqueue).not.toHaveBeenCalled()
  })

  it('rejects a malformed wallet but accepts a blank one', () => {
    render(<BookACall selection={selection} loadout={loadout} />)
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/0x…/i), { target: { value: '0xnope' } })
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/wallet/i)
    expect(queue.enqueue).not.toHaveBeenCalled()
  })
})

/*
 * W1 — the confirmation must state the DELIVERY TRUTH (PRODUCT_AUDIT #3).
 *
 * The shipped version said "You're on John's list — John will follow up at <contact>" the instant
 * localStorage accepted the write. In production the Worker kept that row and told nobody:
 * engagement_requests had 0 rows and no notification path existed. The sentence was false on
 * every submission. These tests pin each real outcome to its own honest wording.
 */
describe('BookACall — delivery is reported honestly, never assumed', () => {
  const submit = async () => {
    render(<BookACall selection={selection} loadout={loadout} />)
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: 'john@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))
    return screen.getByRole('status')
  }

  it('claims an alert only when the Worker reports a configured channel', async () => {
    queue.flush.mockResolvedValueOnce({ results: [{ id: 'eq-test', ok: true, alerting: true }], remaining: 0 })
    await submit()
    expect(await screen.findByText(/alert on his phone/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/delivered to john/i)
  })

  it('confirms delivery WITHOUT promising an alert when no channel is configured', async () => {
    queue.flush.mockResolvedValueOnce({ results: [{ id: 'eq-test', ok: true, alerting: false }], remaining: 0 })
    await submit()
    expect(await screen.findByText(/delivered and recorded/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).not.toHaveTextContent(/alert on his phone/i)
  })

  it('says it is queued — not delivered — when the flush could not reach the Worker', async () => {
    queue.flush.mockResolvedValueOnce({ results: [{ id: 'eq-test', retry: true }], remaining: 1 })
    await submit()
    expect(await screen.findByText(/back online/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).not.toHaveTextContent(/delivered to john/i)
  })

  it('offers a direct human fallback when the request is terminally rejected', async () => {
    queue.flush.mockResolvedValueOnce({ results: [{ id: 'eq-test', rejected: true }], remaining: 0 })
    await submit()
    expect(await screen.findByText(/didn’t reach John’s system/i)).toBeInTheDocument()
    const mailto = screen.getByRole('link', { name: /@/ })
    expect(mailto.getAttribute('href')).toMatch(/^mailto:/)
  })

  it('falls back to queued — never to a success claim — if the flush itself throws', async () => {
    queue.flush.mockRejectedValueOnce(new Error('boom'))
    await submit()
    expect(await screen.findByText(/back online/i)).toBeInTheDocument()
  })
})
