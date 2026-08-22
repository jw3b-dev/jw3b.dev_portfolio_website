/*
 * Kointel — the compliance gate, as a runnable rule  ·  audit-heuristics-engineer
 *
 * WHAT THIS IS, EXACTLY. Kointel's documented differentiator is not a feature list: it is a
 * BUILD-FAILING CI GATE that bans transaction-signing from Web3 modules
 * (`mas/facts/01_OWNER_DECISIONS.md:22`, `mas/facts/cv-source.md:30`). The card said so in prose
 * and the visitor had to take it on faith, because the product itself refuses framing
 * (`X-Frame-Options: DENY`) and degraded to a launch card — a description and a link.
 *
 * WHAT THIS IS NOT — and the distinction is the whole honesty of the surface. This is **not
 * Kointel's source code**. It is an independent implementation of the RULE Kointel enforces,
 * written here so a visitor can run it instead of believing a sentence about it. Nothing on this
 * surface may claim otherwise, and the component says so on screen before the first run.
 *
 * WHY THE RULE IS WORTH DEMONSTRATING. A crypto-tax product reads wallets. Reading needs no
 * signing key. So any module in the Web3 layer that *can* sign or broadcast is a module that can
 * move a customer's funds — and the compliance argument is that this should be impossible by
 * construction rather than forbidden by policy. A gate that fails the BUILD is the difference
 * between "we don't do that" and "we cannot do that", which is the same argument this site makes
 * about its own claims gate. That parallel is real, not rhetorical: both are pattern detectors
 * that turn a promise into something CI can refuse.
 *
 * Detectors are pure and deterministic — same input, same findings, no I/O — for the reason every
 * detector on this site is: a rule that cannot be reproduced cannot be trusted, and one that
 * cannot be tested cannot be trusted either.
 *
 * KNOWN LIMIT, stated rather than hidden: this is textual pattern matching, not dataflow analysis.
 * It catches the capability being NAMED, which is what a CI gate of this kind is for and is also
 * why a real one is paired with review — an obfuscated call assembled at runtime would pass. The
 * component says this too. A gate that oversells its own reach teaches exactly the false
 * confidence the site argues against.
 */

/** @typedef {{id:string, rule:string, line:number, snippet:string, why:string}} GateViolation */

/*
 * The banned capabilities. Each entry is one way a module can end up able to move money, with the
 * reason it is banned rather than merely discouraged — a finding that says "line 12" and nothing
 * else asks to be obeyed instead of understood.
 */
