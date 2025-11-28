import { RiReactjsLine } from "react-icons/ri";
import { SiSolidity, SiEthereum, SiMongodb, SiNodedotjs, SiPostgresql, SiTypescript, SiRust } from "react-icons/si";
import { FaTools } from "react-icons/fa";
import { motion } from "framer-motion";

const TechCard = ({ icon: Icon, name, color }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-2 group hover:border-cyan-400/50 transition-colors"
    >
        <Icon className={`text-4xl ${color} group-hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all`} />
        <span className="text-sm font-mono text-stone-400 group-hover:text-white transition-colors">{name}</span>
    </motion.div>
);

const Technologies = () => {
    return (
        <div className="pb-24">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Tech Stack
                </span>
            </motion.h2>

            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                <TechCard icon={SiSolidity} name="Solidity" color="text-stone-200" />
                <TechCard icon={SiEthereum} name="Ethereum" color="text-cyan-400" />
                <TechCard icon={FaTools} name="Hardhat" color="text-yellow-400" />
                <TechCard icon={RiReactjsLine} name="React" color="text-cyan-400" />
                <TechCard icon={SiNodedotjs} name="Node.js" color="text-green-500" />
                <TechCard icon={SiTypescript} name="TypeScript" color="text-blue-500" />
                <TechCard icon={SiRust} name="Rust" color="text-orange-500" />
                <TechCard icon={SiPostgresql} name="PostgreSQL" color="text-sky-500" />
                <TechCard icon={SiMongodb} name="MongoDB" color="text-green-500" />
            </div>
        </div>
    );
};

export default Technologies;
