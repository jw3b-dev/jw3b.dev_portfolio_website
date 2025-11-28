import { PROJECTS } from "../constants";
import { motion } from "framer-motion";

const Projects = () => {
    return (
        <div className="pb-4" id="projects">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-cyan">
                    Projects
                </span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PROJECTS.map((project, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group relative rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-cyan-400/50 transition-all duration-500"
                    >
                        {/* Image Container */}
                        <div className="relative h-48 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                            <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 right-4 z-20">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 relative z-20">
                            <h3 className="mb-3 font-bold text-xl text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                {project.title}
                            </h3>

                            <p className="mb-6 text-stone-400 text-sm leading-relaxed line-clamp-3">
                                {project.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.technologies.map((tech, techIndex) => (
                                    <span
                                        key={techIndex}
                                        className="px-2 py-1 text-[10px] font-mono font-medium text-cyan-300 bg-cyan-900/20 rounded border border-cyan-500/20"
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
                                    className="inline-flex items-center gap-2 text-sm font-mono text-white/70 hover:text-cyan-400 transition-colors group/link"
                                >
                                    <span className="border-b border-transparent group-hover/link:border-cyan-400 transition-all">View Project</span>
                                    <span className="transform group-hover/link:translate-x-1 transition-transform">→</span>
                                </a>
                            )}
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyan-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Projects;
