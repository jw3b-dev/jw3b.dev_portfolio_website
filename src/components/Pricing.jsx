import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Code2, Kanban, Check, ArrowRight, ExternalLink, Download } from "lucide-react";
import { SERVICE_PACKAGES } from "../constants";

const Pricing = () => {
    const [activeTab, setActiveTab] = useState("security");

    const tabs = [
        { id: "security", label: "Security", icon: Shield, color: "purple", gradient: "from-purple-400 to-purple-600" },
        { id: "engineering", label: "Engineering", icon: Code2, color: "cyan", gradient: "from-cyan-400 to-cyan-600" },
        { id: "pm", label: "Management", icon: Kanban, color: "green", gradient: "from-green-400 to-green-600" }
    ];

    const currentData = SERVICE_PACKAGES[activeTab];

    return (
        <section className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        <span className="text-white">Hire for </span>
                        <span className={`bg-clip-text text-transparent bg-gradient-to-r ${tabs.find(t => t.id === activeTab).gradient}`}>
                            Excellence
                        </span>
                    </h1>
                    <p className="text-stone-400 max-w-2xl mx-auto text-lg">
                        Transparent pricing and defined scopes. Choose the engagement model that fits your protocol's stage—from MVP to Mainnet.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-16">
                    <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300
                                    ${activeTab === tab.id ? 'text-white' : 'text-stone-400 hover:text-white'}
                                `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 bg-${tab.color}-500/20 rounded-xl border border-${tab.color}-500/50`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon size={18} className={activeTab === tab.id ? `text-${tab.color}-400` : ""} />
                                <span className="relative z-10 font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Tab Header Info */}
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-3">{currentData.title}</h2>
                            <p className="text-xl text-stone-300 mb-2">{currentData.subtitle}</p>
                            <p className="text-stone-500 max-w-3xl mx-auto">{currentData.description}</p>
                        </div>

                        {/* Layout Switching based on Tab Type */}
                        {activeTab === "engineering" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {currentData.categories.map((cat, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                        <h3 className="text-2xl font-bold text-cyan-400 mb-6">{cat.name}</h3>
                                        <div className="space-y-6">
                                            {cat.packages.map((pkg, i) => (
                                                <div key={i} className="group border-b border-white/5 last:border-0 pb-6 last:pb-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-lg font-medium text-white group-hover:text-cyan-300 transition-colors">
                                                            {pkg.name}
                                                        </h4>
                                                        <span className="font-mono text-cyan-400 whitespace-nowrap bg-cyan-500/10 px-2 py-1 rounded text-sm">
                                                            {pkg.price}
                                                        </span>
                                                    </div>
                                                    <p className="text-stone-400 text-sm leading-relaxed">{pkg.details}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {currentData.packages.map((pkg, idx) => (
                                    <div
                                        key={idx}
                                        className={`
                                            relative bg-white/5 border rounded-2xl p-8 backdrop-blur-sm flex flex-col
                                            transition-all duration-300 hover:transform hover:-translate-y-2
                                            ${pkg.recommended
                                                ? `border-${currentData.color}-500/50 shadow-2xl shadow-${currentData.color}-500/10`
                                                : 'border-white/10 hover:border-white/20'}
                                        `}
                                    >
                                        {pkg.recommended && (
                                            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-${currentData.color}-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                                            <div className="flex items-end gap-1 mb-4">
                                                <span className={`text-3xl font-bold text-${currentData.color}-400`}>{pkg.price}</span>
                                                <span className="text-stone-500 text-sm mb-1">/ {pkg.period}</span>
                                            </div>
                                            <p className="text-stone-400 text-sm h-12">{pkg.description}</p>
                                        </div>

                                        <div className="flex-grow space-y-4 mb-8">
                                            {pkg.features.map((feat, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <Check size={16} className={`text-${currentData.color}-500 mt-1 flex-shrink-0`} />
                                                    <span className="text-stone-300 text-sm">{feat}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button className={`
                                            w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                            ${pkg.recommended
                                                ? `bg-${currentData.color}-500 text-black hover:bg-${currentData.color}-400`
                                                : 'bg-white/10 text-white hover:bg-white/20'}
                                        `}>
                                            <span>Book Now</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Consulting / Hourly Footer */}
                        {activeTab === "engineering" && (
                            <div className="mt-12 text-center">
                                <p className="text-stone-400 mb-4">Need something custom?</p>
                                <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                                    <Code2 size={20} />
                                    <span>Engineering Hourly Rate: {currentData.hourlyRate}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};

export default Pricing;
