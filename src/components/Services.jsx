import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, Bot, Landmark, Layers, Code2, Rocket, ChevronRight, ExternalLink } from "lucide-react";
import { SERVICES } from "../constants";

// Icon mapping
// Icon mapping
const IconMap = {
    "Smart Contract Security & AI Defense": Shield,
    "AI-Driven DeFi & Agent Development": Bot,
    "RWA & Asset Tokenization": Landmark,
    "Strategic Architecture & ZK Scaling": Layers,
    "Full-Stack Blockchain Engineering": Code2,
    "Web3 Product Delivery": Rocket
};

// Premium color system
const colors = {
    purple: {
        primary: "#a855f7",
        secondary: "#7c3aed",
        glow: "rgba(168, 85, 247, 0.4)",
        gradient: "linear-gradient(135deg, #a855f7, #7c3aed)"
    },
    cyan: {
        primary: "#06b6d4",
        secondary: "#0891b2",
        glow: "rgba(6, 182, 212, 0.4)",
        gradient: "linear-gradient(135deg, #06b6d4, #0891b2)"
    },
    green: {
        primary: "#22c55e",
        secondary: "#16a34a",
        glow: "rgba(34, 197, 94, 0.4)",
        gradient: "linear-gradient(135deg, #22c55e, #16a34a)"
    },
    orange: {
        primary: "#f97316",
        secondary: "#ea580c",
        glow: "rgba(249, 115, 22, 0.4)",
        gradient: "linear-gradient(135deg, #f97316, #ea580c)"
    },
    blue: {
        primary: "#3b82f6",
        secondary: "#2563eb",
        glow: "rgba(59, 130, 246, 0.4)",
        gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    },
    rose: {
        primary: "#f43f5e",
        secondary: "#e11d48",
        glow: "rgba(244, 63, 94, 0.4)",
        gradient: "linear-gradient(135deg, #f43f5e, #e11d48)"
    }
};

// Magnetic button component
const MagneticWrapper = ({ children, className }) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.1);
        y.set((e.clientY - centerY) * 0.1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Dust particles effect
const DustParticles = ({ color, isActive }) => {
    // Generate static random positions for hydration stability
    const [particles] = useState(() =>
        Array.from({ length: 20 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 10 + 10,
            delay: -Math.random() * 10 // Start at random point in cycle immediately
        }))
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: color,
                        boxShadow: `0 0 ${p.size * 3}px ${color}`
                    }}
                    variants={{
                        active: {
                            y: [0, -100],
                            opacity: [0, 1, 0],
                            scale: [1, 1.5, 0],
                            transition: {
                                duration: p.duration,
                                repeat: Infinity,
                                delay: 0, // No delay on start
                                ease: "linear",
                                times: [0, 0.5, 1]
                            }
                        },
                        inactive: {
                            opacity: 0,
                            scale: 0,
                            transition: {
                                duration: 0.5,
                                ease: "easeOut"
                            }
                        }
                    }}
                    initial={{ opacity: 0, scale: 0 }} // Start invisible
                    animate={isActive ? "active" : "inactive"}
                />
            ))}
        </div>
    );
};

