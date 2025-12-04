import React from "react";
import { motion } from "framer-motion";

const Background = () => {
    return (
        <div className="fixed inset-0 bg-[#030014] overflow-hidden">
            {/* Deep Space Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-[#050510] to-[#030014] opacity-90"></div>

            {/* Cyber Grid - Perspective Plane */}
            <div className="absolute inset-0 perspective-grid opacity-30">
                <div className="grid-lines"></div>
            </div>

            {/* Floating Particles / Blockchain Nodes */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-cyan-400 opacity-20 blur-[1px]"
                        initial={{
                            x: Math.random() * 100 + "vw",
                            y: Math.random() * 100 + "vh",
                            scale: Math.random() * 0.5 + 0.2,
                        }}
                        animate={{
                            y: [null, Math.random() * 100 + "vh"],
                            x: [null, Math.random() * 100 + "vw"],
                        }}
                        transition={{
                            duration: Math.random() * 20 + 20,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{
                            width: Math.random() * 4 + 2 + "px",
                            height: Math.random() * 4 + 2 + "px",
                        }}
                    />
                ))}
            </div>

            {/* Connecting Lines (Simulated Network) - Optional visual flair */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>

            {/* Vignette & Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#030014_90%)] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2NkYGD4z8DAwMgAAQAAYgcDA4s8618AAAAASUVORK5CYII=')] opacity-5 pointer-events-none mix-blend-overlay"></div>
        </div>
    );
};

export default Background;
