/*
 * jw3b.dev v2 — notes content pipeline (P5-04) · frontend-engineer
 *
 * The two thesis pages are hand-built components. That made publishing a third piece an
 * engineering task, which is why there are two. This generalises the pattern already used by
 * `privacy.md` / `terms.md`: a note is a markdown file, and adding one is the whole job — the
 * route, the SEO metadata and the sitemap entry all follow from the file.
 *
 * PURE. No I/O and no glob here: the caller passes the modules in, which is what makes the whole
 * pipeline testable without touching the filesystem or Vite.
 *
 * ── ZERO NOTES IS A FIRST-CLASS STATE ─────────────────────────────────────────────────────────
 * With no notes published, `buildIndex` returns an empty list and the caller registers NO route.
 * There is deliberately no "no notes yet" placeholder page: the claims discipline forbids
 * zero-value theatre — a surface shows something proven or shows nothing. Publishing the first
 * file is what brings the section into existence.
 */

/** Frontmatter keys a note may declare. Anything else is ignored rather than rendered. */
const KNOWN_KEYS = ['title', 'date', 'description', 'draft']

/**
 * Split a `---`-delimited YAML-ish frontmatter block off the top of a markdown file.
 * Only `key: value` scalars are supported — deliberately, since a note's metadata is flat and a
 * real YAML parser would be a dependency and an injection surface for no gain.
 * @returns {{meta: Record<string,string>, body: string}}
 */
export function parseFrontmatter(raw = '') {
  const src = String(raw)
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src)
  if (!m) return { meta: {}, body: src.trim() }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line.trim())
    if (!kv) continue
    const key = kv[1].toLowerCase()
    if (!KNOWN_KEYS.includes(key)) continue
    meta[key] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { meta, body: src.slice(m[0].length).trim() }
}

/** `../content/notes/my-piece.md` → `my-piece`. Path-agnostic so the caller's glob shape is free. */
export function slugFromPath(path = '') {
  const base = String(path).split('/').pop() || ''
  return base.replace(/\.md$/i, '')
}

/** ISO date or null. A malformed date is dropped rather than rendered as garbage. */
function normalizeDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/**
 * Build one note from its path and raw contents.
 * Returns null when the file cannot be published — no title, or explicitly `draft: true`. A note
 * without a title has nothing to put in `<title>`, a heading, or a sitemap entry, and half-
 * published content is exactly the kind of surface this rerun removes.
 * @returns {{slug:string, title:string, date:string|null, description:string, body:string, path:string}|null}
 */
export function buildNote(path, raw) {
  const { meta, body } = parseFrontmatter(raw)
  const title = (meta.title || '').trim()
  if (!title) return null
  if (String(meta.draft || '').toLowerCase() === 'true') return null
  if (!body) return null
  return {
    slug: slugFromPath(path),
    title,
    date: normalizeDate(meta.date),
    description: (meta.description || '').trim(),
    body,
    path: `/notes/${slugFromPath(path)}`,
  }
}

/**
 * Build the published index from a Vite glob result (`{ [path]: rawString }`).
 * Newest first; undated notes sort last, so an author who forgets a date does not silently
 * displace dated work at the top of the list.
 */
export function buildIndex(modules = {}) {
  return Object.entries(modules)
    .map(([path, raw]) => buildNote(path, typeof raw === 'string' ? raw : raw && raw.default))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date)
      if (a.date) return -1
      if (b.date) return 1
      return a.title.localeCompare(b.title)
    })
}

/** Look one up. Returns null rather than throwing, so a bad URL renders a not-found, not a crash. */
export function noteBySlug(index, slug) {
  return index.find((n) => n.slug === slug) || null
}

/** JSON-LD for a note. Emitted only with the fields the note actually has. */
export function noteJsonLd(note, origin = 'https://jw3b.dev') {
  if (!note) return null
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    url: `${origin}${note.path}`,
    author: { '@type': 'Person', name: 'John Wellard' },
  }
  if (note.date) ld.datePublished = note.date
  if (note.description) ld.description = note.description
  return ld
}
