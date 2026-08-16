import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { HelmetProvider } from 'react-helmet-async'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './config/wagmi'
import ChatWidget from './components/chat/ChatWidget'

// Lazy-loaded routes — each page is code-split and loads behind the single
// <Suspense> boundary in RootLayout. Heavy Web3 (and future R3F) libs are
// further split by vite.config.js manualChunks (refined in P0-11).
const Home = lazy(() => import('./pages/Home'))
const Audit = lazy(() => import('./pages/Audit'))
const Ctf = lazy(() => import('./pages/Ctf'))
const HireMe = lazy(() => import('./pages/HireMe'))
const Messages = lazy(() => import('./pages/Messages'))
const Privacy = lazy(() => import('./pages/Privacy'))

const queryClient = new QueryClient()

// Persistent app layout (SDD 02 §4). The ≤1-click hire spine (P1-10) and the
// global concierge ChatWidget (P1-07) mount here later; for now it is just the
// Suspense boundary + route outlet.
function RootLayout() {
  return (
    <main>
      {/* P1-10: <HireSpine /> mounts here */}
      <Suspense fallback={<div role="status" aria-live="polite">Loading…</div>}>
        <Outlet />
      </Suspense>
      <ChatWidget />
    </main>
  )
}

function NotFound() {
  return (
    <section>
      <h1>404</h1>
      <p>Route not found.</p>
    </section>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/audit', element: <Audit /> },
      { path: '/ctf', element: <Ctf /> },
      { path: '/hire-me', element: <HireMe /> },
      { path: '/messages', element: <Messages /> },
      { path: '/privacy', element: <Privacy /> },
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
            <RouterProvider router={router} />
          </HelmetProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
