import { CERTIFICATIONS } from "../constants";
import { motion } from "framer-motion";

const Certifications = () => {
    return (
        <div className="pb-24" id="certifications">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-cyan">
                    Certifications & Training
                </span>
            </motion.h2>
            <div className="max-w-4xl mx-auto grid gap-12 px-4">
                <div className="mb-12">
                    <h3 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2 font-mono">
                        <span className="animate-pulse">🚀</span> IN_PROGRESS
                    </h3>
                    <div className="grid gap-4">
                        {CERTIFICATIONS.filter(cert => cert.status.includes("Progress") || cert.status.includes("Next")).map((cert, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="glass-panel p-6 rounded-xl border border-white/5 hover:border-cyan-400/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/50"></div>
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div>
                                        <h4 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">{cert.name}</h4>
                                        <p className="text-sm text-stone-400 mt-2 font-mono flex items-center gap-2">
                                            <span className="text-cyan-500">&gt;</span>
                                            {cert.provider}
                                        </p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 animate-pulse-glow">
                                        {cert.status}
                                    </span>
                                </div>
                                {cert.expected && (
                                    <p className="text-xs text-cyan-400/70 mt-4 font-mono border-t border-white/5 pt-2 inline-block">
                                        ETA: {cert.expected}
                                    </p>
                                )}
                                {cert.priority && (
                                    <p className="text-xs text-yellow-400 mt-2 font-mono">PRIORITY: {cert.priority}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-2 font-mono">
                        <span className="text-green-500">✓</span> COMPLETED
                    </h3>
                    <div className="grid gap-4">
                        {CERTIFICATIONS.filter(cert => cert.status === "Completed").map((cert, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="glass-panel p-6 rounded-xl border border-white/5 hover:border-green-500/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div>
                                        <h4 className="font-bold text-xl text-white group-hover:text-green-400 transition-colors">{cert.name}</h4>
                                        <p className="text-sm text-stone-400 mt-2 font-mono flex items-center gap-2">
                                            <span className="text-green-500">&gt;</span>
                                            {cert.provider}
                                        </p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/30">
                                        VERIFIED
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certifications;
