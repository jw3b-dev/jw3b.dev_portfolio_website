import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Technologies from "./components/Technologies"
import Experience from "./components/Experience"
import Projects from "./components/Projects"
import Education from "./components/Education"
import Certifications from "./components/Certifications"
import AuditStats from "./components/AuditStats"
import Contact from "./components/Contact"
import About from "./components/About"

import Background from "./components/Background"

const App = () => {
  return (
    <div className="overflow-x-hidden text-stone-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      <Background />

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
        <Navbar />
        <Hero />
        <AuditStats />
        <About />
        <Technologies />
        <Experience />
        <Projects />
        <Education />
        <Certifications />
        <Contact />
      </div>
    </div>
  );
};

export default App;