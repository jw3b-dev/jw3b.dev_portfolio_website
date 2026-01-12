import { useState } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import StoryLogo from "./StoryLogo"
import { Link } from "react-router-dom"

const Navbar = () => {
    const [openDropdown, setOpenDropdown] = useState(null);

    // Menu structure with dropdowns
    const menuItems = [
        { label: 'About', href: '#about' },
        { label: 'Services', href: '#services' },
        {
            label: 'Experience',
            href: null, // No link - only subitems
            dropdown: [
                { label: 'My Technologies', href: '#tech-stack' },
                { label: 'My Experience', href: '#career' },
                { label: 'My Education', href: '#education' },
                { label: 'Certifications & Training', href: '#certifications' }
            ]
        },
        {
            label: 'Projects',
            href: '#projects',
            dropdown: [
                { label: 'DevGuild Protocol', href: '/projects/devguild' },
                { label: 'Audit.brave', href: '/projects/audit-brave' },
                { label: 'Flux.brave', href: '/projects/flux-brave' },
                { label: 'Rental Deposit Vault', href: '/projects/rental-deposit' },
                { label: 'CreatorHub.brave', href: '/projects/creatorhub-brave' }
            ]
        },
        {
            label: 'Blog',
            href: null,
            dropdown: [
                { label: 'Coming Soon...', href: '#' }
            ]
        },
        { label: 'Contact', href: '#contact' }
    ];

    const handleMouseEnter = (label) => {
        setOpenDropdown(label);
    };

    const handleMouseLeave = () => {
        setOpenDropdown(null);
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="fixed top-6 inset-x-0 mx-auto z-50 w-[90%] max-w-5xl rounded-full glass-panel px-8 py-4 flex items-center justify-between border border-white/10 bg-black/40 backdrop-blur-xl"
        >
            <div className="flex flex-shrink-0 items-center w-[200px] mr-8">
                <Link to="/" aria-label="Home">
                    <StoryLogo />
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 font-mono text-sm text-stone-300">
                {menuItems.map((item) => (
                    <div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => handleMouseEnter(item.label)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {item.href ? (
                            <a
                                href={item.href}
                                className="relative group flex items-center gap-1 hover:text-white transition-colors py-2"
                            >
                                <span className="text-cyan-500/50 mr-1">&lt;</span>
                                {item.label}
                                <span className="text-cyan-500/50 ml-1">/&gt;</span>
                                {item.dropdown && (
                                    <ChevronDown className={`w-3 h-3 text-cyan-500/50 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                )}
                                {item.comingSoon && (
                                    <span className="ml-2 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                        Soon
                                    </span>
                                )}
                                {!item.comingSoon && (
                                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
                                )}
                            </a>
                        ) : (
                            <span
                                className={`relative group flex items-center gap-1 py-2 cursor-default ${item.comingSoon ? 'opacity-70' : 'hover:text-white transition-colors'}`}
                            >
                                <span className="text-cyan-500/50 mr-1">&lt;</span>
                                {item.label}
                                <span className="text-cyan-500/50 ml-1">/&gt;</span>
                                {item.comingSoon && (
                                    <span className="ml-2 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                        Soon
                                    </span>
                                )}
                                {item.dropdown && (
                                    <ChevronDown className={`w-3 h-3 text-cyan-500/50 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                )}
                                {!item.comingSoon && (
                                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
                                )}
                            </span>
                        )}

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {item.dropdown && openDropdown === item.label && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full left-0 mt-2 min-w-[200px] py-2 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 shadow-xl"
                                >
                                    {item.dropdown.map((subItem, idx) => (
                                        <a
                                            key={idx}
                                            href={subItem.href}
                                            className="block px-4 py-2 text-stone-400 hover:text-white hover:bg-white/5 transition-colors text-sm whitespace-nowrap"
                                        >
                                            <span className="text-cyan-500/30 mr-2">→</span>
                                            {subItem.label}
                                        </a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Mobile Menu Button - Placeholder */}
            <div className="md:hidden">
                <button className="text-stone-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </motion.nav>
    )
}

export default Navbar