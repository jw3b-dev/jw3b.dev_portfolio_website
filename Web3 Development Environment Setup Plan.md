# **The Agentic Turn in Web3 Engineering: A Comprehensive Analysis of Local Development Environments, AI Integration, and Security Infrastructure (2025–2026)**

## **1\. Introduction: The Evolution of the Web3 Developer Experience**

The trajectory of Web3 software engineering has historically been defined by a struggle for tooling maturity. In the nascent stages of Ethereum development (circa 2016–2018), the environment was characterized by brittle, disparate utilities. Developers relied on the Remix browser IDE for rapid prototyping, migrated to the Truffle Suite for lifecycle management, and utilized Ganache for local blockchain simulation. While functional, this stack suffered from significant fragmentation; testing frameworks were slow, debugging was opaque, and security auditing was an isolated, often manual, post-production phase.

By 2026, the ecosystem has undergone a radical transformation, driven by two simultaneous paradigm shifts: the "Rustification" of core infrastructure and the "Agentic Turn" in integrated development environments (IDEs). The former is exemplified by **Foundry**, a Rust-based toolchain that has displaced JavaScript-heavy frameworks like Hardhat to become the hegemon of smart contract development.1 The latter is spearheaded by the **Model Context Protocol (MCP)** and next-generation platforms like **Google Antigravity**, which redefine the developer’s role from a writer of syntax to an orchestrator of autonomous AI agents.4

This report provides an exhaustive analysis of this modern local development environment. It examines the intricate architecture of contemporary IDEs, the precise configurations of the Model Context Protocol that enable local Large Language Models (LLMs) to interact with blockchain nodes, and the bifurcation of the security landscape between traditional static analysis and real-time, AI-driven auditing. We further investigate the "VS Code Extension Wars," analyzing the supply chain security risks inherent in the marketplace and the consolidation of standard tooling. Through this lens, we articulate how the convergence of rigorous systems programming (Rust) and standardized AI interfaces (MCP) creates a high-assurance, autonomous DevOps pipeline for the decentralized web.

## **2\. The Rust Hegemony: Foundry and the New Standard for EVM Development**

The ascendancy of **Foundry** in the Web3 developer survey results of 2024 and 2025 marks a decisive break from the JavaScript-dominated era of Hardhat and Truffle. By 2026, Foundry commands over 50% of the market share among professional protocol engineers and security researchers.3 This shift is not merely a preference for a new CLI; it represents a fundamental demand for performance, correctness, and language unification in smart contract engineering.

### **2.1 Architectural Superiority via Rust and RevM**

Foundry’s dominance is predicated on its underlying architecture. Unlike Hardhat, which relies on the Node.js runtime and the ethereumjs library, Foundry is built in Rust and leverages revm (Rust Ethereum Virtual Machine). This architectural choice yields profound performance implications. Benchmarks indicate that Foundry compiles and tests smart contract suites 2–5 times faster than its Node.js counterparts.2

The implications of this speed extend beyond mere convenience. In large-scale DeFi protocols with thousands of unit and integration tests, a compile-test cycle that takes minutes in Hardhat effectively breaks the developer's "flow state." Foundry reduces this to seconds, enabling a tighter feedback loop that encourages more granular testing and Test-Driven Development (TDD) patterns. Furthermore, Rust's strict memory safety guarantees and concurrency models allow Foundry to execute tests in parallel by default, saturating modern multi-core CPUs in a way that the single-threaded Node.js event loop cannot easily replicate without complex worker sharding.1

### **2.2 The Solidity-First Testing Paradigm**

Perhaps the most significant workflow shift introduced by Foundry is the unification of the development and testing languages. In the Hardhat paradigm, a developer writes smart contracts in Solidity but writes test scripts in JavaScript or TypeScript. This necessitates a constant context switch between two distinct type systems, mental models, and syntax structures. It also introduces an impedance mismatch where EVM-specific concepts (like uint256 overflow behavior) must be simulated or wrapped in BigNumber libraries in JavaScript.1

Foundry eliminates this dichotomy by enabling tests to be written directly in Solidity. This "Solidity-First" approach has several second-order effects:

