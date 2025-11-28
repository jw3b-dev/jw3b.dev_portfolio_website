import { motion } from "framer-motion";

const Logo = ({ className = "h-8" }) => {
    return (
        <motion.div
            className={`${className} flex items-center gap-2`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="font-mono text-2xl font-bold tracking-tighter text-white">
                jw3b
            </div>
        </motion.div>
    );
};

export default Logo;
