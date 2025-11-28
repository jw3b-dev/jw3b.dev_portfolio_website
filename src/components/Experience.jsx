import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
    return (
        <div className="pb-4" id="experience">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Experience
                </span>
            </motion.h2>
            <div>
                {EXPERIENCES.map((experience, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="mb-8 flex flex-wrap lg:justify-center"
                    >
                        <div className="w-full lg:w-1/4">
                            <p className="mb-2 text-sm text-stone-400 font-mono border-l-2 border-cyan-400 pl-4 py-1">
                                {experience.year}
                            </p>
                        </div>
                        <div className="w-full max-w-xl lg:w-3/4">
                            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                <h6 className="mb-2 font-semibold">
                                    {experience.role} -{" "}
                                    <span className="text-sm text-purple-400">
                                        {experience.company}
                                    </span>
                                </h6>
                                <p className="mb-4 text-stone-400 text-sm leading-relaxed">
                                    {experience.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {experience.technologies.map((tech, index) => (
                                        <span
                                            key={index}
                                            className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-cyan-400 border border-white/10"
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
