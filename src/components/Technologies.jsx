import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Tech Icons
import {
    SiSolidity, SiRust, SiReact, SiNextdotjs, SiTypescript,
    SiTailwindcss, SiPython, SiTensorflow, SiOpencv,
    SiGraphql, SiIpfs, SiChainlink
} from "react-icons/si";
import {
    FaCode, FaShieldAlt, FaDatabase, FaNetworkWired,
    FaCogs, FaLock, FaBug, FaKey, FaRobot, FaWallet,
    FaLayerGroup, FaLink, FaFileContract, FaIdCard,
    FaCubes, FaBrain, FaServer, FaDesktop, FaCoins
} from "react-icons/fa";

/*
  TECHNOLOGIES SECTION
  Premium visual style with 3D effects, animations, and skill indicators
*/

const TECH_CATEGORIES = [
    {
        name: "Protocol Core",
        color: "#a855f7", // purple
        icon: FaCubes,
        description: "Building smart contracts with a focus on security-first development patterns.",
        techs: [
            { name: "Solidity", icon: SiSolidity, level: 3, type: "Smart Contract Language", usedIn: "DeFi, DAOs, NFTs", learning: true, linkedProject: "devguild" },
            { name: "Rust", icon: SiRust, level: 1, type: "Systems Language", usedIn: "Solana, Substrate" },
            { name: "Movement", icon: FaCode, level: 1, type: "VM Architecture", usedIn: "Sui, Aptos" },
            { name: "Vyper", icon: FaCode, level: 2, type: "Pythonic Contracts", usedIn: "Curve, Yearn" },
            { name: "Huff", icon: FaCode, level: 1, type: "EVM Assembly", usedIn: "Gas Optimization" },
            { name: "Yul", icon: FaCode, level: 2, type: "Inline Assembly", usedIn: "Storage Patterns" },
        ]
    },
    {
        name: "AI & Agents",
        color: "#f97316", // orange
        icon: FaBrain,
        description: "Exploring AI agents for on-chain automation and smart contract analysis.",
        techs: [
            { name: "Python", icon: SiPython, level: 4, type: "Scripting Language", usedIn: "ML, Agents, APIs" },
            { name: "AI Agents", icon: FaRobot, level: 2, type: "Autonomous Systems", usedIn: "On-chain Actions", learning: true },
            { name: "LangChain", icon: FaCogs, level: 2, type: "LLM Framework", usedIn: "Chatbots, RAG", learning: true },
            { name: "TensorFlow", icon: SiTensorflow, level: 2, type: "Deep Learning", usedIn: "Predictive Models" },
            { name: "OpenCV", icon: SiOpencv, level: 2, type: "Computer Vision", usedIn: "NFT Verification" },
        ]
    },
    {
        name: "Security Tools",
        color: "#f43f5e", // rose
        icon: FaShieldAlt,
        description: "Learning security auditing with static analysis, fuzzing, and formal verification.",
        techs: [
            { name: "Foundry", icon: FaShieldAlt, level: 3, type: "Testing Framework", usedIn: "Fuzzing, Deploy", learning: true, linkedProject: "audit-brave" },
            { name: "Slither", icon: FaBug, level: 3, type: "Static Analyzer", usedIn: "Vuln Detection", learning: true, linkedProject: "audit-brave" },
            { name: "Aderyn", icon: FaBug, level: 2, type: "AST Analyzer", usedIn: "Deep Analysis", learning: true },
            { name: "Echidna", icon: FaLock, level: 2, type: "Property Fuzzer", usedIn: "Invariant Testing", learning: true },
            { name: "Medusa", icon: FaBug, level: 2, type: "Parallel Fuzzer", usedIn: "Stress Testing", learning: true },
            { name: "Certora", icon: FaKey, level: 1, type: "Formal Verifier", usedIn: "Math Proofs" },
            { name: "Halmos", icon: FaShieldAlt, level: 1, type: "Symbolic Tester", usedIn: "Property Proofs" },
        ]
    },
    {
        name: "Infrastructure",
        color: "#22c55e",
        icon: FaServer,
        description: "Working with decentralized backends, subgraphs, and L2 scaling solutions.",
        techs: [
            { name: "The Graph", icon: SiGraphql, level: 2, type: "Indexing Protocol", usedIn: "Subgraphs", linkedProject: "devguild" },
            { name: "IPFS", icon: SiIpfs, level: 2, type: "Decentralized Storage", usedIn: "Metadata, Assets" },
            { name: "ZK Proofs", icon: FaNetworkWired, level: 1, type: "Privacy Layer", usedIn: "Rollups, Identity" },
            { name: "Layer 2s", icon: FaLayerGroup, level: 3, type: "Scaling Solution", usedIn: "Arbitrum, OP", linkedProject: "devguild" },
            { name: "Neo4j", icon: FaDatabase, level: 3, type: "Graph Database", usedIn: "Tx Analysis" },
        ]
    },
    {
        name: "dApp Interface",
        color: "#06b6d4",
        icon: FaDesktop,
        description: "Building Web3 frontends with React, TypeScript, and wallet integration.",
        techs: [
            { name: "React", icon: SiReact, level: 3, type: "UI Framework", usedIn: "Component UIs", linkedProject: "agilegypsy" },
            { name: "Next.js", icon: SiNextdotjs, level: 3, type: "Full-Stack React", usedIn: "SSR, APIs", linkedProject: "agilegypsy" },
            { name: "TypeScript", icon: SiTypescript, level: 3, type: "Type-Safe JS", usedIn: "All Projects" },
            { name: "Viem/Ethers", icon: FaWallet, level: 3, type: "Web3 Library", usedIn: "Wallet, Txs", learning: true, linkedProject: "devguild" },
            { name: "ERC-4337", icon: FaWallet, level: 2, type: "Account Abstraction", usedIn: "Gasless UX", learning: true },
            { name: "Tailwind", icon: SiTailwindcss, level: 4, type: "Utility CSS", usedIn: "Rapid Styling" },
        ]
    },
    {
        name: "Tokenization",
        color: "#3b82f6", // blue
        icon: FaCoins,
        description: "Exploring RWA tokenization with ERC-3643 compliance and cross-chain protocols.",
        techs: [
            { name: "ERC-3643", icon: FaFileContract, level: 2, type: "Security Token", usedIn: "RWA Identity", learning: true, linkedProject: "rental-deposit" },
            { name: "RWA", icon: FaIdCard, level: 2, type: "Asset Tokenization", usedIn: "Real Estate", learning: true, linkedProject: "rental-deposit" },
            { name: "Cross-Chain", icon: FaLink, level: 2, type: "Bridge Protocol", usedIn: "Multichain", learning: true },
            { name: "Chainlink", icon: SiChainlink, level: 3, type: "Oracle Network", usedIn: "Data Feeds", linkedProject: "devguild" },
        ]
    },
];

