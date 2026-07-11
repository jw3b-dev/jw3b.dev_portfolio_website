import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Shield, Code2, Kanban, Check, ArrowRight, ChevronRight, 
    Activity, Cpu, Target, ExternalLink, HelpCircle, RotateCcw,
    Layers, Zap, Database, Globe
} from "lucide-react";
import { SERVICE_PACKAGES } from "../constants";
import ParticleCanvas from "./jw3b.devParticleCanvas";
import UnlockPaywall from "./pricing/UnlockPaywall";
import { SERVICE_LOCKS, PACKAGE_TO_LOCK } from "../config/contracts";

// Premium color system matching Services.jsx
const colors = {
    purple: {
        primary: "#a855f7",
        secondary: "#7c3aed",
        glow: "rgba(168, 85, 247, 0.4)",
        gradient: "linear-gradient(135deg, #a855f7, #7c3aed)"
    },
    cyan: {
        primary: "#06b6d4",
        secondary: "#0891b2",
        glow: "rgba(6, 182, 212, 0.4)",
        gradient: "linear-gradient(135deg, #06b6d4, #0891b2)"
    },
    green: {
        primary: "#22c55e",
        secondary: "#16a34a",
        glow: "rgba(34, 197, 94, 0.4)",
        gradient: "linear-gradient(135deg, #22c55e, #16a34a)"
    },
    orange: {
        primary: "#f97316",
        secondary: "#ea580c",
        glow: "rgba(249, 115, 22, 0.4)",
        gradient: "linear-gradient(135deg, #f97316, #ea580c)"
    },
    blue: {
        primary: "#3b82f6",
        secondary: "#2563eb",
        glow: "rgba(59, 130, 246, 0.4)",
        gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    }
};

