import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, Link } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './config/wagmi'
import ChatWidget from './components/chat/ChatWidget'
import HireSpine from './components/layout/HireSpine'
import SiteFooter from './components/layout/SiteFooter'

// Lazy-loaded routes — each page is code-split and loads behind the single
// <Suspense> boundary in RootLayout. Heavy Web3 (and future R3F) libs are
// further split by vite.config.js manualChunks (refined in P0-11).
const Home = lazy(() => import('./pages/Home'))
const Work = lazy(() => import('./pages/Work'))
const Audit = lazy(() => import('./pages/Audit'))
const Ctf = lazy(() => import('./pages/Ctf'))
const HireMe = lazy(() => import('./pages/HireMe'))
const Messages = lazy(() => import('./pages/Messages'))
const Privacy = lazy(() => import('./pages/Privacy'))
const SystemsAreGraphs = lazy(() => import('./pages/thesis/SystemsAreGraphs'))
const ZeroTrustValidator = lazy(() => import('./pages/thesis/ZeroTrustValidator'))

const queryClient = new QueryClient()

// Persistent app layout (SDD 02 §4). The ≤1-click hire spine (P1-10, FR-002) and the
// global concierge ChatWidget (P1-07) mount here so they wrap EVERY route — the 404
// included — which is what makes the hire CTA reachable from 100% of routes and leaves
// no terminal dead-ends (SC-1). The pt-14 clears the fixed h-14 spine.
function RootLayout() {
  return (
    <>
      <HireSpine />
      <main className="pt-14">
        <Suspense fallback={<div role="status" aria-live="polite" className="p-8 text-content-secondary">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      {/* Global footer — mounts on every route (404 + the PII-collection surfaces), carrying
          the privacy link the compliance gate requires be reachable from every collection point. */}
      <SiteFooter />
      <ChatWidget />
    </>
  )
}

// Not a dead-end: the persistent spine already carries a home link + the hire CTA, and
// this restates both in-content (SC-1: 0 terminal dead-ends).
function NotFound() {
  return (
    <section aria-labelledby="nf-title" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">404</p>
      <h1 id="nf-title" className="mt-3 font-display text-3xl font-semibold text-content-primary">
        That route isn’t running.
      </h1>
      <p className="mt-3 max-w-prose text-content-secondary">
        Nothing lives here — but the consoles do.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link to="/" className="font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary">
          ← Back to the console
        </Link>
        <Link to="/hire-me" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          Hire John →
        </Link>
      </div>
    </section>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/work', element: <Work /> },
      { path: '/audit', element: <Audit /> },
      { path: '/ctf', element: <Ctf /> },
      { path: '/hire-me', element: <HireMe /> },
      { path: '/messages', element: <Messages /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/thesis/systems-are-graphs', element: <SystemsAreGraphs /> },
      { path: '/thesis/zero-trust-validator', element: <ZeroTrustValidator /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

// Provider tree — order is FIXED (SDD 02 §4):
// Wagmi → React Query → RainbowKit → Helmet → Router.
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <HelmetProvider>
            {/* P1-12 / FR-007: reducedMotion="user" neutralises transform/layout animation
                for EVERY Framer surface beneath it — the structural 100% reduced-motion guard,
                paired with the CSS `motion-safe:` convention. */}
            <MotionConfig reducedMotion="user">
              <RouterProvider router={router} />
            </MotionConfig>
          </HelmetProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
