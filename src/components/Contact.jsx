import { CONTACT } from "../constants";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { FaGithub, FaLinkedin, FaDiscord, FaTelegram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Copy, Check, Shield, Bug, Search, Globe, Zap, FileCode, Terminal, Crosshair, Download } from "lucide-react";

const Contact = () => {
    const [copied, setCopied] = useState(false);

    const [walletCopied, setWalletCopied] = useState(false);

    // Email obfuscation - decode at runtime to prevent scraping
    const decodedEmail = useMemo(() => {
        // Base64 encoded: "onchain@jw3b.dev"
        const encoded = "b25jaGFpbkBqdzNiLmRldg==";
        try {
            return atob(encoded);
        } catch {
            return "";
        }
    }, []);

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(decodedEmail);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyWallet = async () => {
        try {
            await navigator.clipboard.writeText(CONTACT.wallet);
            setWalletCopied(true);
            setTimeout(() => setWalletCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy wallet:', err);
        }
    };

    // Security Audit Platforms - Primary Focus
    const auditPlatforms = [
        { key: "CODEHAWKS", handle: "Cyfrin Auditor", link: CONTACT.codehawks, color: "text-orange-400" },
        { key: "CODE4RENA", handle: "Warden", link: CONTACT.code4rena, color: "text-green-400" },
        { key: "SHERLOCK", handle: "Watson", link: CONTACT.sherlock, color: "text-blue-400" },
        { key: "CANTINA", handle: "Security Researcher", link: CONTACT.cantina, color: "text-purple-400" },
        { key: "IMMUNEFI", handle: "Bug Hunter", link: CONTACT.immunefi, color: "text-cyan-400" },
        { key: "HACKERONE", handle: "Security Researcher", link: CONTACT.hackerone, color: "text-red-400" },
        { key: "HACKENPROOF", handle: "Researcher", link: CONTACT.hackenproof, color: "text-yellow-400" },
        { key: "AUDITONE", handle: "Auditor", link: CONTACT.auditone, color: "text-emerald-400" },
        { key: "HATS", handle: "Auditor", link: CONTACT.hats, color: "text-pink-400" },
    ];

    // Professional & Social
    const socialNodes = [
        { key: "GITHUB", icon: <FaGithub className="w-3.5 h-3.5" />, handle: "jw3b-dev", link: CONTACT.github, color: "text-white" },
        { key: "LINKEDIN", icon: <FaLinkedin className="w-3.5 h-3.5" />, handle: "john-wellard", link: CONTACT.linkedin, color: "text-blue-400" },
        { key: "X/TWITTER", icon: <FaXTwitter className="w-3.5 h-3.5" />, handle: "@AgileGypsy_", link: CONTACT.twitter, color: "text-white" },
        { key: "DISCORD", icon: <FaDiscord className="w-3.5 h-3.5" />, handle: "agilegypsy", link: `https://discord.com/users/${CONTACT.discordId}`, color: "text-indigo-400" },
        { key: "TELEGRAM", icon: <FaTelegram className="w-3.5 h-3.5" />, handle: "@agilegypsy", link: "https://t.me/agilegypsy", color: "text-sky-400" },
        { key: "AUDIT_SITE", icon: <Globe className="w-3.5 h-3.5" />, handle: "audit.agilegypsy.com", link: CONTACT.auditWebsite, color: "text-cyan-400" },
    ];

    return (
        <div className="min-h-[calc(100vh-10rem)] border-t border-white/10 pb-20 pt-8 flex flex-col" id="contact">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 mt-8"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-green-500/30 bg-green-500/10"
                >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                        Get In Touch
                    </span>
                </motion.div>

                <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                    <span className="text-white">Initialize </span>
                    <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                        Comms
                    </span>
                </h2>

                <p className="text-stone-400 max-w-3xl mx-auto text-base leading-relaxed">
                    Open to collaboration, mentorship, and learning opportunities—whether building dApps together, contributing to security research, or joining development teams.
                </p>
            </motion.div>

            <div className="w-full max-w-5xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-black via-stone-950 to-black"
                >
                    {/* Terminal Header */}
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-black/50">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="ml-auto font-mono text-xs text-green-400/70">SECURE_CHANNEL_V1.0</div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-6 md:p-8 font-mono text-sm space-y-6">
                        {/* whoami command */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-green-400 mb-2">$ whoami</div>
                            <div className="pl-4 space-y-1 text-stone-300">
                                <p><span className="text-cyan-400">→</span> {CONTACT.address}</p>
                                <p><span className="text-purple-400">→</span> {CONTACT.phoneNo}</p>
                                <p><span className="text-yellow-400">→</span> ENS: <a href={`https://ud.me/${CONTACT.ens}`} target="_blank" rel="noopener noreferrer" className="text-stone-300 hover:text-yellow-400 underline decoration-yellow-400/30 hover:decoration-yellow-400 transition-all">{CONTACT.ens}</a></p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-green-400">→</span>
                                    <span>Wallet:</span>
                                    <span className="text-stone-300 font-mono text-xs break-all">{CONTACT.wallet}</span>
                                    <button
                                        onClick={handleCopyWallet}
                                        className="ml-2 p-1.5 rounded-md hover:bg-white/10 text-stone-500 hover:text-green-400 transition-colors"
                                        aria-label="Copy Wallet Address"
                                        title="Copy Wallet Address"
                                    >
                                        {walletCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* init-comms command */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-green-400 mb-3">$ init-comms --email</div>
                            <button
                                onClick={handleCopyEmail}
                                className="group ml-4 flex items-center gap-3 px-6 py-4 rounded-lg bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                            >
                                <span className="text-cyan-400 text-lg">{decodedEmail}</span>
                                <span className="flex items-center gap-1 text-xs text-stone-500 group-hover:text-cyan-400 transition-colors">
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">[COPIED ✓]</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>[CLICK TO COPY]</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </motion.div>

                        {/* Audit Platforms Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-green-400 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-orange-400" />
                                $ audit-platforms --list
                            </div>
                            <div className="pl-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {auditPlatforms.map((platform, index) => (
                                    <a
                                        key={platform.key}
                                        href={platform.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-2 text-stone-400 hover:text-white transition-colors py-1.5 px-2 rounded hover:bg-white/5"
                                        aria-label={`Visit my profile on ${platform.key}: ${platform.handle}`}
                                    >
                                        <span className="text-stone-600">◆</span>
                                        <span className={`${platform.color} font-semibold`}>
                                            [{platform.key}]
                                        </span>
                                        <span className="text-stone-500 text-xs group-hover:text-stone-300 transition-colors truncate">
                                            {platform.handle}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Social/Network command */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-green-400 mb-3">$ network --list-nodes</div>
                            <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-1">
                                {socialNodes.map((node, index) => (
                                    <a
                                        key={node.key}
                                        href={node.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-2 text-stone-400 hover:text-white transition-colors py-1.5"
                                        aria-label={`Connect with me on ${node.key}: ${node.handle}`}
                                    >
                                        <span className="text-stone-600">├──</span>
                                        <span className={`${node.color} flex items-center gap-1.5`}>
                                            {node.icon}
                                            [{node.key}]
                                        </span>
                                        <span className="text-stone-500 group-hover:text-stone-300 transition-colors text-xs">
                                            {node.handle}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Download CV Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.45 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-green-400 mb-3 flex items-center gap-2">
                                <Download className="w-4 h-4 text-cyan-400" />
                                $ download --cv
                            </div>
                            <div className="pl-4 flex flex-wrap gap-3">
                                <a
                                    href="/cvs/John_Wellard_Blockchain_Engineer_CV.pdf"
                                    download
                                    className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20 hover:border-purple-400 transition-all"
                                >
                                    <Download className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-400 font-mono text-sm">Engineer_CV.pdf</span>
                                </a>
                                <a
                                    href="/cvs/John_Wellard_Web3_PM_CV.pdf"
                                    download
                                    className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-400/30 hover:bg-green-500/20 hover:border-green-400 transition-all"
                                >
                                    <Download className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 font-mono text-sm">PM_CV.pdf</span>
                                </a>
                            </div>
                        </motion.div>

                        {/* Status line with cursor */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            viewport={{ once: true }}
                            className="pt-4 border-t border-white/5"
                        >
                            <div className="flex items-center gap-2 text-stone-500 text-xs">
                                <span className="text-green-400/70">→</span>
                                <span>Response time: ~24h</span>
                                <span className="text-stone-700">|</span>
                                <span>PGP available on request</span>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-green-400">
                                <span>$</span>
                                <span className="w-2 h-5 bg-green-400 animate-pulse"></span>
                            </div>
                        </motion.div>
                    </div>

                    {/* CRT Scanline Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.4)_2px)] bg-[size:100%_4px] pointer-events-none opacity-30"></div>

                    {/* Corner Glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
