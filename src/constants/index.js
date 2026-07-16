import agileGypsyImg from "../assets/projects/agilegypsy-audit.png";
import devguildImg from "../assets/projects/devguild.png";
import auditbraveImg from "../assets/projects/auditbrave.png";
import fluxbraveImg from "../assets/projects/fluxbrave.png";
import rentaldepositImg from "../assets/projects/rentaldeposit.png";
import creatorhubImg from "../assets/projects/creatorhub.png";
import project2 from "../assets/projects/project-2.webp";

// Persona images
// Persona images
import personaEngineer from "../assets/persona_engineer.webp";
import personaPM from "../assets/persona_pm.webp";
import personaAuditor from "../assets/persona_auditor.webp";
import personaFounder from "../assets/persona_founder.webp";

export const HERO_CONTENT = `Founder of AgileGypsy — 15+ years delivering projects now focused on Web3. Building secure smart contracts, auditing protocols, and engineering full-stack dApps toward institutional-grade security standards.`;

export const ABOUT_TEXT = `I'm a blockchain developer specializing in smart contract security, trained at Cyfrin Updraft and Dapp University. As an active security researcher on CodeHawks, I conduct vulnerability assessments on DeFi protocols using Foundry, Slither, and Echidna. I'm advancing toward formal verification with Certora and exploring the intersection of AI × Blockchain for autonomous security testing. My mission is to protect decentralized systems while continuously expanding my expertise.`;

export const ABOUT_INTRO = `Blockchain Developer with 15+ years of project leadership now delivering in Web3. I bring disciplined engineering practices from water infrastructure and business development into smart contract development and security auditing. Currently offering development and security services while advancing toward institutional-grade formal verification. Select a persona below to explore my capabilities.`;