1. **Reduced Cognitive Load**: Developers remain immersed in Solidity's logic and type system throughout the entire development lifecycle.  
2. **Access to Internal State**: Writing tests in Solidity allows for more direct manipulation of the contract's storage and state variables without the abstraction overhead of a JavaScript wrapper.  
3. **Cheatcodes**: Foundry introduces a comprehensive suite of "cheatcodes" exposed via the vm instance (e.g., vm.prank, vm.roll, vm.warp). These allow tests to manipulate the blockchain environment—changing the msg.sender, advancing block numbers, or warping timestamps—with native Solidity syntax, offering a level of control that feels intrinsic to the language rather than external.6

### **2.3 The Fuzzing and Invariant Testing Revolution**

While Hardhat supports fuzzing via plugins, Foundry treats fuzzing as a first-class citizen. Its test runner automatically identifies fuzzable parameters in test functions and generates thousands of pseudo-random inputs to probe edge cases. This property-based testing approach is critical for DeFi security, where obscure boundary conditions (e.g., specific ratios of token reserves) often harbor catastrophic exploits.

Foundry extends this further with **Invariant Testing**. Developers can define invariant functions (properties that must *always* hold true, such as "the protocol's total assets must equal total liabilities"). The fuzzer then attempts to break these invariants by executing random sequences of functions with random data. This stochastic testing methodology aligns closer to formal verification than traditional unit testing, raising the baseline security assurance of contracts developed in the ecosystem.2

### **2.4 The Components of the Foundry Toolchain**

The Foundry stack is composed of four modular binaries, each serving a distinct role in the development lifecycle:

* **Forge**: The core compilation, testing, and dependency management framework. It handles the build pipeline and executes the test suites. Notably, Forge manages dependencies via Git submodules rather than npm, a design choice that keeps the project self-contained and aligns with the Git-centric workflows of open-source development.1  
* **Cast**: Described as a "Swiss Army Knife" for EVM interaction, Cast is a CLI tool that replaces many ad-hoc scripts. It allows developers to perform RPC calls, decode transaction data, convert between hex and decimal, and inspect storage slots directly from the terminal. For an AI agent integration, Cast is invaluable as it provides a deterministic, text-based interface to the blockchain.7  
* **Anvil**: A high-performance local node implementation. Anvil serves as the local testnet (replacing Ganache or Hardhat Network). It supports fast state forking from mainnet, allowing developers to test their contracts against the real-world state of protocols like Uniswap or Aave without deploying to a public testnet. Its speed in processing requests makes it the preferred backend for local MCP servers.7  
* **Chisel**: A Solidity REPL (Read-Eval-Print Loop). Chisel allows for rapid experimentation with Solidity snippets. A developer can type a line of code and immediately see its execution result and gas cost, facilitating quick validation of logic before integration into a larger contract.6

### **2.5 Market Share and Migration Dynamics**

The migration from Hardhat to Foundry is well underway, but rarely is it an instantaneous switch. Many teams adopt a hybrid approach, using Hardhat for deployment scripts (leveraging its robust plugin ecosystem for Etherscan verification and complex deployment orchestration) while moving all testing and compilation to Foundry. However, as Foundry's deployment capabilities mature and its plugin system evolves, the trend line suggests a continued consolidation toward a pure Rust-based stack.2

## **3\. The Editor Landscape: VS Code Extension Wars and Security Risks**

For the majority of Web3 developers, Visual Studio Code (VS Code) remains the primary interface for code editing. However, the ecosystem of Solidity extensions within the VS Code Marketplace has become a battleground of competing standards, legacy implementations, and supply chain security threats.

### **3.1 The Main Contenders: Nomic Foundation vs. Juan Blanco**

Two extensions dominate the market, and the choice between them often dictates the developer's experience with syntax highlighting, formatting, and error reporting.

#### **3.1.1 Solidity by Nomic Foundation**

The **Nomic Foundation**, the organization behind Hardhat, released its official Solidity extension to provide a standardized, high-quality experience. Despite its origins in the Hardhat ecosystem, this extension has been engineered to be framework-agnostic, supporting Foundry projects seamlessly.8

* **Features**: It leverages the official solc compiler for accurate inline error reporting (red squiggles) that matches the compiler's actual output. It provides intelligent "Go to Definition" and "Find References" capabilities that understand the complex inheritance structures of Solidity contracts.  
* **Market Position**: By 2026, this extension is increasingly viewed as the "canonical" choice for professional development due to its maintenance backing and integration with modern Language Server Protocol (LSP) standards.3

