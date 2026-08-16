/*
 * jw3b.dev v2 — KTHULHU flagship embed (P2-10 · ADR-08)  ·  frontend-engineer
 * Shows the live KTHULHU product in a SANDBOXED iframe at minimum privilege. The host
 * (kthulhu.co) is already on the CSP frame-src allowlist (P0-11) — this component does NOT
 * touch the CSP. If framing is refused (the app never loads within the window, or the remote
 * sets frame-ancestors/XFO), it degrades to a labelled RECORDED walkthrough (Tier-1/2, seeded
 * in P2-18) — never a blank frame. An "Open KTHULHU ↗" link is always present, so the visitor
 * reaches the real product even when it can't be framed. Semantic tokens only.
 */
import { useEffect, useRef, useState } from 'react'

// The live product host — MUST stay in sync with the CSP frame-src allowlist (public/_headers).
export const KTHULHU_URL = 'https://kthulhu.co'

// Minimum-privilege sandbox: scripts (the app runs) + same-origin (it reaches its own APIs) +
// popups (external links open in a new tab). No forms, no top-navigation, no pointer-lock.
const SANDBOX = 'allow-scripts allow-same-origin allow-popups'

export default function KthulhuEmbed({ url = KTHULHU_URL, title = 'KTHULHU — autonomous smart-contract auditor', blockTimeoutMs = 7000 }) {
  const [status, setStatus] = useState('loading') // loading → live | blocked
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setTimeout(() => setStatus((s) => (s === 'live' ? s : 'blocked')), blockTimeoutMs)
    return () => clearTimeout(timer.current)
  }, [blockTimeoutMs])

  const onLoad = () => {
    clearTimeout(timer.current)
    setStatus('live')
  }

  return (
    <section aria-labelledby="kthulhu-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · live product</p>
          <h3 id="kthulhu-title" className="mt-1 font-display text-lg font-semibold text-content-primary">KTHULHU</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open KTHULHU ↗
        </a>
      </div>

      {status !== 'blocked' ? (
        <div className="relative aspect-video overflow-hidden rounded-md border border-hairline bg-void">
          {status === 'loading' && (
            <p role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center text-sm text-content-muted">
              Loading the live product…
            </p>
          )}
          <iframe
            title={title}
            src={url}
            sandbox={SANDBOX}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={onLoad}
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="rounded-md border border-caution/30 bg-void/60 p-4">
          <p className="font-mono text-[11px] uppercase tracking-label text-caution">Recorded walkthrough</p>
          <p className="mt-2 text-sm text-content-secondary">
            The live product can’t be embedded here right now — this is a recorded walkthrough of KTHULHU rather than the
            live app. Open it directly for the real thing.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary"
          >
            Open the live KTHULHU ↗
          </a>
        </div>
      )}
    </section>
  )
}