export const ROLE_PROFILES = {
  engineer: {
    id: "engineer",
    title: "Full-Stack Blockchain Engineer",
    tag: "ENGINEER",
    color: "cyan",
    icon: "Code2",
    image: personaEngineer,
    description: "I architect production-grade blockchain protocols at the intersection of AI and decentralized systems. Currently enrolled in Dapp University's Blockchain Bootcamp 3.0 and pursuing the Cyfrin SSCD+ certification, I bring both formal education and hands-on experience to every project.\n\nMy engineering focus spans gasless UX with Account Abstraction (ERC-4337), autonomous AI agents for DeFi operations, and institutional-grade RWA tokenization with ERC-3643. I've built everything from flash loan arbitrage contracts to ZK-rollup integrations, always prioritizing gas optimization and security-first design patterns.\n\nWith a foundation in Chainlink oracles, The Graph indexing, and cross-chain bridge protocols, I deliver full-stack solutions from Solidity/Rust smart contracts to React/Next.js frontends with seamless wallet integration.",
    highlights: [
      { text: "Solidity/Rust", color: "purple" },
      { text: "ERC-4337", color: "cyan" },
      { text: "AI Agents", color: "orange" },
      { text: "ZK Circuits", color: "purple" }
    ],
    linkedSections: ["projects", "technologies"]
  },
  pm: {
    id: "pm",
    title: "Web3 Agile Project Manager",
    tag: "PM",
    color: "green",
    icon: "Kanban",
    image: personaPM,
    description: "With 15+ years of project leadership across water engineering, environmental solutions, and now Web3, I bring battle-tested Agile methodologies to the blockchain space. I hold AgilePM Practitioner and PRINCE2 Foundation certifications, and I've delivered 20+ projects with a 95% on-time completion rate.\n\nMy project management experience spans from managing multi-million dollar infrastructure projects for Total Water Solutions and Designed Bio Solutions to orchestrating DeFi protocol launches from whitepaper to mainnet. I've achieved up to 40% cost savings through Lean methodologies while maintaining the highest quality standards.\n\nAs a certified ClickUp Expert, I leverage modern project management tools to provide transparency, risk mitigation, and seamless cross-functional coordination for DAOs, startups, and enterprise Web3 teams.",
    highlights: [
      { text: "Agile Delivery", color: "green" },
      { text: "15+ Years PM", color: "green" },
      { text: "PRINCE2", color: "green" },
      { text: "95% On-Time", color: "green" }
    ],
    linkedSections: ["projects", "experience"]
  },
  auditor: {
    id: "auditor",
    title: "Smart Contract Security Auditor",
    tag: "AUDITOR",
    color: "purple",
    icon: "Shield",
    image: personaAuditor,
    description: "I protect high-value DeFi protocols against sophisticated attack vectors through rigorous security assessments. Active on Code4rena, Sherlock, and Immunefi, I've developed an adversarial mindset honed through competitive auditing and continuous research into emerging exploit patterns.\n\nMy security toolkit includes Foundry for invariant testing, Slither and Aderyn for static analysis, Echidna and Medusa for property-based fuzzing, and Certora for formal verification. I hold the Advanced Web3 Wallet Security certification from Cyfrin and specialize in reentrancy, oracle manipulation, flash loan attacks, and cross-chain bridge vulnerabilities.\n\nEvery audit combines manual code review with AI-enhanced fuzzing to catch edge cases that automated tools miss. My mission is to find critical vulnerabilities before attackers do, ensuring protocols launch with institutional-grade security.",
    highlights: [
      { text: "Foundry", color: "purple" },
      { text: "Slither", color: "rose" },
      { text: "Echidna", color: "cyan" },
      { text: "Aderyn", color: "green" }
    ],
    linkedSections: ["services"]
  },
  founder: {
    id: "founder",
    title: "Founder & Business Development",
    tag: "FOUNDER",
    color: "orange",
    icon: "Rocket",
    image: personaFounder,
    description: "As Founder of AgileGypsy, I drive the strategic vision for AI × Web3 convergence. My unique background combines 15+ years of business development experience—including being featured in Water & Sanitation Africa magazine—with cutting-edge blockchain expertise.\n\nI build strategic partnerships, design tokenomics models, and guide architectural decisions for Web3 startups and established protocols alike. My consulting work has spanned industries from SproutAI to environmental engineering, always focused on bridging the gap between complex technology and business value.\n\nWith certifications in Neo4j graph databases and a deep understanding of RWA tokenization strategies, I help projects navigate the transition from Web2 to Web3. My mission is to build the next generation of decentralized infrastructure that is as secure as it is revolutionary.",
    highlights: [
      { text: "Strategic BD", color: "orange" },
      { text: "Tokenomics", color: "blue" },
      { text: "AI × Web3", color: "orange" },
      { text: "15+ Years", color: "green" }
    ],
    linkedSections: ["contact"]
  }
};

export const SERVICES = [
  {
    title: "Smart Contract Security & AI Defense",
    subtitle: "Battle-Hardened Protocol Protection.",
    description: "Protecting assets against next-generation attack vectors. I provide comprehensive vulnerability detection, formal verification, and AI-enhanced security analysis for DeFi protocols, bridges, and modular architectures.",
    features: ["AI-Vector Analysis", "Formal Verification", "Cross-Chain Security", "Detailed Audit Reports"],
    color: "purple",
    link: "https://audit.agilegypsy.com"
  },
  {
    title: "AI-Driven DeFi & Agent Development",
    subtitle: "Building the Autonomous Web3 Workforce.",
    description: "Engineering intelligent agents that operate 24/7. I build MEV-aware trading bots, automated portfolio managers, and intent-based transaction agents that execute complex strategies without human intervention.",
    features: ["Autonomous Agents", "Intent Solvers & MEV", "Automated Treasury Ops", "Multi-Agent Systems"],
    color: "cyan",
    link: "https://artofzeta.com/app/"
  },
  {
    title: "RWA & Asset Tokenization",
    subtitle: "Institutional-Grade On-Chain Infrastructure.",
    description: "Bridging real-world value to the blockchain. I engineer compliance-ready token standards (ERC-3643), decentralized identity (DID) integrations, and settlement layers for real estate, private credit, and treasury bills.",
    features: ["Regulatory Compliance", "Asset Fractionalization", "Identity & Whitelisting", "Restricted Token Standards"],
    color: "green",
    link: "https://agilegypsy.com"
  },
  {
    title: "Strategic Architecture & ZK Scaling",
    subtitle: "Future-Proof Protocol Design.",
    description: "Designing for the modular & privacy-first era. I provide expert guidance on Zero-Knowledge rollup implementation, app-chain deployment, and sustainable tokenomics simulation to ensure your protocol scales securely.",
    features: ["ZK & Modular Strategy", "Tokenomics Design", "App-Chain Architecture", "Protocol Strategy"],
    color: "orange",
    link: "https://kthulhu.co"
  },
  {
    title: "Full-Stack Blockchain Engineering",
    subtitle: "Production-Grade dApp Development.",
    description: "Building secure, scalable applications with seamless UX. From high-performance smart contracts in Solidity/Rust to user-friendly interfaces using Account Abstraction (ERC-4337) for gasless, key-free experiences.",
    features: ["Secure Smart Contracts", "DeFi & Yield Integration", "Gasless UX (ERC-4337)", "Cross-Chain Interoperability"],
    color: "blue",
    link: "https://kointel.co.za"
  },
  {
    title: "Web3 Product Delivery",
    subtitle: "End-to-End Delivery Assurance.",
    description: "Steering complex initiatives from whitepaper to mainnet. I provide rigorous roadmap execution, cross-functional coordination, and quality assurance to ensure high-stakes launches succeed without critical failures.",
    features: ["Roadmap Execution", "Mainnet Launch Strategy", "Team Coordination", "Quality Assurance"],
    color: "rose",
    link: "https://agilegypsy.com"
  }
];

