/*
 * jw3b.dev v2 — the CTF challenge brief (W4 · PRODUCT_AUDIT #19)  ·  app-ui-engineer
 *
 * WHY THIS EXISTS. Before this, /ctf pre-wallet was a heading, a testnet label, one sentence and
 * a Connect button — 42 lines of accessibility tree in total. A visitor was asked to connect a
 * wallet to a page that had not told them what the challenge was, what contract they would be
 * attacking, or whether anyone had ever solved it. That is the wrong order: connecting a wallet
 * is the cost, and the page demanded it before offering any of the value.
 *
 * Everything shown here already existed in the bundle or on the Worker and was reachable by
 * nobody: the vault address (src/config/contracts.js), the leaderboard route
 * (GET /ctf/leaderboard), and a recorded solve artifact. This is not new capability — it is
 * capability that was built and then hidden behind a login wall.
 *
 * Honesty rules: the testnet label rides on every surface (BR-09), and the leaderboard states
 * plainly when it is empty rather than rendering a zero-row table as if it were data.
 */
import { useEffect, useState } from 'react'
import { CTF } from '../../config/contracts.js'
import { AGENT_CTF_LEADERBOARD_URL } from '../../config/worker.js'
import RecordedSolve from './RecordedSolve.jsx'
import LearningPath from './LearningPath.jsx'
import { framingOriginAllowed } from '../../config/embeds.js'

const BASESCAN = 'https://sepolia.basescan.org/address/'

/*
 * The vulnerability, stated as the challenge rather than as a spoiler. It is the same
 * checks-effects-interactions violation the /audit instant screen detects, which is the point:
 * the site's own tools would flag this contract, and here it is deployed and drainable.
 */
const VAULT_SOURCE = `contract ReentrantVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");

        // The external call happens BEFORE the balance is zeroed.
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        balances[msg.sender] = 0;
    }
}`

function Step({ n, children }) {
  return (
    <li className="flex gap-2">
      <span className="font-mono text-[10px] uppercase tracking-label text-cyan">{n}</span>
      <span className="text-sm text-content-secondary">{children}</span>
    </li>
  )
}

/** The leaderboard, read-only and honest about being empty. */
function Leaderboard() {
  const [state, setState] = useState({ status: 'loading', entries: [] })

  useEffect(() => {
    // The Worker's CORS allowlist is production-only (the dev origin rides a secret that is
    // absent everywhere else), so this fetch is blocked by the browser off-production and logged
    // as a console error the page cannot catch. That tripped the E2E console-error budget — the
    // same trap the concierge status ping fell into. Attempt the cross-origin call only where it
    // is permitted, and say plainly why it is absent elsewhere rather than showing a fake error.
    if (!framingOriginAllowed()) {
      setState({ status: 'offsite', entries: [] })
      return undefined
    }
    let live = true
    fetch(AGENT_CTF_LEADERBOARD_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => live && setState({ status: 'ready', entries: Array.isArray(d.entries) ? d.entries : [] }))
      // A leaderboard that cannot load is not a leaderboard of zero — say which it is.
      .catch(() => live && setState({ status: 'error', entries: [] }))
    return () => {
      live = false
    }
  }, [])

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-label text-content-muted">Solves</h3>
      {state.status === 'loading' && <p className="mt-1 text-sm text-content-muted">Loading…</p>}
      {state.status === 'offsite' && (
        <p className="mt-1 text-sm text-content-muted">
          The leaderboard reads from the live Worker — it appears on jw3b.dev.
        </p>
      )}
      {state.status === 'error' && (
        <p className="mt-1 text-sm text-content-muted">
          The leaderboard is unreachable right now — the challenge itself is unaffected.
        </p>
      )}
      {state.status === 'ready' && state.entries.length === 0 && (
        <p className="mt-1 text-sm text-content-muted">
          Nobody has captured it yet. The first verified drain takes the top slot.
        </p>
      )}
      {state.status === 'ready' && state.entries.length > 0 && (
        <ol className="mt-1 space-y-1">
          {state.entries.slice(0, 10).map((e, i) => (
            <li key={e.address || i} className="font-mono text-xs text-content-secondary">
              <span className="text-cyan">#{i + 1}</span> {e.address}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Everything a visitor needs to decide whether to connect a wallet — shown BEFORE asking. */
export default function ChallengeBrief() {
  return (
    <div className="space-y-5">
      <section aria-labelledby="ctf-brief">
        <h2 id="ctf-brief" className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          The challenge
        </h2>
        <p className="mt-2 text-sm text-content-secondary">
          A vault is deployed on Base Sepolia holding testnet ETH. Its <code>withdraw()</code> sends
          Ether before it zeroes your balance, so a contract that re-enters during that call can
          withdraw repeatedly against the same deposit. Drain it and the solve is verified{' '}
          <span className="text-content-primary">on-chain</span> — by reading the vault&rsquo;s
          balance, not by taking your word for it.
        </p>
        <ol className="mt-3 space-y-1.5">
          <Step n="1">Connect a wallet on Base Sepolia (testnet — no real funds, ever).</Step>
          <Step n="2">Deploy the attacker contract; the bytecode ships in this page.</Step>
          <Step n="3">Fund it with a little testnet ETH and fire the attack.</Step>
          <Step n="4">The Worker verifies the drain on-chain and records the solve.</Step>
        </ol>
      </section>

      <section aria-labelledby="ctf-target">
        <h2 id="ctf-target" className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          The target
        </h2>
        <p className="mt-1 text-xs text-content-muted">
          <a
            href={`${BASESCAN}${CTF.vaultAddress}`}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-cyan underline"
          >
            {CTF.vaultAddress}
          </a>{' '}
          — inspect it on BaseScan before you touch it.
        </p>
        <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-hairline bg-void p-3 font-mono text-[11px] text-content-secondary">
          <code>{VAULT_SOURCE}</code>
        </pre>
        <p className="mt-2 text-xs text-content-muted">
          This is the same checks-effects-interactions violation the{' '}
          <a href="/audit" className="text-cyan underline">
            instant screen
          </a>{' '}
          flags — deployed, and drainable.
        </p>
      </section>

      <LearningPath />
      <Leaderboard />
      <RecordedSolve />
    </div>
  )
}
