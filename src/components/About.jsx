import aboutImg from "../assets/about.webp";
import { ABOUT_TEXT } from "../constants";
import { motion } from "framer-motion";

const About = () => {
    return (
        <div className="pb-4" id="about">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-purple">
                    About Me
                </span>
            </motion.h2>
            <div className="flex flex-wrap items-center">
                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2 lg:p-8 mb-8 lg:mb-0"
                >
                    <div className="flex items-center justify-center">
                        <div className="relative group w-full max-w-md">
                            {/* Tech Borders */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>

                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                                <img
                                    className="w-full h-auto filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
                                    src={aboutImg}
                                    alt="about"
                                />

                                {/* Overlay Elements */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.2)_2px)] bg-[size:100%_4px] pointer-events-none"></div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2"
                >
                    <div className="flex justify-center lg:justify-start h-full items-center">
                        <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-cyan-400/30 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>

                            <h3 className="text-xl font-mono text-cyan-400 mb-4">&gt; WHO_AM_I?</h3>

                            <p className="my-2 max-w-xl font-mono text-stone-300 leading-relaxed text-sm lg:text-base">
                                {ABOUT_TEXT}
                                <span className="animate-pulse inline-block w-2 h-4 bg-cyan-400 ml-1 align-middle shadow-[0_0_5px_rgba(6,182,212,0.8)]"></span>
                            </p>

                            <div className="mt-6 flex gap-4">
                                <div className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300">
                                    #AUDITOR
                                </div>
                                <div className="px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300">
                                    #DEVELOPER
                                </div>
                                <div className="px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-300">
                                    #RESEARCHER
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
