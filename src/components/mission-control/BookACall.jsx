/*
 * jw3b.dev v2 — Book-a-call floor + engagement capture (P1-19 · FR-036/FR-037 · BR-11)  ·  app-ui-engineer
 * The GUARANTEED terminal action: it completes with no wallet, no chain, and no live Worker
 * (FR-036). On submit the request is written to the offline queue and confirmed OPTIMISTICALLY
 * (BR-11) — the user is never blocked on the network — then flushed to POST /engagement (→ D1,
 * FR-037) with retry/backoff, and re-flushed on reconnect for this surface's lifetime.
 *
 * Wallet is OPTIONAL (the whole point of the floor). Price is never sent (BR-12) — only the tier
 * id travels; the Worker is the price authority. Semantic tokens only; the verified accent frames
 * the confirmation. Client-side validation mirrors the Worker's (instant, specific errors).
 */
import { useEffect, useState } from 'react'
import { enqueue, flush, startAutoFlush } from '../../lib/engagementQueue.js'
import { SITE } from '../../constants/index.js'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const OWNER_EMAIL = SITE.contactEmail

// The status chip states the delivery truth, not a generic success. "Captured" used to appear
// the instant localStorage accepted the write, which is why the old copy could promise a
// follow-up on a submission the Worker had recorded and told nobody about.
const DELIVERY_LABEL = {
  sending: 'Sending',
  delivered: 'Delivered to John',
  queued: 'Saved — sends on reconnect',
  rejected: 'Not delivered',
}

export default function BookACall({ selection, loadout, onBack = () => {} }) {
  const [contact, setContact] = useState('')
  const [wallet, setWallet] = useState('')
  const [error, setError] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  // What actually happened to the lead: sending → delivered (alerting?) | queued | rejected.
  const [delivery, setDelivery] = useState({ state: 'sending' })

  // Keep retrying any queued captures on reconnect while this surface is mounted (BR-11).
  useEffect(() => startAutoFlush(), [])

  const submit = (e) => {
    e.preventDefault()
    const c = contact.trim()
    const w = wallet.trim()
    if (!c) {
      setError('Add an email or handle so John can reach you.')
      return
    }
    if (c.includes('@') && !EMAIL.test(c)) {
      setError('That email doesn’t look right.')
      return
    }
    if (w && !ADDRESS.test(w)) {
      setError('That wallet address doesn’t look right — or leave it blank.')
      return
    }
    setError(null)
    const item = enqueue({
      objective: selection.objective,
      engagement: selection.engagement,
      tier: loadout.tier?.id,
      contact: c,
      wallet: w || null,
      assessment: selection.assessment,
    })
    setConfirmed(item) // optimistic — the floor completes regardless of network (BR-11)
    setDelivery({ state: 'sending' })

    // W1: report the REAL outcome. This surface used to say "John will follow up" the instant it
    // wrote to localStorage — on a path where the Worker kept the row and told nobody. Now the
    // confirmation waits for the flush and states what actually happened: alerted, saved, or
    // still queued for reconnect. Optimism is fine; a promise nothing keeps is not.
    flush()
      .then(({ results }) => {
        const mine = results.find((r) => r.id === item.id)
        if (mine?.ok) setDelivery({ state: 'delivered', alerting: mine.alerting === true })
        else if (mine?.rejected) setDelivery({ state: 'rejected' })
        else setDelivery({ state: 'queued' })
      })
      .catch(() => setDelivery({ state: 'queued' }))
  }

  if (confirmed) {
    return (
      <div
        className={`rounded-lg border bg-panel p-5 ${
          delivery.state === 'rejected' ? 'border-caution/40' : 'border-verified/40'
        }`}
        role="status"
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              delivery.state === 'rejected' ? 'bg-caution' : 'bg-verified'
            }`}
            aria-hidden="true"
          />
          <span
            className={`font-mono text-[11px] uppercase tracking-label ${
              delivery.state === 'rejected' ? 'text-caution' : 'text-verified'
            }`}
          >
            {DELIVERY_LABEL[delivery.state]}
          </span>
        </div>
        <h3 className="mt-3 font-display text-base font-semibold text-content-primary">
          {delivery.state === 'rejected'
            ? 'That didn’t send — here’s the direct line.'
            : `You’re on John’s list${loadout.tier ? ` for ${loadout.tier.name}` : ''}.`}
        </h3>
        <p className="mt-2 text-sm text-content-secondary">
          {delivery.state === 'sending' && (
            <>
              Sending your request for{' '}
              <span className="font-mono text-content-primary">{confirmed.payload.contact}</span>…
            </>
          )}
          {delivery.state === 'delivered' && (
            <>
              {delivery.alerting
                ? 'Delivered — John gets an alert on his phone the moment this lands. He’ll reply at '
                : 'Delivered and recorded against your request. John will reply at '}
              <span className="font-mono text-content-primary">{confirmed.payload.contact}</span>.
            </>
          )}
          {delivery.state === 'queued' && (
            <>
              Saved on this device — it will send itself the moment you’re back online, then John
              replies at{' '}
              <span className="font-mono text-content-primary">{confirmed.payload.contact}</span>.
              Nothing is lost if you close this tab.
            </>
          )}
          {delivery.state === 'rejected' && (
            <>
              The request didn’t reach John’s system and retrying won’t fix it. Message him
              directly at{' '}
              <a href={`mailto:${OWNER_EMAIL}`} className="text-cyan underline">
                {OWNER_EMAIL}
              </a>{' '}
              and quote {loadout.tier ? loadout.tier.name : 'your engagement'} — it will get the
              same answer, faster.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          ← Back to the loadout
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-hairline bg-panel p-5" noValidate>
      <h3 className="font-display text-base font-semibold text-content-primary">Book a call</h3>
      <p className="mt-1 text-sm text-content-secondary">
        The floor — always available. No wallet, no chain, no payment. Leave a way to reach you and
        John takes it from there.
      </p>

      <label className="mt-4 block">
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          Email or handle
        </span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-md border border-hairline bg-void px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />
      </label>

      <label className="mt-3 block">
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          Wallet <span className="normal-case text-content-muted">(optional)</span>
        </span>
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x… — only if you want to go on-chain later"
          className="mt-1 w-full rounded-md border border-hairline bg-void px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-failed" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-3 py-1.5 font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="rounded-md border border-cyan/50 bg-cyan/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan shadow-edge-cyan hover:bg-cyan/20 motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Send request →
        </button>
      </div>
    </form>
  )
}
