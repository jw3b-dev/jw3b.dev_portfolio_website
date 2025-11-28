import { CONTACT } from "../constants";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Contact = () => {
    return (
        <div className="border-t border-white/10 pb-20" id="contact">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-10 text-center text-4xl font-bold"
            >
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Get in Touch
                </span>
            </motion.h2>
            <div className="text-center tracking-tighter">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <p className="my-4 text-lg text-stone-300">{CONTACT.address}</p>
                    <p className="my-4 text-stone-400">{CONTACT.phoneNo}</p>
                    <a
                        href={`mailto:${CONTACT.email}`}
                        className="inline-block my-4 text-cyan-400 hover:text-cyan-300 transition-colors border-b border-cyan-400/50 hover:border-cyan-300 font-mono text-xl"
                    >
                        {CONTACT.email}
                    </a>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex justify-center gap-8 mt-12"
                >
                    <a
                        href={CONTACT.codehawks}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-purple-400 transition-all hover:scale-110 flex flex-col items-center gap-2 group"
                    >
                        <span className="text-3xl">🦅</span>
                        <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">CodeHawks</span>
                    </a>
                    <a
                        href={CONTACT.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-purple-400 transition-all hover:scale-110 flex flex-col items-center gap-2 group"
                    >
                        <FaGithub className="text-3xl" />
                        <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">GitHub</span>
                    </a>
                    <a
                        href={CONTACT.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-cyan-400 transition-all hover:scale-110 flex flex-col items-center gap-2 group"
                    >
                        <FaLinkedin className="text-3xl" />
                        <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">LinkedIn</span>
                    </a>
                    <a
                        href={CONTACT.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-cyan-400 transition-all hover:scale-110 flex flex-col items-center gap-2 group"
                    >
                        <FaTwitter className="text-3xl" />
                        <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">Twitter</span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
