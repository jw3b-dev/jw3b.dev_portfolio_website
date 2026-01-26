import Navbar from "./Navbar"
import Hero from "./Hero"
import Experience from "./Experience"
import Projects from "./Projects"
import Education from "./Education"
import Certifications from "./Certifications"
import AuditStats from "./AuditStats"
import Contact from "./Contact"
import About from "./About"
import Services from "./Services"

import ErrorBoundary from "./ErrorBoundary"
import { Helmet } from "react-helmet-async";

const Home = () => {
    return (
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
            <Helmet>
                <title>John Wellard | Full-Stack Blockchain Engineer & Security Auditor</title>
                <meta name="description" content="Portfolio of John Wellard (JW3B). Expert in Smart Contract Security, Full-Stack dApp Development, and Web3 Architecture. View audits and projects." />
            </Helmet>
            <Navbar />
            <ErrorBoundary>
                <Hero />
            </ErrorBoundary>
            <AuditStats />
            <About />
            <Services />
            <Experience />
            <Projects />
            <Education />
            <Certifications />
            <Contact />
        </div>
    );
};

export default Home;
