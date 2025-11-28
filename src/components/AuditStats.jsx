import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const StatItem = ({ value, label, suffix = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref);

    useEffect(() => {
        if (isInView) {
            const node = ref.current;
            const controls = animate(0, value, {
                duration: 2,
                onUpdate: (value) => {
                    node.textContent = Math.floor(value).toLocaleString() + suffix;
                },
            });
            return () => controls.stop();
        }
    }, [isInView, value, suffix]);

    return (
        <div className="flex flex-col items-center p-6 glass-panel rounded-xl hover:border-cyan-400/30 transition-colors">
            <span ref={ref} className="text-4xl lg:text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                0
            </span>
            <span className="text-stone-400 text-sm tracking-wider uppercase">{label}</span>
        </div>
    );
};

const AuditStats = () => {
    return (
        <div className="py-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatItem value={50000} label="Lines Audited" suffix="+" />
                <StatItem value={15} label="High/Critical Findings" />
                <StatItem value={25} label="Protocols Secured" suffix="+" />
                <StatItem value={100} label="Eth Secured (TVL)" suffix="M+" />
            </div>
        </div>
    );
};

export default AuditStats;
