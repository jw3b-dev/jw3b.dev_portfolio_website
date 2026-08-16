/*
 * jw3b.dev v2 — fast Solidity heuristics (hero console first-pass)  ·  domain-engine
 * The <300ms, fully client-side static pre-screen behind the operable hero (brief 01 key
 * constraint): it returns REAL findings instantly and reliably even if the AI / Worker is
 * offline, so the console is never a dead box (BR-03). It is deliberately NOT KTHULHU — it
 * pattern-matches, it does not reproduce an exploit; the UI labels it as a heuristic pass and
 * reserves "REPRODUCED" for the real recorded run. Pure: source string in, findings out.
 */

const SEVERITY_RANK = { high: 3, medium: 2, low: 1, info: 0 }

// Configurable rule threshold: how far after a value-bearing external call we look for the
// balance write that makes it reentrant (checks-effects-interactions). ~400 chars ≈ the body
// of a typical withdraw(); widen if a rule change demands, but too wide invites false matches.
const REENTRANCY_LOOKAHEAD = 400

export const SEVERITY_META = {
  high: { label: 'HIGH', tone: 'text-failed', dot: 'bg-failed' },
  medium: { label: 'MED', tone: 'text-caution', dot: 'bg-caution' },
  low: { label: 'LOW', tone: 'text-content-secondary', dot: 'bg-content-muted' },
  info: { label: 'INFO', tone: 'text-content-muted', dot: 'bg-content-muted' },
}

const lineOf = (src, index) => src.slice(0, Math.max(0, index)).split('\n').length

/**
 * Static-analyse a Solidity source string.
 * @returns {{ findings: Array<{id,severity,title,line,detail}>, empty: boolean, clean: boolean }}
 */
export function auditSolidity(source) {
  const src = String(source || '')
  const findings = []
  if (!src.trim()) return { findings, empty: true, clean: false }

  // HIGH — reentrancy: value-bearing external call BEFORE the caller's balance is cleared
  // (checks-effects-interactions violated). Match a `.call{value:...}` then a nearby balance write.
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

// The contract the hero console is pre-loaded with — a real, classic reentrancy the
// heuristic reproduces on first paint. Editing it re-runs the pass live.
export const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] = 0;
    }
}
`
