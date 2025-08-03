// SynapPay Frontend Configuration
// Centralized configuration management for new architecture

const isTestnet = process.env.NEXT_PUBLIC_NETWORK_MODE === 'testnet';

const config = {
  // Network configuration
  network: {
    mode: process.env.NEXT_PUBLIC_NETWORK_MODE || 'testnet',
    isTestnet,
    isMainnet: !isTestnet
  },

  // API endpoints (new architecture)
  api: {
    baseUrl: process.env.NEXT_PUBLIC_SYNAPPAY_API_URL || 'http://localhost:8787',
    coordinatorWs: process.env.NEXT_PUBLIC_COORDINATOR_WS_URL || 'ws://localhost:3002',
    fusionPlusProxy: process.env.NEXT_PUBLIC_FUSION_PLUS_API_URL || '/api/v1/fusion-plus'
  },

  // Ethereum configuration (dynamic based on network)
  ethereum: {
    chainId: isTestnet ? 11155111 : 1,
    rpcUrl: isTestnet 
      ? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL 
      : process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    htlcAddress: isTestnet 
      ? process.env.NEXT_PUBLIC_SEPOLIA_HTLC_ADDRESS 
      : process.env.NEXT_PUBLIC_ETHEREUM_HTLC_ADDRESS,
    explorerUrl: isTestnet 
      ? 'https://sepolia.etherscan.io' 
      : 'https://etherscan.io',
    name: isTestnet ? 'Sepolia' : 'Ethereum Mainnet'
  },

  // Stellar configuration (dynamic based on network)
  stellar: {
    horizonUrl: isTestnet 
      ? process.env.NEXT_PUBLIC_STELLAR_TESTNET_HORIZON_URL 
      : process.env.NEXT_PUBLIC_STELLAR_MAINNET_HORIZON_URL,
    networkPassphrase: isTestnet 
      ? process.env.NEXT_PUBLIC_STELLAR_TESTNET_NETWORK_PASSPHRASE 
      : process.env.NEXT_PUBLIC_STELLAR_MAINNET_NETWORK_PASSPHRASE,
    htlcAddress: isTestnet 
      ? process.env.NEXT_PUBLIC_STELLAR_TESTNET_HTLC_ADDRESS 
      : process.env.NEXT_PUBLIC_STELLAR_MAINNET_HTLC_ADDRESS,
    explorerUrl: isTestnet 
      ? 'https://stellar.expert/explorer/testnet' 
      : 'https://stellar.expert/explorer/public',
    name: isTestnet ? 'Stellar Testnet' : 'Stellar Mainnet'
  },

  // WalletConnect configuration
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'SynapPay',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Cross-chain atomic swaps',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://synappay.com',
      icons: ['https://synappay.com/icon.png'],
    },
  },

  // Token configuration
  tokens: {
    decimals: {
      'ETH': 18,
      'XLM': 7,
      'USDC': 6,
      'USDT': 6,
      'DAI': 18
    },
    addresses: {
      ethereum: {
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': process.env.NEXT_PUBLIC_USDC_ADDRESS,
        'USDT': process.env.NEXT_PUBLIC_USDT_ADDRESS,
        'DAI': process.env.NEXT_PUBLIC_DAI_ADDRESS
      },
      stellar: {
        'XLM': 'native',
        'USDC': 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        'USDT': 'USDT:GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V'
      }
    }
  },

  // UI configuration
  ui: {
    minSwapAmount: parseFloat(process.env.NEXT_PUBLIC_MIN_SWAP_AMOUNT) || 0.001,
    maxSwapAmount: parseFloat(process.env.NEXT_PUBLIC_MAX_SWAP_AMOUNT) || 100,
    defaultSlippage: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE) || 1.0,
    supportedTokens: ['ETH', 'XLM', 'USDC', 'USDT', 'DAI'],
    showTestnetBanner: process.env.NEXT_PUBLIC_ENABLE_TESTNET_BANNER === 'true',
    enableNetworkSwitch: process.env.NEXT_PUBLIC_ENABLE_NETWORK_SWITCH === 'true'
  },

  // Feature flags
  features: {
    marketplaceMode: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE_MODE === 'true',
    intentFulfillment: process.env.NEXT_PUBLIC_ENABLE_INTENT_FULFILLMENT === 'true',
    partialFills: process.env.NEXT_PUBLIC_ENABLE_PARTIAL_FILLS === 'true',
    debugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true'
  },

  // Swap configuration (inspired by OverSync but differentiated)
  swaps: {
    defaultTimelock: 3600, // 1 hour in seconds
    maxTimelock: 86400, // 24 hours in seconds
    minTimelock: 1800, // 30 minutes in seconds
    confirmationBlocks: {
      ethereum: 3,
      stellar: 1
    },
    gasMultiplier: 1.2, // 20% gas buffer
    maxRetries: 3,
    retryDelay: 2000 // 2 seconds
  },

  // Development configuration
  dev: {
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true'
  }
};

export default config; 