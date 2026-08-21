/*
 * PostCSS — the two-plugin pipeline Tailwind needs.
 * `tailwindcss` expands the utility classes used across src/; `autoprefixer` adds vendor
 * prefixes for the browser targets. Kept minimal on purpose: all design decisions live in
 * the token layer (src/styles/tokens.css) and tailwind.config.js, never here.
 */
export default {
  plugins: {
    // tailwind.config.js moved into config/ alongside this file; the plugin would otherwise
    // look for it relative to the CWD (the project root) and silently emit unstyled CSS.
    tailwindcss: { config: './config/tailwind.config.js' },
    autoprefixer: {},
  },
}
