import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import Home from "./components/Home";
import Background from "./components/Background";

const ProjectDetails = lazy(() => import("./components/ProjectDetails"));
const Pricing = lazy(() => import("./components/Pricing"));
const AgentTest = lazy(() => import("./components/AgentTest"));

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00f3ff',
            accentColorForeground: '#000',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          <HelmetProvider>
            <BrowserRouter>
              <div className="overflow-x-hidden text-stone-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
                <Background />

                <Suspense fallback={<div className="min-h-screen text-cyan-400 flex items-center justify-center font-mono">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/hire-me" element={<Pricing />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/test-agent" element={<AgentTest />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
          </HelmetProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;