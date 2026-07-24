import { HATS, HAT_ORDER } from "../constants";
import { COLORS } from "../constants/colors";
import { Code2, Kanban, Shield, Rocket } from "lucide-react";

const iconMap = { Code2, Kanban, Shield, Rocket };

// Shared hat-filter chip row (Services + Projects). Filtering DIMS non-matching
// cards rather than hiding them — the whole point of the hats IA is that no part
// of the range ever disappears. `active` is a hat id or null for ALL.
export const HatFilter = ({ active, onChange }) => (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        <button
            onClick={() => onChange(null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border transition-all ${
                active === null
                    ? "text-white border-white/50 bg-white/10"
                    : "text-stone-500 border-white/10 hover:border-white/30 hover:text-stone-300"
            }`}
        >
            ALL
        </button>
        {HAT_ORDER.map((id) => {
            const hat = HATS[id];
            const c = COLORS[hat.color];
            const Icon = iconMap[hat.icon];
            const isActive = active === id;
            return (
                <button
                    key={id}
                    onClick={() => onChange(isActive ? null : id)}
                    title={hat.title}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border transition-all"
                    style={{
                        color: isActive ? "#fff" : c.primary,
                        borderColor: isActive ? c.primary : `${c.primary}40`,
                        backgroundColor: isActive ? `${c.primary}30` : `${c.primary}0d`,
                        boxShadow: isActive ? `0 0 14px ${c.primary}50` : "none"
                    }}
                >
                    <Icon size={12} />
                    {hat.tag}
                </button>
            );
        })}
    </div>
);

// Small per-card hat chips — which hats a service/project belongs to.
export const HatChips = ({ hats = [] }) => (
    <div className="flex gap-1.5">
        {hats.map((id) => {
            const hat = HATS[id];
            if (!hat) return null;
            const c = COLORS[hat.color];
            return (
                <span
                    key={id}
                    title={hat.title}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border"
                    style={{
                        color: c.primary,
                        borderColor: `${c.primary}50`,
                        backgroundColor: "rgba(0,0,0,0.6)"
                    }}
                >
                    {hat.tag}
                </span>
            );
        })}
    </div>
);
