import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, mainnet, polygon } from 'wagmi/chains';

// RainbowKit + Wagmi configuration.
// baseSepolia is included so the live testnet showcases (MilestoneEscrow demo +
// the CTF ReentrantVault) are interactable from the connected wallet.
export const config = getDefaultConfig({
    appName: 'jw3b.dev',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
    chains: [base, baseSepolia, mainnet, polygon],
    ssr: false,
});

// Deployed contract addresses. Escrow + CTF are TESTNET demos on Base Sepolia
// (see contracts/deployments/base-sepolia.json). Real per-client escrows deploy
// to Base mainnet at close of a deal (PROVISIONING.md §1).
export const CONTRACTS = {
    escrow: {
        // MilestoneEscrow (contracts/src/MilestoneEscrow.sol) — Base Sepolia demo.
        // provider (payee) = John's wallet; 3 milestones [100, 150, 250] test USDC.
        address: '0xF75ea6Ba560b8aC3314a8196cb74fDF99672B543',
        chainId: baseSepolia.id,
        token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia test USDC (6 dec)
    },
    ctf: {
        // ReentrantVault honeypot (contracts/src/ctf/ReentrantVault.sol) — Base Sepolia, testnet only.
        address: '0x4f72efbe94677E9bd5a3a1741b137e9Ea203C240',
        chainId: baseSepolia.id,
    },
    sbt: {
        address: null, // Will be set after deployment
        chainId: base.id,
    },
};

// Cloudflare gateway endpoints
export const GATEWAYS = {
    ipfs: 'https://cloudflare-ipfs.com/ipfs/',
    ethereum: 'https://cloudflare-eth.com',
};
