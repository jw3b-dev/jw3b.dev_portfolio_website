import { useParams, Link } from "react-router-dom";
import { PROJECT_DETAILS } from "../constants";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Code, Briefcase, CheckCircle, Database, Layers, ShieldCheck, FileText, ExternalLink, Calendar, GitBranch, Search } from "lucide-react";

const ProjectDetails = () => {
    const { id } = useParams();
    const project = PROJECT_DETAILS[id];
    const [viewMode, setViewMode] = useState("engineering"); // 'engineering' | 'pm'

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!project) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
                    <Link to="/" className="text-cyan-400 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-24 px-4 container mx-auto max-w-5xl relative z-10">
            {/* SEO Metadata */}
            <Helmet>
                <title>{`${project.title} | JW3B Portfolio`}</title>
                <meta name="description" content={`Case study for ${project.title}: ${project.subtitle}. Explore the engineering architecture, smart contracts, and product roadmap.`} />
            </Helmet>

            <Link to="/#projects" className="inline-flex items-center gap-2 text-stone-400 hover:text-cyan-400 mb-8 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Portfolio</span>
            </Link>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">{project.title}</h1>
                <p className="text-xl text-cyan-400 font-mono">{project.subtitle}</p>
            </motion.div>

            {/* Dual Lens Toggle */}
            <div className="flex justify-center mb-12">
                <div className="bg-white/5 border border-white/10 rounded-full p-1 inline-flex backdrop-blur-sm" role="tablist" aria-label="View Mode Toggle">
                    <button
                        onClick={() => setViewMode("engineering")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${viewMode === "engineering"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            : "text-stone-400 hover:text-white"
                            }`}
                        aria-selected={viewMode === "engineering"}
                        role="tab"
                        aria-label="Switch to Engineering View"
                    >
                        <Code size={18} aria-hidden="true" />
                        <span className="font-mono text-sm">Engineering View</span>
                    </button>
                    <button
                        onClick={() => setViewMode("pm")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${viewMode === "pm"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            : "text-stone-400 hover:text-white"
                            }`}
                        aria-selected={viewMode === "pm"}
                        role="tab"
                        aria-label="Switch to PM View"
                    >
                        <Briefcase size={18} aria-hidden="true" />
                        <span className="font-mono text-sm">PM View</span>
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="grid gap-8">
                {viewMode === "engineering" ? (
                    // Engineering Content
                    <div className="space-y-8">
                        {/* Tech Stack Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Database className="text-cyan-400" />
                                Technical Architecture
                            </h3>
                            <div className="grid gap-4">
                                {project.engineering.stack.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                        <span className="font-mono text-cyan-200 font-bold">{item.name}</span>
                                        <span className="text-stone-300">{item.details}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Key Features */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Layers className="text-cyan-400" />
                                Core Mechanics
                            </h3>
                            <ul className="space-y-3">
                                {project.engineering.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-stone-300">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Security Invariants & Deep Dive */}
                        {project.engineering.invariants && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <ShieldCheck className="text-green-400" />
                                    Security Invariants
                                </h3>
                                <ul className="space-y-3 mb-8">
                                    {project.engineering.invariants.map((inv, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-stone-300 font-mono text-sm">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                                            {inv}
                                        </li>
                                    ))}
                                </ul>

                                {project.engineering.deepDiveLink && (
                                    <a
                                        href={project.engineering.deepDiveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all group"
                                    >
                                        <FileText size={18} />
                                        <span>Read Technical Deep Dive</span>
                                        <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Live Concept Verification */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-stone-500/10 text-stone-400">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Smart Contract Verification</h4>
                                    <p className="text-stone-400 text-sm">View verified source code on Etherscan</p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-stone-500/10 border border-stone-500/20 rounded-lg text-stone-400 cursor-not-allowed group"
                            >
                                <Search size={18} />
                                <span>Verify Contracts</span>
                                <span className="ml-2 text-[10px] bg-stone-500/20 text-stone-400 border border-stone-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                    Coming Soon
                                </span>
                            </button>
                        </div>
                    </div>
                ) : (
                    // PM Content
                    <div className="space-y-8">
                        {/* Roadmap */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <CheckCircle className="text-purple-400" />
                                Project Roadmap
                            </h3>
                            <div className="space-y-4">
                                {project.pm.roadmap.map((milestone, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden">
                                        {milestone.status === "Completed" && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                                        )}
                                        {milestone.status === "Live" && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 animate-pulse" />
                                        )}
                                        {milestone.status === "In Progress" && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                                        )}

                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-mono text-xs text-stone-500 uppercase tracking-wider">{milestone.phase}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${milestone.status === "Live" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                                    milestone.status === "Completed" ? "bg-stone-500/20 text-stone-300 border-stone-500/30" :
                                                        "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                                                    }`}>
                                                    {milestone.status}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium">{milestone.item}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personas & Business Logic */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-bold text-white mb-4">Target Personas</h4>
                                <ul className="space-y-2">
                                    {project.pm.personas.map((p, idx) => (
                                        <li key={idx} className="text-stone-300 text-sm flex items-center gap-2">
                                            <span className="text-purple-400">•</span> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-bold text-white mb-4">Revenue Model</h4>
                                <p className="text-stone-300 text-sm leading-relaxed">
                                    {project.pm.businessModel}
                                </p>
                            </div>
                        </div>

                        {/* Agile Framework & Docs */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {project.pm.agileDetails && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Calendar size={64} />
                                    </div>
                                    <h4 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                                        <GitBranch size={20} />
                                        Agile Status: {project.pm.agileDetails.status}
                                    </h4>
                                    <div className="space-y-3 font-mono text-sm">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Current Sprint</span>
                                            <span className="text-white text-right">{project.pm.agileDetails.sprint}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Velocity</span>
                                            <span className="text-cyan-300">{project.pm.agileDetails.velocity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Methodology</span>
                                            <span className="text-white">{project.pm.agileDetails.methodology}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {project.pm.resources && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
                                    <h4 className="text-lg font-bold text-white mb-2">Documentation</h4>
                                    {project.pm.resources.whitepaper && (
                                        <a href={project.pm.resources.whitepaper} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all group">
                                            <span className="text-stone-300 group-hover:text-white">Whitepaper</span>
                                            <ExternalLink size={16} className="text-stone-500 group-hover:text-cyan-400" />
                                        </a>
                                    )}
                                    {project.pm.resources.useCaseAnalysis && (
                                        <a href={project.pm.resources.useCaseAnalysis} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all group">
                                            <span className="text-stone-300 group-hover:text-white">Use Case Analysis</span>
                                            <ExternalLink size={16} className="text-stone-500 group-hover:text-cyan-400" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ProjectDetails;
