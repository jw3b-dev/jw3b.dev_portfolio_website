Agentic Workflow Architecture: jw3b.dev Transformation
This document outlines the complete configuration and execution plan for upgrading jw3b.dev using Google Antigravity. It leverages the "Agentic Turn" in engineering, transforming your IDE from a text editor into an autonomous Web3 factory.

Part 1: "The Rig" - Antigravity Configuration
To enable this workflow, we must first equip the Agent with the ability to interact with your local blockchain tools (Foundry), security scanners (Aderyn), and cloud infrastructure (Cloudflare).

1.1 Model Context Protocol (MCP) Configuration
Action: Open Antigravity → ... Menu → MCP Store → Manage MCP Servers → Edit Config. Paste the following configuration to bridge your local tools to the Agent:

JSON

{
  "mcpServers": {
    "foundry": {
      "command": "npx",
      "args": ["-y", "@pranesh.asp/foundry-mcp-server"],
      "env": {
        "RPC_URL": "http://127.0.0.1:8545",
        "PRIVATE_KEY": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" 
      }
    },
    "aderyn-audit": {
      "command": "aderyn",
      "args": ["--mcp"],
      "disabled": false
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "YOUR_CF_TOKEN_HERE",
        "CLOUDFLARE_ACCOUNT_ID": "YOUR_ACCOUNT_ID_HERE"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/jw3b.dev"]
    }
  }
}
Note: The PRIVATE_KEY above is the default Anvil testnet key. Replace Cloudflare credentials with your own.

1.2 Governance Rules
Action: Create a file at .agent/rules/web3-governance.md. These rules prevent the Agent from generating insecure code or using deprecated patterns (like Ethers.js) without permission.

Web3 Engineering Standards
1. Interaction Layer (Wagmi v2 & Viem)
Simulate-First Mandate: NEVER generate a writeContract hook without a preceding simulateContract step. The pattern must be: Simulate -> Write -> Wait for Receipt.

Tree-Shaking: Do not import full viem objects. Use specific exports (e.g., import { parseEther } from 'viem').

Hooks: Use useReadContract for data fetching. Do not use legacy useContractRead.

2. Security & Compliance
Dependencies: Enforce Next.js versions 15.0.7+ or 16.0.10+ to mitigate CVE-2025-55182.

Auditing: Run @aderyn-audit on any new Solidity file before integration.

Secrets: NEVER hardcode private keys or API tokens in frontend code. Use Cloudflare Workers for all secret-handling operations.

3. Component Architecture
Preservation: Existing components in src/components/ (Hero, Navbar) are immutable unless explicitly refactored.

Styling: All new components must use the existing Glassmorphism tokens (--glass-bg, --neon-cyan) defined in index.css.

1.3 Essential Extensions
Install these extensions in Antigravity to give the Agent semantic understanding of your code:

Solidity (Nomic Foundation): Provides the language server that the Agent reads for compiler errors.

Aderyn (Cyfrin): Real-time security highlighting for smart contracts.

Pretty TypeScript Errors: Helps the Agent parse complex Wagmi generic type errors.

Part 2: "The Brain" - Custom Agent Skills
We will define three specialized "personas" for the Agent using SKILL.md files.

Skill A: smart-contract-engineer
Location: .agent/skills/smart-contract-engineer/SKILL.md Description: Designs, tests, and deploys Solidity contracts using the Foundry toolchain.
name: smart-contract-engineer description: Expert in Solidity, Foundry, and EVM security. Capable of writing fuzz tests and deployment scripts.
Instructions
Scaffold: Use forge init --no-commit for new modules.

Test: Write tests in Solidity (.t.sol) inside test/. ALWAYS include at least one fuzz test for state-changing functions.

Deployment: Use forge script via MCP to deploy to local Anvil node first.

Verification: Use cast to verify state changes after deployment.

Skill B: full-stack-integrator
Location: .agent/skills/full-stack-integrator/SKILL.md Description: Connects smart contracts to React frontends using Wagmi v2 and Viem.
name: full-stack-integrator description: Specialist in Wagmi v2, Viem, and React Query. Handles ABI synchronization and hook generation.
Instructions
ABI Sync: Automatically copy out/Contract.sol/Contract.json to src/abis/ after compilation.

Hook Gen: Create custom hooks hooks/use[ContractName].ts that wrap useWriteContract and useSimulateContract.

Optimistic UI: Implement optimistic updates for UI responsiveness using onMutate in React Query.

Part 3: The Execution Workflow
This is your day-by-day execution plan. Copy the Prompts directly into the Antigravity Agent Manager.

Phase 1: Architecture & Planning
Goal: detailed blueprints without writing code.

Prompt:

@full-stack-integrator Activate Planning Mode. Run a deep audit of src/ and package.json.

Check for ethers.js dependencies (we want to remove them).

Analyze index.css to extract the "Glassmorphism" design tokens.

Create a Master Integration Plan (artifacts/plan_v1.md) mapping these features to the existing file structure:

Unlock Protocol: "Hire Me" page routing and Paywall component.

XMTP: Floating Chat Widget placement in Home.jsx.

Cloudflare AI: Worker directory structure and frontend hooks.

Phase 2: Feature Implementation (Iterative)
Task Group 2.1: The "Hire Me" Page (Unlock Protocol)
Prompt:

@full-stack-integrator Implement the Unlock Protocol integration.

Create src/components/pricing/UnlockPaywall.jsx.

Rule Check: Ensure the paywallConfig uses pessimistic: true to prevent reorg attacks.

Inject the Unlock script into index.html.

Use the Browser Agent to navigate to localhost:5173/hire-me and verify the modal triggers on click.

Task Group 2.2: Secure Messaging (XMTP)
Prompt:

@full-stack-integrator Build the XMTP Chat Widget.

Create src/hooks/useXMTP.ts.

Skill Check: Initialize the Client. If env === 'browser', do NOT pass a dbEncryptionKey.

Build ChatWidget.jsx using the Glassmorphism styles.

Implement "Optimistic Sending" (display message immediately before network confirmation).

Task Group 2.3: AI Assistant (Cloudflare Workers)
Prompt:

@smart-contract-engineer Deploy the AI backend.

Scaffold a worker in workers/portfolio-agent.

Configure wrangler.toml to include the [ai] binding.

Security Rule: Implement a generic OPTIONS handler for CORS. Ensure no headers contain dots (e.g., Client.ID is forbidden).

Create a React hook usePortfolioAgent that streams the response from the worker.

Phase 3: Quality Assurance & Launch
Task Group 3.1: The Security Sweep
Prompt:

@security-auditor Run a final security pass.

Use aderyn via MCP to scan all contracts in src/contracts.

Scan package.json for Next.js versions < 15.0.7 (CVE-2025-55182).

Generate a security_report_final.md artifact with severity ratings.

Task Group 3.2: Final Deployment
Prompt:

"Prepare for mainnet.

Analyze bundle size. Suggest dynamic imports for @xmtp/xmtp-js (it is heavy).

Verify all console.log statements are removed.

Generate a final 'Deployment Checklist' artifact."

How to Start
Paste the MCP Config (Part 1.1) into Antigravity.

Create the Rule File (Part 1.2).

Run the Phase 1 Prompt to generate your blueprints.