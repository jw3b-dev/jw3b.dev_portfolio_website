// Centralized Color System for jw3b.dev
// These 6 colors are used consistently across all sections

export const COLORS = {
    purple: {
        primary: "#a855f7",
        secondary: "#7c3aed",
        glow: "rgba(168, 85, 247, 0.4)",
        gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
        tailwind: {
            text: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/30",
            shadow: "shadow-purple-500/20",
            activeBg: "bg-purple-500/20",
            activeBorder: "border-purple-400",
        }
    },
    cyan: {
        primary: "#06b6d4",
        secondary: "#0891b2",
        glow: "rgba(6, 182, 212, 0.4)",
        gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
        tailwind: {
            text: "text-cyan-400",
            bg: "bg-cyan-400/10",
            border: "border-cyan-400/30",
            shadow: "shadow-cyan-500/20",
            activeBg: "bg-cyan-500/20",
            activeBorder: "border-cyan-400",
        }
    },
    green: {
        primary: "#22c55e",
        secondary: "#16a34a",
        glow: "rgba(34, 197, 94, 0.4)",
        gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
        tailwind: {
            text: "text-green-400",
            bg: "bg-green-400/10",
            border: "border-green-400/30",
            shadow: "shadow-green-500/20",
            activeBg: "bg-green-500/20",
            activeBorder: "border-green-400",
        }
    },
    orange: {
        primary: "#f97316",
        secondary: "#ea580c",
        glow: "rgba(249, 115, 22, 0.4)",
        gradient: "linear-gradient(135deg, #f97316, #ea580c)",
        tailwind: {
            text: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/30",
            shadow: "shadow-orange-500/20",
            activeBg: "bg-orange-500/20",
            activeBorder: "border-orange-400",
        }
    },
    blue: {
        primary: "#3b82f6",
        secondary: "#2563eb",
        glow: "rgba(59, 130, 246, 0.4)",
        gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
        tailwind: {
            text: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/30",
            shadow: "shadow-blue-500/20",
            activeBg: "bg-blue-500/20",
            activeBorder: "border-blue-400",
        }
    },
    rose: {
        primary: "#f43f5e",
        secondary: "#e11d48",
        glow: "rgba(244, 63, 94, 0.4)",
        gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
        tailwind: {
            text: "text-rose-400",
            bg: "bg-rose-400/10",
            border: "border-rose-400/30",
            shadow: "shadow-rose-500/20",
            activeBg: "bg-rose-500/20",
            activeBorder: "border-rose-400",
        }
    }
};

// Helper to get Tailwind classes for a color
export const getColorClasses = (colorName) => {
    const color = COLORS[colorName];
    if (!color) return COLORS.purple.tailwind;
    return color.tailwind;
};

// Theme colors string for Experience cards (backwards compatible)
export const themeColorStrings = {
    purple: "text-purple-400 border-purple-400/30 bg-purple-400/10 shadow-purple-500/20",
    cyan: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10 shadow-cyan-500/20",
    green: "text-green-400 border-green-400/30 bg-green-400/10 shadow-green-500/20",
    orange: "text-orange-400 border-orange-400/30 bg-orange-400/10 shadow-orange-500/20",
    blue: "text-blue-400 border-blue-400/30 bg-blue-400/10 shadow-blue-500/20",
    rose: "text-rose-400 border-rose-400/30 bg-rose-400/10 shadow-rose-500/20"
};
