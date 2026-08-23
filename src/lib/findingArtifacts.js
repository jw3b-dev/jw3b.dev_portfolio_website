/*
 * jw3b.dev v2 — published audit findings (the artifact layer)
 *
 * WHAT THIS PUBLISHES, AND THE ONE RULE THAT GOVERNS IT.
 *
 * A CodeHawks finding is credited to every researcher who validly reported it, and Cyfrin then
 * publishes ONE of their write-ups as the canonical version — the "Selected submission". Only a
 * finding whose selected submitter is `agilegypsy` may be published here, because only then is the
 * prose John's to publish. Anything else would put another researcher's writing on his portfolio
 * under his name.
 *
 * That is not a hypothetical guard. `mas/facts/PORTFOLIO_REFERENCE.md §1b` asserted that a contest
 * report on file was "publishable as a sample audit report" and it was not — it was Cyfrin's
 * compilation of ~70 researchers, with the two findings it described credited to nomadic_bear and
 * robercano. Acting on that sentence would have shipped exactly this mistake. So the rule is code:
 * `publishable()` drops any artifact whose finding is not selected-by-John, and it is tested.
 *
 * PURE. The glob lives in findingArtifactsIndex.js; this module takes modules in, which keeps the
 * whole pipeline testable without Vite or a filesystem. Mirrors notes.js deliberately — same shape,
 * same "zero artifacts registers no route" behaviour, so there is no empty section advertising
 * nothing (claims discipline: a surface shows something proven or shows nothing).
 */
import { CONTESTS } from '../data/codehawks-contests.js'

/** The account whose write-ups this site may publish. */
export const OWNER_HANDLE = 'agilegypsy'

/** `../content/findings/50-L-01.md` → `50-L-01`. Path-agnostic so the glob shape is free. */
export function slugFromPath(path = '') {
  const base = String(path).split('/').pop() || ''
  return base.replace(/\.md$/i, '')
}

/**
 * Resolve a slug to its contest + finding rows.
 * The slug encodes the contest and the finding id (`<flight>-<id>`) so a file cannot be published
 * without naming which finding it is — the metadata comes from the register-backed data module,
 * never from the markdown, so a write-up cannot describe itself as something it is not.
 */
export function locate(slug) {
  const m = /^(\d+)-([HML]-\d+)$/i.exec(String(slug))
  if (!m) return null
  const flight = Number(m[1])
  const findingId = m[2].toUpperCase()
  const contest = CONTESTS.find((c) => c.flight === flight)
  if (!contest) return null
  const finding = contest.findings.find((f) => f.id === findingId)
  return finding ? { contest, finding } : null
}

/**
 * May this artifact be published? Only when Cyfrin selected John's submission for that finding.
 * A missing body is also a refusal: an artifact page with no artifact is theatre.
 */
export function publishable(entry) {
  if (!entry || !entry.body || !entry.body.trim()) return false
  return entry.finding.selected === OWNER_HANDLE
}

/** Build one artifact from its path and raw markdown, or null if it may not be published. */
export function buildArtifact(path, raw) {
  const slug = slugFromPath(path)
  const found = locate(slug)
  if (!found) return null
  const entry = {
    slug,
    body: String(raw || '').trim(),
    contest: found.contest,
    finding: found.finding,
    title: `${found.finding.id} — ${found.finding.title}`,
    severity: found.finding.severity,
  }
  return publishable(entry) ? entry : null
}

/**
 * Build the publishable index from a glob-shaped `{path: rawMarkdown}` map.
 * Sorted newest contest first, so the list does not depend on filesystem ordering.
 */
export function buildIndex(modules = {}) {
  return Object.entries(modules)
    .map(([path, raw]) => buildArtifact(path, raw))
    .filter(Boolean)
    .sort((a, b) => b.contest.flight - a.contest.flight)
}