#### **3.1.2 Solidity by Juan Blanco**

Historically the most popular extension, **Juan Blanco's Solidity** extension was for years the only viable option. It is characterized by immense configurability, allowing granular control over compiler versions, linter rules (Solhint/Solium), and package remappings.9

* **Usage Profile**: It remains favored by "power users" and those maintaining legacy codebases (e.g., DappTools projects) who require non-standard configurations that the more opinionated Nomic extension might not support. However, its complexity can be a barrier to entry for newer developers.

### **3.2 The Supply Chain Threat: The WhiteCobra Malware**

The popularity of these extensions has attracted malicious actors. A significant security incident involving the **WhiteCobra** malware highlighted the vulnerability of the VS Code Marketplace. Threat actors uploaded extensions with names confusingly similar to the legitimate ones (e.g., "solidity" by "juan-blanco" instead of "juanblanco" or "VitalikButerin-EthFoundation" impersonating official bodies).10

These malicious extensions contained obfuscated code designed to exfiltrate private keys and environment variables found in the developer's workspace. This "typosquatting" attack vector underscores the necessity for developers to rigorously verify the **Publisher ID** (NomicFoundation.hardhat-solidity vs. imposters) and review the number of downloads and reviews before installation. In a Web3 context, where the IDE often has access to signing keys, the compromise of an extension is equivalent to the compromise of the protocol itself.

### **3.3 Specialized Security Extensions**

Beyond the primary language support extensions, a suite of security-focused plugins has become standard in the "Gold Standard" environment.

* **Solidity Visual Developer (tintinweb)**: This extension focuses on **visual auditing**. It decorates the code with semantic highlights—marking state variables, identifying external calls (which are reentrancy risks), and clarifying function visibility (public vs. external vs. internal). It also integrates with **Surya** to generate call graphs and inheritance diagrams directly within the editor, aiding in the architectural review of complex systems.11  
* **Aderyn VS Code Extension**: Developed by Cyfrin, this extension brings the power of the Aderyn static analyzer (discussed in Section 4\) into the editor. It runs in the background, providing real-time diagnostics for security vulnerabilities. Unlike a standard linter that checks for style, Aderyn checks for exploits, effectively placing a "security auditor" inside the IDE that flags code as it is written.13

### **3.4 Feature Comparison Matrix**

| Feature | Nomic Foundation (Hardhat) | Juan Blanco (Legacy) | Solidity Visual Developer | Aderyn Extension |
| :---- | :---- | :---- | :---- | :---- |
| **Primary Focus** | Language Support (LSP) | Language Support (Configurable) | Security Visualization | Real-time Auditing |
| **Compiler Backend** | Native solc integration | Configurable (Docker/Local) | N/A | Aderyn (Rust) |
| **Foundry Support** | Native / High | Configurable via Remappings | High | Native |
| **Visual Decorators** | Minimal | Minimal | **Extensive** (State vars, flows) | Vulnerability Highlights |
| **Graph Generation** | No | No | **Yes** (Surya integration) | No |
| **Publisher ID** | NomicFoundation.hardhat-solidity | JuanBlanco.solidity | tintinweb.solidity-visual-auditor | Cyfrin.aderyn |

## **4\. The Security Layer: Static Analysis and Automated Auditing**

In the 2026 development stack, security auditing is no longer treated as a distinct phase that occurs only after code completion. Instead, it is integrated continuously into the development lifecycle through high-performance static analysis tools.

### **4.1 Slither: The Industry Standard**

**Slither**, developed by Trail of Bits, remains the most comprehensive static analysis framework. Written in Python, it operates by converting Solidity code into an intermediate representation called **SlithIR** (Slither Intermediate Representation). This allows it to perform sophisticated **data flow analysis** and **taint tracking**.15

* **Capabilities**: Slither includes over 80 built-in detectors that identify common vulnerabilities such as reentrancy, unprotected functions, and weak randomness. Its ability to track how user input (tainted data) flows through the contract's logic allows it to catch complex logical bugs that simpler tools miss.  
* **Limitations**: As a Python-based tool, Slither can be slower to execute on large codebases compared to newer Rust-based alternatives. Additionally, benchmarks (such as the Kleros study) have noted that while Slither is excellent at finding known vulnerability patterns, it can suffer from a high rate of false positives, requiring manual triage by experienced auditors.17

