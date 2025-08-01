import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

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
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo'),
  },
}); 