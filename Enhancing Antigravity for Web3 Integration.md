# **Architectural Reconfiguration of the jw3b.dev Development Agent via Antigravity Customization**

## **1\. Executive Summary and Strategic Alignment**

The successful deployment of the jw3b.dev Web3 integration project requires a fundamental shift in how automated development agents are configured and governed. Standard large language models (LLMs) lack the specific architectural context and rigid constraint enforcement necessary for high-stakes blockchain engineering. To achieve the granular task planning, detailed design specifications, and robust code generation required, we must rigorously implement the Antigravity customization features: Rules, Workflows, Skills, Model Context Protocol (MCP), and Task Groups.

The jw3b.dev platform, envisioned as a comprehensive Web3 portfolio and interactive hub 1, aggregates decentralized assets, facilitates secure messaging via XMTP 2, controls access via Unlock Protocol 3, and leverages edge-based AI through Cloudflare Workers.4 This stack represents a convergence of distinct cryptographic primitives and serverless architectures, each carrying specific compatibility requirements and security pitfalls.

Our analysis indicates that a generic agent configuration fails to address critical nuances such as the "simulate-before-write" pattern mandated by Wagmi v2 5, the specific encryption key management required by XMTP’s local-first database 6, or the recent critical vulnerabilities discovered in React Server Components.7 Therefore, this report outlines a comprehensive reconfiguration strategy. By embedding these domain-specific realities into the agent's **Rules** (governance), **Skills** (capabilities), and **Workflows** (processes), we transform the agent from a generalist coding assistant into a specialized Web3 solutions architect capable of executing the project with engineering precision.

## **2\. Governance Layer: Configuring Agent Rules**

The **Rules** feature within the Antigravity framework functions as the non-negotiable governance layer for the agent. Unlike prompts which act as suggestions, Rules enforce architectural standards and security boundaries. For jw3b.dev, the rules must be calibrated to prevent the generation of legacy code patterns and to enforce strict security compliance in light of recent vulnerabilities.

### **2.1 Enforcing the Wagmi v2 and Viem Interaction Paradigm**

A primary challenge in modern Web3 frontend development is the migration from Ethers.js to Viem as the underlying interaction layer, a shift fully adopted by Wagmi v2. The agent must be explicitly restricted from defaulting to legacy patterns that result in bloated bundles or unsimulated transactions.

#### **2.1.1 The Simulation Mandate**

The most critical operational rule for the agent concerns state-changing transactions. In the Wagmi v2 ecosystem, writing to the blockchain without prior simulation is considered an anti-pattern that leads to failed transactions and wasted gas.5 The agent must be configured with a rule that rejects any code generation request for a write operation that does not include a preceding simulation step.

The reasoning is twofold. First, simulateContract validates that the transaction parameters are correct and that the user has sufficient balance and allowances before the transaction is broadcast.5 Second, it allows the UI to catch errors (like execution reversions) early, providing a better user experience than a failed on-chain transaction.

**Rule Configuration: Strict Write Simulation**

* **Trigger:** Detection of writeContract or useWriteContract.  
* **Constraint:** The agent must verify the presence of useSimulateContract (or simulateContract in core actions) preceding the write execution.  
* **Enforcement Action:** If the simulation step is missing, the agent must halt generation and refactor the code to implement the "Simulate-Write-Wait" pattern.  
* **Technical Context:** The simulateContract function performs a dry run of the transaction locally or on the node, returning a request object that is then passed to writeContract.5 This pattern is non-negotiable for the jw3b.dev integration to ensure reliability.

#### **2.1.2 Bundle Size and Tree-Shaking Optimization**

To maintain performance on the jw3b.dev platform, the agent must adhere to strict import standards. The research highlights that Viem is designed to be tree-shakable, allowing developers to import only specific actions (e.g., sendTransaction, getBalace) rather than the entire library.8

**Rule Configuration: Modular Import Enforcement**

* **Constraint:** The agent is prohibited from generating code that imports entire namespace objects (e.g., import \* as viem from 'viem') or utilizing the "Client Actions" style (e.g., client.getLogs) when "Tree-Shakable Actions" (e.g., getLogs(client,...)) are available.8  
* **Rationale:** This ensures that the final build of the jw3b.dev portfolio remains lightweight, roughly \~70kB for the full library, optimizing load times for users on slower networks.9

### **2.2 Security Compliance: React Server Components and CORS**

