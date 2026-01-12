import project1 from "../assets/projects/project-1.webp";
import project2 from "../assets/projects/project-2.webp";
import project3 from "../assets/projects/project-3.webp";
import project4 from "../assets/projects/project-4.webp";
import agileGypsyImg from "../assets/projects/agilegypsy-audit.png";
import devguildImg from "../assets/projects/devguild.png";
import auditbraveImg from "../assets/projects/auditbrave.png";
import fluxbraveImg from "../assets/projects/fluxbrave.png";
import rentaldepositImg from "../assets/projects/rentaldeposit.png";
import creatorhubImg from "../assets/projects/creatorhub.png";

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
    link: "/projects/devguild"
  },
  {
    title: "RWA & Asset Tokenization",
    subtitle: "Institutional-Grade On-Chain Infrastructure.",
    description: "Bridging real-world value to the blockchain. I engineer compliance-ready token standards (ERC-3643), decentralized identity (DID) integrations, and settlement layers for real estate, private credit, and treasury bills.",
    features: ["Regulatory Compliance", "Asset Fractionalization", "Identity & Whitelisting", "Restricted Token Standards"],
    color: "green",
    link: "/projects/audit-brave"
  },
  {
    title: "Strategic Architecture & ZK Scaling",
    subtitle: "Future-Proof Protocol Design.",
    description: "Designing for the modular & privacy-first era. I provide expert guidance on Zero-Knowledge rollup implementation, app-chain deployment, and sustainable tokenomics simulation to ensure your protocol scales securely.",
    features: ["ZK & Modular Strategy", "Tokenomics Design", "App-Chain Architecture", "Protocol Strategy"],
    color: "orange",
    link: "/projects/devguild"
  },
  {
    title: "Full-Stack Blockchain Engineering",
    subtitle: "Production-Grade dApp Development.",
    description: "Building secure, scalable applications with seamless UX. From high-performance smart contracts in Solidity/Rust to user-friendly interfaces using Account Abstraction (ERC-4337) for gasless, key-free experiences.",
    features: ["Secure Smart Contracts", "DeFi & Yield Integration", "Gasless UX (ERC-4337)", "Cross-Chain Interoperability"],
    color: "blue",
    link: "/projects/flux-brave"
  },
  {
    title: "Web3 Product Delivery",
    subtitle: "End-to-End Delivery Assurance.",
    description: "Steering complex initiatives from whitepaper to mainnet. I provide rigorous roadmap execution, cross-functional coordination, and quality assurance to ensure high-stakes launches succeed without critical failures.",
    features: ["Roadmap Execution", "Mainnet Launch Strategy", "Team Coordination", "Quality Assurance"],
    color: "rose",
    link: "/projects/creatorhub-brave"
  }
];

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

export const PROJECTS = [
  {
    title: "AgileGypsy - Smart Contract Security",
    image: agileGypsyImg,
    description:
      "My security audit portfolio documenting vulnerability research and protocol assessments. Featuring static analysis, fuzz testing, and formal verification techniques applied to DeFi protocol patterns.",
    technologies: ["Security Auditing", "Solidity", "DeFi", "Foundry", "Slither", "Aderyn", "Echidna", "Certora"],
    link: "https://audit.agilegypsy.com",
    external: true,
    color: "purple",
    phase: "live",
    buttonText: "View Audit Portfolio"
  },
  {
    id: "devguild",
    title: "DevGuild Protocol",
    image: devguildImg,
    description:
      "Decentralized talent ecosystem implementing ERC-6551 (Token Bound Accounts) and ERC-4337 (Account Abstraction) for gasless developer onboarding and verifiable on-chain credentials.",
    technologies: ["Solidity", "Foundry", "ERC-6551", "ERC-4337", "Base L2", "The Graph", "IPFS", "Next.js"],
    link: "/projects/devguild",
    color: "cyan",
    phase: "building",
    buttonText: "View Project Details"
  },
  {
    id: "audit-brave",
    title: "Audit.brave - Content Provenance",
    image: auditbraveImg,
    description:
      "On-chain content verification system for media authenticity. Implements cryptographic stamping and immutable timestamping to combat AI-generated misinformation.",
    technologies: ["Solidity", "IPFS", "React", "Next.js", "TypeScript", "Viem/Ethers", "Tailwind", "Layer 2s"],
    link: "/projects/audit-brave",
    color: "green",
    phase: "mvp",
    buttonText: "View Case Study"
  },
  {
    id: "flux-brave",
    title: "Flux.brave - Payment Streaming",
    image: fluxbraveImg,
    description:
      "Real-time payment streaming protocol for freelancer compensation. Implements time-locked vault patterns with second-by-second token unlocking.",
    technologies: ["Solidity", "React", "Next.js", "TypeScript", "Viem/Ethers", "Tailwind", "Layer 2s"],
    link: "/projects/flux-brave",
    color: "blue",
    phase: "concept",
    buttonText: "View Case Study"
  },
  {
    id: "rental-deposit",
    title: "Rental Deposit Vault",
    image: rentaldepositImg,
    description:
      "Trustless escrow smart contract for rental security deposits. Features time-locked state machines and automated release mechanisms for transparent deposit management.",
    technologies: ["Solidity", "React", "Next.js", "TypeScript", "Viem/Ethers", "Tailwind", "Layer 2s"],
    link: "/projects/rental-deposit",
    color: "orange",
    phase: "concept",
    buttonText: "View Case Study"
  },
  {
    id: "creatorhub-brave",
    title: "CreatorHub.brave - Royalty Splitter",
    image: creatorhubImg,
    description:
      "Automated royalty distribution protocol for creator collectives. Implements PaymentSplitter patterns with minimal proxy factories for gas-efficient deployment.",
    technologies: ["Solidity", "React", "Next.js", "TypeScript", "Viem/Ethers", "Tailwind", "Layer 2s"],
    link: "/projects/creatorhub-brave",
    color: "rose",
    phase: "concept",
    buttonText: "View Case Study"
  },
];

