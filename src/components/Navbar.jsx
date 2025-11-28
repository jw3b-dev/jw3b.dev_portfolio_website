import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa"
import logo from "../assets/jw3b_logo.png"

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-4 px-8 glass-panel border-b border-white/5 bg-black/50 backdrop-blur-md">
            <div className="flex flex-shrink-0 items-center">
                <a href="/" aria-label="Home" className="group">
                    <img
                        src={logo}
                        className="w-24 rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        alt="jw3b.dev logo"
                    />
                </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 font-mono text-sm text-stone-300">
                <a href="#about" className="hover:text-cyan-400 transition-colors">/about</a>
                <a href="#experience" className="hover:text-cyan-400 transition-colors">/experience</a>
                <a href="#projects" className="hover:text-cyan-400 transition-colors">/projects</a>
                <a href="#contact" className="hover:text-cyan-400 transition-colors">/contact</a>
            </div>

            <div className="flex items-center justify-center gap-6 text-xl">
                <a href="https://www.linkedin.com/in/john-wellard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-stone-300 hover:text-cyan-400 transition-all hover:scale-110">
                    <FaLinkedin />
                </a>
                <a href="https://github.com/jw3b-dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-stone-300 hover:text-purple-400 transition-all hover:scale-110">
                    <FaGithub />
                </a>
                <a href="https://twitter.com/web3byvirtuAi"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="text-stone-300 hover:text-cyan-400 transition-all hover:scale-110">
                    <FaTwitter />
                </a>
                <a href="https://codehawks.cyfrin.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="CodeHawks"
                    className="text-stone-300 hover:text-purple-400 transition-all hover:scale-110 text-lg font-mono font-bold"
                    title="CodeHawks Profile">
                    🦅
                </a>
            </div>
        </nav>
    )
}

export default Navbar