### **4.2 Aderyn: The Rust-Based Challenger**

**Aderyn**, developed by Cyfrin, represents the new wave of security tooling. Built in Rust, it is designed for extreme performance and ease of use within the "inner loop" of development.18

* **Architecture**: Aderyn works by traversing the Abstract Syntax Tree (AST) of the Solidity code. Because it is built in Rust, it can analyze entire projects in milliseconds.  
* **Philosophy**: Unlike Slither, which aims for maximum coverage (accepting higher false positives), Aderyn targets "high-confidence" vulnerabilities. It is designed to be developer-friendly, outputting reports in Markdown, JSON, and SARIF that can be directly consumed by CI/CD pipelines or MCP servers.19  
* **Custom Detectors**: Aderyn empowers developers to write custom detectors in Rust, allowing protocol teams to enforce project-specific invariants (e.g., "The admin address must never be the zero address in initialize functions").19

### **4.3 Mythril: Symbolic Execution**

**Mythril**, maintained by ConsenSys, operates on a different principle: **Symbolic Execution**. Instead of analyzing the source code's structure (like static analysis), Mythril mathematically executes the contract's bytecode across all possible paths to find states that violate security assertions.15

* **Depth vs. Speed**: This approach is significantly deeper than static analysis and can find extremely subtle bugs. However, it is computationally expensive and slow. In the Kleros benchmark, Mythril demonstrated the lowest noise (fewest false positives) but required significant time to run, making it less suitable for real-time feedback but essential for deep-dive auditing.17

### **4.4 The "Kleros" Benchmark and Tool Efficacy**

A comparative study referenced in the research 17 highlights the distinct roles of these tools. In a test suite of vulnerable contracts:

* **Slither** identified 2 out of 5 easy vulnerabilities but generated verbose reports with numerous false positives (noise).  
* **Aderyn** identified 1 out of 5 in the "easy" category but excelled at low-noise reporting and speed.  
* **Mythril** found 1 out of 5 but provided the most specific, exploit-oriented feedback.  
* **Conclusion**: No single tool provides complete coverage. The "Gold Standard" workflow, therefore, involves layering these tools: using Aderyn for real-time checks in the IDE, Slither for CI/CD pipeline gating, and Mythril for overnight deep scans.

## **5\. Google Antigravity: The Agent-First IDE**

While VS Code remains the standard editor, **Google Antigravity** represents the future of the IDE as an agent orchestration platform. It is designed from the ground up to support the "Agentic Turn," moving beyond code completion to task execution.4

### **5.1 Core Architecture: Trust and Autonomy**

Antigravity is built on four tenets: **Trust**, **Autonomy**, **Feedback**, and **Self-Improvement**.

* **Agent Manager**: This "Mission Control" interface allows developers to spawn multiple, asynchronous agents. One agent might be writing tests while another is refactoring a component. This parallelism mimics a human team structure.4  
* **Artifacts**: To establish trust, agents produce "Artifacts"—structured documents like implementation plans, architecture diagrams, and audit reports—before executing code. This allows the developer to review the *strategy* of the agent, not just the code, bridging the gap between intent and implementation.5

### **5.2 The SKILL.md Standard and Progressive Disclosure**

Antigravity defines agent capabilities through **Skills**. A Skill is a structured package of knowledge and instructions stored in a SKILL.md file within the .agent/skills/ directory.22

#### **5.2.1 Anatomy of a Skill**

The SKILL.md file contains:

* **YAML Frontmatter**: Defines the name and description. The description is critical because the agent uses semantic matching against it to decide *when* to load the skill.  
* **Instruction Body**: Markdown-formatted steps (e.g., "When auditing a contract, first check for reentrancy, then check for access control").  
* **Resources**: References to scripts (Python/Bash) or template files that the agent can utilize.

#### **5.2.2 Progressive Disclosure**

To prevent "Context Saturation" (overloading the LLM with too much data), Antigravity uses **Progressive Disclosure**. The system initially exposes only the lightweight metadata (names/descriptions) of the skills. Only when an agent decides a skill is relevant does it load the full procedural content. This allows the IDE to support hundreds of specialized skills (e.g., specific to optimizing gas for L2s, auditing ZK circuits) without degrading the agent's reasoning performance.22

