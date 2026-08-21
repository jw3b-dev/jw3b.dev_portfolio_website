/*
 * ESLint (flat config) — the lint half of the quality gate.
 * Scope: the React app in src/, the edge Workers, and the root build config. CI runs
 * `npm run lint` first because it is the cheapest gate; any error blocks the build.
 * The React-specific rules (hooks + fast-refresh) are what catch the classes of bug the
 * type system can't here, since this project is deliberately JSX-not-TypeScript.
 */
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Foundry build artifacts + vendored contract deps (gitignored) — not app JS to lint.
  { ignores: ['dist', 'coverage', 'contracts/lib', 'contracts/out', 'contracts/cache', 'contracts/broadcast'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Mark identifiers used only inside JSX (e.g. <motion.div>) as "used".
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Node-context tooling: build/test configs + the test setup file.
  {
    files: ['**/*.config.{js,cjs,mjs}', 'src/setupTests.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Test files: Vitest globals + Node.
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
]
