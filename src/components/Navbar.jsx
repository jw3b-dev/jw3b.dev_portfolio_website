import { useState } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X } from "lucide-react"
import StoryLogo from "./StoryLogo"
import { Link } from "react-router-dom"
import ConnectButton from "./wallet/ConnectButton"

const Navbar = () => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Menu structure with dropdowns
    const menuItems = [
        { label: 'About', href: '#about' },
        { label: 'Services', href: '#services' },
        { label: 'Hire Me', href: '/hire-me', highlight: true },
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
            className="fixed top-6 inset-x-0 mx-auto z-50 w-[90%] max-w-6xl rounded-full glass-panel px-8 py-4 flex items-center justify-between border border-white/10 bg-black/40 backdrop-blur-xl"
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
                            item.href.startsWith('/') ? (
                                <Link
                                    to={item.href}
                                    className="relative group flex items-center gap-1 hover:text-white transition-colors py-2"
                                >
                                    <span className="text-cyan-500/50 mr-1">&lt;</span>
                                    {item.label}
                                    <span className="text-cyan-500/50 ml-1">/&gt;</span>
                                    {item.dropdown && (
                                        <ChevronDown className={`w-3 h-3 text-cyan-500/50 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                    )}
                                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
                                </Link>
                            ) : (
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
                            )
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
                                        subItem.href.startsWith('/') ? (
                                            <Link
                                                key={idx}
                                                to={subItem.href}
                                                className="block px-4 py-2 text-stone-400 hover:text-white hover:bg-white/5 transition-colors text-sm whitespace-nowrap"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <span className="text-cyan-500/30 mr-2">→</span>
                                                {subItem.label}
                                            </Link>
                                        ) : (
                                            <a
                                                key={idx}
                                                href={subItem.href}
                                                className="block px-4 py-2 text-stone-400 hover:text-white hover:bg-white/5 transition-colors text-sm whitespace-nowrap"
                                            >
                                                <span className="text-cyan-500/30 mr-2">→</span>
                                                {subItem.label}
                                            </a>
                                        )
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Wallet Connect Button (Desktop) */}
            <div className="hidden md:block">
                <ConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
                <ConnectButton className="text-xs" label="Connect" />
                <button
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMobileMenuOpen}
                    className="text-stone-400 hover:text-white transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-full left-0 right-0 mt-3 mx-2 py-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-xl font-mono text-sm max-h-[70vh] overflow-y-auto"
                    >
                        {menuItems.map((item) => (
                            <div key={item.label} className="px-2">
                                {item.href ? (
                                    <MobileNavLink item={item} onNavigate={() => setIsMobileMenuOpen(false)} />
                                ) : (
                                    <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-cyan-500/60">
                                        {item.label}
                                    </div>
                                )}
                                {item.dropdown && item.dropdown.map((subItem) => (
                                    <MobileNavLink
                                        key={subItem.label}
                                        item={subItem}
                                        nested
                                        onNavigate={() => setIsMobileMenuOpen(false)}
                                    />
                                ))}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

// Renders a single mobile nav entry as a router <Link> for internal paths or an <a> for hash/anchor links.
const MobileNavLink = ({ item, nested = false, onNavigate }) => {
    const className = `block py-2.5 text-stone-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors ${nested ? 'pl-8 pr-4 text-stone-400' : 'px-4'}`;
    const label = nested ? <><span className="text-cyan-500/30 mr-2">→</span>{item.label}</> : item.label;

    return item.href.startsWith('/') ? (
        <Link to={item.href} onClick={onNavigate} className={className}>{label}</Link>
    ) : (
        <a href={item.href} onClick={onNavigate} className={className}>{label}</a>
    );
}

export default Navbar