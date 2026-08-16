/*
 * jw3b.dev v2 — Fuzz harness generator (P2-15 · FR-009)  ·  audit-heuristics-engineer
 * PURE, deterministic, offline-safe: pasted Solidity in → a Foundry fuzz-test SKELETON out,
 * same input always the same harness. It scaffolds a `testFuzz_` per state-changing function
 * with `bound()`ed inputs — a STARTING POINT, honestly labelled, never a proof of correctness.
 * The Worker (/fuzz) imports this same generator so the client pre-render and the streamed
 * version can't drift; the model only ENHANCES the deterministic scaffold, never replaces it.
 */

/** The contract name from the source, or a safe default. */
export function parseContractName(source) {
  const m = String(source || '').match(/\bcontract\s+(\w+)/)
  return m ? m[1] : 'Target'
}

/**
 * External/public, state-changing functions (view/pure excluded) with their params.
 * @returns {Array<{name:string, params:Array<{type:string,name:string}>}>}
 */
export function extractFunctions(source) {
  const src = String(source || '')
  const re = /function\s+(\w+)\s*\(([^)]*)\)([^{;]*)/g
  const out = []
  let m
  while ((m = re.exec(src)) !== null) {
    const [, name, paramsRaw, mods] = m
    const isPublic = /\b(external|public)\b/.test(mods)
    const isReadOnly = /\b(view|pure)\b/.test(mods)
    if (!isPublic || isReadOnly) continue
    out.push({ name, params: parseParams(paramsRaw) })
  }
  return out
}

function parseParams(raw) {
  return String(raw)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => {
      const parts = p.split(/\s+/).filter(Boolean)
      const type = parts[0] || 'uint256'
      const name = parts[parts.length - 1] && parts.length > 1 ? parts[parts.length - 1] : `arg${i}`
      return { type, name }
    })
}

// A fuzzed argument line for a param: numeric → bound(); address → assume non-zero; else pass through.
function fuzzLine(p) {
  if (/^u?int\d*$/.test(p.type)) return `        ${p.name} = bound(${p.name}, 0, type(uint128).max);`
  if (p.type === 'address') return `        vm.assume(${p.name} != address(0));`
  return null
}

/** Build the Markdown fuzz harness (a fenced Foundry test skeleton + honest framing). */
export function buildFuzzHarness(source) {
  const name = parseContractName(source)
  const fns = extractFunctions(source)
  const testName = `${name}FuzzTest`

  const tests = (fns.length ? fns : [{ name: 'todo', params: [] }])
    .map((fn) => {
      const sig = fn.params.map((p) => `${p.type} ${p.name}`).join(', ')
      const bounds = fn.params.map(fuzzLine).filter(Boolean).join('\n')
      const callArgs = fn.params.map((p) => p.name).join(', ')
      const body = fn.name === 'todo'
        ? '        // no external/public state-changing function detected — add your target call here'
        : `${bounds ? bounds + '\n' : ''}        target.${fn.name}(${callArgs});\n        // TODO: assert an invariant that must hold after ${fn.name}(...)`
      return `    function testFuzz_${fn.name === 'todo' ? 'invariant' : fn.name}(${sig}) public {\n${body}\n    }`
    })
    .join('\n\n')

  const code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {${name}} from "../src/${name}.sol";

contract ${testName} is Test {
    ${name} target;

    function setUp() public {
        target = new ${name}();
    }

${tests}
}`

  return `Fuzz harness for \`${name}\` — a Foundry skeleton to seed property testing. It scaffolds a fuzz test per state-changing function; fill in the invariant assertions. This is a starting scaffold, not a proof of correctness.

\`\`\`solidity
${code}
\`\`\`
`
}
