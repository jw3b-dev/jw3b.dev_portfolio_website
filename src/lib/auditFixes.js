/*
 * jw3b.dev v2 — deterministic remediations (ADR-P5-02 · W-2)  ·  audit-heuristics-engineer
 *
 * PURE. Each detector in auditHeuristics.js already knows the shape it matched and the documented
 * remediation for it; this expresses that remediation as a function of the source so the console
 * can OFFER it. Source in → source out, same input always the same output.
 *
 * The honesty rules this module is built around (ADR-P5-02 §3/§5):
 *
 *   1. A fix is RULE-DERIVED, never model-derived. Nothing here parses the AI narrative. What is
 *      applied to a visitor's code is a transformation we wrote, tested, and can explain — not
 *      text a model produced about their contract.
 *   2. A fix is never claimed to work. `applyFixAndVerify` applies it and then RE-SCREENS the
 *      result with the real detector, so the console reports whether the finding actually cleared.
 *      A fix that fails to clear its own finding is shown as exactly that. This is the site's own
 *      thesis — reproduce, don't assert — pointed at itself.
 *   3. Clearing a finding is not safety. It means one pattern no longer matches. The console's
 *      AUDIT_DISCLAIMER still governs; a cleared screen is not an audit.
 *   4. If a fix cannot be expressed SAFELY for a given source, it is not offered at all. A missing
 *      button is honest; a button that mangles someone's contract is not.
 */
import { auditSolidity } from './auditHeuristics.js'

/** Identifiers always in scope in Solidity — never evidence that a value was computed earlier. */
const GLOBALS = new Set(['msg', 'block', 'tx', 'this', 'address', 'type', 'super', 'now', 'uint256', 'uint', 'int', 'bool'])

const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/g

// The balance write the reentrancy detector looks for, as a whole statement line.
const BALANCE_WRITE_LINE = /^(\s*)(balances?\s*\[[^\]]*\]\s*)(=|-=)\s*([^;]+);\s*$/
const CALL_LINE = /\.call\s*\{[^}]*value\s*:/

/**
 * Can this statement move ABOVE the external call without breaking? Only if every identifier it
 * reads is already available there — a right-hand side computed AFTER the call cannot be hoisted
 * over it, and guessing would produce code that doesn't compile.
 */
function rhsIsHoistable(rhs, linesBeforeCall) {
  const trimmed = rhs.trim()
  if (/^\d+$/.test(trimmed)) return true // a literal (the classic `= 0`) is always safe
  const before = linesBeforeCall.join('\n')
  const idents = trimmed.match(IDENT) || []
  return idents.every((id) => GLOBALS.has(id) || new RegExp(`\\b${id}\\b`).test(before))
}

/**
 * Reentrancy → checks-effects-interactions: move the balance write above the value-bearing call.
 * Not offered when the write can't be hoisted (see rhsIsHoistable) or isn't a simple statement.
 */
function fixReentrancy(source) {
  const lines = source.split('\n')
  const callIdx = lines.findIndex((l) => CALL_LINE.test(l))
  if (callIdx === -1) return null

  // The state write the detector complained about: the first balance assignment AFTER the call.
  const writeIdx = lines.findIndex((l, i) => i > callIdx && BALANCE_WRITE_LINE.test(l))
  if (writeIdx === -1) return null

  const m = lines[writeIdx].match(BALANCE_WRITE_LINE)
  if (!rhsIsHoistable(m[4], lines.slice(0, callIdx))) return null

  const moved = lines[writeIdx]
  const out = lines.filter((_, i) => i !== writeIdx)
  out.splice(callIdx, 0, moved)
  return out.join('\n')
}

/** tx.origin → msg.sender: authorize the immediate caller, which cannot be phished through a hop. */
function fixTxOrigin(source) {
  return source.replace(/\btx\.origin\b/g, 'msg.sender')
}

/**
 * Floating pragma → pinned. Only for a SINGLE constraint (`^0.8.20`, `>=0.8.20`), where the
 * concrete version is unambiguous. A compound range (`>=0.8.0 <0.9.0`) has no single right answer,
 * so no fix is offered rather than one that silently narrows what the author intended.
 */
function fixFloatingPragma(source) {
  const m = source.match(/pragma\s+solidity\s+([^;]+);/)
  if (!m) return null
  const spec = m[1].trim()
  const single = spec.match(/^[\^>]=?\s*(\d+\.\d+\.\d+)$/)
  if (!single) return null
  return source.replace(m[0], `pragma solidity ${single[1]};`)
}

/**
 * The remediation catalogue, keyed by detector id. `label` is the button; `description` is what
 * the change actually does, in the same voice as the finding that raised it.
 */
export const FIXES = Object.freeze({
  reentrancy: {
    id: 'fix-reentrancy',
    label: 'Apply checks-effects-interactions',
    description: 'Moves the balance write above the external call, so a re-entrant caller finds an already-settled balance.',
    build: fixReentrancy,
  },
  'tx-origin': {
    id: 'fix-tx-origin',
    label: 'Authorize on msg.sender',
    description: 'Replaces every tx.origin with msg.sender, so an intermediary contract cannot pass the check on the victim’s behalf.',
    build: fixTxOrigin,
  },
  'floating-pragma': {
    id: 'fix-floating-pragma',
    label: 'Pin the compiler version',
    description: 'Drops the floating range so production builds are reproducible on one compiler.',
    build: fixFloatingPragma,
  },
})

/**
 * The fixes actually offerable for this screen of this source.
 * One fix per FINDING TYPE, not per finding — three tx.origin hits are one remediation. A fix
 * whose transformation is a no-op or unsafe here is omitted entirely (honesty rule 4).
 *
 * @returns {Array<{id,findingId,label,description,apply:(src:string)=>string}>}
 */
export function fixesFor(findings, source) {
  const src = String(source || '')
  const seen = new Set()
  const out = []
  for (const f of Array.isArray(findings) ? findings : []) {
    const spec = FIXES[f?.id]
    if (!spec || seen.has(f.id)) continue
    seen.add(f.id)
    const next = spec.build(src)
    if (typeof next !== 'string' || next === src) continue // unsafe or no-op → not offered
    out.push({
      id: spec.id,
      findingId: f.id,
      label: spec.label,
      description: spec.description,
      apply: (s) => {
        const applied = spec.build(String(s || ''))
        return typeof applied === 'string' ? applied : String(s || '')
      },
    })
  }
  return out
}

/**
 * Apply a fix and RE-SCREEN the result — the single place the "did it actually clear?" question
 * is answered, so no caller can accidentally assert success (honesty rule 2).
 *
 * @returns {{source:string, changed:boolean, cleared:boolean, before:number, after:number}}
 *   `cleared` = the finding this fix targets no longer matches. It does NOT mean the contract is
 *   safe; it means one pattern stopped matching.
 */
export function applyFixAndVerify(fix, source) {
  const src = String(source || '')
  if (!fix || typeof fix.apply !== 'function') {
    return { source: src, changed: false, cleared: false, before: 0, after: 0 }
  }
  const next = fix.apply(src)
  const countOf = (s) => auditSolidity(s).findings.filter((f) => f.id === fix.findingId).length
  const before = countOf(src)
  const after = countOf(next)
  return { source: next, changed: next !== src, cleared: after === 0 && before > 0, before, after }
}
