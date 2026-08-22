/*
 * /ctf — a learning path, not only a competition  ·  app-ui-engineer  (brief 06, next-need 2)
 *
 * The CTF served one audience: people racing for a rank. A visitor who wanted to UNDERSTAND
 * reentrancy — which is most of the people a security portfolio is for — got a contract, an
 * address and a leaderboard, and had to already know what they were looking at.
 *
 * Progressive hints, revealed one at a time on purpose. Showing all three at once is a solution;
 * showing them in order is a lesson. Each hint points at a LINE of the vault above rather than
 * explaining reentrancy in the abstract, so the reader is looking at real code the whole time.
 *
 * Nothing here is hidden behind a wallet. Learning is pre-wallet, like the brief.
 */
import { useState } from 'react'

export const HINTS = Object.freeze([
  {
    title: 'Where does the money leave?',
    body: 'Find the line that sends ETH. It is a low-level call to msg.sender — and msg.sender can be a contract, which means it can run code when it receives funds.',
  },
  {
    title: 'What is still true at that moment?',
    body: 'When the call fires, balances[msg.sender] has NOT been zeroed yet — that happens on the line after. So from inside the receiving contract, the vault still believes you are owed the full amount.',
  },
  {
    title: 'So what does an attacker do?',
    body: 'From the receive() of their contract, call withdraw() again before the first call returns. The balance check passes again, the vault pays again, and it repeats until the vault is empty. The fix is one line moved: zero the balance BEFORE the call — checks, effects, then interactions.',
  },
])

export default function LearningPath() {
  const [revealed, setRevealed] = useState(0)

  return (
    <section aria-labelledby="ctf-learn" className="mt-5 border-t border-hairline pt-4">
      <h3 id="ctf-learn" className="font-mono text-[10px] uppercase tracking-label text-content-muted">
        Want to understand it first?
      </h3>
      <p className="mt-1 text-sm text-content-secondary">
        Three hints, one at a time. Each points at a line in the vault above. No wallet needed.
      </p>

      <ol className="mt-3 flex flex-col gap-3">
        {HINTS.slice(0, revealed).map((h, i) => (
          <li key={h.title} className="border-l-2 border-cyan/40 pl-3">
            <p className="font-mono text-[10px] uppercase tracking-label text-cyan">
              Hint {i + 1} · {h.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-content-secondary">{h.body}</p>
          </li>
        ))}
      </ol>

      {revealed < HINTS.length ? (
        <button
          type="button"
          onClick={() => setRevealed((n) => n + 1)}
          className="mt-3 rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          {revealed === 0 ? 'Show the first hint' : `Show hint ${revealed + 1} of ${HINTS.length}`}
        </button>
      ) : (
        <p className="mt-3 text-xs text-content-muted">
          That is the whole exploit. The recorded solve below shows it executed; the instant screen
          on <a href="/audit" className="text-cyan underline">/audit</a> flags this exact pattern.
        </p>
      )}
    </section>
  )
}
