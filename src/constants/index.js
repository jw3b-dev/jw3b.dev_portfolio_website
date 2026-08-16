/*
 * jw3b.dev v2 — site constants (single source of site copy/structure).
 * HATS is the canonical four-hat identity (FR-003 / BR-07): one operator, four hats,
 * always shown TOGETHER — filters may DIM a hat, never hide it. Copy is deliberately
 * digit-free; every number lives behind <Claim> (claims gate), so the delivery-record
 * anchors (P1-14, FR-060) carry the counts, not this identity strip.
 * Hat colours reference the per-hat token accents (tokens.css §4).
 */

// Site identity for branded SEO (FR-053 / NFR-06). Branded-search targets: "John Wellard",
// "jw3b", "AgileGypsy". The OG image asset is deferred (pairs with the P2-18 structured-data
// + brand OG art); Seo emits og:image only when one is supplied, so unfurls stay valid now.
export const SITE = Object.freeze({
  name: 'JW3B',
  domain: 'https://jw3b.dev',
  author: 'John Wellard',
  brandTitle: 'John Wellard (JW3B / AgileGypsy) — Senior Agentic AI Developer & Smart-Contract Auditor',
  defaultDescription:
    'John Wellard — Senior Agentic AI Developer and smart-contract auditor (JW3B / AgileGypsy). Multi-agent systems that survive production, an operable AI security console, and a proof-first hire path.',
  ogImage: '', // owner-provisioned later (P2-18); empty ⇒ text-only unfurl (still valid)
})

export const HATS = [
  {
    key: 'engineer',
    label: 'Engineer',
    dot: 'bg-hat-engineer',
    text: 'text-hat-engineer',
    ring: 'hat-engineer',
    blurb: 'Ships agentic AI end-to-end — multi-agent pipelines, graph retrieval, edge RAG.',
  },
  {
    key: 'auditor',
    label: 'Auditor',
    dot: 'bg-hat-auditor',
    text: 'text-hat-auditor',
    ring: 'hat-auditor',
    blurb: 'Autonomous smart-contract auditing, backed by a competitive audit record.',
  },
  {
    key: 'pm',
    label: 'PM',
    dot: 'bg-hat-pm',
    text: 'text-hat-pm',
    ring: 'hat-pm',
    blurb: 'Long-horizon delivery across borders — scope it, size it honestly, name the risks.',
  },
  {
    key: 'founder',
    label: 'Founder',
    dot: 'bg-hat-founder',
    text: 'text-hat-founder',
    ring: 'hat-founder',
    blurb: 'AgileGypsy Labs — live products with paying users, not slideware.',
  },
]