The governance layer must also address critical security vulnerabilities identified in the research, particularly concerning the React framework and Cloudflare Workers integration.

#### **2.2.1 Remediation of CVE-2025-55182 (Flight Payload RCE)**

Recent disclosures regarding Remote Code Execution (RCE) vulnerabilities in React Server Components (CVE-2025-55182) necessitate strict version control.7 The agent must operate under a rule that mandates specific patch versions for any Next.js implementation.

**Rule Configuration: Version Sentinel**

* **Constraint:** When generating package.json or analyzing dependency graphs, the agent must enforce the following minimum versions:  
  * Next.js: 14.2.35+, 15.0.7+, or 16.0.10+.11  
  * React: 19.0.3+ (if used independently).11  
* **Logic:** The agent must identify any configuration using vulnerable versions (e.g., Next.js 14.1.x) as a "Critical Security Violation" and refuse to proceed until updated. This prevents the deployment of code susceptible to unauthenticated remote code execution via malicious Flight payloads.10

#### **2.2.2 Edge Security and Header Sanitation**

For the Cloudflare Workers integration, the agent must enforce rules regarding Cross-Origin Resource Sharing (CORS) and header formatting. The research indicates that Cloudflare's Nginx proxy layer strips headers containing dots (.), which can cause failures in specific API integrations.12

**Rule Configuration: Header Integrity and CORS**

* **Constraint 1 (Sanitation):** The agent must reject any custom header definitions containing periods (e.g., Client.ID). All custom headers must use hyphens (e.g., Client-ID).12  
* **Constraint 2 (Access Control):** Every Cloudflare Worker response generated must include Access-Control-Allow-Origin headers. The agent must automatically inject an OPTIONS handler for preflight requests into every worker script.13

## **3\. Operational Capabilities: Defining Agent Skills**

While Rules restrict what the agent *cannot* do, **Skills** define what it *can* do. For jw3b.dev, generic coding skills are insufficient. We must define high-order, domain-specific skills that encapsulate complex implementation logic for XMTP, Unlock Protocol, and Cloudflare AI.

### **3.1 Skill: Decentralized Identity and Messaging (XMTP)**

The agent requires a specialized skill set to handle the complexities of the XMTP protocol, particularly regarding its "Local-First" architecture and encryption requirements.

#### **3.1.1 Capability: Environmental Encryption Management**

The research highlights a critical divergence in how XMTP handles database encryption across platforms. In a browser environment, the SDK does not use the dbEncryptionKey due to technical limitations, whereas in Node.js or React Native, this key is mandatory for the local SQLite database.6

**Skill Definition: Context-Aware Client Initialization**

* **Input Analysis:** The agent determines the target environment (Browser vs. React Native).  
* **Execution Logic (Browser):** Generates initialization code that omits dbEncryptionKey, invoking Client.create(signer, { env: 'production' }).6  
* **Execution Logic (React Native):** Generates a secure key generation routine (random 32 bytes), integrates with expo-secure-store or similar for persistence, and mandates the key's presence in Client.create().14  
* **Outcome:** This skill prevents runtime errors where a browser client fails due to extraneous arguments or a mobile client fails due to missing encryption.

#### **3.1.2 Capability: Optimistic UI Implementation**

To ensure a responsive user experience in the chat interface, the agent must possess the skill to implement optimistic UI patterns. This involves displaying messages immediately upon sending, before network confirmation.

**Skill Definition: Optimistic Message Handling**

* **Routine:** The agent generates a two-step send process:  
  1. conversation.sendOptimistic(content): Immediately updates the local store and UI.  
  2. conversation.publishMessages(): Broadcasts the message to the XMTP network.15  
* **State Management:** The generated code handles the transition of message states from unpublished to published or failed, ensuring the UI reflects the true status without user intervention.15

### **3.2 Skill: Membership Architecture (Unlock Protocol)**

The integration of Unlock Protocol for token-gating requires a skill focused on smart contract interaction and frontend configuration.

#### **3.2.1 Capability: Paywall Configuration and Pessimistic Locking**

The agent must be able to configure the Unlock Paywall application, which is embedded via script. A key requirement is the "pessimistic" unlocking mode, which is crucial for high-value content where transaction reversibility (reorgs) is a concern.

**Skill Definition: Paywall Configuration Strategy**

