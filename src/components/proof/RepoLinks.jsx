/*
 * jw3b.dev v2 — GitHub ↔ site reinforcement (P3-07 · FR-056)  ·  frontend-engineer
 * Real, PUBLIC repos linked from the flagship surface so a skeptical reader can leave the
 * marketing site and inspect actual code. Claims discipline applies to links too: every href
 * here was verified to resolve publicly (2026-08-17) — a 404 on a "proof" link is an
 * anti-proof — and the closed-source status of the commercial flagships is stated, not hidden.
 * No `bets`/DecentX (forbidden list). Semantic tokens only.
 */

const GITHUB_PROFILE = 'https://github.com/jw3b-dev'

// Each blurb sticks to what the destination itself shows (repo descriptions/contents) —
// no unsourced numbers, nothing the click-through wouldn't confirm.
const REPOS = [
  {
    name: 'solidity-audits',
    href: `${GITHUB_PROFILE}/solidity-audits`,
    blurb: 'Smart-contract security audits and competitive findings — the audit practice, in the open.',
  },
  {
    name: 'jw3b.dev_portfolio_website',
    href: `${GITHUB_PROFILE}/jw3b.dev_portfolio_website`,
    blurb: 'This site’s own source — the console you are using right now, inspectable commit by commit.',
  },
  {
    name: 'development_agent',
    href: `${GITHUB_PROFILE}/development_agent`,
    blurb: 'The agentic Web3 development platform — multi-agent engineering tooling in public.',
  },
  {
    name: 'cyfrin-updraft-track',
    href: `${GITHUB_PROFILE}/cyfrin-updraft-track`,
    blurb: 'Structured progress through the Cyfrin Updraft security curriculum — the training record.',
  },
]

export default function RepoLinks() {
  return (
    <section aria-labelledby="repo-links-title" className="mt-10 rounded-lg border border-hairline bg-panel p-5">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Verify for yourself</p>
      <h2 id="repo-links-title" className="mt-1 font-display text-lg font-semibold text-content-primary">
        The code that is public
      </h2>
      <p className="mt-2 text-sm text-content-secondary">
        KTHULHU, Kointel and Overmind are commercial systems — their code is closed; the live systems
        above are their proof. What <em>is</em> public sits on{' '}
        <a
          href={GITHUB_PROFILE}
          target="_blank"
          rel="me noopener noreferrer"
          className="text-cyan underline"
        >
          github.com/jw3b-dev
        </a>
        :
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {REPOS.map((r) => (
          <li key={r.name}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-md border border-hairline bg-raised p-3 motion-safe:transition-colors hover:border-cyan/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
            >
              <span className="font-mono text-sm text-content-primary">{r.name}</span>
              <span className="mt-1 block text-xs text-content-muted">{r.blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
