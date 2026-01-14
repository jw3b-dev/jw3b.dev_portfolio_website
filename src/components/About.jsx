import { useState } from "react";
import { ROLE_PROFILES, ABOUT_INTRO } from "../constants";
import { COLORS } from "../constants/colors";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Kanban, Shield, Rocket } from "lucide-react";

const roleOrder = ["engineer", "pm", "auditor", "founder"];

const iconMap = {
    Code2: Code2,
    Kanban: Kanban,
    Shield: Shield,
    Rocket: Rocket
};

const colorClasses = {
    cyan: {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        text: "text-cyan-300",
        glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        activeBg: "bg-cyan-500/20",
        activeBorder: "border-cyan-400",
        gradient: "from-cyan-500 to-cyan-600"
    },
    green: {
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        text: "text-green-300",
        glow: "shadow-[0_0_15px_rgba(34,197,94,0.4)]",
        activeBg: "bg-green-500/20",
        activeBorder: "border-green-400",
        gradient: "from-green-500 to-green-600"
    },
    purple: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-300",
        glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        activeBg: "bg-purple-500/20",
        activeBorder: "border-purple-400",
        gradient: "from-purple-500 to-purple-600"
    },
    orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-300",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        activeBg: "bg-orange-500/20",
        activeBorder: "border-orange-400",
        gradient: "from-orange-500 to-orange-600"
    },
    blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-300",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]",
        activeBg: "bg-blue-500/20",
        activeBorder: "border-blue-400",
        gradient: "from-blue-500 to-blue-600"
    },
    rose: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-300",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        activeBg: "bg-rose-500/20",
        activeBorder: "border-rose-400",
        gradient: "from-rose-500 to-rose-600"
    }
};

const About = () => {
    const [activeRole, setActiveRole] = useState("engineer");
    const currentRole = ROLE_PROFILES[activeRole];
    const colors = colorClasses[currentRole.color];
    const Icon = iconMap[currentRole.icon];

    return (
        <div className="min-h-[calc(100vh-10rem)] pb-24 flex flex-col" id="about">
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
                        Identity
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">Who </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        I Am
                    </span>
                </h2>

                {/* Section Description */}
                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    {ABOUT_INTRO}
                </p>
            </motion.div>

            <div className="flex flex-wrap items-stretch max-w-6xl mx-auto flex-grow px-6">
                {/* Dynamic Image */}
                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2 lg:p-4 mb-8 lg:mb-0 flex h-[480px]"
                >
                    <div className="flex items-stretch justify-center w-full h-full">
                        <div className="relative group w-full h-full">
                            {/* Tech Borders - Dynamic Color */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeRole + "-glow"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} rounded-2xl blur opacity-20 group-hover:opacity-50 transition-opacity duration-500`}
                                ></motion.div>
                            </AnimatePresence>

                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 h-full">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeRole + "-image"}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full object-cover filter contrast-110 group-hover:contrast-100 transition-all duration-500"
                                        src={currentRole.image}
                                        alt={currentRole.title}
                                    />
                                </AnimatePresence>

                                {/* Overlay Elements */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.2)_2px)] bg-[size:100%_4px] pointer-events-none"></div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>

                                {/* Persona Label - High Visibility */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeRole + "-badge"}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute bottom-4 left-4 z-50"
                                    >
                                        <div
                                            className="px-4 py-2 rounded-lg text-sm font-mono font-bold tracking-widest uppercase border-2"
                                            style={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                                color: currentRole.color === 'cyan' ? '#06b6d4' :
                                                    currentRole.color === 'green' ? '#22c55e' :
                                                        currentRole.color === 'purple' ? '#a855f7' :
                                                            currentRole.color === 'orange' ? '#f97316' : '#06b6d4',
                                                borderColor: currentRole.color === 'cyan' ? '#06b6d4' :
                                                    currentRole.color === 'green' ? '#22c55e' :
                                                        currentRole.color === 'purple' ? '#a855f7' :
                                                            currentRole.color === 'orange' ? '#f97316' : '#06b6d4',
                                                boxShadow: `0 0 20px ${currentRole.color === 'cyan' ? '#06b6d4' :
                                                        currentRole.color === 'green' ? '#22c55e' :
                                                            currentRole.color === 'purple' ? '#a855f7' :
                                                                currentRole.color === 'orange' ? '#f97316' : '#06b6d4'
                                                    }60, 0 4px 12px rgba(0,0,0,0.5)`,
                                                textShadow: `0 0 8px ${currentRole.color === 'cyan' ? '#06b6d4' :
                                                        currentRole.color === 'green' ? '#22c55e' :
                                                            currentRole.color === 'purple' ? '#a855f7' :
                                                                currentRole.color === 'orange' ? '#f97316' : '#06b6d4'
                                                    }`
                                            }}
                                        >
                                            {currentRole.tag} MODE
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2 lg:p-4 flex h-[480px]"
                >
                    <div className="flex justify-center lg:justify-start h-full items-stretch w-full">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-cyan-400/30 transition-colors flex flex-col w-full h-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeRole + "-topbar"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient} shadow-lg`}
                                ></motion.div>
                            </AnimatePresence>

                            {/* Role Selector Pills */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {roleOrder.map((roleKey) => {
                                    const role = ROLE_PROFILES[roleKey];
                                    const roleColors = colorClasses[role.color];
                                    const isActive = activeRole === roleKey;
                                    const RoleIcon = iconMap[role.icon];

                                    return (
                                        <button
                                            key={roleKey}
                                            onClick={() => setActiveRole(roleKey)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300 border ${isActive
                                                ? `${roleColors.activeBg} ${roleColors.activeBorder} ${roleColors.text} ${roleColors.glow}`
                                                : `${roleColors.bg} ${roleColors.border} ${roleColors.text} hover:${roleColors.activeBg}`
                                                }`}
                                        >
                                            <RoleIcon size={14} />
                                            {role.tag}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Dynamic Title with Icon */}
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={activeRole + "-title"}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`text-xl lg:text-2xl font-semibold ${colors.text} mb-4 flex items-center gap-3`}
                                >
                                    <Icon size={20} className="opacity-70" />
                                    <span>{currentRole.title}</span>
                                </motion.h3>
                            </AnimatePresence>

                            {/* Dynamic Description - Scrollable */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeRole + "-desc"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20"
                                >
                                    <div className="text-stone-400 leading-relaxed text-base whitespace-pre-line">
                                        {currentRole.description}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Dynamic Highlights - With Colors */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeRole + "-highlights"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5"
                                >
                                    {currentRole.highlights.map((highlight, i) => {
                                        const highlightColors = colorClasses[highlight.color] || colors;
                                        return (
                                            <div
                                                key={i}
                                                className={`px-3 py-1 rounded ${highlightColors.bg} border ${highlightColors.border} text-xs font-mono ${highlightColors.text}`}
                                            >
                                                {highlight.text}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
