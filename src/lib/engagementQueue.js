/*
 * jw3b.dev v2 — Engagement capture queue (P1-19 · FR-036/FR-037 · BR-11)  ·  app-ui-engineer
 * The book-a-call FLOOR must always complete — with no wallet, no chain, and no live Worker
 * (FR-036/BR-11). This module makes that true: a submission is written to a localStorage queue
 * and confirmed OPTIMISTICALLY, then flushed to `POST /engagement` (→ D1) with exponential
 * backoff, retrying on reconnect. A conversion is never lost to a transient network/Worker fault.
 *
 * Price provenance (BR-12): the payload carries the tier id but NO price — the Worker copies
 * indicative_price from the catalog and ignores anything the client sends. Everything here is
 * dependency-injectable (storage / fetch / clock / id / window) so it is deterministically
 * unit-tested; production defaults bind to the real browser globals.
 */
import { AGENT_ENGAGEMENT_URL } from '../config/worker.js'

export const QUEUE_KEY = 'jw3b:engagement-queue'
export const MAX_ATTEMPTS = 6
export const BASE_BACKOFF_MS = 2000
export const MAX_BACKOFF_MS = 5 * 60 * 1000

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eq_${Math.random().toString(36).slice(2)}`
}

/** Read the persisted queue, tolerating absent storage and corrupt JSON (never throws). */
export function readQueue(storage = defaultStorage()) {
  if (!storage) return []
  try {
    const parsed = JSON.parse(storage.getItem(QUEUE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(items, storage) {
  if (storage) storage.setItem(QUEUE_KEY, JSON.stringify(items))
}

/**
 * Shape a configurator submission into the Worker's `/engagement` payload. BR-12: the tier id
 * travels, the PRICE never does — the Worker is the price authority. Missing wallet/assessment
 * normalise to null so the record is uniform.
 */
export function toEngagementPayload({ objective, engagement, tier, contact, wallet, assessment, route = 'book_a_call' }) {
  return {
    objective,
    engagement,
    tier,
    route,
    contact,
    wallet: wallet || null,
    assessment: assessment || null,
  }
}

/**
 * Enqueue a submission and return the stored item (the caller confirms optimistically — BR-11).
 * `id` / `now` are injectable for deterministic tests.
 */
export function enqueue(submission, { storage = defaultStorage(), id = newId(), now = Date.now() } = {}) {
  const item = {
    id,
    payload: toEngagementPayload(submission),
    queuedAt: now,
    attempts: 0,
    nextAttemptAt: now,
    status: 'queued',
  }
  const items = readQueue(storage)
  items.push(item)
  writeQueue(items, storage)
  return item
}

// Advance an item after a retryable failure: exponential backoff, capped, with an attempt ceiling.
function scheduleRetry(item, now) {
  item.attempts += 1
  if (item.attempts >= MAX_ATTEMPTS) {
    item.status = 'rejected'
    item.error = 'max attempts exceeded'
    return
  }
  item.nextAttemptAt = now + Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** item.attempts)
}

/**
 * Attempt to POST every due queued item. 2xx → done (removed); 4xx → rejected/terminal (a bad
 * payload will not heal on retry); 5xx or network error → retry with backoff. Items whose backoff
 * has not elapsed are skipped. Returns a per-item result list + the remaining queue length.
 */
export async function flush({
  storage = defaultStorage(),
  fetchImpl = typeof fetch !== 'undefined' ? fetch : null,
  url = AGENT_ENGAGEMENT_URL,
  now = Date.now(),
} = {}) {
  const items = readQueue(storage)
  const results = []
  if (!fetchImpl) return { results, remaining: items.length }

  for (const item of items) {
    if (item.nextAttemptAt > now) {
      results.push({ id: item.id, skipped: true })
      continue
    }
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      if (res.ok) {
        item.status = 'done'
        // The Worker reports whether an alert channel is actually configured (`alerting`). The
        // caller needs it to phrase its confirmation honestly: before W1 this surface promised
        // "John will follow up" on every submission, including ones nothing was listening for.
        // Body parsing is best-effort — a delivered lead stays delivered either way.
        let alerting = false
        try {
          const body = typeof res.json === 'function' ? await res.json() : null
          alerting = body?.alerting === true
        } catch {
          alerting = false
        }
        results.push({ id: item.id, ok: true, alerting })
      } else if (res.status >= 400 && res.status < 500) {
        item.status = 'rejected'
        item.error = `HTTP ${res.status}`
        results.push({ id: item.id, rejected: true })
      } else {
        scheduleRetry(item, now)
        results.push({ id: item.id, retry: true })
      }
    } catch (err) {
      scheduleRetry(item, now)
      results.push({ id: item.id, retry: true, error: String(err) })
    }
  }

  const remaining = items.filter((i) => i.status === 'queued')
  writeQueue(remaining, storage)
  return { results, remaining: remaining.length }
}

/**
 * Wire the queue to flush now and again on every `online` event (reconnect). Returns a cleanup
 * that removes the listener. Injectable `win` keeps it testable and SSR-safe.
 */
export function startAutoFlush({ win = typeof window !== 'undefined' ? window : null, ...flushOpts } = {}) {
  if (!win) return () => {}
  const handler = () => flush(flushOpts)
  win.addEventListener('online', handler)
  handler()
  return () => win.removeEventListener('online', handler)
}
