// SynapPay Frontend Configuration
// Centralized configuration management

const config = {
  ethereum: {
    network: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK,
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    chainId: process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID,
    htlcContractAddress: process.env.NEXT_PUBLIC_HTLC_CONTRACT_ADDRESS,
    etherscanApiKey: process.env.ETHERSCAN_API_KEY
  },
  stellar: {
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    htlcContractAddress: process.env.NEXT_PUBLIC_STELLAR_HTLC_CONTRACT_ADDRESS
  },
  oneinch: {
    apiKey: process.env.ONEINCH_API_KEY,
    baseUrl: 'https://api.1inch.dev',
    chainId: process.env.NEXT_PUBLIC_1INCH_CHAIN_ID
  },
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: [
      {
        id: 11155111, // Sepolia
        name: 'Sepolia',
        network: 'sepolia',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL] },
          public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL] },
        },
        blockExplorers: {
          default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
        },
      },
    ],
    metadata: {
      name: 'SynapPay',
      description: 'Cross-chain swaps with 1inch Fusion+',
      url: 'https://synappay.com',
      icons: ['https://synappay.com/icon.png'],
    },
  },
  tokens: {
    decimals: {
      'ETH': 18,
      'XLM': 7,
      'USDC': 6,
      'USDT': 6,
      'DAI': 18
    },
    addresses: {
      'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6'
    }
  },
  ui: {
    minSwapAmount: 0.001,
    maxSwapAmount: 100,
    defaultSlippage: 1,
    supportedTokens: ['ETH', 'XLM', 'USDC', 'USDT', 'DAI']
  },
  relayer: {
    enabled: true,
    partialFills: true,
    maxPartialFill: 0.8, // 80% of order can be partially filled
    minPartialFill: 0.1, // 10% minimum for partial fills
    gasOptimization: true
  }
};

export default config; 