import { RiReactjsLine } from "react-icons/ri";
import { SiSolidity, SiEthereum, SiMongodb, SiNodedotjs, SiPostgresql, SiTypescript, SiRust } from "react-icons/si";
import { FaTools } from "react-icons/fa";
import { motion } from "framer-motion";

const TechCard = ({ icon: Icon, name, color, delay }) => (
    <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0] }}
        transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
        }}
        whileHover={{ scale: 1.1, y: -5 }}
        className="relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-4 group hover:border-cyan-400/50 transition-all w-32 h-32"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Icon className={`text-5xl ${color} relative z-10 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300`} />
        <span className="text-xs font-mono text-stone-400 group-hover:text-white transition-colors relative z-10">{name}</span>
    </motion.div>
);

const Technologies = () => {
    return (
        <div className="pb-24 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-900/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl lg:text-5xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-purple">
                    Tech Stack
                </span>
            </motion.h2>

            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto px-4">
                <TechCard icon={SiSolidity} name="Solidity" color="text-stone-200" delay={0} />
                <TechCard icon={SiEthereum} name="Ethereum" color="text-cyan-400" delay={0.2} />
                <TechCard icon={FaTools} name="Hardhat" color="text-yellow-400" delay={0.4} />
                <TechCard icon={RiReactjsLine} name="React" color="text-cyan-400" delay={0.6} />
                <TechCard icon={SiNodedotjs} name="Node.js" color="text-green-500" delay={0.8} />
                <TechCard icon={SiTypescript} name="TypeScript" color="text-blue-500" delay={1.0} />
                <TechCard icon={SiRust} name="Rust" color="text-orange-500" delay={1.2} />
                <TechCard icon={SiPostgresql} name="PostgreSQL" color="text-sky-500" delay={1.4} />
                <TechCard icon={SiMongodb} name="MongoDB" color="text-green-500" delay={1.6} />
            </div>
        </div>
    );
};

export default Technologies;
