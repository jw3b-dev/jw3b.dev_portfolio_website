#!/usr/bin/env node
/*
 * jw3b.dev v2 — client-bundle secret-leak scan (P0-12, FR-050)  ·  security role
 * Fails CI if a server secret ever reaches shipped client code. All secrets live in
 * the Worker (wrangler secret put) — NOTHING sensitive may appear in the SPA source
 * or the built bundle. High-signal patterns only, so a hit is a real finding, not noise.
 *
 * Scans: dist/** (the actual artifact shipped to browsers) + src/** (catch a hardcode
 * before it is even built). Run `npm run build` first so dist/ exists; if dist/ is
 * absent the scan still covers src/ and warns.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOTS = ['dist', 'src']
const EXTS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.map'])

// [name, regex, why]. Keep each pattern high-signal — a match must be worth a red build.
const PATTERNS = [
  ['anthropic-key', /sk-ant-[A-Za-z0-9_-]{8,}/, 'Anthropic API key'],
  ['openai-key', /sk-(?:proj-)?[A-Za-z0-9]{20,}/, 'OpenAI-style secret key'],
  ['private-key-block', /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, 'PEM private key'],
  ['assigned-anthropic', /ANTHROPIC_API_KEY\s*[:=]\s*['"][^'"]{6,}['"]/, 'hardcoded ANTHROPIC_API_KEY value'],
  ['wallet-privkey', /(?:privateKey|PRIVATE_KEY|mnemonic|seedPhrase)\s*[:=]\s*['"](?:0x)?[A-Za-z0-9 ]{24,}['"]/, 'hardcoded wallet private key / mnemonic'],
  ['aws-akid', /\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  ['generic-bearer', /\b(?:secret|token|apikey|api_key|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{24,}['"]/i, 'hardcoded secret/token literal'],
]

// Public-by-design values that must NOT trip the scan (VITE_ vars ship to the client
// intentionally; the 'demo' WalletConnect id is a placeholder).
const ALLOW = [/VITE_[A-Z0-9_]+/, /projectId:\s*['"]demo['"]/]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue
      walk(p, out)
    } else if (EXTS.has(extname(p))) {
      out.push(p)
    }
  }
  return out
}

const findings = []
for (const root of ROOTS) {
  if (!existsSync(root)) {
    if (root === 'dist') console.warn(`⚠ secret-scan: ${root}/ not found — run \`npm run build\` to scan the shipped bundle too.`)
    continue
  }
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8')
    for (const [name, re, why] of PATTERNS) {
      const m = text.match(re)
      if (m && !ALLOW.some((a) => a.test(m[0]))) {
        findings.push({ file, name, why, sample: m[0].slice(0, 24) + '…' })
      }
    }
  }
}

if (findings.length) {
  console.error(`✗ secret-scan: ${findings.length} potential secret leak(s):`)
  for (const f of findings) console.error(`  [${f.name}] ${f.file} — ${f.why} (match: ${f.sample})`)
  console.error('All secrets belong in the Worker (wrangler secret put), never the client bundle (FR-050).')
  process.exit(1)
}
console.log('✓ secret-scan: no server secrets in src/ or the client bundle.')
