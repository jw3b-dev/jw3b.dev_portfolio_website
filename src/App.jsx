import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import AuditStats from "./components/AuditStats"
import About from "./components/About"
import Technologies from "./components/Technologies"
import Experience from "./components/Experience"
import Projects from "./components/Projects"
import Education from "./components/Education"
import Certifications from "./components/Certifications"
import Contact from "./components/Contact"


const App = () => {
  return (
    <div className="overflow-x-hidden text-stone-300 antialised">
      <div className="fixed inset-0 -z-10">
        <div className="relative h-full w-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#9333ea36,#000)]"></div>
          <div className="absolute right-0 bottom-[-10%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle_300px_at_50%_300px,#06b6d436,#000)]"></div>
        </div>
      </div>

      <div className="container mx-auto px-8">
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
  )
}


export default App