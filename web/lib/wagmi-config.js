import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

// Use the real WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9';

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

export const config = createConfig({
  chains: [sepolia],
  connectors: [
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
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo'),
  },
  ssr: true,
}); 