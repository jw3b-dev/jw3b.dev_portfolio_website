/*
 * jw3b.dev v2 — the audit console's takeaway artifact (W3 · PRODUCT_AUDIT #18)  ·  domain-engine
 *
 * WHY. The console let a visitor screen a contract, iterate through versions, and run AI
 * analyses — and then gave them no way to leave with any of it. Everything lived in a browser tab
 * that a reload wipes (deliberately: nothing is persisted, see the workspace ADR). A tool whose
 * output you cannot take with you is a demo, not an instrument, and the person most likely to
 * want the artifact is exactly the person deciding whether to hire an auditor.
 *
 * PURE by design: state in, Markdown out. No DOM, no clock, no I/O — the component supplies the
 * timestamp so this stays deterministic and exhaustively testable.
 *
 * HONESTY RULES travel with the report, because a file outlives the screen that explained it:
 *   · the disclaimer is verbatim AUDIT_DISCLAIMER (BR-10), never a paraphrase;
 *   · every analysis is labelled live-model or recorded-fallback, as it is in the UI;
 *   · a clean instant screen is reported as "no patterns matched", never as "safe";
 *   · the report states which version each analysis actually read.
 */
import { AUDIT_DISCLAIMER } from './auditClient.js'

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 }

/** `2026-08-21T09:12:33.000Z` → `2026-08-21 09:12 UTC`. Injected, never read from the clock here. */
function stamp(iso) {
  const s = String(iso || '')
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]} UTC` : s
}

function findingsTable(findings) {
  if (!findings.length) {
    // The single most instructive line the tool can print, and the easiest one to get wrong.
    return 'No known patterns matched. That is not a statement that the contract is safe — it\nmeans none of this screen\'s rules fired.\n'
  }
  const rows = [...findings]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || a.line - b.line)
    .map((f) => `### ${f.severity.toUpperCase()} · ${f.title}\n\nLine ${f.line}.\n\n${f.detail}\n`)
  return rows.join('\n')
}

/**
 * Build the Markdown report.
 *
 * @param {object} input
 * @param {string} input.source        the contract as it stands now
 * @param {Array}  input.findings      instant-screen findings for that source
 * @param {Array}  input.versions      [{ id, label, source }]
 * @param {Array}  input.runs          [{ id, seq, source, narrative, degraded, versionLabel }]
 * @param {string} input.generatedAt   ISO timestamp, supplied by the caller
 * @returns {string} Markdown
 */
export function buildAuditReport({ source = '', findings = [], versions = [], runs = [], generatedAt = '' } = {}) {
  const out = []
  out.push('# Contract screening report')
  out.push('')
  out.push(`Generated ${stamp(generatedAt)} by the jw3b.dev security console (https://jw3b.dev/audit).`)
  out.push('')
  out.push('## Instant screen')
  out.push('')
  out.push('Deterministic pattern matching, run in the browser against the contract below.')
  out.push('')
  out.push(findingsTable(findings))

  out.push('## AI analyses')
  out.push('')
  if (!runs.length) {
    out.push('None were run.')
    out.push('')
  } else {
    for (const r of runs) {
      // Provenance is not decoration: a recorded fallback did not read this contract, and the
      // report must not let that distinction quietly evaporate into a wall of prose.
      const provenance = r.degraded ? 'recorded fallback' : 'live model'
      out.push(`### Run ${r.seq} — ${provenance}`)
      out.push('')
      if (r.versionLabel) out.push(`Read version: ${r.versionLabel}.`)
      out.push('')
      out.push(String(r.narrative || '').trim() || '_No narrative was returned._')
      out.push('')
    }
  }

  out.push('## Versions')
  out.push('')
  for (const v of versions) {
    const lines = String(v.source || '').split('\n').length
    out.push(`- **${v.label}** — ${lines} lines`)
  }
  out.push('')

  out.push('## Contract as screened')
  out.push('')
  out.push('```solidity')
  out.push(String(source).trimEnd())
  out.push('```')
  out.push('')

  out.push('---')
  out.push('')
  out.push(AUDIT_DISCLAIMER)
  out.push('')
  return out.join('\n')
}

/** A filesystem-safe name for the download. */
export function reportFilename(source = '', generatedAt = '') {
  const contract = (String(source).match(/contract\s+(\w+)/) || [])[1] || 'contract'
  const day = (String(generatedAt).match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || 'report'
  return `${contract}-screening-${day}.md`
}

/**
 * Character range of a 1-based line, for selecting it in a textarea.
 *
 * Findings carry a line number, and until now that number was only ever printed — the reader had
 * to count lines by eye in their own contract to find what was being talked about. Selecting the
 * line turns the finding into navigation.
 *
 * Clamps rather than throwing: a detector reporting a line past the end of an edited source is a
 * stale finding, not a crash.
 *
 * @returns {{start:number, end:number}}
 */
export function lineRange(source, line) {
  const lines = String(source == null ? '' : source).split('\n')
  const idx = Math.min(Math.max(Math.trunc(Number(line) || 1), 1), lines.length) - 1
  let start = 0
  for (let i = 0; i < idx; i++) start += lines[i].length + 1
  return { start, end: start + lines[idx].length }
}
