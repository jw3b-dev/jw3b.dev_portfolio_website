/*
 * jw3b.dev v2 — Solidity vulnerability corpus (P2-14 · OD-06)  ·  audit-heuristics-engineer
 * PUBLIC smart-contract security knowledge — the source the /audit edge-RAG (Cloudflare
 * Vectorize) is seeded from. Each chunk is well-established, citable vulnerability knowledge;
 * there are NO portfolio stats here (the retrieval-safety guard in auditRag.js additionally
 * filters any that ever leaked into the index, so an ungoverned number can't reach the
 * narrative). This is knowledge for grounding the explanation, never claims about John.
 */
export const VULN_CORPUS = Object.freeze([
  {
    id: 'reentrancy',
    title: 'Reentrancy',
    severity: 'high',
    text: 'A contract that makes an external call before updating its own state can be re-entered by the callee and drained. Apply checks-effects-interactions (write state before the call) and/or a reentrancy guard.',
  },
  {
    id: 'tx-origin',
    title: 'Authorization via tx.origin',
    severity: 'medium',
    text: 'Using tx.origin for authorization lets a malicious intermediary contract phish a privileged user into authorizing an action. Authorize on msg.sender instead.',
  },
  {
    id: 'unchecked-call',
    title: 'Unchecked low-level call',
    severity: 'medium',
    text: 'The boolean return of address.call/send is easy to ignore; a failed transfer then passes silently. Check the returned success flag or use a checked transfer pattern.',
  },
  {
    id: 'access-control',
    title: 'Missing access control',
    severity: 'high',
    text: 'A state-changing or fund-moving function without an owner/role check can be called by anyone. Gate privileged functions with an explicit modifier (e.g. onlyOwner / role check).',
  },
  {
    id: 'integer-overflow',
    title: 'Arithmetic overflow/underflow',
    severity: 'medium',
    text: 'Before Solidity 0.8 arithmetic wraps silently; inside unchecked blocks it still can. Use a checked-math compiler (>=0.8) and reserve unchecked only for provably safe math.',
  },
  {
    id: 'delegatecall',
    title: 'Unsafe delegatecall',
    severity: 'high',
    text: 'delegatecall runs external code against the caller’s storage; an untrusted or upgradeable target can corrupt storage or hijack the contract. Restrict targets and align storage layouts.',
  },
  {
    id: 'oracle-manipulation',
    title: 'Spot-price oracle manipulation',
    severity: 'high',
    text: 'Reading an AMM spot price as an oracle lets a flash-loan attacker move the pool and skew the price within one transaction. Use a manipulation-resistant TWAP or an independent oracle.',
  },
  {
    id: 'floating-pragma',
    title: 'Floating compiler pragma',
    severity: 'low',
    text: 'A caret pragma (^0.8.x) lets production bytecode be built with an unintended compiler version. Pin an exact solc version for deployed contracts.',
  },
])

/** Corpus as {id, text, metadata} records for seeding a vector index. */
export function corpusRecords() {
  return VULN_CORPUS.map((c) => ({ id: c.id, text: c.text, metadata: { title: c.title, severity: c.severity, text: c.text } }))
}
