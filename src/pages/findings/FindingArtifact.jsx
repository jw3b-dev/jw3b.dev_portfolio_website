/*
 * /findings/:slug — one published audit finding  ·  frontend-engineer
 *
 * The strongest single piece of proof on this site, and the one that took the longest to find.
 *
 * The record's only public receipt broke — profiles.cyfrin.io now shows "Unranked · High 0 Med 0
 * Low 0" to a logged-out visitor (mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md) — so the rank
 * became a number a reader has to take on trust. This page is the opposite of that: the actual
 * audit, in John's own words, as Cyfrin published it.
 *
 * WHAT MAKES IT PUBLISHABLE. CodeHawks credits every researcher who validly reports a finding and
 * then publishes ONE write-up as canonical. For this finding, out of 24 reporters, the selected
 * submission is John's. `findingArtifacts.publishable()` enforces that rule in code — a markdown
 * file for a finding he did not author will not render, because PORTFOLIO_REFERENCE §1b once
 * asserted the opposite and nearly put two other researchers' work on this site under his name.
 *
 * Prose is VERBATIM from Cyfrin's report; everything around it (contest, finding id, severity,
 * who was selected) comes from the register-backed data module, never from the markdown — so the
 * write-up cannot describe itself as something it is not.
 */
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import Seo from '../../components/seo/Seo.jsx'
import Claim from '../../components/Claim.jsx'
import { parseMarkdown } from '../../lib/markdown.js'
import { ARTIFACTS } from '../../lib/findingArtifactsIndex.js'

const SEVERITY_TONE = { High: 'text-failed', Medium: 'text-caution', Low: 'text-content-muted' }

function Block({ block }) {
  switch (block.type) {
    case 'h1':
    case 'h2':
      return <h2 className="mt-8 font-display text-lg font-semibold text-content-primary">{block.text}</h2>
    case 'h3':
      return (
        <h3 className="mt-6 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan">
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-content-secondary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'code':
      // Wide source must scroll inside its own box — the page itself never scrolls sideways.
      return (
        <div className="mt-3 overflow-x-auto rounded-md border border-hairline bg-void">
          {block.lang && (
            <p className="border-b border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-content-muted">
              {block.lang}
            </p>
          )}
          <pre className="p-3 text-[12px] leading-relaxed text-content-secondary">
            <code>{block.text}</code>
          </pre>
        </div>
      )
    default:
      return <p className="mt-3 max-w-prose text-sm leading-relaxed text-content-secondary">{block.text}</p>
  }
}

export default function FindingArtifact() {
  const { slug } = useParams()
  const artifact = ARTIFACTS.find((a) => a.slug === slug)

  if (!artifact) {
    return (
      <section aria-labelledby="finding-title" className="mx-auto max-w-3xl px-6 py-16">
        <Seo title="Finding not found" description="That published finding does not exist." />
        <h1 id="finding-title" className="font-display text-2xl font-semibold text-content-primary">Finding not found</h1>
        <p className="mt-3 text-sm text-content-secondary">
          That finding is not published here.{' '}
          <Link to="/work" className="text-cyan underline">See the audit record</Link>.
        </p>
      </section>
    )
  }

  const { contest, finding, body } = artifact
  const blocks = parseMarkdown(body)
  const contestUrl = `https://codehawks.cyfrin.io/c/${contest.slug}`

  return (
    <section aria-labelledby="finding-title" className="mx-auto max-w-3xl px-6 py-16">
      <Seo
        title={`${finding.id} · ${finding.title}`}
        description={`A ${finding.severity}-severity finding from CodeHawks First Flight #${contest.flight} (${contest.name}), published by Cyfrin as the selected submission.`}
      />
      <Helmet>
        {/* Not indexed as original scholarship: it is a contest submission republished with its
            provenance. The canonical record is Cyfrin's. */}
        <link rel="canonical" href={contestUrl} />
      </Helmet>

      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">
        Published audit finding
      </p>
      <h1 id="finding-title" className="mt-2 font-display text-2xl font-semibold text-content-primary">
        {finding.id} — {finding.title}
      </h1>

      <div className="mt-4 rounded-md border border-cyan/30 bg-void p-4">
        <p className="text-sm text-content-secondary">
          <span className={`font-mono text-[11px] uppercase tracking-label ${SEVERITY_TONE[finding.severity]}`}>
            {finding.severity} severity
          </span>
          <span className="mx-2 text-content-muted">·</span>
          CodeHawks{' '}
          <span className="text-content-primary">
            First Flight #{contest.flight} · {contest.name}
          </span>
          , {contest.ended}.
        </p>
        <p className="mt-2 text-sm text-content-secondary">
          Cyfrin credits every researcher who validly reports a finding and publishes one write-up
          as the canonical version. For this finding that is{' '}
          <span className="text-content-primary">John&rsquo;s</span> — the text below is his
          submission exactly as it appears in the official contest report.{' '}
          <Claim id="codehawks-selected-writeup" />.
        </p>
        <p className="mt-2 text-[13px] text-content-muted">
          Severity is Cyfrin&rsquo;s classification, not the submitter&rsquo;s: this was filed as a
          Medium and published as a Low.
        </p>
        <a
          href={contestUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-block font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          The contest on CodeHawks ↗
        </a>
      </div>

      <article className="mt-8">
        {blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      <p className="mt-10 border-t border-hairline pt-4 text-[13px] text-content-muted">
        One finding from a competitive audit, reproduced with its provenance. The rest of the record
        is on <Link to="/work" className="text-cyan underline">the work page</Link>; the live
        screening console is at <Link to="/audit" className="text-cyan underline">/audit</Link>.
      </p>
    </section>
  )
}
