/*
 * jw3b.dev v2 — Person structured data + studio cross-link (P2-19 · FR-054 · NFR-06)  ·  frontend-engineer
 * schema.org Person JSON-LD for branded/entity search, plus the studio↔person cross-link:
 * a `rel=me` to agilegypsy.com and `sameAs` links. The CodeHawks profile URL is sourced
 * from the evidence register (the same pointer <CodeHawksLink> uses), so the record is deep-linked
 * from a SECOND surface — completing the FR-044 target. No numeric claim is asserted here (the
 * numbers live in the gated <Claim> surfaces); this is identity + verifiable links only.
 */
import { Helmet } from 'react-helmet-async'
import { SITE } from '../../constants/index.js'
import { getClaim } from '../../lib/claimsRegister.js'

// John's studio (AgileGypsy Labs) — the person↔studio cross-link.
export const STUDIO_URL = 'https://agilegypsy.com'

// The CodeHawks/Cyfrin profile — read from the register so it can't drift from <CodeHawksLink>.
export const CODEHAWKS_URL = getClaim('codehawks-rank')?.evidence_pointer || 'https://profiles.cyfrin.io/u/agilegypsy'

export const PERSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.author,
  alternateName: 'JW3B / AgileGypsy',
  jobTitle: 'Senior Agentic AI Developer & Smart-Contract Auditor',
  url: SITE.domain,
  worksFor: { '@type': 'Organization', name: 'AgileGypsy', url: STUDIO_URL },
  sameAs: [STUDIO_URL, CODEHAWKS_URL],
}

// WebSite entity so the brand terms ("jw3b", "AgileGypsy") resolve to this site in branded
// search (SC-5). Identity only — name/alternates/url; NO SearchAction (the site has no
// site-search endpoint, and a schema'd search box that doesn't exist would be a false claim).
export const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  alternateName: ['JW3B', 'AgileGypsy', 'John Wellard'],
  url: SITE.domain,
}

export default function PersonJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(PERSON_LD)}</script>
      <script type="application/ld+json">{JSON.stringify(WEBSITE_LD)}</script>
      <link rel="me" href={STUDIO_URL} />
    </Helmet>
  )
}
