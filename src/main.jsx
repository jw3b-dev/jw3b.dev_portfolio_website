import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.jsx'

// Web3 polyfills. wagmi/viem and their transitive deps expect Node's Buffer and a
// `global`; vite.config.js also defines `global: globalThis` + mocks `process.env`.
// Do not remove without re-testing the wallet stack (see ACTIVE_STACK.md).
if (!window.Buffer) window.Buffer = Buffer
if (!window.global) window.global = window

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
