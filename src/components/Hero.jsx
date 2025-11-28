import profilePic from "../assets/johnWellardProfile.png";
import digitalFortress from "../assets/digital_fortress.png";
import { HERO_CONTENT } from "../constants";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Hero = () => {
    const [text, setText] = useState("");
    const roles = ["Smart Contract Auditor", "DeFi Protocol Engineer", "zk-L2 Specialist"];
    const [roleIndex, setRoleIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center pt-28 lg:pt-0 relative z-10">
            <div className="flex flex-wrap lg:flex-nowrap items-center w-full gap-10 lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-1/2 order-2 lg:order-1"
                >
                    <div className="flex flex-col items-center lg:items-start">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-mono text-cyan-400 border border-cyan-400/30 rounded-full bg-cyan-400/5 animate-pulse-glow"
                        >
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            Available for Audits
                        </motion.div>

                        <h1 className="pb-4 text-5xl font-bold tracking-tighter lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-white via-stone-200 to-stone-400 glitch-effect">
                            John Wellard
                        </h1>

                        <div className="h-12 mb-6 flex items-center">
                            <span className="text-2xl lg:text-3xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">
                                &gt; {text}
                            </span>
                            <span className="text-cyan-400 animate-pulse ml-1">_</span>
                        </div>

                        <p className="my-2 max-w-xl py-6 text-lg leading-relaxed text-stone-400 border-l-2 border-cyan-400/20 pl-6">
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="/resume.pdf"
                                download
                                className="px-8 py-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all font-mono text-cyan-400 tracking-wide"
                            >
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
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm">
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
                                    <div className="mt-1 text-stone-400">LOC: UK // EARTH</div>
                                </div>
                                <div className="font-mono text-xs text-purple-400 bg-black/60 px-3 py-1 rounded backdrop-blur-md border border-purple-400/20 text-right">
                                    <div>ID: JW3B</div>
                                    <div className="mt-1 text-stone-400">LVL: 99</div>
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
