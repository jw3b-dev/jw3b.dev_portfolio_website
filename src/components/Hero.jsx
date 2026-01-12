import profilePic from "../assets/johnWellardProfile.webp";
import digitalFortress from "../assets/digital_fortress.webp";
import { HERO_CONTENT } from "../constants";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import ParticleCanvas from "./jw3b.devParticleCanvas";

const Hero = () => {
    const [text, setText] = useState("");
    const roles = ["Blockchain Developer", "Security Researcher", "DeFi Architect"];
    const [roleIndex, setRoleIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Services offered
    const availabilityOptions = ["Smart Contract Dev", "Security Auditing", "Full-Stack dApps", "Consulting"];

    useEffect(() => {
        const currentRole = roles[roleIndex];
        const typeSpeed = isDeleting ? 40 : 80;

        const timer = setTimeout(() => {
            if (!isDeleting && charIndex < currentRole.length) {
                setText(currentRole.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            } else if (isDeleting && charIndex > 0) {
                setText(currentRole.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else if (!isDeleting && charIndex === currentRole.length) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setRoleIndex((prev) => (prev + 1) % roles.length);
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, roleIndex, roles]);

    return (
        <div className="min-h-screen flex items-center justify-center pt-32 lg:pt-28 relative z-10 overflow-hidden">
            <ParticleCanvas />

            <div className="flex flex-wrap lg:flex-nowrap items-center w-full gap-10 lg:gap-20 max-w-6xl mx-auto relative z-20">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-1/2 order-2 lg:order-1"
                >
                    <div className="flex flex-col items-center lg:items-start">
                        {/* Status Indicator */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-xs font-mono text-green-400 border border-green-400/50 rounded-full bg-green-400/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        >
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                            <span className="font-bold tracking-wider">OPEN FOR WORK</span>
                        </motion.div>

                        {/* Animated Service Tags */}
                        <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                            {availabilityOptions.map((service, index) => (
                                <motion.span
                                    key={service}
                                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    transition={{
                                        delay: 0.8 + index * 0.15,
                                        type: "spring",
                                        stiffness: 200
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
                                    }}
                                    className="px-3 py-1 text-[11px] font-mono font-medium text-purple-300 bg-purple-500/10 rounded-full border border-purple-500/30 cursor-default hover:text-white hover:border-purple-400/60 transition-colors"
                                >
                                    {service}
                                </motion.span>
                            ))}
                        </div>

                        <h1 className="pb-2 text-5xl font-bold tracking-tighter lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-white via-stone-200 to-stone-400 glitch-effect">
                            John Wellard
                        </h1>

                        <div className="h-10 mb-3 flex items-center">
                            <span className="text-2xl lg:text-3xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">
                                &gt; {text}
                            </span>
                            <span className="text-cyan-400 animate-pulse ml-1">_</span>
                        </div>

                        <p className="max-w-xl py-4 text-lg leading-relaxed text-stone-400 border-l-2 border-cyan-400/20 pl-6">
                            {HERO_CONTENT}
                        </p>

                        <div className="flex gap-6 mt-8">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://audit.agilegypsy.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
                            >
                                VIEW AUDITS
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                href="/resume.pdf"
                                download
                                className="px-8 py-4 rounded-lg border border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400 hover:bg-cyan-400/15 transition-all font-mono text-cyan-400 tracking-wide flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                DOWNLOAD CV
                            </motion.a>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2"
                >
                    <div className="relative w-[320px] h-[320px] lg:w-[500px] lg:h-[500px] group">
                        {/* Background Elements */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse"></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-500"></div>

                        {/* Main Image Container */}
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                            <img
                                src={digitalFortress}
                                alt="Digital Fortress"
                                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                            />
                            <img
                                src={profilePic}
                                alt="John Wellard"
                                className="relative w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
                            />

                            {/* HUD Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,#000_2px)] bg-[size:100%_4px] opacity-10 pointer-events-none"></div>
                            <div className="absolute inset-0 border border-cyan-400/20 rounded-2xl"></div>

                            {/* Corner Accents */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>

                            {/* Tech Stats */}
                            <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                                <div className="font-mono text-xs text-cyan-400 bg-black/60 px-3 py-1 rounded backdrop-blur-md border border-cyan-400/20">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        STATUS: ONLINE
                                    </div>
                                    <div className="mt-1 text-stone-400">LOC: 🌍 REMOTE</div>
                                </div>
                                <div className="font-mono text-xs text-purple-400 bg-black/60 px-3 py-1 rounded backdrop-blur-md border border-purple-400/20 text-right">
                                    <div>ID: JW3B</div>
                                    <div className="mt-1 text-stone-400">LVL: DEVELOPER</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
