import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sepolia } from '@reown/appkit/networks';

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

// Set up the Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia],
  projectId,
  ssr: true
});

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
  projectId,
  metadata: {
    name: 'SynapPay',
    description: 'Cross-chain swaps between Ethereum and Stellar using 1inch Fusion+',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://synappay.com',
    icons: ['/icon.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#6366f1',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-border-radius-master': '12px'
  }
});

export { wagmiAdapter, modal };
export const config = wagmiAdapter.wagmiConfig;