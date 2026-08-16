/*
 * jw3b.dev v2 — per-route SEO / OpenGraph (P1-15 · FR-053 / NFR-06)  ·  frontend-engineer
 * One Helmet head-block per route: branded <title>, description, canonical, and a complete
 * OpenGraph + Twitter card so the page unfurls correctly and targets branded search
 * ("John Wellard" / "jw3b" / "AgileGypsy"). Person JSON-LD structured data is P2-18 — NOT here.
 * og:image is emitted only when an image is supplied (SITE.ogImage), so the unfurl stays valid
 * as a text card until the brand OG art is provisioned. og:url/canonical derive from the live
 * route via useLocation, so every route gets a correct absolute URL with no per-page wiring.
 */
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { SITE } from '../../constants/index.js'

export default function Seo({ title, description, type = 'website', image = SITE.ogImage }) {
  const { pathname } = useLocation()
  const url = `${SITE.domain}${pathname}`
  // Home passes no title → the full brand title; inner routes get "<page> — JW3B".
  const fullTitle = title ? `${title} — ${SITE.name}` : SITE.brandTitle
  const desc = description || SITE.defaultDescription

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="author" content={SITE.author} />
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
