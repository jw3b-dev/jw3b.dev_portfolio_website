import profilePic from "../assets/johnWellardProfile.jpg";
import { HERO_CONTENT } from "../constants";
import { useState, useEffect } from "react";

const Hero = () => {
    const [text, setText] = useState("");
    const roles = ["Smart Contract Auditor", "DeFi Protocol Engineer", "zk-L2 Specialist"];
    const [roleIndex, setRoleIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentRole = roles[roleIndex];
        const typeSpeed = isDeleting ? 50 : 100;

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
        <div className="min-h-screen flex items-center justify-center pt-20 lg:pt-0">
            <div className="flex flex-wrap lg:flex-nowrap items-center w-full gap-10">
                <div className="w-full lg:w-1/2 order-2 lg:order-1">
                    <div className="flex flex-col items-center lg:items-start">
                        <div className="inline-block px-3 py-1 mb-4 text-xs font-mono text-cyan-400 border border-cyan-400/30 rounded-full bg-cyan-400/10">
                            Available for Audits
                        </div>
                        <h1 className="pb-4 text-5xl font-bold tracking-tighter lg:text-7xl">
                            John Wellard
                        </h1>
                        <div className="h-12 mb-6">
                            <span className="text-2xl lg:text-3xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                                {text}
                            </span>
                            <span className="text-cyan-400 animate-pulse">|</span>
                        </div>
                        <p className="my-2 max-w-xl py-6 text-lg leading-relaxed text-stone-400">
                            {HERO_CONTENT}
                        </p>
                        <div className="flex gap-6 mt-8">
                            <a
                                href="https://audit.agilegypsy.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-1"
                            >
                                View Audits
                            </a>
                            <a
                                href="/resume.pdf"
                                download
                                className="px-8 py-3 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all font-mono text-cyan-400"
                            >
                                Download CV
                            </a>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2">
                    <div className="relative w-[300px] h-[300px] lg:w-[450px] lg:h-[450px] group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                            <img
                                src={profilePic}
                                alt="John Wellard"
                                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                            {/* Tech Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="font-mono text-xs text-cyan-400">
                                    <div>STATUS: ONLINE</div>
                                    <div>LOC: UK</div>
                                </div>
                                <div className="font-mono text-xs text-purple-400">
                                    <div>ID: JW3B</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
