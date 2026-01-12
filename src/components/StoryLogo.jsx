import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const StoryLogo = () => {
    const [phase, setPhase] = useState('JW'); // JW, WEB3, JW3B

    useEffect(() => {
        let timeout;
        const runSequence = () => {
            // Start at JW
            setPhase('JW');

            // Go to JW3B after 2s
            timeout = setTimeout(() => {
                setPhase('JW3B');

                // Restart after 5s (Total 7s)
                timeout = setTimeout(() => {
                    runSequence();
                }, 5000);
            }, 2000);
        };

        runSequence();
        return () => clearTimeout(timeout);
    }, []);

    // Animation variants
    const containerVariants = {
        JW: { gap: '0.5rem' },
        JW3B: { gap: '0.1rem' }
    };

    // Smoother, less "snappy" spring
    const itemTransition = {
        type: "spring",
        stiffness: 70, // Reduced from 120
        damping: 20,   // Increased from 18
        mass: 1
    };

    // Common styles - Audiowide for futuristic theme
    const letterClass = "text-5xl font-['Audiowide'] font-bold text-white tracking-widest relative z-10";

    // Using a gradient text for the metallic look
    const metalText = {
        background: "linear-gradient(to bottom, #ffffff 30%, #a0a0a0 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
    };

    // Pulsing glow animation for the "3"
    const pulseAnimation = {
        textShadow: [
            "0 0 10px rgba(0, 242, 254, 0.5), 0 0 20px rgba(0, 242, 254, 0.3)",
            "0 0 15px rgba(0, 242, 254, 0.8), 0 0 30px rgba(0, 242, 254, 0.5)",
            "0 0 10px rgba(0, 242, 254, 0.5), 0 0 20px rgba(0, 242, 254, 0.3)"
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    return (
        <div className="relative h-16 w-auto px-4 flex items-center justify-center overflow-hidden">

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

                    {/* Shared 3 (Only in JW3B) */}
                    <AnimatePresence mode="popLayout">
                        {phase === 'JW3B' && (
                            <motion.span
                                layoutId="shared-3"
                                layout="position"
                                className="text-6xl font-['Audiowide'] font-bold relative z-20"
                                style={{ color: "#00f2fe" }}
                                initial={{ opacity: 0, y: -20, scale: 0.5, textShadow: "0 0 10px rgba(0, 242, 254, 0.5)" }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1.1,
                                    textShadow: pulseAnimation.textShadow
                                }}
                                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                                transition={{
                                    ...itemTransition,
                                    textShadow: pulseAnimation.transition
                                }}
                            >
                                3
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Letter B */}
                    <AnimatePresence mode="popLayout">
                        {phase === 'JW3B' && (
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
