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
import cyberBg from "./assets/cyber_bg.png"

const App = () => {
  return (
    <div className="overflow-x-hidden text-stone-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      <div className="fixed inset-0 -z-10">
        <div className="relative h-full w-full">
          <img
            src={cyberBg}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-transparent to-[#030014] opacity-90"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.05),transparent_50%)]"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
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