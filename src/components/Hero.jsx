import profilePic from "../assets/johnWellardProfile.webp";
import digitalFortress from "../assets/digital_fortress.webp";
import { HERO_CONTENT, HATS, HAT_ORDER } from "../constants";
import { COLORS } from "../constants/colors";
import { useState, useEffect } from "react";
import { Download, Shield, Rocket, Code2, Kanban } from "lucide-react";
import { motion } from "framer-motion";
import ParticleCanvas from "./jw3b.devParticleCanvas";
import { useAccount } from "wagmi";
import ConnectButton from "./wallet/ConnectButton";

const iconMap = { Code2, Shield, Kanban, Rocket };
// Typing line cycles the four hat titles; the static hat strip below carries
// the "all four at once" message so the identity never hides behind one role.
const ROLES = HAT_ORDER.map((id) => HATS[id].title);

const Hero = () => {
    const { isConnected } = useAccount();
    const [text, setText] = useState("");
    const [roleIndex, setRoleIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentRole = ROLES[roleIndex];
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
                setRoleIndex((prev) => (prev + 1) % ROLES.length);
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, roleIndex]);

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

                        {/* Four-hat strip — all roles lit at once, each in its hat color */}
                        <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                            {HAT_ORDER.map((id, index) => {
                                const hat = HATS[id];
                                const c = COLORS[hat.color];
                                const Icon = iconMap[hat.icon];
                                return (
                                    <motion.a
                                        key={id}
                                        href="#about"
                                        title={hat.title}
                                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        transition={{ delay: 0.8 + index * 0.12, type: "spring", stiffness: 200 }}
                                        whileHover={{ scale: 1.05 }}
                                        className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold rounded-full border cursor-pointer transition-colors"
                                        style={{
                                            color: c.primary,
                                            backgroundColor: `${c.primary}12`,
                                            borderColor: `${c.primary}40`
                                        }}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {hat.tag}
                                    </motion.a>
                                );
                            })}
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

                        <div className="flex flex-nowrap gap-3 lg:gap-4 mt-8 overflow-x-auto pb-2 scrollbar-hide">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://audit.agilegypsy.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-44 h-14 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-white/20 transition-all duration-300"
                            >
                                <Shield className="w-5 h-5" />
                                <span>AUDITS</span>
                            </motion.a>

                            <div className="relative group">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-44 h-14 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-cyan-500/30 text-cyan-400 font-bold tracking-wide hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>CV</span>
                                </motion.button>
                                <div className="absolute top-full left-0 mt-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="bg-black/95 border border-cyan-400/30 rounded-lg overflow-hidden backdrop-blur-md min-w-[160px]">
                                        <a
                                            href="/cvs/John_Wellard_Blockchain_Engineer_CV.pdf"
                                            download
                                            className="flex items-center gap-2 px-4 py-3 text-sm font-mono text-purple-400 hover:bg-purple-500/20 hover:text-white transition-colors"
                                        >
                                            <Download className="w-3 h-3" />
                                            Engineer CV
                                        </a>
                                        <a
                                            href="/cvs/John_Wellard_Web3_PM_CV.pdf"
                                            download
                                            className="flex items-center gap-2 px-4 py-3 text-sm font-mono text-green-400 hover:bg-green-500/20 hover:text-white transition-colors border-t border-white/10"
                                        >
                                            <Download className="w-3 h-3" />
                                            PM CV
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet CTA */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-44 h-14"
                            >
                                {isConnected ? (
                                    <a
                                        href="#services"
                                        className="w-full h-full flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold tracking-wide hover:bg-green-500/20 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300"
                                    >
                                        <Rocket className="w-5 h-5" />
                                        <span>BOOK NOW</span>
                                    </a>
                                ) : (
                                    <ConnectButton label="CONNECT" className="w-full h-full" />
                                )}
                            </motion.div>
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
