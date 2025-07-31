// SynapPay Frontend Configuration
// Centralized configuration management

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3000/api',
    oneinchApiKey: process.env.NEXT_PUBLIC_ONEINCH_API_KEY,
  },

  // Blockchain Configuration
  ethereum: {
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    htlcContractAddress: process.env.NEXT_PUBLIC_HTLC_CONTRACT_ADDRESS,
    chainId: 11155111, // Sepolia
    networkName: 'sepolia',
  },

  // Stellar Configuration
  stellar: {
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    network: 'testnet',
  },

  // WalletConnect Configuration
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: [11155111], // Sepolia testnet
    metadata: {
      name: 'SynapPay',
      description: 'Cross-Chain ETH ↔ XLM Swaps',
      url: 'https://synappay.com',
      icons: ['https://synappay.com/icon.png']
    }
  },

  // Feature Flags
  features: {
    fusion: process.env.NEXT_PUBLIC_ENABLE_FUSION === 'true',
    realTime: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME === 'true',
    auctionMonitoring: process.env.NEXT_PUBLIC_ENABLE_AUCTION_MONITORING === 'true',
  },

  // UI Configuration
  ui: {
    defaultSlippage: 1, // 1%
    maxSlippage: 5, // 5%
    minSwapAmount: 0.001, // Minimum ETH amount
    maxSwapAmount: 10, // Maximum ETH amount
    refreshInterval: 5000, // 5 seconds
  },

  // Token Configuration
  tokens: {
    supported: ['ETH', 'USDC', 'USDT', 'DAI', 'XLM'],
    addresses: {
      ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      DAI: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
    },
    decimals: {
      ETH: 18,
      USDC: 6,
      USDT: 6,
      DAI: 18,
      XLM: 7,
    },
  },

  // Error Messages
  errors: {
    insufficientBalance: 'Insufficient balance for this swap',
    networkError: 'Network error. Please check your connection.',
    apiError: 'API error. Please try again.',
    invalidAmount: 'Please enter a valid amount',
    walletNotConnected: 'Please connect your wallet first',
  },

  // Success Messages
  success: {
    swapCreated: 'Swap created successfully!',
    swapCompleted: 'Swap completed successfully!',
    quoteReceived: 'Quote received successfully!',
  },
};

export default config; 