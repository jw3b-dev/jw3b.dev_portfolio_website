import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConnectButton from '../wallet/ConnectButton.jsx'
import Seo from '../seo/Seo.jsx'
import { useXMTP } from '../../hooks/useXMTP.js'
import { XMTP_STATUS } from '../../lib/xmtpFlow.js'

/*
 * XmtpChannel (P3-01 · FR-039)  ·  full-stack-integrator
 * The live E2E channel UI, mounted by /messages only when the `xmtp` flag is ON and John's
 * recipient is provisioned. Every state — connect / start / initializing / conversation /
 * unreachable / error — resolves to a real next step, and every non-happy ending keeps the
 * book-a-call floor one click away (BR-11, zero dead-ends). Tokens only; honest about what it is.
 */

const kicker = 'font-mono text-[11px] uppercase tracking-label text-cyan'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-md border border-cyan/50 bg-raised px-3 py-2 text-sm ' +
  'font-medium text-cyan transition-colors hover:bg-panel hover:border-cyan focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-void'
const linkCta = 'font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary'

function BookACall() {
  return (
    <Link to="/hire-me" className={linkCta}>
      Book a call →
    </Link>
  )
}

function NeedsWallet() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-content-secondary">Connect a wallet to open your encrypted inbox.</p>
      <ConnectButton />
    </div>
  )
}

function StartChannel({ onStart }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-content-secondary">
        Create your encrypted inbox — your wallet will ask you to sign a message (free, no transaction, moves no funds).
      </p>
      <button type="button" onClick={onStart} className={btnPrimary}>
        Start encrypted channel
      </button>
    </div>
  )
}

function Initializing() {
  return (
    <p className="flex items-center gap-2 text-sm text-content-secondary" role="status" aria-live="polite">
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" aria-hidden="true" />
      Creating your encrypted inbox — approve the signature in your wallet…
    </p>
  )
}

function Degrade({ note, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-content-secondary">{note} You can still reach John the guaranteed way:</p>
      <div className="flex flex-wrap items-center gap-4">
        <BookACall />
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
            Try again →
          </button>
        )}
      </div>
    </div>
  )
}

function Conversation({ messages, inboxId, send }) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const ok = await send(text)
    setSending(false)
    if (ok) setDraft('') // the DM stream echoes the sent message back into the list
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto" aria-label="Messages">
        {messages.length === 0 && <li className="text-sm text-content-muted">No messages yet — say hello.</li>}
        {messages.map((m) => {
          const mine = Boolean(m.senderInboxId) && m.senderInboxId === inboxId
          return (
            <li key={m.id} className={mine ? 'self-end' : 'self-start'}>
              <span
                className={`inline-block max-w-[36ch] whitespace-pre-wrap break-words rounded-md px-3 py-2 text-sm ${
                  mine ? 'bg-cyan/10 text-content-primary' : 'bg-raised text-content-secondary'
                }`}
              >
                {m.content}
              </span>
            </li>
          )
        })}
      </ul>
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <label htmlFor="xmtp-input" className="sr-only">
          Message
        </label>
        <textarea
          id="xmtp-input"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-hairline bg-void px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus-visible:border-cyan focus-visible:outline-none"
        />
        <button type="submit" disabled={sending || !draft.trim()} className={`${btnPrimary} disabled:opacity-50`}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default function XmtpChannel() {
  const xmtp = useXMTP()
  const { status } = xmtp

  return (
    <section aria-labelledby="xmtp-title" className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <Seo
        title="Encrypted Messages"
        description="End-to-end encrypted, wallet-to-wallet messaging with John Wellard (JW3B / AgileGypsy) over XMTP."
      />
      <p className={kicker}>Encrypted messaging · XMTP</p>
      <h1 id="xmtp-title" className="mt-3 font-display text-3xl font-semibold text-content-primary">
        Wallet-to-wallet, end-to-end encrypted.
      </h1>
      <p className="mt-3 max-w-prose text-content-secondary">
        Your wallet is the identity — no email, no middleman. Messages are end-to-end encrypted over XMTP (MLS);
        nothing is stored on this site. Signing is free and moves no funds.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-panel/60 p-5">
        {status === XMTP_STATUS.NO_WALLET && <NeedsWallet />}
        {status === XMTP_STATUS.READY && <StartChannel onStart={xmtp.connect} />}
        {status === XMTP_STATUS.INITIALIZING && <Initializing />}
        {status === XMTP_STATUS.CONNECTED && <Conversation messages={xmtp.messages} inboxId={xmtp.inboxId} send={xmtp.send} />}
        {status === XMTP_STATUS.UNREACHABLE && <Degrade note="John's inbox isn't reachable on XMTP yet." />}
        {status === XMTP_STATUS.ERROR && <Degrade note={xmtp.error || 'The channel could not open.'} onRetry={xmtp.connect} />}
      </div>

      <p className="mt-6 text-[12px] text-content-muted">
        Not into wallets? <span className="text-content-secondary">Book a call instead —</span> <BookACall />
      </p>
    </section>
  )
}
