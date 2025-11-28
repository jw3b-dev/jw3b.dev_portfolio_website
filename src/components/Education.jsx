import { EDUCATION } from "../constants";
import { motion } from "framer-motion";

const Education = () => {
    return (
        <div className="pb-4" id="education">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-purple">
                    Education
                </span>
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-6">
                {EDUCATION.map((edu, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="w-full max-w-xl"
                    >
                        <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-all h-full relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/10 transition-colors"></div>

                            <div className="flex justify-between items-start flex-wrap gap-4 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{edu.degree}</h3>
                                    <p className="text-lg text-stone-300 mt-2 font-mono flex items-center gap-2">
                                        <span className="text-purple-400">@</span>
                                        {edu.institution}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-stone-400 font-mono text-sm border border-white/10 px-3 py-1 rounded bg-black/30">{edu.year}</p>
                                    <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                        {edu.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Education;

