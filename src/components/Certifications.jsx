import { CERTIFICATIONS } from "../constants";
import { COLORS } from "../constants/colors";
import { motion } from "framer-motion";
import { useState } from "react";
import {
    Shield, Kanban, Database, ExternalLink, CheckCircle, Clock, ArrowRight,
    Code2, Link, Server, Award, Layers, CircleDot, Network
} from "lucide-react";

const tabConfig = {
    blockchain: {
        color: COLORS.purple,
        icon: Shield,
        label: "Blockchain & Web3"
    },
    pm: {
        color: COLORS.orange,
        icon: Kanban,
        label: "Project Management"
    },
    infrastructure: {
        color: COLORS.green,
        icon: Database,
        label: "Infrastructure & Data"
    }
};

// Provider icon and color mapping
const providerConfig = {
    cyfrin: { icon: Shield, color: "#a855f7", label: "Cyfrin" },       // purple
    dapp: { icon: Code2, color: "#22d3ee", label: "Dapp" },            // cyan
    chainlink: { icon: Link, color: "#3b82f6", label: "Chainlink" },   // blue
    comptia: { icon: Server, color: "#22c55e", label: "CompTIA" },     // green
    apmg: { icon: Award, color: "#f97316", label: "APMG" },            // orange
    axelos: { icon: Layers, color: "#f97316", label: "AXELOS" },       // orange
    microsoft: { icon: Layers, color: "#3b82f6", label: "Microsoft" }, // blue
    neo4j: { icon: CircleDot, color: "#22c55e", label: "Neo4j" },      // green
    agile: { icon: Kanban, color: "#f97316", label: "Agile" },         // orange
    duxbury: { icon: Network, color: "#22d3ee", label: "Duxbury" }     // cyan
};

const ProviderIcon = ({ iconKey, size = 14 }) => {
    const config = providerConfig[iconKey] || { icon: Award, color: "#a8a29e" };
    const IconComponent = config.icon;
    return <IconComponent size={size} style={{ color: config.color }} />;
};