export const SERVICE_PACKAGES = {
  security: {
    title: "Security Auditing",
    subtitle: "Fortify Your Protocol Against Sovereign Threats",
    description: "I bring an adversarial mindset, AI-driven fuzzing, and formal verification to expose vulnerabilities before they become exploits. Don't just audit—immunize your codebase against next-gen attack vectors.",
    color: "purple",
    icon: "Shield",
    project: [
      {
        name: "Security Review Lite",
        price: "$500",
        period: "flat fee",
        description: "Rapid entry-level assessment for single contracts or small modules (≤500 SLOC). Focuses on identifying obvious vulnerabilities, logic errors, and gas inefficiencies.",
        features: ["1 Smart Contract", "Manual Code Review", "Static Analysis (Slither)", "Gas Optimization Tips", "48h Turnaround"],
        recommended: false
      },
      {
        name: "Standard Audit",
        price: "$2,500+",
        period: "starting",
        description: "Comprehensive vulnerability assessment for pre-launch protocols. Includes manual line-by-line review, custom fuzzing harness development (Foundry/Echidna), and economic attack simulation. Delivered with a detailed remediation roadmap.",
        features: ["Full Protocol Scope", "Manual & Automated Review", "Fuzz Testing Harness", "Remediation Roadmap", "Fix Verification", "2 Weeks Avg."],
        recommended: true
      },
      {
        name: "Enterprise Verification",
        price: "$10,000+",
        period: "starting",
        description: "Institutional-grade security assurance. Includes formal verification with Certora, advanced invariant testing, and deep economic modeling for high-TVL protocols.",
        features: ["Multi-Contract Systems", "Formal Verification (Certora)", "Invariant Testing", "Economic Attack Simulation", "Direct Team Access", "4-6 Weeks"],
        recommended: false
      }
    ],
    retainer: [
       {
        name: "Security Advisor",
        price: "$6,000",
        period: "per month",
        description: "Ongoing security guidance for early-stage teams. I review every PR, advise on architectural decisions, and ensure security best practices are baked in from day one.",
        features: ["~60 Hours / Month", "Architecture Review", "PR Code Audits", "Ad-hoc Advisory", "Flexible Scheduling"],
        recommended: false
      },
      {
        name: "Resident Auditor",
        price: "$10,000",
        period: "per month",
        description: "Embedded security resource. I work alongside your devs to build secure code. Includes continuous fuzzing coverage and threat modeling as the protocol evolves.",
        features: ["~120 Hours / Month", "Continuous Auditing", "Threat Modeling", "Test Suite Enhancement", "Weekly Syncs"],
        recommended: true
      },
      {
        name: "Fractional CSO",
        price: "$12,500",
        period: "per month",
        description: "Full security leadership. I manage external audits, run bug bounty programs, and define the incident response plan to protect your protocol's reputation and assets.",
        features: ["~160 Hours / Month", "Security Strategy", "Manage Audit Firms", "Incident Response Plan", "Team Training"],
        recommended: false
      }
    ]
  },
  engineering: {
    title: "Full-Stack Engineering",
    subtitle: "Architecting the Decentralized Future",
    description: "From zero-knowledge logic to seamless account abstraction UIs, I build production-grade infrastructure that scales with your TVL. Clean, gas-optimized code that stands the test of time.",
    color: "cyan",
    icon: "Code2",
    hourlyRate: "$125 - $150 / hr",
    project: [
      {
         name: "Smart Contract Module",
         price: "$5,000+",
         period: "starting",
         description: "Custom solidity development for specific needs. Tokens (ERC20/721), Staking contracts, or isolated DeFi logic modules. Fully tested and documented.",
         features: ["Solidity Development", "Unit Testing (Foundry)", "Gas Optimization", "NatSpec Documentation", "Deployment Scripts"],
         recommended: false
      },
      {
         name: "dApp MVP",
         price: "$15,000+",
         period: "starting",
         description: "Rapid deployment of a fully functional Alpha. Includes core Solidity logic (ERC-20/721), a secure React/Next.js frontend with RainbowKit, and subgraph indexing. Optimized for speed-to-market without sacrificing security patterns.",
         features: ["Core Smart Contracts", "React + RainbowKit UI", "Wallet Integration", "The Graph / Indexing", "Testnet Deployment"],
         recommended: true
      },
      {
         name: "Full Protocol Build",
         price: "$50,000+",
         period: "starting",
         description: "Complete multi-contract system engineering. DEXs, Lending Markets, or complex Yield protocols. Includes advanced security patterns and full frontend dashboard.",
         features: ["Complex Architecture", "Advanced Security Patterns", "Full Frontend Dashboard", "Custom API & Indexer", "Mainnet Launch Support"],
         recommended: false
      }
    ],
    retainer: [
      {
        name: "Fractional Dev",
        price: "$6,000",
        period: "per month",
        description: "Part-time capacity to keep your roadmap moving. Ideal for maintenance, small feature additions, or assisting an existing lead developer.",
        features: ["~60 Hours / Month", "Frontend or Contracts", "Bug Fixes", "Feature Implementation", "Code Reviews"],
        recommended: false
      },
      {
        name: "Standard Engineer",
        price: "$10,000",
        period: "per month",
        description: "A dedicated senior engineer without the overhead. High velocity delivery across the full stack (Solidity + React). I own features from spec to shipping.",
        features: ["~120 Hours / Month", "Full-Stack Dev", "Sprint Participation", "Architecture Design", "Daily Updates"],
        recommended: true
      },
      {
        name: "Tech Lead / CTO",
        price: "$12,500",
        period: "per month",
        description: "Technical leadership for your project. I manage the stack, make high-level architectural decisions, and mentor junior developers to ensure code quality.",
        features: ["~160 Hours / Month", "Technical Direction", "Team Leadership", "Complex Implementation", "System Architecture"],
        recommended: false
      }
    ]
  },
  pm: {
    title: "Web3 Project Management",
    subtitle: "Command & Control for Distributed Teams",
    description: "Chaos is the enemy of shipping. I deploy battle-tested Agile methodologies to align distributed teams, crush blockers, and execute mainnet launches with military precision.",
    color: "green",
    icon: "Kanban",
    project: [
      {
        name: "Sprint Facilitation",
        price: "$2,500",
        period: "per 2-week sprint",
        description: "I join as a fractional Delivery Lead to run your Agile ceremonies. I ensure the backlog is groomed, standups are effective, and the team stays unblocked.",
        features: ["Backlog Management", "Daily Standups", "Sprint Planning & Retro", "Risk Mitigation", "Stakeholder Reporting"],
        recommended: false
      },
      {
        name: "Protocol Launch",
        price: "$8,000+",
        period: "per release",
        description: "End-to-end coordination of a mainnet launch. I coordinate auditors, marketing, devops, and community managers to ensure a synchronized and safe release.",
        features: ["Launch Roadmap", "Audit Coordination", "Deployment Scripting Check", "Incident Response Plan", "Post-Mortem Analysis"],
        recommended: true
      },
      {
        name: "DAO Governance Setup",
        price: "$5,000+",
        period: "flat fee",
        description: "Establishing the framework for decentralized decision making. Includes Snapshot setup, Tally integration, and deployment of on-chain Governor contracts.",
        features: ["Governance Framework", "Tooling Setup (Snapshot)", "Proposal Templates", "Voting Parameters", "Documentation"],
        recommended: false
      }
    ],
    retainer: [
      {
        name: "Fractional PM",
        price: "$6,000",
        period: "per month",
        description: "Oversight for teams that need structure but aren't ready for a full-time Head of Product. I keep the trains running on time and manage external vendors.",
        features: ["~60 Hours / Month", "Backlog Grooming", "Async Coordination", "Vendor Management", "Weekly Reporting"],
        recommended: false
      },
      {
        name: "Delivery Lead",
        price: "$10,000",
        period: "per month",
        description: "Driving the day-to-day execution of your roadmap. I act as the engine room for your project, ensuring the engineering team ships high-quality code every sprint.",
        features: ["~120 Hours / Month", "Full Agile Process", "Blocker Removal", "Cross-functional Syncs", "Release Management"],
        recommended: true
      },
      {
        name: "Head of Product",
        price: "$12,500",
        period: "per month",
        description: "Strategic product leadership. I work with founders to define the 'What' and 'Why', translating vision into actionable specs and a coherent long-term roadmap.",
        features: ["~160 Hours / Month", "Product Strategy", "Roadmap Definition", "Stakeholder Mgmt", "Team Leadership"],
        recommended: false
      }
    ]
  }
};

