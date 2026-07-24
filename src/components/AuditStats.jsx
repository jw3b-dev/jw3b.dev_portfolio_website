import { animate, useInView, motion } from "framer-motion";
import { useEffect, useRef } from "react";

const StatItem = ({ value, label, suffix = "", prefix = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref);

    useEffect(() => {
        if (isInView) {
            const node = ref.current;
            const controls = animate(0, value, {
                duration: 2,
                onUpdate: (value) => {
                    node.textContent = prefix + Math.floor(value).toLocaleString() + suffix;
                },
            });
            return () => controls.stop();
        }
    }, [isInView, value, suffix, prefix]);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative flex flex-col items-center p-6 glass-panel rounded-xl overflow-hidden group"
        >
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] translate-y-[-100%] group-hover:animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100"></div>

            <span ref={ref} className="relative z-10 text-4xl lg:text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2 text-glow-cyan">
                0
            </span>
            <span className="relative z-10 text-stone-400 text-sm tracking-wider uppercase font-mono group-hover:text-white transition-colors">
                {label}
            </span>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 group-hover:border-cyan-400 transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 group-hover:border-cyan-400 transition-colors"></div>
        </motion.div>
    );
};

const AuditStats = () => {
    return (
        <div className="py-20 relative">
            {/* Section Header Line */}
            <div className="absolute top-10 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>

            {/* Verified competitive-audit record (CodeHawks/Cyfrin, Jan 2026) — see
                docs/PORTFOLIO_REFERENCE.md §1b. Real scoreboard only: no aggregate
                TVL / protocols-secured / lines-audited claims (unsupported). */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <StatItem value={124} label="CodeHawks Rank" prefix="#" />
                <StatItem value={17} label="Contest Findings" />
                <StatItem value={8} label="High Severity" />
                <StatItem value={1430} label="CodeHawks EXP" />
            </div>

            <div className="mt-6 text-center">
                <a
                    href="https://profiles.cyfrin.io/u/agilegypsy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-stone-500 hover:text-cyan-400 transition-colors"
                >
                    Live record → profiles.cyfrin.io/u/agilegypsy · Jan 2026
                </a>
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(400%); }
                }
            `}</style>
        </div>
    );
};

export default AuditStats;