const RULES = Object.freeze([
  Object.freeze({
    id: 'send-transaction',
    rule: 'Broadcasts a transaction',
    pattern: /\b(sendRawTransaction|sendTransaction)\b/,
    why: 'Broadcasting is the step that actually moves funds. A read-only wallet module never needs it.',
  }),
  Object.freeze({
    id: 'sign',
    rule: 'Signs a transaction or message',
    pattern: /\b(signTransaction|signTypedData|_signTypedData|signMessage)\b/,
    why: 'A signature is an irrevocable authorisation. Signing capability in a reporting module is capability nobody asked for.',
  }),
  /*
   * RPC METHOD NAMES ARE SCANNED DIFFERENTLY, and the reason is a genuine conflict between two
   * rules this detector has to satisfy at once.
   *
   * Stripping string literals is what stops the gate firing on its own documentation — a rule that
   * flags `const err = "signTransaction is banned"` trains people to delete the message. But an RPC
   * call names its capability IN a string: `provider.request({ method: 'eth_sendTransaction' })`.
   * Strip strings and the gate goes blind to the most direct form of the thing it bans.
   *
   * So the scan surface is split by what the token IS. JS identifiers are CODE and are read from
   * the string-stripped line; `eth_*` / `personal_sign` are DATA THAT IS CAPABILITY and are read
   * from the raw (comment-stripped) line. The accepted cost is stated rather than discovered: a
   * sentence in a string that mentions `eth_sign` will be flagged. For a gate whose failure mode
   * is letting signing into a reporting module, erring toward the flag is the correct bias — and
   * a false positive here is one comment reworded, not a lost key.
   */
  Object.freeze({
    id: 'rpc-signing-method',
    rule: 'Calls a signing or sending JSON-RPC method',
    pattern: /\b(eth_sendTransaction|eth_sendRawTransaction|eth_sign|eth_signTypedData(_v\d)?|personal_sign)\b/,
    scanRaw: true,
    why: 'The RPC layer is the floor beneath every library. A module that can name these methods can sign without importing anything that looks like a wallet.',
  }),
  Object.freeze({
    id: 'private-key',
    rule: 'Handles a private key or mnemonic',
    pattern: /\b(privateKey|PRIVATE_KEY|mnemonic|fromPhrase|Wallet\.fromEncryptedJson|HDNodeWallet)\b/,
    why: 'Key material in a module that only needs to read balances is the single highest-value secret in the system, in the place least equipped to hold it.',
  }),
  Object.freeze({
    id: 'write-contract',
    rule: 'Writes to a contract',
    pattern: /\b(writeContract|deployContract|estimateContractGas)\b/,
    why: 'A state-changing contract call is a transaction wearing an abstraction. The ban has to follow the capability, not the vocabulary.',
  }),
  Object.freeze({
    id: 'approve-spend',
    rule: 'Grants a token allowance',
    pattern: /\.\s*approve\s*\(|\bincreaseAllowance\b/,
    why: 'An allowance delegates spending to someone else — the one move that loses funds without a transfer appearing in the module that made it possible.',
  }),
])

/** Comments only. Documentation of the ban is never itself a violation, whichever surface scans it. */
function stripComments(line) {
  return line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Comments AND string literals — the surface for JS identifiers, so prose about signing is safe. */
function stripNonCode(line) {
  return stripComments(line).replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""')
}

/**
 * Run the gate over a module.
 *
 * @param {string} source
 * @returns {{passed:boolean, violations:GateViolation[], scanned:number, empty:boolean}}
 */
export function runKointelGate(source) {
  const text = typeof source === 'string' ? source : ''
  if (!text.trim()) return { passed: false, violations: [], scanned: 0, empty: true }

  const lines = text.split('\n')
  const violations = []

  lines.forEach((raw, i) => {
    const code = stripNonCode(raw)
    const data = stripComments(raw)
    for (const r of RULES) {
      const surface = r.scanRaw ? data : code
      if (!surface.trim()) continue
      if (!r.pattern.test(surface)) continue
      violations.push({
        id: r.id,
        rule: r.rule,
        line: i + 1,
        snippet: raw.trim().slice(0, 160),
        why: r.why,
      })
    }
  })

  return { passed: violations.length === 0, violations, scanned: lines.length, empty: false }
}

/** Every rule the gate enforces — so the UI can list them without restating them. */
export const GATE_RULES = Object.freeze(RULES.map((r) => Object.freeze({ id: r.id, rule: r.rule, why: r.why })))

/*
 * Two modules that do the SAME JOB — report what a wallet holds — one of which cannot ship.
 *
 * The pair matters more than either half. A demo that only shows a failure proves the detector
 * fires; showing the compliant module beside it proves the rule is satisfiable, which is the
 * actual claim ("governance engineered in") rather than "we reject things".
 */
export const GATE_EXAMPLES = Object.freeze([
  Object.freeze({
    id: 'compliant',
    title: 'Balance reader (ships)',
    blurb: 'Reads holdings for the tax report. It has no way to move anything.',
    source: `// wallet/balances.js — Web3 layer, read-only by construction.
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({ chain: mainnet, transport: http() })

export async function holdingsFor(address) {
  const balance = await client.getBalance({ address })
  const block = await client.getBlockNumber()
  return { address, balance, block }
}
`,
  }),
  Object.freeze({
    id: 'violating',
    title: 'Balance reader + "just one" transfer (fails the build)',
    blurb: 'The same reporting module, with a convenience helper bolted on. CI refuses it.',
    source: `// wallet/balances.js — the version that fails the gate.
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createPublicClient({ chain: mainnet, transport: http() })

export async function holdingsFor(address) {
  return client.getBalance({ address })
}

// Added "temporarily" so the reconciliation job could settle a dust balance.
const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const wallet = createWalletClient({ account, chain: mainnet, transport: http() })

export async function settleDust(to, value) {
  return wallet.sendTransaction({ to, value })
}
`,
  }),
])