### **5.3 The Browser Agent**

A key feature for Web3 development is the **Browser Agent**. This agent can autonomously launch a Chrome instance, navigate to a dApp's frontend (e.g., localhost:3000), connect a wallet, and simulate user interactions (clicking buttons, signing transactions). This enables end-to-end testing where the agent verifies that the smart contract logic is correctly exposed to the user interface.4

## **6\. The Model Context Protocol (MCP): The Universal Connector**

The **Model Context Protocol (MCP)** is the technological substrate that enables the "Agentic Turn." It provides a standardized interface for AI models to discover and interact with local tools and data sources, solving the "M x N" integration problem.23

### **6.1 Protocol Mechanics**

MCP operates on a Client-Server architecture:

* **MCP Host (Client)**: The AI interface (e.g., Claude Desktop, Antigravity, Cursor).  
* **MCP Server**: A standalone process wrapping a tool (e.g., Foundry, Slither).  
* **Primitives**: Servers expose **Tools** (executable functions), **Resources** (read-only data), and **Prompts** (templates).  
* **Transport**: Communication occurs via standard input/output (stdio) for local processes or Server-Sent Events (SSE) for networked tools.25

### **6.2 Specialized Web3 MCP Servers**

#### **6.2.1 Foundry MCP Server (PraneshASP)**

This server wraps the Foundry toolchain, allowing agents to act as "Foundry Operators".7

* **Capabilities**:  
  * anvil\_start / anvil\_stop: Manage local testnets.  
  * cast\_call: Read contract state.  
  * forge\_test: Run test suites.  
  * heimdall\_decompile: Decompile bytecode for analysis.  
* **Configuration**:  
  JSON  
  "foundry": {  
    "command": "npx",  
    "args": \["@pranesh.asp/foundry-mcp-server"\],  
    "env": { "RPC\_URL": "http://127.0.0.1:8545", "PRIVATE\_KEY": "..." }  
  }

#### **6.2.2 EVM MCP Server (mcpdotdirect / QuickNode)**

This server focuses on chain interaction and wallet management.27

* **Features**: It supports BIP-39 mnemonic derivation, allowing agents to manage deterministic wallets for testing. It includes "intelligent ABI fetching," automatically retrieving ABIs from block explorers to decode transaction data, which is essential for agents to "understand" what a transaction does.  
* **Use Case**: An agent can use this server to "Monitor the USDC/ETH pool on Uniswap V3 and report any large swaps in the last 10 blocks."

#### **6.2.3 Faro Fino and Security Aggregation**

**Faro Fino** is a Dockerized MCP server that aggregates multiple security tools.29

* **Mechanism**: Instead of installing Slither and Aderyn locally (and managing Python/Rust dependencies), the developer runs the Faro Fino container. The MCP server inside the container exposes a unified audit\_contract tool.  
* **Benefit**: This ensures a consistent audit environment across the entire team, regardless of individual OS or dependency versions.

#### **6.2.4 Cloudflare Workers MCP**

For the frontend and decentralized infrastructure, the **Cloudflare Workers MCP** server allows agents to deploy and manage serverless functions.30

* **Capabilities**: list\_workers, deploy\_worker, get\_logs.  
* **Implication**: An agent can write a backend API for a dApp, deploy it to the edge, and verify its functionality, all through natural language commands.

### **6.3 Local AI and Privacy: The Ollama Bridge**

For developers sensitive to privacy, sending code to cloud LLMs is unacceptable. The **Ollama MCP Bridge** allows local models (like Llama-3 or Qwen2.5) to function as the reasoning engine for MCP tools.32

* **Architecture**: The bridge translates the JSON-RPC messages from the MCP Client into Ollama's API format.  
* **Configuration**:  
  JSON  
  "ollama-bridge": {  
    "command": "npx",  
    "args": \["ollama-mcp-server"\],  
    "env": { "OLLAMA\_HOST": "http://127.0.0.1:11434" }  
  }

* **Limitation**: Local models often struggle with complex "Tool Use." Fine-tuned models like Hermes-Function-Calling are recommended to ensure reliable interaction with MCP servers.

## **7\. The Agentic DevOps Pipeline: Synthesizing the Workflow**

By integrating these components, we can construct the "Gold Standard" local development workflow for 2026\. This pipeline is semi-autonomous, with the developer acting as the architect.