* **Input:** Lock addresses, network IDs (e.g., Base, Polygon), and content metadata.  
* **Execution:** The agent constructs the unlockProtocolConfig JSON object.  
* **Specific Constraint:** It sets pessimistic: true to ensure the application waits for transaction indexing before granting access.16  
* **Output Example:**  
  JavaScript  
  var unlockProtocolConfig \= {  
    locks: {  
      '0x...': { name: 'Premium Access' }  
    },  
    pessimistic: true,  
    callToAction: { default: 'Unlock your Web3 Portfolio' }  
  }

#### **3.2.2 Capability: Custom Hook Deployment**

For advanced access control (e.g., password-protected purchases), the agent must demonstrate the skill to write and deploy Unlock Protocol Hooks.

**Skill Definition: Solidity Hook Generation**

* **Context:** The standard PublicLock contract allows delegating purchase logic to an external contract via the onKeyPurchaseHook.  
* **Execution:** The agent generates a Solidity contract implementing ILockKeyPurchaseHook. It includes logic to verify parameters passed in the data field (e.g., verifying a cryptographic signature corresponding to a password).17  
* **Integration:** The skill includes the necessary Hardhat scripts to deploy this hook and register it with the main lock via setEventHooks.19

### **3.3 Skill: Edge Intelligence (Cloudflare Workers AI)**

The final core skill focuses on the backend intelligence layer, enabling the jw3b.dev platform to perform AI inference at the edge.

#### **3.3.1 Capability: AI Model Binding and Streaming**

The agent must be proficient in configuring Cloudflare Workers to interface with the Workers AI platform.

**Skill Definition: AI Worker Implementation**

* **Configuration:** The agent generates the wrangler.toml configuration to include the \[ai\] binding, ensuring the worker has access to the neural network models.20  
* **Inference Logic:** It generates the fetch handler code utilizing env.AI.run. Crucially, it selects the appropriate model (e.g., @cf/meta/llama-3.1-8b-instruct) based on the task (chat vs. completion).21  
* **Streaming Response:** To enhance UX, the agent implements response streaming. It returns a Response object constructed from the model's ReadableStream output, setting Transfer-Encoding: chunked headers to allow the frontend to display text as it generates.20

## **4\. Contextual Integration: Model Context Protocol (MCP)**

To function as a true architectural partner, the agent must utilize the **Model Context Protocol (MCP)** to maintain a real-time understanding of the project state and the evolving documentation of the tech stack. This solves the problem of "hallucinated" APIs by grounding the agent in actual, retrieved data.

### **4.1 MCP Server: Documentation Retrieval**

Given the rapid versioning of libraries like Wagmi (v1 to v2) and Next.js, the agent relies on an MCP server to fetch the latest documentation rather than relying on stale training data.

**Configuration:**

* **Resource:** wagmi-v2-docs: Provides authoritative syntax for hooks like useWriteContract (replacing the deprecated useContractWrite).22  
* **Resource:** viem-docs: Provides details on "Tree-Shakable Actions" and client instantiation.8  
* **Resource:** unlock-protocol-docs: Source of truth for the ILockKeyPurchaseHook interface and ABI details.17

### **4.2 MCP Server: Project State Analysis**

The agent uses a local file system MCP server to analyze the jw3b.dev codebase, ensuring generated code is compatible with existing dependencies.

**Configuration:**

* **Tool:** read\_package\_json: The agent reads package.json to verify if ethers v5 or v6 is installed alongside wagmi. If ethers is present (often required for legacy compatibility), the agent activates specific "Adapter Skills" to bridge Viem clients to Ethers signers.23  
* **Tool:** analyze\_directory\_structure: The agent scans src/abis to confirm that ABI JSON files are correctly placed and named before generating hook code that references them.9

## **5\. Granular Task Groups: The Execution Roadmap**

To satisfy the requirement for "granular task lists," the agent manages the integration through distinct **Task Groups**. Each group contains a sequence of verified steps, ensuring no dependency is overlooked.

### **5.1 Task Group A: Infrastructure & Wallet Connectivity**

*Objective: Establish a secure, multi-wallet connection layer using Wagmi v2.*

