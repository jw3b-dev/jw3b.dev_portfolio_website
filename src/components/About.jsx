import { ROLE_PROFILES, ABOUT_INTRO, HATS, HAT_ORDER } from "../constants";
import { COLORS } from "../constants/colors";
import { motion } from "framer-motion";
import { Code2, Kanban, Shield, Rocket } from "lucide-react";

const iconMap = { Code2, Kanban, Shield, Rocket };

// Refined-cyber About: all four hats are visible at once. Color is reserved
// for hat identity (engineer=cyan, auditor=purple, pm=green, founder=orange) —
// each card is neutral glass except for its hat accent, so the four-color code
// reads cleanly instead of six colors competing. No one-at-a-time selector.
const RoleCard = ({ hatId, index }) => {
    const hat = HATS[hatId];
    const role = ROLE_PROFILES[hatId];
    const c = COLORS[hat.color];
    const Icon = iconMap[hat.icon];

    return (
        <motion.div
            id={`hat-${hatId}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel border transition-colors scroll-mt-32"
            style={{ borderColor: `${c.primary}22` }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${c.primary}55`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.primary}22`; }}
        >
            {/* Hat accent bar */}
            <div className="absolute top-0 left-0 h-full w-1" style={{ background: c.gradient }} />

            {/* Persona image band */}
            <div className="relative h-40 shrink-0 overflow-hidden bg-black/40">
                <img
                    src={role.image}
                    alt={role.title}
                    className="w-full h-full object-cover object-center opacity-80 grayscale contrast-110 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-[#030014]/40 to-transparent" />
                {/* Verb + tag badge */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-widest uppercase border"
                        style={{
                            color: c.primary,
                            borderColor: `${c.primary}80`,
                            backgroundColor: "rgba(0,0,0,0.75)",
                            boxShadow: `0 0 14px ${c.primary}40`
                        }}
                    >
                        <Icon size={13} />
                        {hat.tag}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
                        {hat.verb}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-grow p-5">
                <h3 className="text-lg font-semibold text-white mb-1">{role.title}</h3>
                <p className="text-xs font-mono mb-3" style={{ color: c.primary }}>{hat.tagline}</p>

                <div className="flex-grow overflow-y-auto pr-1 max-h-40 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p className="text-sm text-stone-400 leading-relaxed whitespace-pre-line">
                        {role.description}
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                    {role.highlights.map((h, i) => {
                        const hc = COLORS[h.color] || c;
                        return (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[11px] font-mono border"
                                style={{
                                    color: hc.primary,
                                    backgroundColor: `${hc.primary}12`,
                                    borderColor: `${hc.primary}30`
                                }}
                            >
                                {h.text}
                            </span>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

const About = () => {
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
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                        One Operator · Four Hats
                    </span>
                </div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">Who </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        I Am
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    {ABOUT_INTRO}
                </p>

                {/* Verb spine — Build · Secure · Deliver · Grow */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-sm">
                    {HAT_ORDER.map((id, i) => {
                        const hat = HATS[id];
                        const c = COLORS[hat.color];
                        return (
                            <span key={id} className="flex items-center gap-3">
                                <span style={{ color: c.primary }} className="font-semibold tracking-wide">
                                    {hat.verb}
                                </span>
                                {i < HAT_ORDER.length - 1 && <span className="text-stone-600">·</span>}
                            </span>
                        );
                    })}
                </div>
            </motion.div>

            {/* All four hats, always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full px-6">
                {HAT_ORDER.map((id, i) => (
                    <RoleCard key={id} hatId={id} index={i} />
                ))}
            </div>
        </div>
    );
};

export default About;
