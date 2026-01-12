import { motion } from "framer-motion";

const CyberNode = ({ theme }) => {
    const colorMap = {
        purple: "bg-purple-500 shadow-purple-500/50",
        cyan: "bg-cyan-500 shadow-cyan-500/50",
        green: "bg-green-500 shadow-green-500/50",
        orange: "bg-orange-500 shadow-orange-500/50",
        blue: "bg-blue-500 shadow-blue-500/50",
    };

    const activeClass = colorMap[theme] || colorMap.purple;

    return (
        <div className="relative w-4 h-4">
            <div className={`absolute inset-0 rounded-full animate-pulse ${activeClass.replace('bg-', 'bg-opacity-50 ')}`} />
            <div className={`relative w-full h-full rounded-full border-2 border-[#030014] ${activeClass.split(" ")[0]} z-10`} />
        </div>
    );
};

export default CyberNode;