export const PROJECT_DETAILS = {
  "devguild": {
    title: "DevGuild Protocol",
    subtitle: "Decentralized Developer Ecosystem",
    engineering: {
      diagram: "Architecture Diagram Placeholder",
      stack: [
        { name: "Smart Contracts", details: "ERC-721 (Identity), ERC-6551 (TBA), Custom Reputation Logic" },
        { name: "account Abstraction", details: "ERC-4337 Bundlers & Paymasters" },
        { name: "Indexing", details: "The Graph Subgraph" }
      ],
      features: [
        "Token Bound Accounts (ERC-6551) for holding credentials",
        "Gasless Onboarding via ERC-4337",
        "Verifiable On-Chain Resume",
        "Trustless Gig Escrow"
      ],
      invariants: [
        "Solvency: Escrow vault balance >= Active gig values",
        "Immutability: Reputation scores cannot be decremented",
        "Access: Only Arbiter can release disputed funds"
      ],
      deepDiveLink: "https://github.com/jw3b-dev"
    },
    pm: {
      roadmap: [
        { phase: "Phase 1", item: "Core Protocol & Identity NFT", status: "Completed" },
        { phase: "Phase 2", item: "Gig Marketplace Alpha", status: "In Progress" },
        { phase: "Phase 3", item: "DAO Governance", status: "Planned" }
      ],
      personas: ["Aspiring Developer (Junior)", "Protocol Maintainer (Client)", "Audit Firm (Verifier)"],
      businessModel: "Transaction fee on gig payments + Premium recruiter access.",
      agileDetails: {
        status: "Active Sprint",
        sprint: "Sprint 14: Alpha Polymarket Integration",
        velocity: "24 SP / Sprint",
        methodology: "ScrumBravodo"
      },
      resources: {
        whitepaper: "#",
        useCaseAnalysis: "#"
      }
    }
  },
  "audit-brave": {
    title: "Audit.brave",
    subtitle: "Content Provenance Data Layer",
    engineering: {
      stack: [
        { name: "Registry", details: "Immutable Solidity Smart Contract" },
        { name: "Storage", details: "IPFS for Media & Metadata" },
        { name: "Signature", details: "EIP-712 Typed Data Signing" }
      ],
      features: [
        "Cryptographic Stamping of Media",
        "On-Chain Timestamping",
        "Creator Identity Verification"
      ]
    },
    pm: {
      roadmap: [{ phase: "MVP", item: "Image Stamping on Base Sepolia", status: "Live" }],
      personas: ["Digital Artist", "News Organization", "Social Media Platform"],
      businessModel: "Small protocol fee per stamp (subsidized for early users)."
    }
  },
  "flux-brave": {
    title: "Flux.brave",
    subtitle: "Real-Time Payment Streaming",
    engineering: {
      stack: [
        { name: "Vault", details: "Sablier-inspired Streaming Contract" },
        { name: "Frontend", details: "React + Wagmi Hooks" }
      ],
      features: ["Second-by-second unlocking", "Mutual Cancellation Pattern", "Client-side Stream Visualization"]
    },
    pm: {
      roadmap: [{ phase: "Beta", item: "Freelancer Dashboard", status: "Live" }],
      personas: ["Freelancer (Receiver)", "Client (Payer)"],
      businessModel: "0.5% fee on total streamed volume."
    }
  },
  "rental-deposit": {
    title: "Rental Deposit Vault",
    subtitle: "Trustless Security Deposits",
    engineering: {
      stack: [
        { name: "Escrow", details: "Time-locked Solidity Vault" },
        { name: "Logic", details: "State Machine (Active -> GracePeriod -> Released)" }
      ],
      features: ["Automated Time-locks", "Landlord Claim Mechanism", "Tenant Auto-Withdraw"]
    },
    pm: {
      roadmap: [{ phase: "MVP", item: "Single Tenant Escrow", status: "Completed" }],
      personas: ["Tenant (Renter)", "Landlord (Property Owner)"],
      businessModel: "Flat fee per deposit creation."
    }
  },
  "creatorhub-brave": {
    title: "CreatorHub.brave",
    subtitle: "Automated Royalty Splitter",
    engineering: {
      stack: [
        { name: "PaymentSplitter", details: "OpenZeppelin derived logic" },
        { name: "Factory", details: "Minimal Proxy Factory (EIP-1167) for cheap deployment" }
      ],
      features: ["Instant ETH Distribution", "Immutable Shares", "Low Gas Execution"]
    },
    pm: {
      roadmap: [{ phase: "V1", item: "Basic ETH Splitter", status: "Live" }],
      personas: ["Music Producer", "NFT Artist Collective"],
      businessModel: "0.25% fee on split funds."
    }
  }
};

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

