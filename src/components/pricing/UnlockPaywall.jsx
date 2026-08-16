/*
 * jw3b.dev v2 — UnlockPaywall (P2-05 · FR-034/FR-041)  ·  full-stack-integrator
 * The Unlock Protocol membership rail. FR-034: it appears ONLY when a real lock is
 * provisioned for this offer — otherwise it hides and hands the visitor the guaranteed
 * book-a-call floor (never a dead paywall). FR-041: checkout runs through
 * `window.unlockProtocol`, whose script is loaded on demand (not on every page — the rail
 * is off by default, so we don't pay for a third-party script until it's actually offered).
 * Semantic tokens only. Screen + wiring; the lock lives on-chain, prices never invented here.
 */
import { useEffect, useState } from 'react'
import { isEnabled } from '../../config/features.js'
import { unlockLockFor } from '../../config/contracts.js'
import { unlockOfferable, unlockCheckoutConfig, isUnlockedEvent, UNLOCK_SCRIPT_SRC } from '../../lib/unlockPaywall.js'
import BookACall from '../mission-control/BookACall.jsx'

// Inject the Unlock paywall script once, on demand. Safe in tests/SSR (guards document).
function ensureUnlockScript() {
  if (typeof document === 'undefined') return
  if (window.unlockProtocol || document.querySelector(`script[src="${UNLOCK_SCRIPT_SRC}"]`)) return
  const s = document.createElement('script')
  s.src = UNLOCK_SCRIPT_SRC
  s.async = true
  document.head.appendChild(s)
}

export default function UnlockPaywall({ lockKey, title, selection, loadout, onBack = () => {} }) {
  const lock = unlockLockFor(lockKey)
  const offerable = unlockOfferable({ enabled: isEnabled('unlock'), lock })
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (!offerable || typeof window === 'undefined') return
    ensureUnlockScript()
    const onState = (e) => setUnlocked(isUnlockedEvent(e.detail))
    window.addEventListener('unlockProtocol', onState)
    return () => window.removeEventListener('unlockProtocol', onState)
  }, [offerable])

  // FR-034: no real lock → hide the paywall, offer the floor instead.
  if (!offerable) {
    return (
      <div>
        <p className="mb-4 text-sm text-content-secondary">
          Membership checkout isn’t live yet — book a call and John will set you up directly.
        </p>
        <BookACall selection={selection} loadout={loadout} onBack={onBack} />
      </div>
    )
  }

  if (unlocked) {
    return (
      <section className="rounded-lg border border-hairline bg-panel p-6">
        <p className="text-sm text-verified">Membership active — you’re in. John will be in touch.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="unlock-title" className="rounded-lg border border-hairline bg-panel p-6">
      <h3 id="unlock-title" className="mb-2 font-display text-lg font-semibold text-content-primary">
        {title || 'Unlock membership'}
      </h3>
      <p className="mb-4 text-sm text-content-secondary">
        Purchase the membership on-chain — the terms and price live in the lock, not here.
      </p>
      <button
        type="button"
        onClick={() => window.unlockProtocol?.loadCheckoutModal(unlockCheckoutConfig(lock, { title }))}
        className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        Unlock membership
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 block font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary"
      >
        ← Back
      </button>
    </section>
  )
}
