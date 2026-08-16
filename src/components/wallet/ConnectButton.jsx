import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { chainMeta } from '../../config/wagmi'

/*
 * Custom wallet connect button (P0-09, FR-040/FR-042).
 * Built on RainbowKit's headless `ConnectButton.Custom` so every state is our own
 * flat cyan engineered-panel UI (no RainbowKit chrome), and every network is
 * labelled honestly — a Base Sepolia demo can never masquerade as real value (BR-09).
 *
 * States covered:
 *   • loading            → nothing (avoids hydration flash)
 *   • disconnected       → "Connect wallet"
 *   • wrong network      → "Wrong network" (caution) → chain modal
 *   • connected          → [network badge · chain] + [address · account modal]
 */

const baseBtn =
  'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ' +
  'transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-void'

function NetworkBadge({ meta }) {
  // TESTNET = caution amber; MAINNET = cyan; UNSUPPORTED = failed red.
  const tone = meta.isTestnet
    ? 'text-caution border-caution/40'
    : meta.network === 'MAINNET'
      ? 'text-cyan border-cyan/40'
      : 'text-failed border-failed/40'
  return (
    <span
      className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}
      title={meta.fundsWarning}
    >
      {meta.network}
    </span>
  )
}

export default function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (authenticationStatus === undefined || authenticationStatus === 'authenticated')

        return (
          <div
            aria-hidden={!ready}
            className={ready ? '' : 'pointer-events-none select-none opacity-0'}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className={`${baseBtn} border-cyan/50 bg-raised text-cyan hover:bg-panel hover:border-cyan`}
                  >
                    Connect wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    onClick={openChainModal}
                    className={`${baseBtn} border-failed/50 bg-raised text-failed hover:border-failed`}
                  >
                    Wrong network
                  </button>
                )
              }

              const meta = chainMeta(chain.id)
              return (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openChainModal}
                    className={`${baseBtn} border-hairline bg-panel text-content-secondary hover:border-cyan/40 hover:text-content-primary`}
                  >
                    <NetworkBadge meta={meta} />
                    <span>{chain.name || meta.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className={`${baseBtn} border-hairline bg-panel text-content-primary hover:border-cyan/40`}
                  >
                    <span className="font-mono tabular-nums">{account.displayName}</span>
                    {account.displayBalance ? (
                      <span className="font-mono text-content-muted">{account.displayBalance}</span>
                    ) : null}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