// Reusable Flippable Card Component
const FlippableCard = ({ children, backContent, isActive, onClick, colorConfig, className = "" }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const cardRef = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
        if (!cardRef.current || isFlipped) return; // Disable tilt when flipped or flipping
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Subtle tilt
        const rotateXVal = ((e.clientY - centerY) / (rect.height / 2)) * -4; 
        const rotateYVal = ((e.clientX - centerX) / (rect.width / 2)) * 4;
        setRotateX(rotateXVal);
        setRotateY(rotateYVal);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    const handleLearnMore = (e) => {
        e.stopPropagation();
        setIsFlipped(true);
    };

    const handleFlipBack = (e) => {
        e.stopPropagation();
        setIsFlipped(false);
    };

    return (
        <div
            ref={cardRef}
            onClick={!isFlipped ? onClick : undefined} // Only trigger main click if not flipped
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative cursor-pointer h-full ${className} ${isActive ? 'z-20' : 'z-10'}`}
            style={{ perspective: "1000px" }}
        >
            <motion.div
                className="relative h-full w-full"
                style={{ 
                    transformStyle: "preserve-3d"
                }}
                animate={{ 
                    rotateY: isFlipped ? 180 : rotateY,
                    rotateX: isFlipped ? 0 : rotateX,
                    scale: isActive && !isFlipped ? 1.02 : 1 // Lift only when active and front-facing
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* --- FRONT OF CARD --- */}
                <div 
                    className={`
                        relative h-full w-full p-8 rounded-2xl border backdrop-blur-xl overflow-hidden flex flex-col backface-hidden
                        ${isActive ? 'border-white/10' : 'border-white/5 hover:border-white/10'}
                    `}
                    style={{
                        backfaceVisibility: "hidden",
                        background: isActive 
                            ? `linear-gradient(135deg, ${colorConfig.primary}10, transparent 60%)` 
                            : 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)',
                        boxShadow: isActive 
                            ? `0 20px 40px -10px ${colorConfig.glow}` 
                            : '0 10px 30px -10px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Active Gradient Mesh */}
                     {isActive && (
                        <div 
                            className="absolute inset-0 rounded-2xl pointer-events-none opacity-50"
                            style={{
                                border: `1px solid ${colorConfig.primary}`,
                                maskImage: 'linear-gradient(to bottom, black, transparent)'
                            }}
                        />
                    )}
                    
                    {children}

                    {/* Learn More Trigger - Only show if backContent exists */}
                    {backContent && (
                        <div className="mt-auto pt-6 flex justify-center border-t border-white/5">
                            <button 
                                onClick={handleLearnMore}
                                className="text-xs font-mono flex items-center gap-2 hover:underline transition-all relative z-10"
                                style={{ color: colorConfig.primary }}
                            >
                                <ExternalLink size={12} />
                                <span>LEARN MORE</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- BACK OF CARD --- */}
                {backContent && (
                    <div 
                        className="absolute inset-0 h-full w-full p-8 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden flex flex-col backface-hidden"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            boxShadow: `0 20px 40px -10px ${colorConfig.glow}`
                        }}
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <span className="text-xs font-mono text-stone-400">TECHNICAL SPECS</span>
                            <div className="p-1.5 rounded-full bg-white/5">
                                <Layers size={14} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-grow space-y-6">
                            {backContent}
                        </div>

                        <button 
                            onClick={handleFlipBack}
                            className="mt-auto w-full py-3 rounded-lg border border-white/10 hover:bg-white/5 text-stone-300 text-xs font-mono flex items-center justify-center gap-2 transition-all relative z-10"
                        >
                            <RotateCcw size={14} />
                            <span>RETURN TO LOADOUT</span>
                        </button>
                    </div>
                )}

            </motion.div>
        </div>
    );
};

// Assessment Questions Data
const ASSESSMENT_DATA = {
    security: [
        { id: "target", question: "Attack Surface", options: ["Smart Contracts", "Frontend / DNS", "Full Protocol"] },
        { id: "tvl", question: "Economic Value (TVL)", options: ["Seed (<$1M)", "Growth ($1M-$10M)", "Whale ($50M+)"] },
        { id: "complexity", question: "Code Complexity", options: ["Standard ERCs", "Novel Mechanisms", "Forked/Modified"] }
    ],
    engineering: [
        { id: "phase", question: "Development Phase", options: ["Greenfield (0-1)", "MVP Refinement", "Scaling L2"] },
        { id: "constraint", question: "Critical Constraint", options: ["Gas Optimization", "Throughput/TPS", "Time-to-Market"] },
        { id: "arch", question: "Architecture", options: ["Monolithic", "Modular / ZK", "Cross-Chain"] }
    ],
    pm: [
        { id: "topology", question: "Team Topology", options: ["Solo/Founder", "Distributed Squad", "DAO Structure"] },
        { id: "method", question: "Methodology", options: ["Chaos/Ad-hoc", "Kanban/Agile", "Waterfall"] },
        { id: "gov", question: "Governance", options: ["Centralized Admin", "Multisig/Safe", "On-Chain DAO"] }
    ]
};

const MissionControl = () => {
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState(null); 
  const [assessment, setAssessment] = useState({}); // Stores q_id: answer
  const [engagement, setEngagement] = useState(null); 

  const objectives = [
    { id: "security", title: "SECURE", icon: Shield, desc: "Deploy advanced defensive measures. Fortify protocols against sovereign threats, economic exploits, and nation-state vectors.", color: "purple" },
    { id: "engineering", title: "BUILD", icon: Code2, desc: "Architect the new internet. Severe-grade decentralized infrastructure, autonomous agents, and censorship-resistant financial systems.", color: "cyan" },
    { id: "pm", title: "LEAD", icon: Kanban, desc: "Command and control. Orchestrate distributed engineering teams, manage chaotic roadmaps, and execute mainnet launches with military precision.", color: "green" }
  ];

  const engagements = [
    { id: "project", title: "TACTICAL OPS", subtitle: "One-Off Projects", icon: Target, desc: "Surgical intervention. Fixed-scope deliverables executed with high velocity. Ideal for audits, MVPs, and specific module implementations.", color: "orange" },
    { id: "retainer", title: "CORE INTEGRATION", subtitle: "Monthly Retainer", icon: Activity, desc: "Strategic embedding. I integrate directly into your core team as a force multiplier. Continuous delivery, architectural guidance, and long-term security oversight.", color: "blue" }
  ];

  const selectedPersonaData = objective ? SERVICE_PACKAGES[objective] : null;
  const loadoutPackages = (objective && engagement) ? selectedPersonaData[engagement] : [];
  const activeColorConfig = objective ? colors[objectives.find(o => o.id === objective).color] : colors.purple;

  // Handle Assessment Selection
  const handleAssessmentSelect = (questionId, value) => {
    setAssessment(prev => ({...prev, [questionId]: value}));
  };

  const isAssessmentComplete = () => {
    const questions = ASSESSMENT_DATA[objective];
    return questions.every(q => assessment[q.id]);
  };

  // Helper to generate back content based on objective
  const getBackContent = (pkg) => {
    // Determine stack based on objective
    let stack = [];
    if (objective === 'engineering') stack = [{icon: Code2, label: "Solidity / Rust"}, {icon: Globe, label: "React / Next.js"}, {icon: Database, label: "The Graph / IPFS"}];
    if (objective === 'security') stack = [{icon: Shield, label: "Foundry / Echidna"}, {icon: Zap, label: "Slither / Aderyn"}, {icon: Activity, label: "Manual Review"}];
    if (objective === 'pm') stack = [{icon: Kanban, label: "Jira / ClickUp"}, {icon: Activity, label: "Agile / Scrum"}, {icon: Target, label: "Risk Mgmt"}];

    return (
        <>
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Core Technology</h4>
                <div className="grid grid-cols-1 gap-2">
                    {stack.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                            <item.icon size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-300">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

             <div className="space-y-2 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-white">Ideal For</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                    {pkg.description}
                </p>
                <div className="flex gap-2 mt-2">
                    {pkg.recommended && (
                         <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-mono border border-green-500/30">
                            BEST VALUE
                        </span>
                    )}
                </div>
            </div>
        </>
    );
  };

  return (
    <section className="min-h-screen pt-40 pb-20 px-4 md:px-8 relative overflow-hidden font-sans border-y border-white/5">
      
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Particles Layer */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
          <ParticleCanvas />
      </div>

      {/* Dynamic Ambient Gradient to support the active color theme */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
            background: `radial-gradient(circle at 50% 30%, ${activeColorConfig.primary}08, transparent 70%)`
        }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2NkYGD4z8DAwMgAAQAAYgcDA4s8618AAAAASUVORK5CYII=')] opacity-5 mix-blend-overlay"></div>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-16 relative z-10 flex flex-col items-center text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 mb-6 rounded-full border bg-black/40 backdrop-blur-md"
            style={{ 
                borderColor: `${activeColorConfig.primary}30`,
                boxShadow: `0 0 20px -5px ${activeColorConfig.primary}30`
            }}
        >
            <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ background: activeColorConfig.primary }}></div>
                <div className="relative w-2 h-2 rounded-full" style={{ background: activeColorConfig.primary }}></div>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Mission Control Active
            </span>
        </motion.div>
        
        <h1 className="text-4xl lg:text-6xl font-black mb-6 text-white tracking-tighter uppercase relative inline-block">
             <span className="relative z-10">Configure Protocol</span>
             <span 
                className="absolute -inset-1 blur-2xl opacity-20 pointer-events-none"
                style={{ background: activeColorConfig.primary }}
             ></span>
        </h1>
        
        <p className="text-stone-400 max-w-xl mx-auto mb-12 text-sm md:text-base leading-relaxed">
            Initialize your engagement parameters. Select your objective, assess tactical requirements, and generate a custom service loadout.
        </p>
        
        {/* Progress Steps */}
         <div className="flex justify-center items-center gap-4 text-sm font-mono mt-8 overflow-x-auto pb-4 md:pb-0">
            <span className="text-white text-shadow-glow whitespace-nowrap transition-colors duration-300">01 OBJECTIVE</span>
            <ChevronRight size={14} className="text-stone-800 shrink-0" />
            <span className={`${step >= 2 ? "text-white text-shadow-glow" : "text-stone-700"} whitespace-nowrap transition-colors duration-300`}>02 ASSESSMENT</span>
            <ChevronRight size={14} className="text-stone-800 shrink-0" />
            <span className={`${step >= 3 ? "text-white text-shadow-glow" : "text-stone-700"} whitespace-nowrap transition-colors duration-300`}>03 PARAMETERS</span>
            <ChevronRight size={14} className="text-stone-800 shrink-0" />
            <span className={`${step >= 4 ? "text-white text-shadow-glow" : "text-stone-700"} whitespace-nowrap transition-colors duration-300`}>04 LOADOUT</span>
          </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 min-h-[500px]">
        <AnimatePresence mode="wait">
            
          {/* STEP 1: OBJECTIVE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {objectives.map((obj) => (
                <div key={obj.id} className="h-full">
                     {/* Using the same component structure for consistency, but flipping disabled for Step 1 */}
                     <FlippableCard
                        colorConfig={colors[obj.color]}
                        onClick={() => { setObjective(obj.id); setAssessment({}); setStep(2); }}
                        className="group"
                        // Disable flipping for objective cards if desired, or verify if we want them flippable too. 
                        // User request specifically mentioned "bottom of each card" on the loadout. But let's keep it consistent if possible.
                        // Actually, let's keep FlippableCard logic but maybe hide 'Learn More' if no back content provided?
                        // For now we will just use the render structure.
                    >
                         <div className="flex flex-col h-full">
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                                style={{ 
                                    background: `linear-gradient(135deg, ${colors[obj.color].primary}20, transparent)`, 
                                    border: `1px solid ${colors[obj.color].primary}40`,
                                    color: colors[obj.color].primary,
                                    boxShadow: `0 0 20px -5px ${colors[obj.color].primary}20`
                                }}
                            >
                                <obj.icon size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">{obj.title}</h3>
                            <p className="text-stone-400 text-sm leading-relaxed mb-8 flex-grow">{obj.desc}</p>
                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500 group-hover:text-white transition-colors">
                                <span>Initiate</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </FlippableCard>
                    {/* Note: I didn't pass backContent so FlippableCard will render 'Learn More' but flipping might be empty. 
                        Update: I should hide 'Learn More' if backContent is null. */}
                </div>
              ))}
            </motion.div>
          )}

          {/* STEP 2: ASSESSMENT */}
          {step === 2 && (
            <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="max-w-3xl mx-auto"
            >
                 <button 
                    onClick={() => setStep(1)}
                    className="mb-8 text-stone-500 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors"
                >
                    <ChevronRight className="rotate-180" size={14} /> BACK TO OBJECTIVE
                </button>

                <div className="grid grid-cols-1 gap-6">
                    {ASSESSMENT_DATA[objective].map((q) => (
                        <div key={q.id} className="space-y-4">
                            <h3 className="text-stone-300 font-bold text-lg flex items-center gap-2">
                                <span style={{ color: activeColorConfig.primary }}>//</span> {q.question}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {q.options.map((opt) => {
                                    const isSelected = assessment[q.id] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleAssessmentSelect(q.id, opt)}
                                            className={`
                                                px-4 py-4 rounded-xl border text-sm font-medium transition-all duration-200 text-left md:text-center
                                                ${isSelected 
                                                    ? `bg-${activeColorConfig.primary}/10 border-${activeColorConfig.primary} text-white shadow-lg` 
                                                    : 'bg-white/5 border-white/5 text-stone-400 hover:bg-white/10 hover:text-white'}
                                            `}
                                            style={{
                                                backgroundColor: isSelected ? `${activeColorConfig.primary}15` : undefined,
                                                borderColor: isSelected ? activeColorConfig.primary : undefined,
                                                boxShadow: isSelected ? `0 0 20px ${activeColorConfig.primary}15` : undefined
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-end">
                    <button
                        onClick={() => isAssessmentComplete() && setStep(3)}
                        disabled={!isAssessmentComplete()}
                        className={`
                            px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all duration-300
                            ${isAssessmentComplete() 
                                ? 'text-black shadow-lg cursor-pointer hover:scale-105' 
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
                        `}
                        style={{
                            backgroundColor: isAssessmentComplete() ? activeColorConfig.primary : undefined,
                            boxShadow: isAssessmentComplete() ? `0 0 30px ${activeColorConfig.primary}50` : undefined
                        }}
                    >
                        <span>CONFIRM INTEL</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>
          )}

          {/* STEP 3: ENGAGEMENT */}
          {step === 3 && (
            <motion.div
              key="step3"
               initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto"
            >
                <button 
                    onClick={() => setStep(2)}
                    className="mb-8 text-stone-500 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors"
                >
                    <ChevronRight className="rotate-180" size={14} /> BACK TO ASSESSMENT
                </button>
                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {engagements.map((eng) => (
                  <div key={eng.id} className="h-full">
                       <FlippableCard
                            colorConfig={colors[eng.color]}
                            onClick={() => { setEngagement(eng.id); setStep(4); }}
                            className="group"
                            backContent={
                                <div className="flex flex-col h-full">
                                    <h4 className="text-xl font-bold mb-4" style={{ color: colors[eng.color].primary }}>
                                        // Deployment Specs
                                    </h4>
                                    <ul className="space-y-3 text-sm text-stone-400">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                                            {eng.id === 'project' ? "Full architectural audit included." : "Deep strategy and execution."}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                                            E2E encrypted secure channel.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                                            Real-time CI/CD integration.
                                        </li>
                                    </ul>
                                    <div className="mt-auto">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEngagement(eng.id);
                                                setStep(4);
                                            }}
                                            className="w-full py-3 rounded-xl font-bold transition-all"
                                            style={{ 
                                                background: `${colors[eng.color].primary}20`,
                                                border: `1px solid ${colors[eng.color].primary}40`,
                                                color: 'white'
                                            }}
                                        >
                                            SELECT THIS OPS
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div 
                                    className="p-3 rounded-xl"
                                    style={{ background: `${colors[eng.color].primary}15`, color: colors[eng.color].primary }}
                                >
                                    <eng.icon size={28} />
                                </div>
                                <div 
                                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                    style={{ 
                                        borderColor: `${colors[eng.color].primary}30`, 
                                        color: colors[eng.color].primary,
                                        background: `${colors[eng.color].primary}05`
                                    }}
                                >
                                    {eng.subtitle}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{eng.title}</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">{eng.desc}</p>
                      </FlippableCard>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: LOADOUT */}
          {step === 4 && (
             <motion.div
              key="step4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
                 <button 
                    onClick={() => setStep(3)}
                    className="text-stone-500 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors"
                >
                    <ChevronRight className="rotate-180" size={14} /> ADJUST PARAMETERS
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadoutPackages.map((pkg, idx) => {
                        const isRecommended = pkg.recommended;
                        const accent = activeColorConfig;
                        
                        return (
                             <FlippableCard
                                key={idx}
                                colorConfig={accent}
                                isActive={isRecommended} // Logic: Active state
                                className={isRecommended ? "md:-mt-4" : ""} // Subtle lift
                                backContent={getBackContent(pkg)}
                             >
                                {isRecommended && (
                                     <div className="absolute top-4 right-4 animate-pulse">
                                        <div 
                                            className="w-2 h-2 rounded-full"
                                            style={{ background: accent.primary, boxShadow: `0 0 10px ${accent.primary}` }}
                                        />
                                     </div>
                                )}

                                <h3 className="text-lg font-bold text-white mb-4">{pkg.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span 
                                        className="text-3xl font-bold tracking-tight"
                                        style={{ color: isRecommended ? accent.primary : 'white' }}
                                    >
                                        {pkg.price}
                                    </span>
                                    <span className="text-stone-500 text-xs">/ {pkg.period}</span>
                                </div>
                                
                                <p className="text-stone-400 text-xs leading-relaxed border-b border-white/5 pb-6 mb-6">
                                    {pkg.description}
                                </p>

                                <div className="space-y-3 mb-8">
                                    {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <Check size={14} style={{ color: accent.primary }} className="mt-0.5" />
                                            <span className="text-stone-300 text-xs">{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                {PACKAGE_TO_LOCK[pkg.name] ? (
                                    <UnlockPaywall 
                                        lockAddress={SERVICE_LOCKS[PACKAGE_TO_LOCK[pkg.name]]}
                                        metadata={{
                                            objective,
                                            engagement,
                                            package: pkg.name,
                                            assessment
                                        }}
                                    />
                                ) : (
                                    <button 
                                        className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                        style={{
                                            background: isRecommended ? accent.primary : 'rgba(255,255,255,0.05)',
                                            color: isRecommended ? '#000000' : '#ffffff',
                                            border: isRecommended ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <span>ENQUIRE</span>
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                )}
                             </FlippableCard>
                        );
                    })}
                </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
};

export default MissionControl;
