import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const StoryLogo = () => {
    const [phase, setPhase] = useState('JW'); // JW, WEB3, JW3B

    useEffect(() => {
        let timeout;
        const runSequence = () => {
            // Start at JW
            setPhase('JW');

            // Go to WEB3 after 2s
            timeout = setTimeout(() => {
                setPhase('WEB3');

                // Go to JW3B after 3s (Total 5s)
                timeout = setTimeout(() => {
                    setPhase('JW3B');

                    // Restart after 6s (Total 11s)
                    timeout = setTimeout(() => {
                        runSequence();
                    }, 6000);
                }, 3000);
            }, 2000);
        };

        runSequence();
        return () => clearTimeout(timeout);
    }, []);

    // Animation variants
    const containerVariants = {
        JW: { gap: '0.5rem' },
        WEB3: { gap: '0.2rem' },
        JW3B: { gap: '0.2rem' }
    };

    // Smoother, less "snappy" spring
    const itemTransition = {
        type: "spring",
        stiffness: 70, // Reduced from 120
        damping: 20,   // Increased from 18
        mass: 1
    };

    // Common styles - font-mono for hacker theme
    const letterClass = "text-5xl font-mono font-bold text-white tracking-tighter relative z-10";

    // Using a gradient text for the metallic look
    const metalText = {
        background: "linear-gradient(to bottom, #ffffff 30%, #a0a0a0 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
    };

    const cyanText = {
        color: "#00f2fe",
        textShadow: "0 0 10px rgba(0, 242, 254, 0.5), 0 0 20px rgba(0, 242, 254, 0.3)"
    };

    return (
        <div className="relative h-24 w-80 flex items-center justify-center overflow-hidden bg-black/40 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl">

            <LayoutGroup>
                <motion.div
                    className="flex items-baseline justify-center"
                    variants={containerVariants}
                    animate={phase}
                    layout
                    transition={itemTransition} // Apply smooth transition to container layout changes too
                >
                    {/* Letter J */}
                    <AnimatePresence mode="popLayout">
                        {(phase === 'JW' || phase === 'JW3B') && (
                            <motion.span
                                layoutId="letter-J"
                                layout="position" // Explicitly animate position
                                className={letterClass}
                                style={metalText}
                                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                transition={itemTransition}
                            >
                                J
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Letter W */}
                    <motion.span
                        layoutId="letter-W"
                        layout="position"
                        className={letterClass}
                        style={metalText}
                        transition={itemTransition}
                    >
                        W
                    </motion.span>

                    {/* Letter E (Only in WEB3) */}
                    <AnimatePresence mode="popLayout">
                        {phase === 'WEB3' && (
                            <motion.span
                                layoutId="letter-E"
                                layout="position"
                                className={letterClass}
                                style={metalText}
                                initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                                transition={itemTransition}
                            >
                                E
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Shared 3 (WEB3 and JW3B) */}
                    <AnimatePresence mode="popLayout">
                        {(phase === 'WEB3' || phase === 'JW3B') && (
                            <motion.span
                                layoutId="shared-3"
                                layout="position"
                                className="text-6xl font-mono font-bold relative z-20"
                                style={cyanText}
                                initial={{ opacity: 0, y: -20, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1.1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                                transition={itemTransition}
                            >
                                3
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Letter B */}
                    <AnimatePresence mode="popLayout">
                        {(phase === 'WEB3' || phase === 'JW3B') && (
                            <motion.span
                                layoutId="letter-B"
                                layout="position"
                                className={letterClass}
                                style={metalText}
                                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                transition={itemTransition}
                            >
                                B
                            </motion.span>
                        )}
                    </AnimatePresence>

                </motion.div>
            </LayoutGroup>
        </div>
    );
};

export default StoryLogo;
