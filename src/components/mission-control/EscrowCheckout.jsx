/*
 * jw3b.dev v2 — EscrowCheckout (P2-04 · FR-033/FR-035)  ·  app-ui-engineer / full-stack-integrator
 * The high-ticket on-chain rail: fund a MilestoneEscrow agreement in USDC on Base via
 * Simulate → Write → Wait. It renders the full product-state set (connect / wrong-chain /
 * simulating / ready / signing / pending / funded / error) and, whenever the rail is not
 * live or a step fails, drops to the guaranteed book-a-call floor — never a dead-end
 * (SC-1/SC-2). Every on-chain surface carries the honest testnet/mainnet label (BR-09).
 * Semantic tokens only. Screen + wiring only — the contract + its ABI belong upstream.
 */
import { useEffect } from 'react'
import { PROVIDER_WALLET, ESCROW } from '../../config/contracts.js'
import { useEscrow } from '../../hooks/useEscrow.js'
import ConnectButton from '../wallet/ConnectButton.jsx'
import SwitchChainButton from '../wallet/SwitchChainButton.jsx'
import BookACall from './BookACall.jsx'

// Honest network chip — TESTNET amber, MAINNET cyan, anything else red (BR-09).
function FundsBadge({ funds }) {
  const tone = funds.isTestnet
    ? 'text-caution border-caution/40'
    : funds.movesRealFunds
      ? 'text-cyan border-cyan/40'
      : 'text-failed border-failed/40'
  return (
    <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label ${tone}`}>
      {funds.label}
    </span>
  )
}

// The honest floor, reused whenever escrow can't (or shouldn't) proceed.
function Floor({ selection, loadout, onBack, note }) {
  return (
    <div>
      {note ? <p className="mb-4 text-sm text-content-secondary">{note}</p> : null}
      <BookACall selection={selection} loadout={loadout} onBack={onBack} />
    </div>
  )
}

export default function EscrowCheckout({ selection, loadout, onBack = () => {} }) {
  const escrow = useEscrow({
    selection,
    provider: PROVIDER_WALLET,
    amountUsdc: loadout?.tier?.price ?? null,
  })
  const { phase, reason, degrade, funds, fund, approve, recordEngagement, txHash } = escrow

  // Record the engagement exactly once, when the receipt confirms (route=escrow → D1).
  useEffect(() => {
    if (phase === 'funded') recordEngagement()
  }, [phase, recordEngagement])

  // Not live yet, or a step failed → the guaranteed floor, with an honest one-line reason.
  if (degrade) {
    const note =
      phase === 'unprovisioned'
        ? 'On-chain escrow isn’t live yet — book a call and John will set up the engagement directly.'
        : phase === 'blocked'
          ? `The escrow transaction can’t proceed: ${reason}. You can still book a call below.`
          : `Something went wrong on-chain${reason ? ` (${reason})` : ''}. Book a call and we’ll sort it out.`
    return <Floor selection={selection} loadout={loadout} onBack={onBack} note={note} />
  }

  return (
    <section aria-labelledby="escrow-title" className="rounded-lg border border-hairline bg-panel p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 id="escrow-title" className="font-display text-lg font-semibold text-content-primary">
          Fund in escrow
        </h3>
        <FundsBadge funds={funds} />
      </header>

      {phase === 'disconnected' && (
        <div className="space-y-3">
          <p className="text-sm text-content-secondary">Connect a wallet to fund the milestone escrow in USDC.</p>
          <ConnectButton />
        </div>
      )}

      {phase === 'wrong-chain' && <SwitchChainButton chainId={ESCROW.chainId} />}

      {phase === 'simulating' && (
        <p role="status" aria-live="polite" className="text-sm text-content-secondary">
          Checking the transaction…
        </p>
      )}

      {/* ERC-20 allowance gate (P5 audit fix): fund() moves the client's USDC via
          safeTransferFrom, so the escrow must be approved first. Before this existed the
          simulation always reverted and the rail silently dropped to book-a-call. */}
      {phase === 'checking-allowance' && (
        <p role="status" aria-live="polite" className="text-sm text-content-secondary">
          Checking your USDC allowance…
        </p>
      )}

      {phase === 'needs-approval' && (
        <div className="space-y-3">
          <p className="text-sm text-content-secondary">
            One-time step: approve the escrow to move the USDC for this milestone. Approving does
            not send anything — the funding transaction is a separate confirmation.
          </p>
          <button
            type="button"
            onClick={approve}
            className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Approve USDC
          </button>
        </div>
      )}

      {phase === 'approving' && (
        <p role="status" aria-live="polite" className="text-sm text-content-secondary">
          Approval submitted — waiting for it to confirm, then you can fund.
        </p>
      )}

      {phase === 'ready' && (
        <div className="space-y-3">
          <p className="text-sm text-content-secondary">Simulation passed. Confirm to fund the escrow in USDC on {funds.label.toLowerCase()}.</p>
          <button
            type="button"
            onClick={fund}
            className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Fund escrow
          </button>
        </div>
      )}

      {phase === 'signing' && (
        <p role="status" aria-live="polite" className="text-sm text-content-secondary">
          Confirm the transaction in your wallet…
        </p>
      )}

      {phase === 'pending' && (
        <p role="status" aria-live="polite" className="text-sm text-content-secondary">
          Funding — waiting for on-chain confirmation…
        </p>
      )}

      {phase === 'funded' && (
        <div className="space-y-2">
          <p className="text-sm text-verified">Escrow funded. John is notified and will kick off milestone one.</p>
          {txHash ? <p className="break-all font-mono text-[11px] text-content-muted">tx: {txHash}</p> : null}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary"
      >
        ← Back
      </button>
    </section>
  )
}
