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

    // Optimistic confirmation regardless of network (BR-11).
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/request captured/i)
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