1. **Planning (Antigravity)**: The developer requests a new feature (e.g., "Add a Staking Vault"). The Agent Manager spawns a "Planner Agent" which generates an Architecture Artifact outlining the contract structure and inheritance.  
2. **Scaffolding (Foundry MCP)**: Once approved, a "Dev Agent" uses the **Foundry MCP** server to initialize the files (create\_solidity\_file) and install dependencies (forge install openzeppelin).  
3. **Implementation & Testing**: The Dev Agent writes the Solidity code and immediately writes a test suite. It uses forge\_test via MCP to run the tests. If a test fails, it reads the stack trace, adjusts the code, and retries—a self-correcting loop.  
4. **Security Audit (Faro Fino MCP)**: Before requesting human review, the agent calls audit\_contract via the **Faro Fino** server. It parses the Aderyn/Slither report and fixes any "High" severity issues automatically (e.g., adding nonReentrant modifiers).  
5. **Deployment (EVM MCP)**: The agent spins up a local Anvil node (anvil\_start), deploys the contract using the **EVM MCP** server, and verifies the deployment addresses.  
6. **Frontend Verification (Browser Agent)**: Finally, the agent opens a browser instance, navigates to the local dApp frontend, and performs a "user test" (connecting a wallet and staking tokens) to ensure full-stack integration.

### **7.1 Security Implications of Agentic Workflows**

This pipeline introduces new attack vectors. **Prompt Injection** could theoretically trick an agent into deploying malicious code or exfiltrating keys. Furthermore, the reliance on **MCP Servers** creates a supply chain risk; a compromised MCP server binary could intercept all data passing through it. Therefore, running MCP servers in isolated environments (like Docker containers) and strictly limiting their permissions (e.g., using read-only API keys where possible) is mandatory.28

## **8\. Conclusion**

The Web3 development environment of 2026 is defined by the convergence of high-performance systems programming and standardized AI interoperability. **Foundry** has provided the bedrock of speed and correctness necessary for professional engineering. **VS Code** and **Antigravity** compete to provide the best interface for managing complexity, with Antigravity pushing the boundaries of autonomous agency. **MCP** serves as the nervous system, connecting these disparate organs into a cohesive, intelligent organism.

For the modern developer, mastery of this stack does not just mean knowing Solidity; it means knowing how to orchestrate the agents that write Solidity. It involves configuring **Aderyn** for real-time security feedback, setting up **Foundry** for high-speed fuzzing, and wiring these tools together via **MCP** to create a development loop that is faster, safer, and more autonomous than ever before. The era of the manual toolchain is over; the era of the AI-augmented architect has begun.

### **9\. Comprehensive Tooling Reference Matrix**

| Category | Tool | Function | MCP Integration | Primary Benefit |
| :---- | :---- | :---- | :---- | :---- |
| **Framework** | **Foundry** | Compilation, Testing, Fuzzing | **Yes** (PraneshASP) | Speed (Rust), Solidity-native testing |
| **Analysis** | **Aderyn** | Static Analysis (Real-time) | **Yes** (Cyfrin) | Low false positives, VS Code integration |
| **Analysis** | **Slither** | Static Analysis (Deep) | **Yes** (TrailOfBits) | Comprehensive data-flow analysis |
| **Audit Suite** | **Faro Fino** | Aggregated Security | **Native** | Dockerized, unified audit interface |
| **Chain Ops** | **EVM MCP** | Interaction, Wallet, ABI | **Native** (QuickNode) | Intelligent ABI fetching, chain agnosticism |
| **IDE** | **Antigravity** | Agent Orchestration | **Native** | Artifact-based trust, Browser Agent |
| **IDE Ext** | **Nomic** | Language Support | N/A | Reliability, Standard LSP compliance |
| **AI Bridge** | **Ollama** | Local Model Inference | **Yes** | Privacy-preserving, air-gapped agents |
| **Infra** | **Cloudflare** | Serverless / Frontend | **Yes** (Workers) | Agent-driven deployment and logs |

1

#### **Works cited**

