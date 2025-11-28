import aboutImg from "../assets/about.webp";
import { ABOUT_TEXT } from "../constants";
import { motion } from "framer-motion";

const About = () => {
    return (
        <div className="pb-4" id="about">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-20 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    About Me
                </span>
            </motion.h2>
            <div className="flex flex-wrap">
                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2 lg:p-8"
                >
                    <div className="flex items-center justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <img
                                className="relative rounded-2xl border border-white/10 group-hover:border-cyan-400/50 transition-colors"
                                src={aboutImg}
                                alt="about"
                            />
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-1/2"
                >
                    <div className="flex justify-center lg:justify-start h-full items-center">
                        <div className="glass-panel p-8 rounded-xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-cyan-400"></div>
                            <p className="my-2 max-w-xl py-6 font-mono text-stone-300 leading-relaxed">
                                <span className="text-cyan-400 mr-2">$</span>
                                {ABOUT_TEXT}
                                <span className="animate-pulse inline-block w-2 h-4 bg-cyan-400 ml-1 align-middle"></span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
