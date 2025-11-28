import { EDUCATION } from "../constants";
import { motion } from "framer-motion";

const Education = () => {
    return (
        <div className="pb-4" id="education">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
                        <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-cyan-400/30 transition-all h-full">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{edu.degree}</h3>
                                    <p className="text-lg text-cyan-400 mt-1 font-mono">{edu.institution}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-stone-400 font-mono text-sm">{edu.year}</p>
                                    <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
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

