import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, polygon } from 'wagmi/chains';

// RainbowKit + Wagmi configuration
export const config = getDefaultConfig({
    appName: 'jw3b.dev',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
    chains: [base, mainnet, polygon],
    ssr: false,
});

// Contract addresses (to be updated after deployment)
export const CONTRACTS = {
    escrow: {
        address: null, // Will be set after deployment
        chainId: base.id,
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