1. Foundry Vs Hardhat \- EatTheBlocks, accessed on January 16, 2026, [https://eattheblocks.com/foundry-vs-hardhat/](https://eattheblocks.com/foundry-vs-hardhat/)  
2. Best Solidity Test Workflow in 2026: Hardhat vs Foundry, AI Testing, and Auditing Tools, accessed on January 16, 2026, [https://blog.bitium.agency/best-solidity-test-workflow-in-2026-hardhat-vs-foundry-ai-testing-and-auditing-tools-a3a582e3b056](https://blog.bitium.agency/best-solidity-test-workflow-in-2026-hardhat-vs-foundry-ai-testing-and-auditing-tools-a3a582e3b056)  
3. Solidity Developer Survey 2024 Results | Solidity Programming Language, accessed on January 16, 2026, [https://www.soliditylang.org/blog/2025/04/25/solidity-developer-survey-2024-results/](https://www.soliditylang.org/blog/2025/04/25/solidity-developer-survey-2024-results/)  
4. Antigravity IDE Hands-On: Google's Agent-First Future — Are we ready? \- Medium, accessed on January 16, 2026, [https://medium.com/@visrow/antigravity-ide-hands-on-googles-agent-first-future-are-we-ready-a6d991025082](https://medium.com/@visrow/antigravity-ide-hands-on-googles-agent-first-future-are-we-ready-a6d991025082)  
5. Introducing Google Antigravity, a New Era in AI-Assisted Software Development, accessed on January 16, 2026, [https://antigravity.google/blog/introducing-google-antigravity](https://antigravity.google/blog/introducing-google-antigravity)  
6. Foundry vs Hardhat: A Faster, Native Way to Test Solidity Smart Contracts \- Three Sigma, accessed on January 16, 2026, [https://threesigma.xyz/blog/foundry/foundry-vs-hardhat-solidity-testing-tools](https://threesigma.xyz/blog/foundry/foundry-vs-hardhat-solidity-testing-tools)  
7. An experimental MCP Server for foundry built for Solidity devs \- GitHub, accessed on January 16, 2026, [https://github.com/PraneshASP/foundry-mcp-server](https://github.com/PraneshASP/foundry-mcp-server)  
8. Video: Foundry Simple Storage \- VSCode Solidity Setup, accessed on January 16, 2026, [https://updraft.cyfrin.io/courses/foundry/foundry-simple-storage/vscode-solidity-setup](https://updraft.cyfrin.io/courses/foundry/foundry-simple-storage/vscode-solidity-setup)  
9. solidity \- Visual Studio Marketplace, accessed on January 16, 2026, [https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)  
10. WhiteCobra's Playbook Exposed \- Koi Security, accessed on January 16, 2026, [https://www.koi.ai/blog/whitecobra-vscode-cursor-extensions-malware](https://www.koi.ai/blog/whitecobra-vscode-cursor-extensions-malware)  
11. Solidity Visual Developer \- Visual Studio Marketplace, accessed on January 16, 2026, [https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor)  
12. Top Visual Studio Plugins for Web3 and Blockchain Development in 2022 \- EatTheBlocks, accessed on January 16, 2026, [https://eattheblocks.com/top-visual-studio-plugins-for-web3-and-blockchain-development-in-2022/](https://eattheblocks.com/top-visual-studio-plugins-for-web3-and-blockchain-development-in-2022/)  
13. Supercharge Secure Solidity Development: The Aderyn VS Code Extension \- Cyfrin, accessed on January 16, 2026, [https://www.cyfrin.io/blog/supercharge-secure-solidity-development-the-aderyn-vs-code-extension](https://www.cyfrin.io/blog/supercharge-secure-solidity-development-the-aderyn-vs-code-extension)  
14. Cyfrin/vscode-aderyn: Official VS Code Extension for Aderyn \- GitHub, accessed on January 16, 2026, [https://github.com/Cyfrin/vscode-aderyn](https://github.com/Cyfrin/vscode-aderyn)  
15. Essential Tools for Auditing Solidity Smart Contracts: A Practical Guide \- Medium, accessed on January 16, 2026, [https://medium.com/@dehvcurtis/essential-tools-for-auditing-solidity-smart-contracts-a-practical-guide-4a6b5e1b5709](https://medium.com/@dehvcurtis/essential-tools-for-auditing-solidity-smart-contracts-a-practical-guide-4a6b5e1b5709)  
16. Static Analysis \- Cyfrin Glossary, accessed on January 16, 2026, [https://www.cyfrin.io/glossary/static-analysis](https://www.cyfrin.io/glossary/static-analysis)  
17. Smart Contract Security Tools: A Comprehensive Review \- Kleros, accessed on January 16, 2026, [https://blog.kleros.io/smart-contract-security-tools-a-comprehensive-review/](https://blog.kleros.io/smart-contract-security-tools-a-comprehensive-review/)  
18. Cyfrin/aderyn: Solidity Static Analyzer that easily integrates into your editor \- GitHub, accessed on January 16, 2026, [https://github.com/Cyfrin/aderyn](https://github.com/Cyfrin/aderyn)  
19. Aderyn MCP: Open-Source Solidity Smart Contract Static Analyzer with Multi-Project & Multi-Format Reports, accessed on January 16, 2026, [https://mcp.aibase.com/server/1518032733329432590](https://mcp.aibase.com/server/1518032733329432590)  
20. Build with Google Antigravity, our new agentic development platform, accessed on January 16, 2026, [https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)  
21. Google Antigravity Documentation, accessed on January 16, 2026, [https://antigravity.google/docs/home](https://antigravity.google/docs/home)  
22. How to Build Custom Skills in Google Antigravity: 5 Practical ..., accessed on January 16, 2026, [https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d](https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d)  
23. MCP \- SettleMint Console, accessed on January 16, 2026, [https://console.settlemint.com/documentation/blockchain-platform/blockchain-and-ai/mcp](https://console.settlemint.com/documentation/blockchain-platform/blockchain-and-ai/mcp)  
24. Create an EVM MCP Server with Claude AI | Quicknode Guides, accessed on January 16, 2026, [https://www.quicknode.com/guides/ai/evm-mcp-server](https://www.quicknode.com/guides/ai/evm-mcp-server)  
25. Connect to local MCP servers \- Model Context Protocol, accessed on January 16, 2026, [https://modelcontextprotocol.io/docs/develop/connect-local-servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers)  
26. Securing the AI Revolution: Introducing Cloudflare MCP Server Portals, accessed on January 16, 2026, [https://blog.cloudflare.com/zero-trust-mcp-server-portals/](https://blog.cloudflare.com/zero-trust-mcp-server-portals/)  
27. MCP server that provides LLMs with tools for interacting with EVM networks \- GitHub, accessed on January 16, 2026, [https://github.com/mcpdotdirect/evm-mcp-server](https://github.com/mcpdotdirect/evm-mcp-server)  
28. sinco-lab/evm-mcp-server: An EVM interaction service based on Model Context Protocol (MCP) \- GitHub, accessed on January 16, 2026, [https://github.com/sinco-lab/evm-mcp-server](https://github.com/sinco-lab/evm-mcp-server)  
29. italoag/farofino-mcp: Faro Fino Smart Contract Auditor MCP Server \- GitHub, accessed on January 16, 2026, [https://github.com/italoag/farofino-mcp](https://github.com/italoag/farofino-mcp)  
30. Cloudflare MCP Server \- GitHub, accessed on January 16, 2026, [https://github.com/cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare)  
31. mcp-server-cloudflare \- Augment Code, accessed on January 16, 2026, [https://www.augmentcode.com/mcp/mcp-server-cloudflare](https://www.augmentcode.com/mcp/mcp-server-cloudflare)  
32. ollama-mcp MCP Server: The Definitive Guide for AI Engineers \- Skywork.ai, accessed on January 16, 2026, [https://skywork.ai/skypage/en/ollama-mcp-MCP-Server-The-Definitive-Guide-for-AI-Engineers/1972585330623180800](https://skywork.ai/skypage/en/ollama-mcp-MCP-Server-The-Definitive-Guide-for-AI-Engineers/1972585330623180800)  
33. Self-contained MCP server for comprehensive Ollama management with zero external dependencies \- GitHub, accessed on January 16, 2026, [https://github.com/paolodalprato/ollama-mcp-server](https://github.com/paolodalprato/ollama-mcp-server)  
34. Unlocking Smart Contract Security: A Deep Dive into Cyfrin's Aderyn MCP Server, accessed on January 16, 2026, [https://skywork.ai/skypage/en/unlocking-smart-contract-security/1977965316714991616](https://skywork.ai/skypage/en/unlocking-smart-contract-security/1977965316714991616)