import { PROJECTS } from "../constants";
import { motion } from "framer-motion";

const Projects = () => {
    return (
        <div className="pb-4" id="projects">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Projects
                </span>
            </motion.h2>
            <div>
                {PROJECTS.map((project, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="mb-8 flex flex-wrap lg:justify-center group"
                    >
                        <div className="w-full lg:w-1/4">
                            <div className="relative mb-6 rounded-xl overflow-hidden">
                                <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="w-full h-auto rounded-xl border border-white/10 group-hover:scale-105 transition-transform duration-500"
                                    width={250}
                                    height={250}
                                />
                            </div>
                        </div>
                        <div className="w-full max-w-xl lg:w-3/4">
                            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-cyan-400/30 transition-all h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="mb-2 font-semibold text-2xl text-white group-hover:text-cyan-400 transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="mb-4 text-stone-400 leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.technologies.map((tech, techIndex) => (
                                            <span
                                                key={techIndex}
                                                className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-purple-300 border border-white/10"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    {project.link && (
                                        <a
                                            href={project.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono"
                                        >
                                            View Project <span className="text-lg">→</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Projects;