| Task ID | Task Description | Technical Constraint/Reference |
| :---- | :---- | :---- |
| **A-01** | **Dependency Installation** | Install wagmi, viem, and @tanstack/react-query. **Must** verify React 18+ compatibility.22 |
| **A-02** | **Wagmi Config Setup** | Implement createConfig with http transports. Configure chains: Mainnet, Base, Optimism, Polygon.22 |
| **A-03** | **Connector Implementation** | Configure injected, walletConnect (requires Project ID env var), coinbaseWallet, and safe connectors.22 |
| **A-04** | **Provider Wrapping** | Wrap the root application in WagmiProvider and QueryClientProvider.22 |
| **A-05** | **Legacy Adapter Creation** | *Conditional:* Implement clientToSigner and clientToProvider (Viem \-\> Ethers) if legacy SDKs are detected.23 |
| **A-06** | **Wallet UI Component** | Create MultiWalletConnect component handling isConnecting and isDisconnected states. Display connection status and address.22 |

### **5.2 Task Group B: Identity & Messaging (XMTP)**

*Objective: Integrate secure, wallet-based messaging.*

| Task ID | Task Description | Technical Constraint/Reference |
| :---- | :---- | :---- |
| **B-01** | **Signer Extraction** | Implement hook to retrieve WalletClient from Wagmi and convert/pass to XMTP Client.create.14 |
| **B-02** | **Client Initialization** | Implement Client.create(). **Crucial:** Detect platform. If Browser, omit dbEncryptionKey. If Mobile/Node, enforce key generation/storage.6 |
| **B-03** | **Stream Listener** | Set up client.conversations.streamAllMessages for real-time message reception.14 |
| **B-04** | **Content Type Registry** | Register ReactionCodec, ReplyCodec, and RemoteAttachmentCodec during client initialization.27 |
| **B-05** | **Optimistic Send** | Implement sendOptimistic UI pattern to eliminate perceived network latency.15 |

### **5.3 Task Group C: Access Control (Unlock Protocol)**

*Objective: Implement token-gating for portfolio assets.*

| Task ID | Task Description | Technical Constraint/Reference |
| :---- | :---- | :---- |
| **C-01** | **Paywall Script Injection** | Inject unlock.latest.min.js into the application head. Ensure non-blocking load.16 |
| **C-02** | **Config Object Definition** | Define unlockProtocolConfig with lock addresses. Set pessimistic: true for transaction safety.16 |
| **C-03** | **Event Listener Setup** | Implement window.addEventListener('unlockProtocol.status',...) to trigger React state updates upon unlock.16 |
| **C-04** | **Hook Development** | *Optional:* Develop PurchaseHook.sol for password protection. Deploy via Hardhat.17 |
| **C-05** | **Checkout Trigger** | Implement UI button invoking window.unlockProtocol.loadCheckoutModal().28 |

### **5.4 Task Group D: Intelligent Backend (Cloudflare Workers)**

*Objective: Deploy edge AI for portfolio analysis.*

| Task ID | Task Description | Technical Constraint/Reference |
| :---- | :---- | :---- |
| **D-01** | **Project Scaffolding** | Initialize via npm create cloudflare. Configure wrangler.toml with \[ai\] binding.20 |
| **D-02** | **CORS Middleware** | Implement generic OPTIONS handler. Add Access-Control-Allow-Origin to *all* responses. **No dots in header names**.12 |
| **D-03** | **Inference Logic** | Implement env.AI.run call. Handle ReadableStream output for text streaming.20 |
| **D-04** | **Frontend Integration** | Create React component to fetch from Worker. Parse chunked response for real-time display.20 |

## **6\. Detailed Workflows and Procedural Logic**

**Workflows** define the complex, multi-step sequences the agent must navigate. These are the "design specifications" in motion, dictating how the static code components interact.

### **6.1 Workflow: The "Simulate-Write-Wait" Transaction Cycle**

This workflow governs all on-chain interactions, ensuring the jw3b.dev platform minimizes user error and gas wastage.

1. **Trigger:** User action (e.g., "Mint Membership NFT").  
2. **Phase 1: Validation (Simulation)**  
   * **Agent Action:** Generate useSimulateContract hook.  
   * **Parameters:** Contract ABI, Address, Function Name (purchase), Args (Value, Referrer, Data).  
   * **Logic:** The hook queries the node. If the node returns an error (e.g., "Execution Reverted"), the UI must disable the "Mint" button and display the error reason.5  
3. **Phase 2: Execution (Write)**  
   * **Condition:** Simulation returns success (data.request is populated).  
   * **Agent Action:** Call writeContract(data.request). This bypasses the need for the wallet to re-estimate gas, as the simulation already provided precise parameters.5  
