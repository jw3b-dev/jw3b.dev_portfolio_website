/** @type {import('tailwindcss').Config} */
// P0-03 (brand-architect): semantic utilities read the CSS custom-property token layer
// (src/styles/tokens.css). Components use these classes only — ZERO raw hex in components.
export default {
  darkMode: 'class', // dark-only design; :root tokens ARE the theme
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        panel: 'var(--color-panel)',
        raised: 'var(--color-raised)',
        hairline: 'var(--color-hairline)',
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        // Accents that carry alpha use the RGB-channel tokens so `cyan/40`, `bg-cyan/5`,
        // `border-cyan/50` etc. resolve to real colors (hex tokens stay the source).
        cyan: 'rgb(var(--color-cyan-rgb) / <alpha-value>)',
        'cyan-dim': 'var(--color-cyan-dim)',
        verified: 'rgb(var(--color-cyan-rgb) / <alpha-value>)',
        failed: 'rgb(var(--color-failed-rgb) / <alpha-value>)',
        caution: 'rgb(var(--color-caution-rgb) / <alpha-value>)',
        hat: {
          engineer: 'var(--color-hat-engineer)',
          auditor: 'var(--color-hat-auditor)',
          pm: 'var(--color-hat-pm)',
          founder: 'var(--color-hat-founder)',
        },
        scrim: 'var(--color-scrim)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        marquee: 'var(--text-marquee)',
      },
      letterSpacing: {
        tightish: 'var(--tracking-tight)',
        label: 'var(--tracking-label)',
      },
      spacing: {
        section: 'var(--space-section)',
        // Modern rhythm refinements — keep 8-pt grid but tighter interior spacing
        // so surfaces breathe without excessive air.
        heroGap: 'clamp(1rem, 2vw, 1.5rem)',
        contentGap: 'clamp(0.75rem, 1.5vw, 1rem)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
        // New modern radii for chips & badges
        badge: 'var(--radius-sm)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        raised: 'var(--shadow-raised)',
        'edge-cyan': 'var(--shadow-edge-cyan)',
        'edge-failed': 'var(--shadow-edge-failed)',
        // Modern elevation refinements — subtle focus / active states
        focus: '0 0 0 2px rgba(34, 211, 238, 0.25), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 0 1px rgba(255, 255, 255, 0.02) inset',
      },
      blur: {
        scrim: 'var(--blur-scrim)',
        nav: 'var(--blur-nav)',
      },
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        standard: 'var(--ease-standard)',
        accelerate: 'var(--ease-accelerate)',
        spring: 'var(--ease-spring)',
        // New modern easing for state transitions
        'state-out': 'var(--ease-out-expo)',
        'state-in': 'var(--ease-accelerate)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        verdict: 'var(--duration-verdict)',
        normal: 'var(--duration-normal)',
        entrance: 'var(--duration-entrance)',
        slow: 'var(--duration-slow)',
        // New micro-states
        'state-fast': 'var(--duration-instant)',
      },
      zIndex: {
        base: 'var(--z-base)',
        raised: 'var(--z-raised)',
        nav: 'var(--z-nav)',
        overlay: 'var(--z-overlay)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
}
