/*
 * jw3b.dev v2 — KTHULHU flagship (P2-10 · ADR-08)  ·  frontend-engineer
 * KTHULHU is a live security product. Its origin (kthulhu.co) now opts jw3b.dev in to framing via
 * CSP `frame-ancestors https://jw3b.dev` (verified live 2026-08-16), so we embed it LIVE in a
 * sandboxed iframe — gated behind the `kthulhuEmbed` flag (fails closed). The allow-list is scoped
 * to https://jw3b.dev, so the frame only renders on the deployed origin; anywhere else (localhost,
 * a preview host) the browser refuses it and we degrade to the recorded walkthrough — never a
 * broken "refused to connect" frame. jw3b.dev's CSP frame-src already allows kthulhu.co
 * (public/_headers). Semantic tokens only.
 */
import { useEffect, useRef, useState } from 'react'
import { RECORDED_RUNS } from '../../data/recorded-runs/index.js'
import { isEnabled } from '../../config/features.js'
import { framingOriginAllowed } from '../../config/embeds.js'

// The live product host. Framing is allowed for https://jw3b.dev only (see file header).
export const KTHULHU_URL = 'https://kthulhu.co'

// Minimum-privilege sandbox: scripts (the app runs) + same-origin (it reaches its own APIs) +
// popups (external links open in a new tab). No forms, no top-navigation, no pointer-lock.
const SANDBOX = 'allow-scripts allow-same-origin allow-popups'

// The recorded walkthrough (Tier-2, seeded P2-18) — single-sourced from the bundled runs so the
// preview copy can't drift from the fallback fixture. Shown as the fallback when not embedding.
const WALKTHROUGH = RECORDED_RUNS['kthulhu-intro']

export default function KthulhuEmbed({ url = KTHULHU_URL, embed = isEnabled('kthulhuEmbed') && framingOriginAllowed(), blockTimeoutMs = 6000 }) {
  const [status, setStatus] = useState('loading') // loading → live | blocked
  const timer = useRef(null)

  useEffect(() => {
    if (!embed) return undefined
    // If the frame hasn't loaded within the window (e.g. the origin isn't in kthulhu.co's
    // frame-ancestors allow-list), degrade to the recorded walkthrough.
    timer.current = setTimeout(() => setStatus((s) => (s === 'live' ? s : 'blocked')), blockTimeoutMs)
    return () => clearTimeout(timer.current)
  }, [embed, blockTimeoutMs])

  const onLoad = () => {
    clearTimeout(timer.current)
    setStatus('live')
  }

  const frames = WALKTHROUGH?.frames ?? []
  const showLiveFrame = embed && status !== 'blocked'

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

      <p className="text-sm text-content-secondary">
        An autonomous smart-contract auditor: it runs a multi-agent audit pass over a contract and returns findings with
        reproductions. The on-site <span className="text-content-primary">/audit</span> console is a fast deterministic
        pre-screen; KTHULHU is the deeper autonomous system — live, with credit billing and a REST API + MCP.
      </p>

      {showLiveFrame ? (
        // Live embed of the real product (renders where kthulhu.co allows the framing origin).
        <div className="relative mt-4 aspect-video overflow-hidden rounded-md border border-hairline bg-void">
          {status === 'loading' && (
            <p role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center text-sm text-content-muted">
              Loading the live product…
            </p>
          )}
          <iframe
            title="KTHULHU — autonomous smart-contract auditor"
            src={url}
            sandbox={SANDBOX}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={onLoad}
            className="h-full w-full"
          />
        </div>
      ) : (
        // Fallback: the recorded walkthrough (flag off, or the framing origin isn't allow-listed).
        <div className="mt-4 rounded-md border border-hairline bg-void/60 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-label text-caution">Recorded walkthrough</p>
            {WALKTHROUGH?.capturedAt && (
              <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">{WALKTHROUGH.capturedAt}</p>
            )}
          </div>
          <div className="space-y-2">
            {frames.map((f, i) => (
              <p key={i} className="whitespace-pre-line text-sm text-content-secondary">
                {f.response}
              </p>
            ))}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Open the live KTHULHU ↗
          </a>
        </div>
      )}
    </section>
  )
}
