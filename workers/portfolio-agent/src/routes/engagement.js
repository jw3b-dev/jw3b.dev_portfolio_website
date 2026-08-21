/*
 * jw3b.dev v2 — Engagement + book-a-call routes (P1-06 · FR-049 · BR-12)  ·  backend-specialist
 * `/engagement` captures a conversion request: every input validated, the tier resolved against
 * the sealed pricing catalog (src/data/retainer.json — single source), and indicative_price
 * COPIED FROM the catalog, never trusted from the client (BR-12). Parameterized INSERT into
 * engagement_requests. `/book-a-call` is the guaranteed terminal action (FR-036).
 *
 * W1 (2026-08-21) — BOTH routes now REACH JOHN. Previously a submitted lead landed in D1 and
 * nothing read it (`engagement_requests`: 0 rows ever, in production, while the UI said "John
 * will follow up"), and `/book-a-call` validated a contact then discarded it entirely. The order
 * here is load-bearing: PERSIST first, alert second, and the alert can never fail the capture.
 * Each response now carries `alerting` — whether an alert channel is actually configured — so the
 * client can promise a follow-up only when something is genuinely listening.
 */
import catalog from '../../../../src/data/retainer.json'
import { notifyLead, telegramConfigured } from '../notify.js'

export const OBJECTIVES = ['security', 'engineering', 'pm']
export const ENGAGEMENTS = ['project', 'retainer']
export const ROUTES = ['book_a_call', 'escrow', 'unlock']
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const TIERS = Array.isArray(catalog.tiers) ? catalog.tiers : []
const tierById = new Map(TIERS.map((t) => [t.id, t]))

export function catalogTier(id) {
  return tierById.get(id) || null
}

/**
 * PURE validation of an engagement submission. On success returns the DB record with
 * indicative_price taken FROM the catalog (BR-12) — the client-supplied price is ignored.
 * @returns {{ok:true, record:object} | {ok:false, error:string}}
 */
export function validateEngagement(b) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'body required' }
  if (!OBJECTIVES.includes(b.objective)) return { ok: false, error: 'invalid objective' }
  if (!ENGAGEMENTS.includes(b.engagement)) return { ok: false, error: 'invalid engagement' }
  if (!ROUTES.includes(b.route)) return { ok: false, error: 'invalid route' }
  const tier = catalogTier(b.tier)
  if (!tier) return { ok: false, error: 'invalid tier' }
  if (tier.objective !== b.objective || tier.engagement !== b.engagement)
    return { ok: false, error: 'tier does not match objective/engagement' }
  if (typeof b.contact !== 'string' || !b.contact.trim() || b.contact.length > 200)
    return { ok: false, error: 'contact required' }
  if (b.contact.includes('@') && !EMAIL.test(b.contact)) return { ok: false, error: 'invalid email' }
  const wallet = b.wallet != null && b.wallet !== '' ? String(b.wallet) : null
  if (wallet && !ADDRESS.test(wallet)) return { ok: false, error: 'invalid wallet' }
  const assessment = b.assessment && typeof b.assessment === 'object' ? JSON.stringify(b.assessment) : null
  return {
    ok: true,
    record: {
      objective: b.objective,
      engagement: b.engagement,
      tier: tier.id,
      indicative_price: typeof tier.indicative_price === 'string' ? tier.indicative_price : '', // FROM catalog (BR-12)
      route: b.route,
      wallet,
      contact: b.contact.trim().slice(0, 200),
      assessment_json: assessment,
    },
  }
}

/** @returns {Promise<{status:number, body?:object, error?:string}>} */
export async function handleEngagement(req, env, ctx, body) {
  const v = validateEngagement(body)
  if (!v.ok) return { status: 400, error: v.error }
  const id = crypto.randomUUID()
  const r = v.record
  if (env && env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO engagement_requests
           (id, objective, assessment_json, engagement, tier, indicative_price, route, wallet, contact, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'submitted')`,
      )
        .bind(id, r.objective, r.assessment_json, r.engagement, r.tier, r.indicative_price, r.route, r.wallet, r.contact)
        .run()
    } catch {
      // Signal the client to retry (BR-11 queue) rather than silently dropping the conversion.
      return { status: 503, error: 'could not persist request' }
    }
  }
  // The row is durable — only now do we try to reach John. notifyLead never throws and never
  // awaits the send inline (ctx.waitUntil), so a Telegram outage costs a notification, not a lead.
  const { alerting } = notifyLead(env, ctx, 'engagement', { ...r, id })
  return { status: 200, body: { id, status: 'submitted', alerting } }
}

/**
 * `/book-a-call` — the guaranteed terminal action (FR-036) and the floor every other rail
 * degrades to. It now PERSISTS (0005_book_a_call_leads) and alerts; before W1 it validated the
 * contact and dropped it, which made "book a call" the most-promised and least-delivered path on
 * the site. Async because capture is a write now, not a formality.
 */
export async function handleBookACall(req, env, ctx, body) {
  if (!body || typeof body.contact !== 'string' || !body.contact.trim())
    return { status: 400, error: 'contact required' }
  if (body.contact.length > 200) return { status: 400, error: 'contact too long' }

  const wallet = body.wallet != null && body.wallet !== '' ? String(body.wallet) : null
  if (wallet && !ADDRESS.test(wallet)) return { status: 400, error: 'invalid wallet' }
  const contact = body.contact.trim().slice(0, 200)
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 40) : null
  const id = crypto.randomUUID()
  const alerting = telegramConfigured(env)

  if (env && env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO book_a_call_leads (id, contact, wallet, source, notified)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
        .bind(id, contact, wallet, source, alerting ? 1 : 0)
        .run()
    } catch {
      // Same rule as /engagement: tell the client to retry (its offline queue will) rather than
      // acknowledge a booking that was never written down.
      return { status: 503, error: 'could not persist request' }
    }
  }

  notifyLead(env, ctx, 'book_a_call', { id, contact, wallet, source })
  return { status: 200, body: { ok: true, id, alerting, scheduler_url: (env && env.SCHEDULER_URL) || null } }
}
