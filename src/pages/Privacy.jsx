/*
 * /privacy — Privacy notice (P1-20 · FR-057 / NFR-07)  ·  frontend-engineer
 * Renders the FULL real text from the single canonical source (src/content/privacy.md) so the
 * page and the record can never drift. Compliance-officer authored the notice; this page presents
 * it — headings, paragraphs, and lists — in the site's semantic tokens. A legal surface must show
 * its true content, not a stub.
 */
import Seo from '../components/seo/Seo.jsx'
import privacyMd from '../content/privacy.md?raw'
import { parseMarkdown } from '../lib/markdown.js'

const BLOCKS = parseMarkdown(privacyMd)

function Block({ block }) {
  switch (block.type) {
    case 'h1':
      return (
        <h1 id="privacy-title" className="font-display text-2xl font-semibold text-content-primary">
          {block.text}
        </h1>
      )
    case 'h2':
      return (
        <h2 className="mt-6 font-display text-lg font-semibold text-content-primary">{block.text}</h2>
      )
    case 'h3':
      return (
        <h3 className="mt-4 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan">
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-content-secondary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    default:
      return <p className="max-w-prose text-sm leading-relaxed text-content-secondary">{block.text}</p>
  }
}

export default function Privacy() {
  return (
    <section aria-labelledby="privacy-title" className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <Seo
        title="Privacy Notice"
        description="How jw3b.dev handles analytics, connected-wallet data, and engagement-request details."
      />
      <div className="flex flex-col gap-3">
        {BLOCKS.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </section>
  )
}
