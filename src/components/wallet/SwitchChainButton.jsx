/*
 * jw3b.dev v2 — targeted chain switch (P5 fix · FR-042/BR-09)  ·  web3-blockchain
 *
 * WHY THIS EXISTS: the wrong-chain states used to render the generic <ConnectButton />, whose
 * chain menu lists every supported chain. Base MAINNET is first in that list, so a visitor told
 * "switch to Base Sepolia" would tap the obvious entry and land on mainnet — still the wrong
 * network, with the surface unchanged and no explanation. Owner-reported on the live CTF.
 *
 * This switches to EXACTLY the chain the surface requires, and takes its label from `chainMeta`
 * rather than hardcoded copy — the same drift that left the escrow prompt saying "Base" after
 * that rail moved to Base Sepolia. One source of truth for the chain's name and testnet status.
 *
 * Every failure is handled: a rejected or unsupported switch keeps the visitor on the surface
 * with an honest message and the wallet's own network menu as the fallback, never a dead end.
 */
import { useSwitchChain } from 'wagmi'
import { chainMeta } from '../../config/wagmi'
import ConnectButton from './ConnectButton.jsx'

export default function SwitchChainButton({ chainId }) {
  const { switchChain, isPending, error } = useSwitchChain()
  const meta = chainMeta(chainId)

  return (
    <div className="space-y-3">
      <p className="text-sm text-caution">
        This runs on <span className="font-mono text-content-primary">{meta.label}</span>.{' '}
        {meta.fundsWarning}
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={() => switchChain?.({ chainId })}
        className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        {isPending ? 'Confirm in your wallet…' : `Switch to ${meta.label}`}
      </button>

      {error && (
        <p role="alert" className="text-sm text-failed">
          Your wallet didn’t switch networks — approve the prompt, or pick{' '}
          <span className="font-mono">{meta.label}</span> from the network menu below.
        </p>
      )}

      {/* Kept as the escape hatch: if the programmatic switch is rejected or the wallet can't
          add the chain, the visitor still has the wallet's own network menu. */}
      <ConnectButton />
    </div>
  )
}
