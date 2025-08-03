/**
 * Network Configuration for SynapPay
 */

export interface NetworkConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  escrowFactory?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export interface StellarNetworkConfig {
  name: string;
  displayName: string;
  horizonUrl: string;
  networkPassphrase: string;
  explorerUrl: string;
  testnet: boolean;
}

export const ETHEREUM_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    id: 1,
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    rpcUrl: (import.meta as any).env?.VITE_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_MAINNET_API_KEY_HERE',
    explorerUrl: 'https://etherscan.io',
    escrowFactory: '0xa7bCb4EAc8964306F9e3764f67Db6A7af6DdF99A', // 1inch Escrow Factory
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  sepolia: {
    id: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    rpcUrl: (import.meta as any).env?.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_SEPOLIA_API_KEY_HERE',
    explorerUrl: 'https://sepolia.etherscan.io',
    escrowFactory: '0x3f344ACDd17a0c4D21096da895152820f595dc8A', // Testnet HTLC Bridge
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    testnet: true,
  },
  hardhat: {
    id: 31337,
    name: 'hardhat',
    displayName: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
};

export const STELLAR_NETWORKS: Record<string, StellarNetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Stellar Mainnet',
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    explorerUrl: 'https://stellarchain.io',
    testnet: false,
  },
  testnet: {
    name: 'testnet',
    displayName: 'Stellar Testnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    explorerUrl: 'https://testnet.stellarchain.io',
    testnet: true,
  },
};

export const CONTRACT_ADDRESSES = {
  ethereum: {
    mainnet: {
      htlcBridge: '0x0000000000000000000000000000000000000000', // Will use 1inch escrow instead
      escrowFactory: '0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a', // 1inch Escrow Factory
      testToken: '0xA0b86a33E6441b8bB770AE39aaDC4e75C0f03E6F', // WETH mainnet
    },
    sepolia: {
      htlcBridge: '0x3f344ACDd17a0c4D21096da895152820f595dc8A',
      escrowFactory: '0x3f344ACDd17a0c4D21096da895152820f595dc8A', // Testnet HTLC Bridge
      testToken: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH sepolia
    },
  },
  stellar: {
    mainnet: {
      htlcAddress: 'your_stellar_mainnet_contract_id',
    },
    testnet: {
      htlcAddress: 'CDLZFC3SYJYDZT7K67VZ462WYUMNPUYT6DQJX4MHGD77R2DQVXREBM4T',
    },
  },
};

export const getCurrentNetwork = () => {
  // Check URL parameters first
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const networkParam = urlParams.get('network');
    if (networkParam === 'mainnet' || networkParam === 'testnet') {
      return networkParam;
    }
  }

  // Check environment variable
  const envNetwork = (import.meta as any).env?.VITE_NETWORK_MODE;
  if (envNetwork === 'mainnet' || envNetwork === 'testnet') {
    return envNetwork;
  }

  // Default to testnet
  return 'testnet';
};

export const getContractAddresses = () => {
  const network = getCurrentNetwork();
  
  return {
    ethereum: CONTRACT_ADDRESSES.ethereum[network === 'mainnet' ? 'mainnet' : 'sepolia'],
    stellar: CONTRACT_ADDRESSES.stellar[network === 'mainnet' ? 'mainnet' : 'testnet'],
  };
};

export const getFaucets = () => {
  const network = getCurrentNetwork();
  
  if (network === 'testnet') {
    return {
      sepolia: 'https://sepoliafaucet.com/',
      stellar: 'https://laboratory.stellar.org/#account-creator?network=test',
    };
  }
  
  return {};
};

export const isTestnet = () => {
  return getCurrentNetwork() === 'testnet';
}; 