import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { walletConnect, injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

// Use environment variable for WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable is not set. Please set it to your WalletConnect project ID from https://cloud.reown.com/sign-in');
  // For development, we'll use a demo project ID
  console.warn('Using demo WalletConnect project ID for development');
}

// Dynamic metadata based on environment
const getMetadata = () => {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const baseUrl = isLocalhost ? 'http://localhost:3000' : 'https://www.synappay.com';
  
  return {
    name: 'SynapPay',
    description: 'Cross-chain swaps between Ethereum and Stellar',
    url: baseUrl,
    icons: [`${baseUrl}/icon.png`],
  };
};

// Create config only once to prevent multiple initializations
let configInstance = null;

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    // Injected connector for MetaMask and other browser wallets
    injected({
      target: 'metaMask',
    }),
    // Generic injected connector for other wallets
    injected(),
    // MetaMask specific connector
    metaMask(),
    // Coinbase Wallet connector
    coinbaseWallet({
      appName: 'SynapPay',
      appLogoUrl: 'https://www.synappay.com/icon.png',
    }),
    // WalletConnect connector (only if project ID is available)
    ...(projectId ? [
      walletConnect({
        projectId,
        metadata: getMetadata(),
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'light',
          themeVariables: {
            '--w3m-z-index': '9999'
          }
        },
        relayUrl: 'wss://relay.walletconnect.org',
        optionalChains: [sepolia],
        optionalMethods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign'],
      })
    ] : []),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo'),
  },
  ssr: true,
});