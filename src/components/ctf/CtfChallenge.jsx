/*
 * jw3b.dev v2 — CtfChallenge (P2-09 · FR-022/023/024/026)  ·  app-ui-engineer
 * The live Capture-the-Vault console. Renders the full state machine (connect → switch-chain
 * → deploy Attacker → drain → verify → rank) with the testnet label on EVERY surface
 * (FR-024). Any unprovisioned/failed step degrades honestly — an unreachable Worker shows a
 * labelled recorded solve (FR-026), never a dead box. Screen + wiring; the contracts and the
 * on-chain verify live upstream (P2-02/P2-08). Semantic tokens only.
 */
import { useEffect } from 'react'
import ChallengeBrief from './ChallengeBrief.jsx'
import { useCtf } from '../../hooks/useCtf.js'
import { CTF_LABEL } from '../../lib/ctfFlow.js'
import ConnectButton from '../wallet/ConnectButton.jsx'
import SwitchChainButton from '../wallet/SwitchChainButton.jsx'
import { CTF } from '../../config/contracts.js'

// FR-024 — the honest testnet banner shown on every CTF surface.
function TestnetBanner() {
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-caution/40 px-2 py-1 font-mono text-[10px] uppercase tracking-label text-caution">
      {CTF_LABEL}
    </p>
  )
}

const primaryBtn =
  'rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

export default function CtfChallenge() {
  const ctf = useCtf()
  const { phase, reason, deploy, attack, runVerify, attackerAddress, rank, txHash } = ctf

  // Auto-verify once the drain tx confirms (the receipt drives the phase into verify).
  useEffect(() => {
    if (txHash) runVerify()
  }, [txHash, runVerify])

  return (
    <section aria-labelledby="ctf-title" className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Capture the Vault</p>
      <h1 id="ctf-title" className="mt-3 font-display text-3xl font-semibold text-content-primary">
        Break the vault. Prove it on-chain.
      </h1>
      <div className="mt-4">
        <TestnetBanner />
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-panel p-6">
        {phase === 'unprovisioned' && (
          <p className="text-sm text-content-secondary">The CTF vault isn’t deployed yet — check back once it’s live on Base Sepolia.</p>
        )}

        {/*
            The brief comes BEFORE the wallet ask. This surface used to be a heading, a testnet
            label, one sentence and a Connect button — it demanded the visitor's wallet before
            telling them what the challenge was, what they'd be attacking, or whether anyone had
            solved it. All of that already existed in the bundle and on the Worker, reachable by
            nobody.
        */}
        {phase === 'disconnected' && (
          <div className="space-y-5">
            <ChallengeBrief />
            <div className="space-y-2 border-t border-hairline pt-4">
              <p className="text-sm text-content-secondary">Ready? Connect a wallet on Base Sepolia to take it on.</p>
              <ConnectButton />
            </div>
          </div>
        )}

        {phase === 'wrong-chain' && <SwitchChainButton chainId={CTF.chainId} />}

        {phase === 'vault-empty' && (
          <p className="text-sm text-content-secondary">The vault has no bounty to drain right now. Check back shortly.</p>
        )}

        {phase === 'ready' && (
          <div className="space-y-3">
            {!attackerAddress ? (
              <>
                <p className="text-sm text-content-secondary">Deploy your own Attacker contract — then drain the vault through the reentrancy.</p>
                <button type="button" onClick={deploy} className={primaryBtn}>Deploy attacker</button>
              </>
            ) : (
              <>
                <p className="text-sm text-content-secondary">Attacker deployed. Drain the vault (seeds a tiny testnet stake, then re-enters).</p>
                <button type="button" onClick={attack} className={primaryBtn}>Drain the vault</button>
              </>
            )}
          </div>
        )}

        {phase === 'deploying' && <p role="status" aria-live="polite" className="text-sm text-content-secondary">Deploying your attacker…</p>}
        {phase === 'attacking' && <p role="status" aria-live="polite" className="text-sm text-content-secondary">Draining the vault…</p>}
        {phase === 'verifying' && <p role="status" aria-live="polite" className="text-sm text-content-secondary">Verifying the drain on-chain…</p>}

        {phase === 'solved' && (
          <p className="text-sm text-verified">Captured — the vault is drained and verified on-chain{rank ? `. You’re #${rank} on the leaderboard.` : '.'}</p>
        )}
        {phase === 'already-solved' && (
          <p className="text-sm text-verified">You’ve already captured this vault{rank ? ` (#${rank}).` : '.'}</p>
        )}

        {phase === 'recorded' && (
          <div className="space-y-1">
            <p className="text-sm text-caution">Live verification is unavailable right now — here’s a recorded solve of the drain.</p>
            <p className="font-mono text-[11px] text-content-muted">Recorded solve · not your live on-chain result</p>
          </div>
        )}

        {phase === 'error' && (
          <p className="text-sm text-failed">Something went wrong{reason ? `: ${reason}` : ''}. You can try again.</p>
        )}
      </div>
    </section>
  )
}
