import { PROJECTS } from "../constants";
import { COLORS } from "../constants/colors";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Phase badge configuration - highly visible
const PHASE_CONFIG = {
    live: { label: "LIVE", color: "#22c55e", bgColor: "rgba(0, 0, 0, 0.85)" },
    building: { label: "BUILDING", color: "#3b82f6", bgColor: "rgba(0, 0, 0, 0.85)" },
    mvp: { label: "MVP", color: "#eab308", bgColor: "rgba(0, 0, 0, 0.85)" },
    concept: { label: "CONCEPT", color: "#a855f7", bgColor: "rgba(0, 0, 0, 0.85)" }
};

// Tech category colors (matching Technologies section)
const TECH_COLORS = {
    // Protocol Core (purple)
    "Solidity": "#a855f7",
    "Foundry": "#a855f7",
    "ERC-6551": "#a855f7",
    "ERC-4337": "#a855f7",
    "Base L2": "#a855f7",
    "DeFi": "#a855f7",
    // Security Tools (rose)
    "Security Auditing": "#f43f5e",
    "Slither": "#f43f5e",
    "Aderyn": "#f43f5e",
    "Echidna": "#f43f5e",
    "Certora": "#f43f5e",
    // dApp Interface (cyan)
    "React": "#06b6d4",
    "Next.js": "#06b6d4",
    "TypeScript": "#06b6d4",
    "Tailwind": "#06b6d4",
    "Viem/Ethers": "#06b6d4",
    // Infrastructure (green)
    "IPFS": "#22c55e",
    "The Graph": "#22c55e",
    "Layer 2s": "#22c55e",
};

const Projects = () => {
    return (
        <div className="min-h-[calc(100vh-10rem)] pb-24 flex flex-col" id="projects">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 mt-8"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10"
                >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                        Proof of Work
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">Selected </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Projects
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    Projects and protocols that demonstrate my security-first mindset and practical approach to solving complex Web3 challenges.
                </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {PROJECTS.map((project, index) => {
                    const projectColor = COLORS[project.color] || COLORS.cyan;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative rounded-2xl overflow-hidden glass-panel h-full flex flex-col"
                            style={{
                                borderColor: `${projectColor.primary}20`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = `${projectColor.primary}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = `${projectColor.primary}20`;
                            }}
                        >
                            {/* Image Container */}
                            <div className="relative h-56 overflow-hidden shrink-0 bg-black/40">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent z-10 opacity-70"></div>
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                {/* Phase Badge - High Visibility */}
                                {project.phase && PHASE_CONFIG[project.phase] && (
                                    <div
                                        className="absolute top-3 left-3 z-50 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest uppercase border-2 shadow-xl"
                                        style={{
                                            backgroundColor: PHASE_CONFIG[project.phase].bgColor,
                                            color: PHASE_CONFIG[project.phase].color,
                                            borderColor: PHASE_CONFIG[project.phase].color,
                                            boxShadow: `0 0 20px ${PHASE_CONFIG[project.phase].color}60, 0 4px 12px rgba(0,0,0,0.5)`,
                                            textShadow: `0 0 8px ${PHASE_CONFIG[project.phase].color}`
                                        }}
                                    >
                                        {PHASE_CONFIG[project.phase].label}
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 z-30">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                                        style={{
                                            backgroundColor: projectColor.primary,
                                            boxShadow: `0 0 12px ${projectColor.glow}`
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 relative z-20 flex flex-col flex-grow">
                                <h3
                                    className="mb-3 font-bold text-xl text-white transition-colors flex items-center gap-2"
                                    style={{ '--hover-color': projectColor.primary }}
                                >
                                    {project.title}
                                </h3>

                                <p className="mb-6 text-stone-300 text-sm leading-relaxed line-clamp-3">
                                    {project.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                                    {project.technologies.map((tech, techIndex) => {
                                        const techColor = TECH_COLORS[tech] || projectColor.primary;
                                        return (
                                            <span
                                                key={techIndex}
                                                className="px-2.5 py-1 text-[11px] font-mono font-medium rounded border"
                                                style={{
                                                    color: techColor,
                                                    backgroundColor: `${techColor}15`,
                                                    borderColor: `${techColor}30`
                                                }}
                                            >
                                                {tech}
                                            </span>
                                        );
                                    })}
                                </div>

                                {project.link && (
                                    project.external ? (
                                        <a
                                            href={project.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg border transition-all group/link w-full"
                                            style={{
                                                borderColor: `${projectColor.primary}30`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = `${projectColor.primary}20`;
                                                e.currentTarget.style.borderColor = `${projectColor.primary}50`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.borderColor = `${projectColor.primary}30`;
                                            }}
                                        >
                                            <span>{project.buttonText || 'View Project'}</span>
                                            <span className="transform group-hover/link:translate-x-1 transition-transform">→</span>
                                        </a>
                                    ) : (
                                        <Link
                                            to={project.link}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg border transition-all group/link w-full"
                                            style={{
                                                borderColor: `${projectColor.primary}30`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = `${projectColor.primary}20`;
                                                e.currentTarget.style.borderColor = `${projectColor.primary}50`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.borderColor = `${projectColor.primary}30`;
                                            }}
                                        >
                                            <span>{project.buttonText || 'View Project'}</span>
                                            <span className="transform group-hover/link:translate-x-1 transition-transform">→</span>
                                        </Link>
                                    )
                                )}
                            </div>

                            {/* Hover Glow Effect - Project Color */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `linear-gradient(135deg, ${projectColor.primary}10, transparent, ${projectColor.primary}05)`
                                }}
                            ></div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Projects;
