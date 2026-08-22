/*
 * engagementState (brief 00, next-need 1) — the spine acknowledging what the visitor already did.
 *
 * The load-bearing honesty rule: this reader knows what LEFT the browser, never what John
 * RECEIVED. So there is no 'delivered' state and no message ever claims receipt — a test pins that.
 */
import { describe, it, expect } from 'vitest'
import { engagementState, engagementStateMessage } from '../engagementState.js'

const store = (items) => {
  const m = new Map([['jw3b:engagement-queue', JSON.stringify(items)]])
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('engagementState', () => {
  it('reports none for an empty queue', () => {
    expect(engagementState(store([]))).toEqual({ state: 'none', count: 0 })
  })
  it('reports pending when a submission is still queued', () => {
    expect(engagementState(store([{ status: 'queued' }, { status: 'queued' }]))).toEqual({ state: 'pending', count: 2 })
  })
  it('pending OUTRANKS failed — a live retry is the more useful thing to surface', () => {
    expect(engagementState(store([{ status: 'rejected' }, { status: 'queued' }])).state).toBe('pending')
  })
  it('reports none when the queue holds only items in some OTHER status', () => {
    // A non-empty queue whose items are neither queued nor rejected (e.g. already sent and not
    // yet pruned) is not something to tell the visitor about — there is nothing outstanding.
    expect(engagementState(store([{ status: 'sent' }, { status: 'done' }]))).toEqual({ state: 'none', count: 0 })
  })

  it('reports failed only when nothing is still trying', () => {
    expect(engagementState(store([{ status: 'rejected' }]))).toEqual({ state: 'failed', count: 1 })
  })
})

describe('engagementStateMessage — never claims receipt', () => {
  it('has no message for none', () => {
    expect(engagementStateMessage({ state: 'none', count: 0 })).toBeNull()
    expect(engagementStateMessage(null)).toBeNull()
  })
  it('the pending and failed messages never say delivered/received/sent-successfully', () => {
    for (const st of ['pending', 'failed']) {
      const msg = engagementStateMessage({ state: st, count: 1 })
      expect(msg).toBeTruthy()
      expect(msg).not.toMatch(/received|delivered|John (has|got)/i)
    }
  })
})