// Service Card with 3D tilt effect
const ServiceCard = ({ service, index, isActive, onClick, onHover, onLeave }) => {
    const cardRef = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const color = colors[service.color];
    const Icon = IconMap[service.title];

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rotateXVal = ((e.clientY - centerY) / (rect.height / 2)) * -8;
        const rotateYVal = ((e.clientX - centerX) / (rect.width / 2)) * 8;
        setRotateX(rotateXVal);
        setRotateY(rotateYVal);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    const handleLinkClick = (e) => {
        e.stopPropagation();
        const isExternal = service.link.startsWith('http');
        if (isExternal) {
            window.open(service.link, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = service.link;
        }
    };

    return (
        <motion.div
            ref={cardRef}
            className="relative cursor-pointer"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            viewport={{ once: true }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                handleMouseLeave();
                setIsHovered(false);
                onLeave();
            }}
            onMouseEnter={() => {
                onHover(index);
                setIsHovered(true);
            }}
            onClick={onClick}
            style={{
                perspective: "1000px"
            }}
        >
            {/* Fixed overlay link - doesn't transform with tilt */}
            <div
                onClick={handleLinkClick}
                className="absolute bottom-6 left-8 z-50 cursor-pointer inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
                style={{
                    color: isActive ? '#ffffff' : color.primary,
                    textShadow: isActive ? `0 0 10px ${color.primary}` : 'none'
                }}
            >
                <span>Learn more</span>
                <ExternalLink size={14} />
            </div>

            <motion.div
                className="relative h-full"
                animate={{
                    rotateX,
                    rotateY,
                    scale: isActive ? 1.02 : 1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Glow effect behind card */}
                <motion.div
                    className="absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-opacity duration-500"
                    style={{ background: color.gradient }}
                    animate={{ opacity: isActive ? 0.05 : 0 }}
                />

                {/* Dust Particles - Rendered behind the glass card */}
                {/* REMOVED FROM HERE */}

                {/* Main card */}
                <div
                    className={`relative h-full p-8 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden ${isActive ? 'border-white/5' : 'border-white/5 hover:border-white/5'
                        }`}
                    style={{
                        background: isActive
                            ? `linear-gradient(135deg, ${color.primary}00, transparent 60%)`
                            : 'linear-gradient(135deg, rgba(255,255,255,0.01), transparent)',
                        boxShadow: isActive
                            ? `0 25px 50px -12px ${color.glow}`
                            : '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Dust Particles - Moved INSIDE so they are visible through the transparency but not blurred away */}
                    <DustParticles color={color.primary} isActive={isActive || isHovered} />

                    {/* Animated border gradient */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${color.primary}40, transparent)`,
                            backgroundSize: '200% 100%'
                        }}
                        animate={{
                            backgroundPosition: isActive ? ['100% 0%', '-100% 0%'] : '100% 0%'
                        }}
                        transition={{
                            duration: 4,
                            repeat: isActive ? Infinity : 0,
                            ease: "linear"
                        }}
                    />

                    {/* Corner decoration */}
                    <svg className="absolute top-0 right-0 w-24 h-24 opacity-10" viewBox="0 0 100 100">
                        <motion.path
                            d="M100 0 L100 100 L0 100"
                            fill="none"
                            stroke={color.primary}
                            strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: isActive ? 1 : 0.5 }}
                            transition={{ duration: 0.8 }}
                        />
                    </svg>

                    {/* Header: Icon + Title */}
                    <div className="flex items-center gap-6 mb-6">
                        {/* Icon with animated ring */}
                        <div className="relative">
                            <motion.div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                                style={{
                                    background: `linear-gradient(135deg, ${color.primary}20, transparent)`,
                                    border: `1px solid ${color.primary}40`
                                }}
                            >
                                <Icon
                                    size={32}
                                    strokeWidth={1.5}
                                    style={{
                                        color: isActive ? '#ffffff' : color.primary,
                                        filter: isActive ? `drop-shadow(0 0 8px ${color.primary})` : 'none'
                                    }}
                                />

                                {/* Rotating ring */}
                                <motion.div
                                    className="absolute inset-0"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                    <svg className="w-full h-full" viewBox="0 0 64 64">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="30"
                                            fill="none"
                                            stroke={color.primary}
                                            strokeWidth="0.5"
                                            strokeDasharray="8 12"
                                            opacity={isActive ? 0.6 : 0.2}
                                        />
                                    </svg>
                                </motion.div>
                            </motion.div>

                        </div>

                        {/* Title - next to icon */}
                        <h3
                            className="text-xl font-bold transition-colors duration-300"
                            style={{ color: isActive ? color.primary : '#f5f5f4' }}
                        >
                            {service.title}
                        </h3>
                    </div>

                    {/* Status indicator - Top Right of Card */}
                    <motion.div
                        className="absolute top-6 right-6 w-3 h-3 rounded-full"
                        style={{ backgroundColor: color.primary }}
                        animate={{
                            scale: isActive ? [1, 1.3, 1] : 1,
                            opacity: isActive ? 1 : 0.5
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />


                    {/* Description */}
                    <div className="mb-6">
                        <p className="text-sm font-bold mb-2 transition-colors duration-300" style={{ color: isActive ? '#fff' : '#d6d3d1' }}>
                            {service.subtitle}
                        </p>
                        <p className={`text-sm leading-relaxed transition-colors duration-300 ${isActive ? 'text-stone-200' : 'text-stone-400'}`}>
                            {service.description}
                        </p>
                    </div>

                    {/* Features with staggered reveal */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {service.features.map((feature, idx) => (
                            <motion.div
                                key={feature}
                                className="flex items-center gap-2 text-xs"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{
                                    opacity: isActive ? 1 : 0.6,
                                    x: 0
                                }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <ChevronRight
                                    size={12}
                                    style={{ color: color.primary }}
                                />
                                <span
                                    className="font-mono transition-colors duration-300"
                                    style={{ color: isActive ? color.primary : '#a8a29e' }}
                                >
                                    {feature}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                    {/* CTA text is in the fixed overlay above */}
                </div>
            </motion.div>
        </motion.div >
    );
};

// Main Services Component
const Services = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const containerRef = useRef(null);

    // Auto-rotate only when not hovering any card
    useEffect(() => {
        if (hoveredIndex !== null) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % SERVICES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [hoveredIndex]);

    const activeColor = colors[SERVICES[activeIndex].color];

    return (
        <section
            ref={containerRef}
            className="min-h-screen pt-8 pb-24 relative overflow-hidden"
            id="services"
        >
            {/* Dynamic background gradient - very subtle */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: `radial-gradient(ellipse 60% 40% at 50% 40%, ${activeColor.primary}10, transparent 50%)`
                }}
                transition={{ duration: 1.5 }}
            />

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, white 1px, transparent 1px),
                        linear-gradient(to bottom, white 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px'
                }}
            />

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-green-500/30 bg-green-500/10"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                            Available for Projects
                        </span>
                    </motion.div>

                    <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-white">What I </span>
                        <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                            Deliver
                        </span>
                    </h2>

                    <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                        Bringing 15+ years of disciplined project delivery to the blockchain space—applying engineering rigor to smart contract development, security-focused building, and exploring AI-powered solutions.
                    </p>
                </motion.div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {SERVICES.map((service, index) => (
                        <ServiceCard
                            key={service.title}
                            service={service}
                            index={index}
                            isActive={activeIndex === index}
                            onClick={() => setActiveIndex(index)}
                            onHover={(index) => {
                                setActiveIndex(index);
                                setHoveredIndex(index);
                            }}
                            onLeave={() => setHoveredIndex(null)}
                        />
                    ))}
                </div>


            </div>

            {/* Add gradient animation keyframes */}
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

export default Services;