export const EXPERIENCES = [
  {
    year: "Jan 2026 - Present",
    role: "Full Stack Blockchain Engineer",
    company: "AgileGypsy",
    description: "Engineering autonomous AI agents for DeFi, institutional RWA infrastructure (ERC-3643), modular scaling with ZK rollups, and gasless UX journeys with Account Abstraction (ERC-4337).",
    technologies: ["Solidity", "Rust", "React", "ZK Circuits", "Python", "AI Agents"],
    color: "cyan"
  },
  {
    year: "Feb 2025 - Present",
    role: "Smart Contract Security Auditor",
    company: "AgileGypsy / Independent",
    description: "Conducting security assessments and formal verification for DeFi protocols. Active on Code4rena, Sherlock, and Immunefi. Specializing in reentrancy, oracle manipulation, and cross-chain exploits.",
    technologies: ["Foundry", "Slither", "Echidna", "Certora", "AI Fuzzing"],
    color: "purple"
  },
  {
    year: "Mar 2024 - Present",
    role: "Founder & Web3 Delivery Lead",
    company: "AgileGypsy",
    description: "Founded a blockchain consultancy offering full-cycle dApp delivery. Providing Agile project management for DeFi protocols—from whitepaper to mainnet—while pioneering AI × Web3 convergence.",
    technologies: ["Agile PM", "Tokenomics", "Strategic Partnerships", "Product Strategy"],
    color: "orange"
  },
  {
    year: "Feb 2025 - Jan 2026",
    role: "Junior Smart Contract & AI Developer",
    company: "AgileGypsy",
    description: "Led full-stack engineering initiatives at the intersection of AI Agents and RWA tokenization. Built foundational skills in Solidity smart contract development and AI integration for Web3 applications.",
    technologies: ["Solidity", "Web3.js", "React", "AI Integration", "RWA"],
    color: "blue"
  },
  {
    year: "Sep 2023 - Present",
    role: "Data Annotation Specialist",
    company: "RemoteTasks (Freelance)",
    description: "Processed 10,000+ image classification and NLP sentiment analysis tasks with 98%+ accuracy. Expertise in CVAT annotation tools and multi-label classification projects.",
    technologies: ["CVAT", "Image Classification", "NLP", "Multi-label Annotation"],
    color: "rose"
  },
  {
    year: "Oct 2022 - Mar 2024",
    role: "Project & Business Development Consultant",
    company: "Independent",
    description: "Led 20+ projects across diverse industries including SproutAI and Designed Bio. Achieved 95% on-time delivery and up to 40% savings through Lean methodologies.",
    technologies: ["Agile PM", "Lean Methodologies", "Budgeting", "Client Strategy"],
    color: "cyan"
  },
  {
    year: "Aug 2020 - Dec 2022",
    role: "Project & Business Development Manager",
    company: "Designed Bio Solutions",
    description: "Led water/wastewater projects with key achievements in global execution, risk management, and design optimization. Reduced delays by 25% and achieved 12% cost savings.",
    technologies: ["Project Management", "Risk Management", "Global Execution", "Engineering Design"],
    color: "green"
  },
  {
    year: "Jan 2011 - Aug 2020",
    role: "Project & Business Development Manager",
    company: "Total Water Solutions",
    description: "Optimized team performance and financial controls, leading to 40% revenue expansion and 95% client approval. Featured in Water & Sanitation Africa magazine.",
    technologies: ["Operations Management", "Financial Controls", "Team Leadership", "RND"],
    color: "blue"
  },
  {
    year: "Jun 2004 - Dec 2010",
    role: "Network Engineer & Lead Web Developer",
    company: "Computer Concepts",
    description: "Maintained network infrastructures and managed web hosting/development. Early full-stack development and network security.",
    technologies: ["HTML/CSS", "JavaScript", "Network Security", "DNS", "Hosting"],
    color: "orange"
  },
];

