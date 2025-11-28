import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
    return (
        <div className="pb-4 relative" id="experience">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-purple">
                    Experience
                </span>
            </motion.h2>

            <div className="relative max-w-4xl mx-auto">
                {/* Timeline Line */}
                <div className="absolute left-0 lg:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"></div>

                {EXPERIENCES.map((experience, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`mb-12 flex flex-col lg:flex-row gap-8 lg:gap-0 relative ${index % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}
                    >
                        {/* Timeline Dot */}
                        <div className="absolute left-[-5px] lg:left-1/2 lg:-translate-x-1/2 top-0 w-3 h-3 rounded-full bg-black border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10"></div>

                        {/* Date - Desktop */}
                        <div className="hidden lg:block w-1/2 px-8 text-right">
                            <span className={`inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-cyan-400 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                                {experience.year}
                            </span>
                        </div>

                        {/* Content Card */}
                        <div className="w-full lg:w-1/2 pl-8 lg:px-8">
                            {/* Date - Mobile */}
                            <div className="lg:hidden mb-2">
                                <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-cyan-400">
                                    {experience.year}
                                </span>
                            </div>

                            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors"></div>

                                <h6 className="mb-1 font-bold text-lg text-white">
                                    {experience.role}
                                </h6>
                                <p className="mb-4 text-sm font-mono text-purple-400">
                                    {experience.company}
                                </p>
                                <p className="mb-4 text-stone-400 text-sm leading-relaxed">
                                    {experience.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {experience.technologies.map((tech, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 text-[10px] font-medium text-cyan-300 bg-cyan-900/10 rounded border border-cyan-500/10"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Experience;
