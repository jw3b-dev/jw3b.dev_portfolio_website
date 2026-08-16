/*
 * jw3b.dev v2 — site constants (single source of site copy/structure).
 * HATS is the canonical four-hat identity (FR-003 / BR-07): one operator, four hats,
 * always shown TOGETHER — filters may DIM a hat, never hide it. Copy is deliberately
 * digit-free; every number lives behind <Claim> (claims gate), so the delivery-record
 * anchors (P1-14, FR-060) carry the counts, not this identity strip.
 * Hat colours reference the per-hat token accents (tokens.css §4).
 */

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
