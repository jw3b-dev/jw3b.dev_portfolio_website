/*
 * jw3b.dev v2 — the findings glob. The ONLY impure part of the artifact pipeline, isolated so
 * `findingArtifacts.js` stays pure and fully testable (same split as notesIndex.js / notes.js).
 *
 * Vite resolves this at build time, so publishing a finding is: drop the markdown in, named
 * `<flight>-<finding-id>.md`. With no files the glob is empty, ARTIFACTS is [], and App.jsx
 * registers no route — no empty section advertising nothing.
 */
import { buildIndex } from './findingArtifacts.js'

const modules = import.meta.glob('../content/findings/*.md', { eager: true, query: '?raw', import: 'default' })

export const ARTIFACTS = buildIndex(modules)
export const HAS_ARTIFACTS = ARTIFACTS.length > 0