// Skill level labels mapping
const SKILL_LABELS = {
    1: "Novice",
    2: "Basic",
    3: "Competent",
    4: "Advanced",
    5: "Mastery"
};

// Skill level indicator component (5 dots)
const SkillLevel = ({ level, color }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
            <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                    backgroundColor: i <= level ? color : 'rgba(255,255,255,0.1)',
                    opacity: i <= level ? 1 : 0.3,
                    boxShadow: i <= level ? `0 0 5px ${color}40` : 'none'
                }}
            />
        ))}
    </div>
);

// Tech pill component
const TechPill = ({ tech, color, isHovered, onHover, onLeave }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            onMouseEnter={() => onHover(tech)}
            onMouseLeave={onLeave}
            className="group flex flex-col p-1.5 px-2 rounded-md bg-black/20 border border-white/5 transition-all duration-200 hover:bg-white/5 cursor-default"
            style={{
                borderColor: isHovered ? `${color}40` : 'rgba(255,255,255,0.05)'
            }}
            whileHover={{ y: -1 }}
        >
            <div className="flex items-center gap-1 mb-0.5">
                <tech.icon
                    className="text-sm transition-colors duration-200 shrink-0"
                    style={{ color: isHovered ? color : '#a8a29e' }}
                />
                <span className="text-xs text-stone-300 font-medium truncate">
                    {tech.name}
                </span>
                {tech.learning && (
                    <span className="text-[6px] bg-purple-500/20 text-purple-300 px-0.5 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse shrink-0">
                        L
                    </span>
                )}
            </div>
            <SkillLevel level={tech.level} color={color} />
        </motion.div>
    );
};

// Stats row component for the footer
const StatRow = ({ label, value, color, showDots, level }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500 font-medium">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-stone-300" style={{ color: value ? undefined : color }}>
                {value}
            </span>
            {showDots && <SkillLevel level={level} color={color} />}
        </div>
    </div>
);

