import { useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Home from "./components/Home";
import Background from "./components/Background";
const ProjectDetails = lazy(() => import("./components/ProjectDetails"));

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="overflow-x-hidden text-stone-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
          <Background />

          <Suspense fallback={<div className="min-h-screen text-cyan-400 flex items-center justify-center font-mono">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;