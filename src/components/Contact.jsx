import { CONTACT } from "../constants";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Contact = () => {
    return (
        <div className="border-t border-white/10 pb-20 pt-10" id="contact">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-10 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-cyan">
                    Initialize Comms
                </span>
            </motion.h2>

            <div className="max-w-3xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden"
                >
                    {/* Terminal Header */}
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="ml-auto font-mono text-xs text-stone-500">SECURE_CHANNEL_V1.0</div>
                    </div>

                    <div className="text-center tracking-tighter space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <p className="text-lg text-stone-300 font-mono mb-2">
                                <span className="text-cyan-400">&gt;</span> {CONTACT.address}
                            </p>
                            <p className="text-stone-400 font-mono mb-6">
                                <span className="text-purple-400">&gt;</span> {CONTACT.phoneNo}
                            </p>
                            <a
                                href={`mailto:${CONTACT.email}`}
                                className="inline-block px-8 py-4 rounded-lg bg-white/5 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all font-mono text-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            >
                                {CONTACT.email}
                            </a>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            {[
                                { icon: "🦅", label: "CodeHawks", link: CONTACT.codehawks, color: "text-purple-400" },
                                { icon: <FaGithub />, label: "GitHub", link: CONTACT.github, color: "text-white" },
                                { icon: <FaLinkedin />, label: "LinkedIn", link: CONTACT.linkedin, color: "text-blue-400" },
                                { icon: <FaTwitter />, label: "Twitter", link: CONTACT.twitter, color: "text-cyan-400" }
                            ].map((item, index) => (
                                <a
                                    key={index}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-400/50 transition-all group flex flex-col items-center gap-2 hover:-translate-y-1"
                                >
                                    <span className={`text-2xl ${item.color} group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-xs font-mono text-stone-400 group-hover:text-white transition-colors">
                                        {item.label}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Background Scan Line */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.5)_2px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
