/*
 * jw3b.dev v2 — Design tokens, JS mirror  ·  owner: brand-architect (MAS P0-03)
 * The programmatic export of src/styles/tokens.css, for consumers that need JS values
 * (Framer Motion, any canvas/shader work, tests). tokens.css stays authoritative for CSS;
 * this mirror MUST be kept in sync (both are hand-maintained from the same design-story spec).
 * A JSON export for external design tools (Figma/Style-Dictionary) is derivable from this
 * object on demand and intentionally NOT committed as a static file (avoids silent drift).
 */

export const color = {
  void: '#0A0C10', panel: '#11141A', raised: '#171B22', hairline: '#232A35',
  textPrimary: '#F2F5F8', textSecondary: '#9BA6B4', textMuted: '#78828F', textInverse: '#06090E',
  cyan: '#22D3EE', cyanDim: '#0E7C8C',
  verified: '#22D3EE', failed: '#FB5E6A', caution: '#F5C542',
  hatEngineer: '#22D3EE', hatAuditor: '#A78BFA', hatPm: '#34D399', hatFounder: '#E0A22E',
}

export const font = {
  display: "'Geist Variable', 'Geist', ui-sans-serif, system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', 'Menlo', monospace",
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64, 24: 96 } // px

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 } // px

// Motion — the single source; motion.js derives Framer helpers, tokens.css mirrors as ms strings.
export const motion = {
  durationMs: { instant: 100, verdict: 180, normal: 260, entrance: 400, slow: 600 },
  ease: {
    outExpo: [0.16, 1, 0.3, 1],
    standard: [0.4, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    spring: [0.34, 1.4, 0.64, 1],
  },
  stagger: { fast: 0.05, normal: 0.08, slow: 0.16 }, // seconds
}
