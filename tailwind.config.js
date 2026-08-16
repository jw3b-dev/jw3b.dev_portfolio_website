/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    // P0-03 (brand-architect) extends this to read the CSS custom-property token
    // layer (src/styles/tokens.css) — semantic token classes only, zero raw hex.
    // Left intentionally empty here so the token task drops in without re-plumbing.
    extend: {},
  },
  plugins: [],
}
