
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa"
import { motion } from "framer-motion"
import Logo from "./Logo"

const Navbar = () => {
    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl rounded-full glass-panel px-6 py-4 flex items-center justify-between border border-white/10 bg-black/40 backdrop-blur-xl"
        >
            <a href="#" className="flex items-center gap-2 group flex-shrink-0">
                <Logo className="h-8" />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 font-mono text-sm text-stone-300">
                {['about', 'experience', 'projects', 'contact'].map((item) => (
                    <a
                        key={item}
                        href={`#${item}`}
                        className="relative group hover:text-white transition-colors"
                    >
                        <span className="text-cyan-500/50 mr-1">&lt;</span>
                        {item}
                        <span className="text-cyan-500/50 ml-1">/&gt;</span>
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
                    </a>
                ))}
            </div>

            <div className="flex items-center justify-center gap-5 text-xl">
                <a href="https://www.linkedin.com/in/john-wellard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-stone-400 hover:text-cyan-400 transition-all hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
                    <FaLinkedin />
                </a>
                <a href="https://github.com/jw3b-dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-stone-400 hover:text-purple-400 transition-all hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(147,51,234,0.8)]">
                    <FaGithub />
                </a>
                <a href="https://twitter.com/web3byvirtuAi"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="text-stone-400 hover:text-cyan-400 transition-all hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
                    <FaTwitter />
                </a>
                <a href="https://codehawks.cyfrin.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="CodeHawks"
                    className="text-stone-400 hover:text-purple-400 transition-all hover:scale-110 text-lg font-mono font-bold hover:drop-shadow-[0_0_5px_rgba(147,51,234,0.8)]"
                    title="CodeHawks Profile">
                    🦅
                </a>
            </div>
        </motion.nav>
    )
}

export default Navbar