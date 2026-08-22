/*
 * What the visitor already did  ·  full-stack-integrator  (brief 00, next-need 1)
 *
 * A visitor who had already submitted an engagement request was still greeted, on their next
 * visit, as though they had done nothing — the same "book a call" ask, no acknowledgement that a
 * request was already in flight. The offline queue (engagementQueue) already holds the answer: an
 * item that is still `queued` never reached John, and one that `rejected` exhausted its retries.
 *
 * This is a PURE reader over that queue. It states only what the device can honestly know:
 *   · a submission is still waiting to send (came back before reconnect) → tell them, don't re-ask
 *   · a submission gave up after max retries → tell them plainly, offer the call as the floor
 *   · nothing pending → no claim at all
 *
 * It deliberately does NOT claim "John received your request" — the queue only knows what left
 * this browser, not what landed. The delivered state is the Worker's to confirm (BR-11/FR-037),
 * and inventing it here would be exactly the kind of unearned reassurance the site argues against.
 */
import { readQueue } from './engagementQueue.js'

/** @typedef {{ state:'none'|'pending'|'failed', count:number }} EngagementState */

/**
 * PURE — summarise what this browser's queue says about prior submissions.
 * @returns {EngagementState}
 */
export function engagementState(storage) {
  const items = readQueue(storage)
  if (!items.length) return { state: 'none', count: 0 }

  const pending = items.filter((i) => i.status === 'queued')
  if (pending.length) return { state: 'pending', count: pending.length }

  const failed = items.filter((i) => i.status === 'rejected')
  if (failed.length) return { state: 'failed', count: failed.length }

  return { state: 'none', count: 0 }
}

/** The one honest sentence for each state — no "delivered", because this side cannot know that. */
export function engagementStateMessage(state) {
  if (!state || state.state === 'none') return null
  if (state.state === 'pending')
    return 'You already started a request on this device — it is queued and will send when you are back online. No need to start another.'
  return 'A request you started on this device could not be sent after several tries. Booking a call is the surest way to reach John.'
}
