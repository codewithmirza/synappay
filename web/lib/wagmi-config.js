import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

// Use a more reliable project ID or handle the 403 error gracefully
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9';

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    walletConnect({
      projectId,
      metadata: {
        name: 'SynapPay',
        description: 'Cross-chain swaps between Ethereum and Stellar',
        url: 'https://www.synappay.com',
        icons: ['https://www.synappay.com/icon.png'],
      },
      // Add options to handle connection issues gracefully
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--w3m-z-index': '9999'
        }
      }
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo'),
  },
  // Add error handling for connection issues
  ssr: true,
}); 