4. **Phase 3: Confirmation (Wait)**  
   * **Agent Action:** Utilize useWaitForTransactionReceipt({ hash }).  
   * **UI State:** Display "Processing" spinner.  
   * **Completion:** Upon receipt, trigger a toast notification and refresh the useBalance or useLock hooks to update the UI.22

### **6.2 Workflow: The Secure Messaging Bootstrap**

This workflow manages the delicate process of initializing the user's secure inbox.

1. **Trigger:** User navigates to "/messages".  
2. **Phase 1: Identity Resolution**  
   * **Agent Action:** Extract Signer from Wagmi useWalletClient.  
   * **Check:** Does client exist in context? If yes, skip to Phase 4\.  
3. **Phase 2: Environment & Key Check**  
   * **Agent Action (MCP Context):** Check Platform.  
   * **Branch A (Browser):** Proceed without dbEncryptionKey.  
   * **Branch B (Mobile):** Query SecureStore. If key missing, generate random 32-byte hex string, save to SecureStore, then proceed.6  
4. **Phase 3: Client Creation**  
   * **Agent Action:** Call Client.create.  
   * **Error Handling:** If creation fails due to DB lock, prompt user to "Force Logout" (clear DB).6  
5. **Phase 4: Sync & Stream**  
   * **Agent Action:** Call client.conversations.syncAllConversations().  
   * **Agent Action:** Start streamAllMessages() listener loop to catch new envelopes.14

### **6.3 Workflow: The Edge AI Inference Chain**

1. **Trigger:** User asks the Portfolio Agent a question.  
2. **Phase 1: Frontend Request**  
   * **Agent Action:** Send POST request to Cloudflare Worker endpoint.  
   * **Payload:** { prompt: "Analyze my NFT holdings..." }.  
3. **Phase 2: Worker Processing (Edge)**  
   * **Preflight:** Worker intercepts OPTIONS request, returns CORS headers (Access-Control-Allow-Origin: \*).13  
   * **Inference:** Worker calls env.AI.run.  
4. **Phase 3: Streaming Response**  
   * **Agent Action:** Worker returns Response with ReadableStream.  
   * **Frontend Action:** React component uses TextDecoderStream to read chunks.  
   * **Updates:** Text is appended to the UI state variable response in real-time, providing an immediate "typing" effect.20

## **7\. Architecture and Design Specifications**

The jw3b.dev platform is architected as a modular, decentralized application. The agent is configured to maintain strict boundaries between these modules while ensuring seamless data flow.

### **7.1 Frontend Module: Next.js & Wagmi**

The core application utilizes **Next.js** (App Router). However, due to CVE-2025-55182, the architecture explicitly forbids the use of unpatched versions. The agent enforces the use of Next.js 15.0.7+ or 16.0.10+.11

* **State Management:** @tanstack/react-query v5 handles all async state (blockchain reads, API calls). The agent is configured to use the "Object Syntax" for queries, as the callback syntax (onSuccess, onError) was removed in v5.31  
* **Ethereum Interface:** The app uses **Viem** for all low-level interaction. If interaction with legacy libraries (like older Unlock Protocol SDKs) is required, the architecture includes a dedicated **Adapter Layer** (src/utils/adapters.ts) where clientToSigner functions convert Viem clients to Ethers v6 signers.23

### **7.2 Access Control Module: Unlock Protocol**

The architecture treats the Unlock Protocol as the "Gatekeeper."

* **PublicLock Contract:** Deployed on Polygon (for low fees) or Base.  
* **Hooks:** The onKeyPurchaseHook is deployed separately. The architecture dictates that the PublicLock is initialized with this hook's address.  
* **Frontend Logic:** The "Paywall" is decoupled from the main app bundle, loaded via CDN script (unlock.latest.min.js). The React app communicates with this script via the window object and event listeners, ensuring that the heavy lifting of the checkout process (credit card handling, etc.) is offloaded to Unlock's secure infrastructure.16

### **7.3 Intelligence Module: Cloudflare Workers**

The AI component is architected as a set of **microservices** on Cloudflare Workers.

* **Isolation:** Each major AI function (e.g., "Portfolio Analysis", "Chat") runs in its own Worker to isolate failure domains.  
* **Communication:** The frontend communicates via standard REST APIs.  
* **Data Flow:** Frontend \-\> Worker (CORS Validated) \-\> Workers AI (Llama 3\) \-\> Stream \-\> Frontend.

## **8\. Conclusion**