const Certifications = () => {
    const [activeTab, setActiveTab] = useState("blockchain");
    const currentConfig = tabConfig[activeTab];

    const filteredCerts = CERTIFICATIONS.filter(cert => cert.category === activeTab);
    const inProgress = filteredCerts.filter(c => c.status.includes("Progress"));
    const completed = filteredCerts.filter(c => c.status === "Completed");
    const upNext = filteredCerts.filter(c => c.status === "Up Next");

    return (
        <div className="pb-24" id="certifications">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 mt-8"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-rose-500/30 bg-rose-500/10"
                >
                    <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span className="text-xs font-mono text-rose-400 uppercase tracking-wider">
                        Credentials
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">Certifications & </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Training
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    Verified credentials demonstrating expertise across blockchain security, project delivery, and infrastructure—from industry-recognized providers including Cyfrin, APMG, and CompTIA.
                </p>
            </motion.div>

            <div className="max-w-6xl mx-auto px-4">
                {/* Statistics Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10"
                >
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border border-white/10 bg-white/5">
                        <span className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                            {CERTIFICATIONS.length}
                        </span>
                        <span className="text-xs md:text-sm text-stone-400 font-mono">Total</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border border-green-500/20 bg-green-500/5">
                        <span className="text-2xl md:text-3xl font-bold text-green-400">
                            {CERTIFICATIONS.filter(c => c.status === "Completed").length}
                        </span>
                        <span className="text-xs md:text-sm text-stone-400 font-mono">Completed</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                        <span className="text-2xl md:text-3xl font-bold text-purple-400">
                            {CERTIFICATIONS.filter(c => c.status.includes("Progress")).length}
                        </span>
                        <span className="text-xs md:text-sm text-stone-400 font-mono">In Progress</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                        <span className="text-2xl md:text-3xl font-bold text-cyan-400">
                            {CERTIFICATIONS.filter(c => c.status.includes("Up Next")).length}
                        </span>
                        <span className="text-xs md:text-sm text-stone-400 font-mono">Upcoming</span>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {Object.entries(tabConfig).map(([id, config]) => {
                        const Icon = config.icon;
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className="px-5 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2"
                                style={{
                                    backgroundColor: isActive ? `${config.color.primary}15` : 'rgba(255,255,255,0.05)',
                                    borderColor: isActive ? config.color.primary : 'rgba(255,255,255,0.1)',
                                    color: isActive ? config.color.primary : '#a8a29e',
                                    boxShadow: isActive ? `0 0 20px ${config.color.glow}` : 'none'
                                }}
                            >
                                <Icon size={16} />
                                <span className="font-mono text-sm tracking-wide">{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-12"
                >
                    {/* In Progress Section */}
                    {inProgress.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-5 h-5 text-purple-400" />
                                <h3 className="text-lg font-bold text-white">Currently Pursuing</h3>
                                <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                                    {inProgress.length}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {inProgress.map((cert, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-5"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-lg mb-1">{cert.name}</h4>
                                                <p className="text-sm text-stone-400 font-mono mb-3 flex items-center gap-1.5">
                                                    <ProviderIcon iconKey={cert.icon} size={14} />
                                                    {cert.provider}
                                                    {cert.year && <span className="text-stone-600 mx-2">•</span>}
                                                    {cert.year && <span>{cert.year}</span>}
                                                </p>
                                                {cert.skills && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {cert.skills.map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full md:w-48">
                                                <div className="flex justify-between text-xs font-mono text-purple-400 mb-1.5">
                                                    <span className="font-medium">Progress</span>
                                                    <span className="font-bold">{cert.progress}%</span>
                                                </div>
                                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                                                        style={{
                                                            width: `${cert.progress}%`,
                                                            boxShadow: '0 0 12px rgba(167, 139, 250, 0.5)'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Completed Section */}
                    {completed.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <h3 className="text-lg font-bold text-white">Completed</h3>
                                <span className="text-xs font-mono text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                                    {completed.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completed.map((cert, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 p-5"
                                    >
                                        {/* Verified badge */}
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle className="w-4 h-4 text-green-400/70" />
                                        </div>

                                        {/* Provider badge */}
                                        <div
                                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono mb-3"
                                            style={{
                                                backgroundColor: `${providerConfig[cert.icon]?.color || currentConfig.color.primary}15`,
                                                color: providerConfig[cert.icon]?.color || currentConfig.color.primary,
                                                borderColor: `${providerConfig[cert.icon]?.color || currentConfig.color.primary}30`,
                                                border: '1px solid'
                                            }}
                                        >
                                            <ProviderIcon iconKey={cert.icon} size={12} />
                                            {cert.provider}
                                        </div>

                                        <h4 className="font-bold text-white mb-1 pr-6 group-hover:text-green-400 transition-colors">
                                            {cert.name}
                                        </h4>
                                        <p className="text-xs text-stone-500 font-mono mb-3">
                                            {cert.year}
                                        </p>

                                        {/* Skills */}
                                        {cert.skills && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {cert.skills.slice(0, 3).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-stone-400 border border-white/10"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Verify link */}
                                        {cert.verifyUrl && (
                                            <a
                                                href={cert.verifyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-green-400 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                <span>Verify</span>
                                            </a>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Up Next Section */}
                    {upNext.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <ArrowRight className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-lg font-bold text-white">Up Next</h3>
                                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                                    {upNext.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {upNext.map((cert, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group relative overflow-hidden rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 hover:border-cyan-500/40 transition-all"
                                    >
                                        <h4 className="font-semibold text-white text-sm mb-1">{cert.name}</h4>
                                        <p className="text-xs text-stone-500 font-mono mb-2 flex items-center gap-1">
                                            <ProviderIcon iconKey={cert.icon} size={12} />
                                            {cert.provider}
                                        </p>
                                        {cert.skills && (
                                            <div className="flex flex-wrap gap-1">
                                                {cert.skills.slice(0, 2).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Certifications;
