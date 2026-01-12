import { EDUCATION } from "../constants";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen } from "lucide-react";

const Education = () => {
    const edu = EDUCATION[0]; // Featured single degree

    return (
        <div className="pb-24" id="education">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 mt-8"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10"
                >
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                        Academic Base
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">My </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Education
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    Continuously expanding expertise through structured formal education—complementing practical blockchain development with environmental systems understanding for sustainable Web3 solutions.
                </p>
            </motion.div>

            {/* Featured Education Card */}
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
                >
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />

                    {/* Content */}
                    <div className="relative p-8 md:p-12">
                        {/* Icon and Status */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <GraduationCap className="w-8 h-8 text-purple-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 animate-pulse-glow">
                                        IN PROGRESS
                                    </span>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-stone-500">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm font-mono">{edu.year}</span>
                            </div>
                        </div>

                        {/* Degree Title */}
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {edu.degree}
                        </h3>
                        <p className="text-lg text-stone-400 font-mono mb-6">
                            {edu.institution}
                        </p>

                        {/* Progress Section */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm font-mono mb-2">
                                <span className="text-purple-400 font-medium">Progress</span>
                                <span className="text-purple-300 font-bold">{edu.progress}%</span>
                            </div>
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${edu.progress}%` }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    viewport={{ once: true }}
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                                    style={{ boxShadow: '0 0 20px rgba(167, 139, 250, 0.5)' }}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        {edu.description && (
                            <p className="text-stone-400 italic mb-6 border-l-2 border-purple-500/50 pl-4">
                                "{edu.description}"
                            </p>
                        )}

                        {/* Skills */}
                        {edu.skills && (
                            <div>
                                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-3 block">
                                    Skills Being Developed
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {edu.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 text-stone-300 border border-white/10"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mobile year display */}
                        <div className="md:hidden mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-stone-500">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm font-mono">{edu.year}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Education;
