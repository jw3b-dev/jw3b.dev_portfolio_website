/*
 * Root shim — the real Vitest config lives in config/vitest.config.js.
 *
 * This file exists purely so test discovery keeps working the way people expect: a bare
 * `npx vitest` (or an IDE's test runner, which auto-discovers a ROOT config) would otherwise
 * run with Vitest's defaults — no jsdom environment, no setup file — and report a wall of
 * confusing failures rather than a clear "config not found". That silent-misconfiguration
 * trap is worse than the one extra file, so the pointer stays.
 *
 * npm scripts pass --config explicitly, so they are unaffected either way.
 */
export { default } from './config/vitest.config.js'