// NOTE: project images below are interim placeholders reusing existing assets.
// Replace each with a real screenshot of the corresponding live site.
export const PROJECTS = [
  {
    title: "KTHULHU Overmind",
    image: auditbraveImg,
    description:
      "Autonomous, AI-driven smart-contract auditing engineered for near-zero false positives. A multi-agent system pairs ensemble LLM reasoning and adversarial red-teaming with formal verification (Halmos) and dynamic EVM fork testing — every finding is reproduced on a mainnet fork before it ships. Live with a USDC credit system.",
    technologies: ["AI Agents", "Solidity", "Foundry", "Halmos", "Cloudflare Workers", "Durable Objects", "Next.js"],
    link: "https://kthulhu.co",
    external: true,
    color: "purple",
    phase: "live",
    buttonText: "Explore KTHULHU"
  },
  {
    title: "Kointel — AI Crypto Tax",
    image: creatorhubImg,
    description:
      "AI-powered crypto tax compliance for South Africa — turning raw exchange exports into SARS-ready ITR12 capital-gains reports. AI classifies every transaction with confidence-banded review, a FIFO engine computes gains under SARS rules, and the whole stack runs edge-native on Cloudflare. 70K+ LOC, live in production.",
    technologies: ["Next.js", "React", "TypeScript", "Cloudflare Workers", "Vectorize", "Workers AI", "Stitch"],
    link: "https://kointel.co.za",
    external: true,
    color: "green",
    phase: "live",
    buttonText: "Visit Kointel"
  },
  {
    title: "Art of Zeta — MEV Trading Engine",
    image: fluxbraveImg,
    description:
      "An autonomous multi-agent crypto trading platform for MEV, triangular, and ZAR arbitrage. A Cloudflare Workers orchestration layer drives high-frequency execution through on-chain MEVExecutor and UniswapX filler contracts on Mainnet + Arbitrum, fronted by a React dashboard for strategy management, simulation, and live P&L.",
    technologies: ["MEV", "Flashbots", "Solidity", "Arbitrum", "Cloudflare Workers", "Durable Objects", "React"],
    link: "https://artofzeta.com/app/",
    external: true,
    color: "orange",
    phase: "live",
    buttonText: "Open the App"
  },
  {
    title: "AgileGypsy — Security Audits",
    image: agileGypsyImg,
    description:
      "My smart-contract security practice — vulnerability research and protocol assessments using manual review, static analysis, fuzzing, and formal verification. The home base for audit engagements and published findings.",
    technologies: ["Security Auditing", "Solidity", "Foundry", "Slither", "Aderyn", "Echidna", "Certora"],
    link: "https://audit.agilegypsy.com",
    external: true,
    color: "rose",
    phase: "live",
    buttonText: "View Audit Portfolio"
  },
  {
    title: "AgileGypsy Labs",
    image: rentaldepositImg,
    description:
      "My Web3 engineering and security studio — where the audits, tooling, and production dApps come together: smart-contract security, AI × blockchain R&D, and full-stack delivery for teams shipping on-chain.",
    technologies: ["Web3", "Smart Contracts", "AI", "Security", "Full-Stack"],
    link: "https://agilegypsy.com",
    external: true,
    color: "blue",
    phase: "live",
    buttonText: "Visit AgileGypsy"
  },
  {
    title: "MB-agentic — Overmind Engine",
    image: devguildImg,
    description:
      "The engine behind the swarm: an autonomous multi-agent orchestration system with a security-hardened governance layer (AgilePM). Specialized agents coordinate over MCP with sovereign governance verbs, operator-walled authority, and forgery-resistant agent identity. In active development.",
    technologies: ["AI Agents", "MCP", "TypeScript", "Cloudflare Workers", "Durable Objects", "Governance"],
    link: "https://github.com/jw3b-dev/MB-agentic",
    external: true,
    color: "cyan",
    phase: "building",
    buttonText: "View on GitHub"
  },
  {
    title: "AgileCEO",
    image: project2,
    description:
      "The governed business brain that agentic coding lacks — so an AI swarm ships a viable, fit-for-purpose product instead of blind code. You act as CEO; the governed agent fleet is your executive team, run on the proven AgilePM® / DSDM® delivery method.",
    technologies: ["AI Agents", "AgilePM / DSDM", "Governance", "Multi-Agent Systems"],
    color: "green",
    phase: "building",
    buttonText: "Coming Soon"
  },
];


