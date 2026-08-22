/*
 * jw3b.dev v2 — the notes glob (P5-04) · frontend-engineer
 *
 * The ONLY impure part of the pipeline, isolated here so `src/lib/notes.js` stays pure and fully
 * testable. Vite resolves this glob at build time, which is what makes "add a markdown file" the
 * entire publishing step — no component edit, no registry to update.
 *
 * With no files present the glob is an empty object, `NOTES` is `[]`, and App.jsx registers no
 * route at all. That is deliberate: an empty "Notes" section advertising nothing is exactly the
 * zero-value theatre the claims discipline forbids.
 */
import { buildIndex } from './notes.js'

const modules = import.meta.glob('../content/notes/*.md', { eager: true, query: '?raw', import: 'default' })

export const NOTES = buildIndex(modules)
export const HAS_NOTES = NOTES.length > 0