By implementing this comprehensive Antigravity customization, we elevate the jw3b.dev development agent from a simple code generator to a domain-aware systems integrator. The **Rules** impose necessary constraints, preventing security vulnerabilities and legacy code patterns. The **Skills** provide the agent with the specific technical know-how to implement complex protocols like XMTP and Unlock. The **Workflows** map out the intricate sequences of Web3 interactions, and the **Task Groups** ensure every step of the implementation is tracked and executed. This configuration ensures that the jw3b.dev integration will be robust, secure, and architecturally sound, capable of handling the unique challenges of the decentralized web.

### ---

**Table 1: Configuration Summary for Antigravity Agent**

| Feature | Configuration Element | Purpose | Critical Reference |
| :---- | :---- | :---- | :---- |
| **Rule** | Strict Write Simulation | Prevents write ops without simulateContract | 5 |
| **Rule** | Next.js Version Sentinel | Enforces patched versions (e.g., 15.0.7+) | 10 |
| **Rule** | CORS Header Sanitation | Enforces no dots in headers; mandatory CORS | 12 |
| **Skill** | XMTP Client Init | Handles dbEncryptionKey by platform | 6 |
| **Skill** | Paywall Config | Generates unlockProtocolConfig \+ pessimistic mode | 16 |
| **Skill** | AI Worker Binding | Configures wrangler.toml and streaming | 20 |
| **MCP** | Docs-Loader | Retrieves latest Wagmi v2/Viem docs | 9 |
| **Workflow** | Simulate-Write-Wait | Orchestrates safe transaction lifecycle | 5 |
| **Task Group** | Identity & Messaging | Phase 2 implementation steps | 2 |

#### **Works cited**

