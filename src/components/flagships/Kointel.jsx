/*
 * jw3b.dev v2 — Kointel flagship (P2-12)  ·  frontend-engineer
 * The fourth flagship: John's live external product (kointel.co.za), a compliance-first crypto-
 * tax product. We embed it LIVE in a sandboxed iframe when the remote permits framing, and
 * degrade to a launch card (description + dimensions + open link) when it doesn't.
 *
 * PROVISIONING (owner action): kointel.co.za currently sends `X-Frame-Options: DENY`, so the
 * browser refuses the frame and this shows the launch-card fallback. Because Kointel is John's
 * own product he can opt jw3b.dev in: on the Kointel origin, REMOVE `X-Frame-Options: DENY` and
 * add `Content-Security-Policy: frame-ancestors https://jw3b.dev` (XFO can't whitelist a single
 * origin; CSP frame-ancestors can). Once that ships, the live embed renders automatically — no
 * change here. jw3b.dev's own CSP already allows kointel.co.za in frame-src (public/_headers).
 * Semantic tokens only.
 */
import { useEffect, useRef, useState } from 'react'
import { HATS } from '../../constants/index.js'
import { isEnabled } from '../../config/features.js'
import { framingOriginAllowed } from '../../config/embeds.js'
import KointelGate from './KointelGate.jsx'

export const KOINTEL_URL = 'https://kointel.co.za'

// The two hats Kointel speaks to — pulled from the canonical HATS source (no re-styling).
const DIMENSIONS = HATS.filter((h) => h.key === 'auditor' || h.key === 'founder')

// Minimum-privilege sandbox: scripts (the app runs) + same-origin (it reaches its own APIs) +
// popups (external links open in a new tab). No forms, no top-navigation, no pointer-lock.
const SANDBOX = 'allow-scripts allow-same-origin allow-popups'

export default function Kointel({ url = KOINTEL_URL, embed = isEnabled('kointelEmbed') && framingOriginAllowed(), blockTimeoutMs = 6000 }) {
  const [status, setStatus] = useState('loading') // loading → live | blocked

  const timer = useRef(null)

  useEffect(() => {
    if (!embed) return undefined
    // Belt-and-suspenders: even with the flag on, if the frame hasn't loaded within the
    // window, assume the remote refused framing and degrade to the launch card.
    timer.current = setTimeout(() => setStatus((s) => (s === 'live' ? s : 'blocked')), blockTimeoutMs)
    return () => clearTimeout(timer.current)
  }, [embed, blockTimeoutMs])

  const onLoad = () => {
    clearTimeout(timer.current)
    setStatus('live')
  }

  return (
    <section aria-labelledby="kointel-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · live product</p>
          <h3 id="kointel-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Kointel</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open Kointel ↗
        </a>
      </div>

      <p className="text-sm text-content-secondary">
        A compliance-first agentic product — built with an EU AI Act dossier and a compliance gate in CI, so the
        governance is engineered in, not bolted on.
      </p>

      {/* Live embed of the real product; gated behind the kointelEmbed flag (fails closed) and
          degrades to the launch card if framing is refused after the flag is turned on. */}
      {embed && status !== 'blocked' && (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-md border border-hairline bg-void">
          {status === 'loading' && (
            <p role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center text-sm text-content-muted">
              Loading the live product…
            </p>
          )}
          <iframe
            title="Kointel — live product"
            src={url}
            sandbox={SANDBOX}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={onLoad}
            className="h-full w-full"
          />
        </div>
      )}

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Dimensions">
        {DIMENSIONS.map((h) => (
          <li key={h.key} className="inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} aria-hidden="true" />
            {h.label}
          </li>
        ))}
      </ul>

      {/*
          The on-site half. Kointel refuses framing, so this card was a description and a link —
          the weakest of the four, and the last one asserting a capability the visitor could not
          reach. The compliance gate is the product's documented differentiator and is a pure
          rule, so it runs here. Same lesson as the KTHULHU corpus: the demonstrable thing was
          never behind an API.
      */}
      <KointelGate />
    </section>
  )
}
