import { describe, it, expect, vi } from 'vitest'
import {
  telegramConfigured,
  escapeHtml,
  formatLeadMessage,
  sendTelegram,
  notifyLead,
} from '../notify.js'
import { handleEngagement, handleBookACall, validateEngagement, TIERS } from '../routes/engagement.js'

/*
 * W1 — a submitted lead must REACH JOHN (PRODUCT_AUDIT #1/#2/#3).
 *
 * The defect these tests exist to prevent from ever returning: a visitor completed Mission
 * Control, was told "You're on John's list — John will follow up", and nothing anywhere told
 * him. `engagement_requests` had 0 rows in production; `/book-a-call` discarded the contact it
 * had just validated; no notification path existed in the worker at all.
 *
 * The invariants under test are ordered by how expensive their violation is:
 *   1. capture is durable BEFORE any alert is attempted,
 *   2. an alert failure never costs the lead,
 *   3. the response never claims an alert channel that isn't configured.
 */

const env = (over = {}) => ({ TELEGRAM_BOT_TOKEN: 't0ken', TELEGRAM_CHAT_ID: '4242', ...over })

/** A D1 double that records what was written, and can be told to fail. */
function fakeDb({ fail = false } = {}) {
  const writes = []
  return {
    writes,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (fail) throw new Error('D1 down')
              writes.push({ sql, args })
              return { success: true }
            },
          }
        },
      }
    },
  }
}

/** ctx double that runs waitUntil work eagerly so the test can await the send. */
function fakeCtx() {
  const pending = []
  return { waitUntil: (p) => pending.push(p), settle: () => Promise.all(pending), pending }
}

const validSubmission = () => {
  const tier = TIERS[0]
  return {
    objective: tier.objective,
    engagement: tier.engagement,
    tier: tier.id,
    route: 'book_a_call',
    contact: 'founder@example.com',
    assessment: { stage: 'live', surface: 'contracts', timeline: 'urgent' },
  }
}

describe('telegramConfigured — both secrets or nothing', () => {
  it('is true only when both secrets are present and non-empty', () => {
    expect(telegramConfigured(env())).toBe(true)
    expect(telegramConfigured({ TELEGRAM_BOT_TOKEN: 't' })).toBe(false)
    expect(telegramConfigured({ TELEGRAM_CHAT_ID: '1' })).toBe(false)
    expect(telegramConfigured({ TELEGRAM_BOT_TOKEN: '  ', TELEGRAM_CHAT_ID: '1' })).toBe(false)
    expect(telegramConfigured({})).toBe(false)
    expect(telegramConfigured(undefined)).toBe(false)
  })
})

