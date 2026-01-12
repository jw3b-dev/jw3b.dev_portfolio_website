import { EXPERIENCES } from "../constants";
import { themeColorStrings } from "../constants/colors";
import { motion } from "framer-motion";
import Technologies from "./Technologies";
import CyberDNA from "./CyberDNA";
import CyberNode from "./CyberNode";
import { Briefcase, Calendar } from "lucide-react";

const themeColors = themeColorStrings;

const Experience = () => {
    return (
        <section className="pb-24 relative flex flex-col" id="experience">
            {/* Tech Stack Section - Clear Background */}
            <Technologies />

            {/* Header */}
            <motion.div
                id="career"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 mt-8 relative z-10 scroll-mt-32"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-orange-500/30 bg-orange-500/10"
                >
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-xs font-mono text-orange-400 uppercase tracking-wider">
                        Career Path
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">My </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Experience
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    15+ years of project leadership now channeled into blockchain—transitioning from enterprise delivery into smart contract development and security learning.
                </p>
            </motion.div>

            {/* Experience Timeline - With Neural Helix Background */}
            <div className="relative overflow-hidden pt-12">
                <div className="absolute inset-x-0 top-0 bottom-32 z-0 pointer-events-none">
                    <CyberDNA />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 w-full">
                    {EXPERIENCES.map((experience, index) => {
                        const themeClass = themeColors[experience.color] || themeColors.purple;
                        const [textColor, borderColor, bgColor, shadowColor] = themeClass.split(" ");

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`mb-32 flex flex-col lg:flex-row gap-8 lg:gap-0 relative z-10 ${index % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Timeline Node - Holographic Port */}
                                <div className="absolute left-[28px] lg:left-1/2 top-6 -translate-x-1/2 z-20">
                                    <CyberNode theme={experience.color} />
                                </div>

                                {/* Date - Desktop */}
                                <div className={`hidden lg:flex w-1/2 px-12 lg:px-24 items-start pt-8 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`flex items-center gap-2 font-mono text-sm border px-4 py-2 rounded-full backdrop-blur-sm ${themeClass.replace(/shadow-\S+/, '')}`}>
                                        <Calendar size={14} />
                                        {experience.year}
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className="w-full lg:w-1/2 pl-20 lg:px-24">
                                    {/* Date - Mobile */}
                                    <div className="lg:hidden mb-4 pl-2">
                                        <div className={`inline-flex items-center gap-2 font-mono text-xs border px-3 py-1.5 rounded-full backdrop-blur-sm ${themeClass.replace(/shadow-\S+/, '')}`}>
                                            <Calendar size={12} />
                                            {experience.year}
                                        </div>
                                    </div>

                                    <motion.div
                                        className="glass-panel p-8 rounded-2xl relative overflow-hidden group"
                                        whileHover={{ md: { y: -5 } }}
                                    >
                                        {/* Content */}
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className={`font-bold text-2xl text-white transition-colors group-hover:${textColor.split('-')[1]}-300`}>
                                                    {experience.role}
                                                </h3>
                                                <Briefcase
                                                    size={20}
                                                    className={`mt-1 transition-colors ${textColor}`}
                                                />
                                            </div>

                                            <p className="mb-6 text-sm font-mono tracking-wide text-stone-400 group-hover:text-white transition-colors">
                                                {experience.company}
                                            </p>

                                            <p className={`mb-6 text-stone-300 text-sm leading-relaxed border-l-2 pl-4 ${borderColor}`}>
                                                {experience.description}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {experience.technologies.map((tech, i) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors cursor-default ${themeClass.replace(/shadow-\S+/, '')}`}
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

export default Experience;