// Main card component with 3D tilt and premium effects
const TechCard = ({ category, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    // activeItem holds either { type: 'category', data: category } or { type: 'tech', data: tech }
    const [activeItem, setActiveItem] = useState({ type: 'category', data: category });
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const timeoutRef = useRef(null);
    const CategoryIcon = category.icon;

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setRotateX(((e.clientY - centerY) / (rect.height / 2)) * -2);
        setRotateY(((e.clientX - centerX) / (rect.width / 2)) * 2);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setIsHovered(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveItem({ type: 'category', data: category });
    };

    const handleTechHover = (tech) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveItem({ type: 'tech', data: tech });
    };

    const handleTechLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setActiveItem({ type: 'category', data: category });
        }, 200);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="relative h-full"
            style={{ perspective: '1000px' }}
        >
            <motion.div
                animate={{ rotateX, rotateY, scale: isHovered ? 1.01 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="h-full"
            >
                {/* Glow effect */}
                <motion.div
                    className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-500"
                    style={{ background: category.color }}
                    animate={{ opacity: isHovered ? 0.1 : 0 }}
                />

                {/* Main card */}
                <div
                    className="relative h-full p-4 rounded-2xl border backdrop-blur-sm overflow-hidden flex flex-col"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.2))',
                        borderColor: isHovered ? `${category.color}30` : 'rgba(255,255,255,0.08)'
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 shrink-0">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                            style={{
                                background: isHovered ? `${category.color}20` : 'rgba(255,255,255,0.05)',
                                color: isHovered ? category.color : '#a8a29e'
                            }}
                        >
                            <CategoryIcon className="text-base" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-stone-200">
                                {category.name}
                            </h3>
                        </div>
                    </div>

                    {/* Category Progress Indicator */}
                    {(() => {
                        const avgLevel = category.techs.reduce((sum, t) => sum + t.level, 0) / category.techs.length;
                        const progressPercent = (avgLevel / 5) * 100;
                        return (
                            <div className="mb-2 shrink-0">
                                <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1 font-mono">
                                    <span>Proficiency</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: category.color }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                    />
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tech Grid */}
                    <div className="grid grid-cols-2 gap-1.5 mb-2 content-start flex-grow">
                        {category.techs.map((tech) => (
                            <TechPill
                                key={tech.name}
                                tech={tech}
                                color={category.color}
                                isHovered={isHovered}
                                onHover={handleTechHover}
                                onLeave={handleTechLeave}
                            />
                        ))}
                    </div>

                    {/* Stats Footer */}
                    <div
                        className="mt-auto px-2 py-2 rounded-lg transition-colors duration-300 min-h-[130px] flex flex-col justify-center"
                        style={{
                            background: isHovered ? `${category.color}10` : 'rgba(0,0,0,0.3)',
                            borderTop: `1px solid ${isHovered ? `${category.color}20` : 'rgba(255,255,255,0.05)'}`
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.type === 'tech' ? activeItem.data.name : 'category'}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="w-full"
                            >
                                {activeItem.type === 'tech' ? (
                                    <div className="space-y-2">
                                        {/* Tech Name Header */}
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                            <activeItem.data.icon
                                                className="text-sm"
                                                style={{ color: category.color }}
                                            />
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: category.color }}
                                            >
                                                {activeItem.data.name}
                                            </span>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="space-y-1.5">
                                            <StatRow
                                                label="Type:"
                                                value={activeItem.data.type}
                                                color={category.color}
                                            />
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-500 font-medium">Level:</span>
                                                <div className="flex items-center gap-2">
                                                    <SkillLevel level={activeItem.data.level} color={category.color} />
                                                    <span style={{ color: category.color }} className="font-medium">
                                                        {SKILL_LABELS[activeItem.data.level]}
                                                    </span>
                                                </div>
                                            </div>
                                            <StatRow
                                                label="Used In:"
                                                value={activeItem.data.usedIn}
                                                color={category.color}
                                            />
                                            {activeItem.data.linkedProject && (
                                                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                                                    <span className="text-stone-500 font-medium">Project:</span>
                                                    <Link
                                                        to={`/projects/${activeItem.data.linkedProject}`}
                                                        className="font-medium hover:underline transition-colors"
                                                        style={{ color: category.color }}
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <p className="text-sm text-stone-300 text-center leading-relaxed">
                                            {activeItem.data.description}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Technologies = () => {
    return (
        <section id="tech-stack" className="pt-8 pb-24 relative overflow-hidden">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, white 1px, transparent 1px),
                        linear-gradient(to bottom, white 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-purple-500/30 bg-purple-500/10">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                        Tech Stack
                    </span>
                </div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">My </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Technologies
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed mb-6">
                    The tools I'm actively learning to build secure smart contracts, understand protocol security, and develop full-stack dApps.
                </p>

                {/* Skill Level Legend */}
                <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-stone-500">
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                        <span>Novice</span>
                    </div>
                    <span className="text-stone-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                        <span>Basic</span>
                    </div>
                    <span className="text-stone-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                        <span>Competent</span>
                    </div>
                    <span className="text-stone-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                        <span>Advanced</span>
                    </div>
                    <span className="text-stone-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        </div>
                        <span>Mastery</span>
                    </div>
                </div>
            </motion.div>

            {/* Tech Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
                {TECH_CATEGORIES.map((category, index) => (
                    <TechCard
                        key={category.name}
                        category={category}
                        index={index}
                    />
                ))}
            </div>

            {/* Gradient animation keyframes */}
            <style>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    animation: gradient 4s ease infinite;
                }
            `}</style>
        </section>
    );
};

export default Technologies;