export const CERTIFICATIONS = [
  // In Progress
  {
    name: "Blockchain Development Bootcamp 3.0",
    status: "In Progress",
    progress: 10,
    year: "Jan 2026 - Jul 2026",
    provider: "Dapp University",
    category: "blockchain",
    icon: "dapp",
    skills: ["Full-Stack dApps", "DeFi Protocols", "AI Agents"]
  },
  {
    name: "Advanced Foundry",
    status: "In Progress",
    progress: 50,
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Fuzz Testing", "Invariant Testing", "Gas Optimization"]
  },
  {
    name: "Smart Contract Developer Certification (SSCD+)",
    status: "In Progress",
    progress: 35,
    expected: "2026",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Professional Auditing", "Security Best Practices", "Formal Verification"]
  },
  // Up Next
  {
    name: "Advanced Web3 Wallet Security",
    status: "Up Next",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Wallet Architecture", "Key Management", "Attack Vectors"]
  },
  {
    name: "Smart Contract Security",
    status: "Up Next",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Vulnerability Detection", "Audit Methodology", "Report Writing"]
  },
  {
    name: "Assembly & Formal Verification",
    status: "Up Next",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Yul/Assembly", "Certora", "Mathematical Proofs"]
  },
  // Completed - Blockchain
  {
    name: "Chainlink Fundamentals",
    status: "Completed",
    year: "Jan 2026",
    provider: "Chainlink",
    category: "blockchain",
    icon: "chainlink",
    skills: ["Price Feeds", "VRF", "Automation"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  {
    name: "The Blockchain Bootcamp 2.0",
    status: "Completed",
    year: "Jan 2025",
    provider: "Dapp University",
    category: "blockchain",
    icon: "dapp",
    skills: ["Solidity", "React", "Web3.js"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  {
    name: "Blockchain Basics",
    status: "Completed",
    year: "Jul 2025",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Smart Contracts", "EVM", "Blockchain Architecture"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  {
    name: "Foundry Fundamentals",
    status: "Completed",
    year: "Jul 2025",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Testing", "Deployment", "Scripting"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  {
    name: "Web3 Wallet Security Basics",
    status: "Completed",
    year: "May 2025",
    provider: "Cyfrin Updraft",
    category: "blockchain",
    icon: "cyfrin",
    skills: ["Wallet Security", "Phishing Prevention", "Key Safety"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  // Completed - Infrastructure
  {
    name: "Neo4j Certified Professional",
    status: "Completed",
    year: "Jan 2025",
    provider: "Neo4j GraphAcademy",
    category: "infrastructure",
    icon: "neo4j",
    skills: ["Graph Databases", "Cypher", "Data Modeling"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  // Completed - PM
  {
    name: "Business Agility Professional Level 1",
    status: "Completed",
    year: "Oct 2024",
    provider: "Agile Business Consortium",
    category: "pm",
    icon: "agile",
    skills: ["Business Agility", "Lean Thinking", "Value Delivery"]
  },
  {
    name: "AgilePM® Practitioner",
    status: "Completed",
    year: "Oct 2023",
    provider: "APMG International",
    category: "pm",
    icon: "apmg",
    skills: ["Agile Delivery", "Sprint Planning", "Stakeholder Management"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  {
    name: "PRINCE2® Foundation",
    status: "Completed",
    year: "Jun 2019",
    provider: "AXELOS Global Best Practice",
    category: "pm",
    icon: "axelos",
    skills: ["Structured PM", "Risk Management", "Quality Control"],
    verifyUrl: "https://www.linkedin.com/in/john-wellard/details/certifications/"
  },
  // Completed - Infrastructure (Legacy)
  {
    name: "Microsoft Certified Professional (MCP)",
    status: "Completed",
    year: "Dec 2008",
    provider: "Microsoft",
    category: "infrastructure",
    icon: "microsoft",
    skills: ["Windows Server", "Active Directory", "System Admin"]
  },
  {
    name: "Network+",
    status: "Completed",
    year: "May 2008",
    provider: "CompTIA",
    category: "infrastructure",
    icon: "comptia",
    skills: ["Networking", "TCP/IP", "Troubleshooting"]
  },
  {
    name: "A+ IT Technician",
    status: "Completed",
    year: "Mar 2008",
    provider: "CompTIA",
    category: "infrastructure",
    icon: "comptia",
    skills: ["Hardware", "Software", "IT Support"]
  },
  {
    name: "Duxbury Certified Network Engineer",
    status: "Completed",
    year: "Aug 2007",
    provider: "Duxbury Networking",
    category: "infrastructure",
    icon: "duxbury",
    skills: ["Network Engineering", "Infrastructure", "Security"]
  }
];

export const EDUCATION = [
  {
    degree: "BSc (Honours), Environmental Science",
    institution: "The Open University",
    year: "Oct 2022 - Jul 2027",
    status: "In Progress",
    progress: 33,
    description: "Complementing blockchain development with environmental systems understanding for sustainable Web3 solutions.",
    skills: ["Environmental Analysis", "Sustainability", "Systems Thinking", "Research Methods"]
  }
];

export const CONTACT = {
  address: "Building the secure decentralized future, one audit at a time",
  phoneNo: "Open to audits, development contracts, and strategic collaboration",
  email: "onchain@jw3b.dev",

  // On-Chain Identity
  ens: "jw3b.brave",
  secondaryEns: "agilegypsy.brave",
  wallet: "0x2385EdA7304198AC639d09619667fA5DfFd79e6d",

  // Professional
  github: "https://github.com/jw3b-dev",
  linkedin: "https://www.linkedin.com/in/john-wellard/",
  auditWebsite: "https://audit.agilegypsy.com",

  // Social
  twitter: "https://x.com/AgileGypsy_",
  discord: "agilegypsy",
  discordId: "1224731505620942960",
  telegram: "@agilegypsy",

  // Security Audit Platforms
  codehawks: "https://profiles.cyfrin.io/u/agilegypsy",
  code4rena: "https://code4rena.com/@AgileGypsy",
  sherlock: "https://audits.sherlock.xyz/watson/JW3B.DEV",
  cantina: "https://cantina.xyz/u/agilegypsy",
  immunefi: "https://immunefi.com/profile/agilegypsy",
  hackerone: "https://hackerone.com/jw3b-dev",
  hackenproof: "https://hackenproof.com/hackers/agilegypsy",
  auditone: "https://app.auditone.io/u/agilegypsy",
  hats: "https://app.hats.finance/profile/agilegypsy",

  website: "https://jw3b.dev"
};