1. Blockchain / Web3 Case Study: W3B Portfolio \- Modern Launch, accessed on January 16, 2026, [https://modernlaunch.co/blockchain-web3-case-study-w3b-portfolio/](https://modernlaunch.co/blockchain-web3-case-study-w3b-portfolio/)  
2. XMTP, accessed on January 16, 2026, [https://xmtp.org/](https://xmtp.org/)  
3. Unlock Protocol: Documentation, accessed on January 16, 2026, [https://docs.unlock-protocol.com/](https://docs.unlock-protocol.com/)  
4. Workers AI \- Cloudflare, accessed on January 16, 2026, [https://www.cloudflare.com/developer-platform/products/workers-ai/](https://www.cloudflare.com/developer-platform/products/workers-ai/)  
5. Why You Should Always Use simulateContract Before Writing to Blockchain in Wagmi, accessed on January 16, 2026, [https://medium.com/@mirbasit01/why-you-should-always-use-simulatecontract-before-writing-to-blockchain-in-wagmi-470d0d503aee](https://medium.com/@mirbasit01/why-you-should-always-use-simulatecontract-before-writing-to-blockchain-in-wagmi-470d0d503aee)  
6. Create an XMTP client, accessed on January 16, 2026, [https://docs.xmtp.org/chat-apps/core-messaging/create-a-client](https://docs.xmtp.org/chat-apps/core-messaging/create-a-client)  
7. CVE-2025-66478: RCE in React Server Components \- AWS \- Amazon.com, accessed on January 16, 2026, [https://aws.amazon.com/security/security-bulletins/rss/aws-2025-030/](https://aws.amazon.com/security/security-bulletins/rss/aws-2025-030/)  
8. Viem \- Wagmi, accessed on January 16, 2026, [https://wagmi.sh/react/guides/viem](https://wagmi.sh/react/guides/viem)  
9. WAGMI Library: Complete Guide to Building React dApps in 2025 \- Yuri Shapkarin, accessed on January 16, 2026, [https://shapkarin.me/articles/WAGMI-basics/](https://shapkarin.me/articles/WAGMI-basics/)  
10. CVE-2025-55182 – React Server Components RCE via Flight Payload Deserialization, accessed on January 16, 2026, [https://www.offsec.com/blog/cve-2025-55182/](https://www.offsec.com/blog/cve-2025-55182/)  
11. CVE-2025-55184 & CVE-2025-55183: React Server Components Fix \- Strapi, accessed on January 16, 2026, [https://strapi.io/blog/cve-2025-55184-cve-2025-55183-react-server-components-vulnerabilities](https://strapi.io/blog/cve-2025-55184-cve-2025-55183-react-server-components-vulnerabilities)  
12. Custom headers in cloudflare workers fetch \- Stack Overflow, accessed on January 16, 2026, [https://stackoverflow.com/questions/79765027/custom-headers-in-cloudflare-workers-fetch](https://stackoverflow.com/questions/79765027/custom-headers-in-cloudflare-workers-fetch)  
13. How To Fix CORS Errors On Cloudflare Workers \- DEV Community, accessed on January 16, 2026, [https://dev.to/megaconfidence/how-to-fix-cors-errors-on-cloudflare-workers-1jn6](https://dev.to/megaconfidence/how-to-fix-cors-errors-on-cloudflare-workers-1jn6)  
14. Get started with the XMTP React Native SDK, accessed on January 16, 2026, [https://docs.xmtp.org/chat-apps/sdks/react-native](https://docs.xmtp.org/chat-apps/sdks/react-native)  
15. Send messages \- XMTP Docs, accessed on January 16, 2026, [https://docs.xmtp.org/chat-apps/core-messaging/send-messages](https://docs.xmtp.org/chat-apps/core-messaging/send-messages)  
16. Paywall \- Unlock Protocol, accessed on January 16, 2026, [https://docs.unlock-protocol.com/tools/checkout/paywall/](https://docs.unlock-protocol.com/tools/checkout/paywall/)  
17. Creating a hook to password-protect purchases \- Unlock Protocol, accessed on January 16, 2026, [https://docs.unlock-protocol.com/tutorials/smart-contracts/hooks/using-on-key-purchase-hook-to-password-protect](https://docs.unlock-protocol.com/tutorials/smart-contracts/hooks/using-on-key-purchase-hook-to-password-protect)  
18. Hooks \- Unlock Protocol, accessed on January 16, 2026, [https://docs.unlock-protocol.com/core-protocol/public-lock/hooks](https://docs.unlock-protocol.com/core-protocol/public-lock/hooks)  
19. Hooks | Unlock Protocol, accessed on January 16, 2026, [https://docs.unlock-protocol.com/tutorials/smart-contracts/hooks/](https://docs.unlock-protocol.com/tutorials/smart-contracts/hooks/)  
20. Vercel AI SDK · Cloudflare Workers AI docs, accessed on January 16, 2026, [https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/)  
21. Get started \- REST API · Cloudflare Workers AI docs, accessed on January 16, 2026, [https://developers.cloudflare.com/workers-ai/get-started/rest-api/](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)  
22. Wagmi v2 & Viem Hooks Guide for React Applications | by mirbasit01 \- Medium, accessed on January 16, 2026, [https://medium.com/@mirbasit01/wagmi-v2-viem-hooks-guide-for-react-applications-1d7c6cd51768](https://medium.com/@mirbasit01/wagmi-v2-viem-hooks-guide-for-react-applications-1d7c6cd51768)  
23. Ethers.js Adapters \- Wagmi, accessed on January 16, 2026, [https://wagmi.sh/core/guides/ethers](https://wagmi.sh/core/guides/ethers)  
24. Installation | Wagmi, accessed on January 16, 2026, [https://wagmi.sh/react/installation](https://wagmi.sh/react/installation)  
25. Ethers.js Adapters \- Wagmi, accessed on January 16, 2026, [https://wagmi.sh/react/guides/ethers](https://wagmi.sh/react/guides/ethers)  
26. Wallet Client \- Viem, accessed on January 16, 2026, [https://viem.sh/docs/clients/wallet](https://viem.sh/docs/clients/wallet)  
27. xmtp/react-sdk \- NPM, accessed on January 16, 2026, [https://www.npmjs.com/package/%40xmtp%2Freact-sdk](https://www.npmjs.com/package/%40xmtp%2Freact-sdk)  
28. Integrating Unlock with React, accessed on January 16, 2026, [https://unlock-protocol.com/blog/integratating-unlock-react](https://unlock-protocol.com/blog/integratating-unlock-react)  
29. Get started \- Dashboard · Cloudflare Workers AI docs, accessed on January 16, 2026, [https://developers.cloudflare.com/workers-ai/get-started/dashboard/](https://developers.cloudflare.com/workers-ai/get-started/dashboard/)  
30. Write to Contract | Wagmi, accessed on January 16, 2026, [https://wagmi.sh/react/guides/write-to-contract](https://wagmi.sh/react/guides/write-to-contract)  
31. Migrating to TanStack Query v5, accessed on January 16, 2026, [https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5](https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5)