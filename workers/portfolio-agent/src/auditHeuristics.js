/*
 * jw3b.dev v2 — Solidity heuristics (Worker mirror)  ·  domain-engine (P1-05, FR-008, BR-10)
 * VERBATIM mirror of the detector in src/lib/auditHeuristics.js (the domain owner's engine).
 * The `/audit` route streams these findings FIRST — a deterministic, zero-upstream-dependency
 * severity table that is real even when the AI/Worker upstream is offline (BR-03). This is a
 * pattern-matching first pass, NOT an exploit reproduction: severity labels and recommendations
 * are public security claims, deliberately conservative. A parity test fails CI if this detector
 * drifts from the client mirror. Pure: source string in, findings out.
 */

const SEVERITY_RANK = { high: 3, medium: 2, low: 1, info: 0 }

// How far after a value-bearing external call we look for the balance write that makes it
// reentrant (checks-effects-interactions). ~400 chars ≈ a typical withdraw() body.
const REENTRANCY_LOOKAHEAD = 400

// Plain severity labels (the client mirror carries the Tailwind-styled variant; the Worker
// emits text only). Kept in sync with src/lib/auditHeuristics.js SEVERITY_META labels.
export const SEVERITY_LABEL = { high: 'HIGH', medium: 'MED', low: 'LOW', info: 'INFO' }

// BR-10 — the AI-assisted-first-pass disclaimer streamed with every finding set. Reviewed as a
// public security claim: conservative, no determinism language ("guarantee"/"100%"/"approved").
export const AUDIT_DISCLAIMER =
  'Automated AI-assisted first-pass screen: deterministic heuristics plus a model narrative. ' +
  'It flags common patterns and is not a substitute for a full manual audit; it does not claim ' +
  'to be complete. Reproduced exploits appear only in labelled recorded runs.'

const lineOf = (src, index) => src.slice(0, Math.max(0, index)).split('\n').length

/**
 * Static-analyse a Solidity source string. Mirror of src/lib/auditHeuristics.js.
 * @returns {{ findings: Array<{id,severity,title,line,detail}>, empty: boolean, clean: boolean }}
 */
export function auditSolidity(source) {
  const src = String(source || '')
  const findings = []
  if (!src.trim()) return { findings, empty: true, clean: false }

  // HIGH — reentrancy: value-bearing external call BEFORE the caller's balance is cleared.
  const callRe = /\.call\s*\{[^}]*value\s*:/g
  let m
  while ((m = callRe.exec(src)) !== null) {
    const after = src.slice(m.index, m.index + REENTRANCY_LOOKAHEAD)
    if (/balances?\s*\[[^\]]*\]\s*(?:-=|=)/.test(after)) {
      findings.push({
        id: 'reentrancy',
        severity: 'high',
        title: 'Reentrancy — external call before state update',
        line: lineOf(src, m.index),
        detail:
          'Ether is sent via a low-level call before the sender’s balance is zeroed. The recipient can re-enter and drain the contract. Move the state update above the call (checks-effects-interactions) or add a reentrancy guard.',
      })
    }
  }

  // MEDIUM — tx.origin used for authorization (phishable).
  const originRe = /tx\.origin/g
  while ((m = originRe.exec(src)) !== null) {
    findings.push({
      id: 'tx-origin',
      severity: 'medium',
      title: 'Authorization via tx.origin',
      line: lineOf(src, m.index),
      detail: 'tx.origin can be spoofed through an intermediary contract; authorize on msg.sender.',
    })
  }

  // LOW — floating compiler pragma (non-deterministic bytecode across compilers).
  const pragma = src.match(/pragma\s+solidity\s+([^;]+);/)
  if (pragma && /[\^>]/.test(pragma[1])) {
    findings.push({
      id: 'floating-pragma',
      severity: 'low',
      title: 'Floating pragma',
      line: lineOf(src, src.indexOf('pragma')),
      detail: `Pragma "${pragma[1].trim()}" floats — pin an exact compiler version for production builds.`,
    })
  }

  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.line - b.line)
  return { findings, empty: false, clean: findings.length === 0 }
}

/** Render a finding set as human-readable SSE text (one block, tags never used here). */
export function formatFindingsText(result) {
  if (!result || result.empty) return 'No source provided.'
  if (result.clean) return 'Heuristic pass: no common-pattern issues detected in this first-pass screen.'
  const lines = result.findings.map(
    (f) => `${SEVERITY_LABEL[f.severity] || '?'} · line ${f.line} — ${f.title}\n  ${f.detail}`,
  )
  return `${result.findings.length} finding(s):\n\n${lines.join('\n\n')}`
}
