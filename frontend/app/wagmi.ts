import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    sepolia,
    baseSepolia,
    foundry,
} from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
    appName: 'TrustBridge',
    projectId: 'e3d2e85da5729f4fcbba4ab2ec4896c0',
    chains: [
        foundry, // Local development
        sepolia,
        baseSepolia,
    ],
    ssr: true,
});
