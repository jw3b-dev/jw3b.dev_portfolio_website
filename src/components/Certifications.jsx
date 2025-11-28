import { CERTIFICATIONS } from "../constants";
import { motion } from "framer-motion";

const Certifications = () => {
    return (
        <div className="pb-24" id="certifications">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Certifications & Training
                </span>
            </motion.h2>
            <div className="max-w-4xl mx-auto grid gap-12">
                <div className="mb-12">
                    <h3 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                        <span className="animate-pulse">🚀</span> In Progress
                    </h3>
                    <div className="grid gap-4">
                        {CERTIFICATIONS.filter(cert => cert.status.includes("Progress") || cert.status.includes("Next")).map((cert, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="glass-panel p-4 rounded-lg border border-white/5 hover:border-purple-500/50 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-lg text-white">{cert.name}</h4>
                                        <p className="text-sm text-stone-400 mt-1 font-mono">{cert.provider}</p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                        {cert.status}
                                    </span>
                                </div>
                                {cert.expected && (
                                    <p className="text-xs text-cyan-400 mt-2 font-mono">Expected: {cert.expected}</p>
                                )}
                                {cert.priority && (
                                    <p className="text-xs text-yellow-400 mt-2 font-mono">⭐ {cert.priority}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-2">
                        ✅ Completed
                    </h3>
                    <div className="grid gap-4">
                        {CERTIFICATIONS.filter(cert => cert.status === "Completed").map((cert, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="glass-panel p-4 rounded-lg border border-white/5 hover:border-green-500/50 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-lg text-white">{cert.name}</h4>
                                        <p className="text-sm text-stone-400 mt-1 font-mono">{cert.provider}</p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/30">
                                        ✓ Completed
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