describe('escapeHtml — visitor text is untrusted input rendered in John\'s client', () => {
  it('escapes the three characters that break Telegram HTML', () => {
    expect(escapeHtml('<b>x</b> & y')).toBe('&lt;b&gt;x&lt;/b&gt; &amp; y')
  })

  it('handles null/undefined without throwing', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})

describe('formatLeadMessage', () => {
  it('leads with the contact — the one thing John acts on', () => {
    const msg = formatLeadMessage('engagement', { contact: 'a@b.com', tier: 'security-audit-sprint' })
    expect(msg).toContain('New engagement request')
    expect(msg.indexOf('a@b.com')).toBeLessThan(msg.indexOf('security-audit-sprint'))
  })

  it('escapes markup in the contact rather than rendering it', () => {
    const msg = formatLeadMessage('engagement', { contact: '<script>alert(1)</script>' })
    expect(msg).not.toContain('<script>')
    expect(msg).toContain('&lt;script&gt;')
  })

  it('carries the assessment answers so the reply has context', () => {
    const msg = formatLeadMessage('engagement', {
      contact: 'a@b.com',
      assessment_json: JSON.stringify({ stage: 'live', timeline: 'urgent' }),
    })
    expect(msg).toContain('Assessment')
    expect(msg).toContain('urgent')
  })

  it('survives a malformed assessment payload', () => {
    const msg = formatLeadMessage('engagement', { contact: 'a@b.com', assessment_json: '{not json' })
    expect(msg).toContain('a@b.com')
    expect(msg).not.toContain('Assessment')
  })

  it('titles a book-a-call differently from an engagement', () => {
    expect(formatLeadMessage('book_a_call', { contact: 'a@b.com' })).toContain('Book a call')
  })

  it('caps the payload under the Telegram limit', () => {
    const msg = formatLeadMessage('engagement', { contact: 'x'.repeat(5000) })
    expect(msg.length).toBeLessThanOrEqual(3501)
  })
})

describe('sendTelegram', () => {
  it('posts to the Bot API with the token in the path and the chat in the body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const res = await sendTelegram(env(), 'hello', fetchImpl)
    expect(res).toEqual({ sent: true })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toContain('/bott0ken/sendMessage')
    expect(JSON.parse(init.body)).toMatchObject({ chat_id: '4242', text: 'hello', parse_mode: 'HTML' })
  })

  it('reports rather than throws when the API rejects', async () => {
    const res = await sendTelegram(env(), 'x', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    expect(res).toEqual({ sent: false, reason: 'http_403' })
  })

  it('reports rather than throws when the network fails', async () => {
    const res = await sendTelegram(env(), 'x', vi.fn().mockRejectedValue(new Error('offline')))
    expect(res).toEqual({ sent: false, reason: 'network' })
  })

  it('does not call the network at all when unconfigured', async () => {
    const fetchImpl = vi.fn()
    expect(await sendTelegram({}, 'x', fetchImpl)).toEqual({ sent: false, reason: 'not_configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('notifyLead', () => {
  it('hands the send to waitUntil so the response is never blocked on Telegram', async () => {
    const ctx = fakeCtx()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    expect(notifyLead(env(), ctx, 'engagement', { contact: 'a@b.com' }, fetchImpl)).toEqual({ alerting: true })
    expect(ctx.pending).toHaveLength(1)
    await ctx.settle()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('reports alerting:false and queues nothing when unconfigured', () => {
    const ctx = fakeCtx()
    expect(notifyLead({}, ctx, 'engagement', { contact: 'a@b.com' })).toEqual({ alerting: false })
    expect(ctx.pending).toHaveLength(0)
  })

  it('never throws when ctx has no waitUntil', () => {
    expect(() => notifyLead(env(), null, 'engagement', { contact: 'a' }, vi.fn().mockResolvedValue({ ok: true }))).not.toThrow()
  })
})

describe('FR-036 — /engagement reaches John', () => {
  it('persists the lead AND alerts, reporting alerting:true', async () => {
    const DB = fakeDb()
    const ctx = fakeCtx()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    // notifyLead is called by the route with the real global fetch; stub it for this assertion.
    const original = globalThis.fetch
    globalThis.fetch = fetchImpl
    try {
      const out = await handleEngagement({}, { ...env(), DB }, ctx, validSubmission())
      expect(out).toMatchObject({ status: 200 })
      expect(out.body.alerting).toBe(true)
      expect(DB.writes).toHaveLength(1)
      expect(DB.writes[0].sql).toContain('INSERT INTO engagement_requests')
      await ctx.settle()
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.fetch = original
    }
  })

  it('captures the lead and says alerting:false when no channel is configured', async () => {
    const DB = fakeDb()
    const out = await handleEngagement({}, { DB }, fakeCtx(), validSubmission())
    expect(out.status).toBe(200)
    expect(out.body.alerting).toBe(false)
    expect(DB.writes).toHaveLength(1) // the lead is NEVER lost to a missing secret
  })

  it('asks the client to retry when the write fails — never acknowledges an unwritten lead', async () => {
    const out = await handleEngagement({}, { ...env(), DB: fakeDb({ fail: true }) }, fakeCtx(), validSubmission())
    expect(out.status).toBe(503)
  })

  it('does not alert on a rejected submission', async () => {
    const ctx = fakeCtx()
    const out = await handleEngagement({}, env(), ctx, { objective: 'nope' })
    expect(out.status).toBe(400)
    expect(ctx.pending).toHaveLength(0)
  })

  it('still takes the price from the catalog, not the client (BR-12)', () => {
    const v = validateEngagement({ ...validSubmission(), indicative_price: '$1' })
    expect(v.ok).toBe(true)
    expect(v.record.indicative_price).toBe(TIERS[0].indicative_price)
  })
})

describe('FR-036 — /book-a-call is a real capture, not an acknowledgement', () => {
  it('persists the contact it validates', async () => {
    const DB = fakeDb()
    const out = await handleBookACall({}, { DB }, fakeCtx(), { contact: 'founder@example.com' })
    expect(out.status).toBe(200)
    expect(out.body.ok).toBe(true)
    expect(DB.writes).toHaveLength(1)
    expect(DB.writes[0].sql).toContain('INSERT INTO book_a_call_leads')
    expect(DB.writes[0].args).toContain('founder@example.com')
  })

  it('records whether an alert channel existed at capture time', async () => {
    const DB = fakeDb()
    await handleBookACall({}, { ...env(), DB }, fakeCtx(), { contact: 'a@b.com' })
    expect(DB.writes[0].args.at(-1)).toBe(1)
    const DB2 = fakeDb()
    await handleBookACall({}, { DB: DB2 }, fakeCtx(), { contact: 'a@b.com' })
    expect(DB2.writes[0].args.at(-1)).toBe(0)
  })

  it('alerts John, reporting alerting honestly in the response', async () => {
    const ctx = fakeCtx()
    const original = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    try {
      const out = await handleBookACall({}, { ...env(), DB: fakeDb() }, ctx, { contact: 'a@b.com' })
      expect(out.body.alerting).toBe(true)
      await ctx.settle()
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.fetch = original
    }
  })

  it('rejects a missing contact and an over-long contact', async () => {
    expect((await handleBookACall({}, {}, fakeCtx(), {})).status).toBe(400)
    expect((await handleBookACall({}, {}, fakeCtx(), { contact: '   ' })).status).toBe(400)
    expect((await handleBookACall({}, {}, fakeCtx(), { contact: 'x'.repeat(201) })).status).toBe(400)
  })

  it('rejects a malformed wallet rather than storing it', async () => {
    const DB = fakeDb()
    const out = await handleBookACall({}, { DB }, fakeCtx(), { contact: 'a@b.com', wallet: 'not-an-address' })
    expect(out.status).toBe(400)
    expect(DB.writes).toHaveLength(0)
  })

  it('asks the client to retry when the write fails', async () => {
    const out = await handleBookACall({}, { DB: fakeDb({ fail: true }) }, fakeCtx(), { contact: 'a@b.com' })
    expect(out.status).toBe(503)
  })
})
