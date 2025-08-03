// Synappay-style Network Configuration
// Supports both testnet and mainnet like the original Synappay

export const NETWORK_CONFIG = {
  testnet: {
    name: 'Testnet',
    ethereum: {
      chainId: 11155111, // Sepolia
      name: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18
      },
      // For testnet, we use custom escrow factory (like Synappay does)
      escrowFactory: '0x1234567890123456789012345678901234567890', // Custom testnet contract
      fusionPlusEnabled: false // 1inch doesn't provide testnet Fusion+
    },
    stellar: {
      name: 'Stellar Testnet',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
      explorerUrl: 'https://stellar.expert/explorer/testnet',
      nativeCurrency: {
        name: 'Testnet Lumens',
        symbol: 'XLM',
        decimals: 7
      }
    },
    faucets: {
      ethereum: 'https://sepoliafaucet.com/',
      stellar: 'https://friendbot.stellar.org'
    }
  },
  
  mainnet: {
    name: 'Mainnet',
    ethereum: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      // For mainnet, use official 1inch Escrow Factory (like Synappay)
      escrowFactory: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Official 1inch factory
      fusionPlusEnabled: true
    },
    stellar: {
      name: 'Stellar Mainnet',
      horizonUrl: 'https://horizon.stellar.org',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
      explorerUrl: 'https://stellar.expert/explorer/public',
      nativeCurrency: {
        name: 'Lumens',
        symbol: 'XLM',
        decimals: 7
      }
    }
  }
};

export const SUPPORTED_TOKENS = {
  testnet: {
    ethereum: [
      {
        symbol: 'ETH',
        name: 'Sepolia ETH',
        address: '0x0000000000000000000000000000000000000000', // Native ETH
        decimals: 18,
        icon: '/icons/eth.svg'
      }
    ],
    stellar: [
      {
        symbol: 'XLM',
        name: 'Testnet Lumens',
        code: 'XLM',
        issuer: null, // Native asset
        decimals: 7,
        icon: '/icons/xlm.svg'
      }
    ]
  },
  
  mainnet: {
    ethereum: [
      {
        symbol: 'ETH',
        name: 'Ether',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: '/icons/eth.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E6441b8C4505B4afDcA7FBf074497C23',
        decimals: 6,
        icon: '/icons/usdc.svg'
      }
    ],
    stellar: [
      {
        symbol: 'XLM',
        name: 'Lumens',
        code: 'XLM',
        issuer: null,
        decimals: 7,
        icon: '/icons/xlm.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        code: 'USDC',
        issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        decimals: 7,
        icon: '/icons/usdc.svg'
      }
    ]
  }
};

class NetworkManager {
  constructor() {
    this.currentNetwork = 'testnet'; // Start with testnet like Synappay
    this.listeners = new Set();
  }

  getCurrentNetwork() {
    return this.currentNetwork;
  }

  getConfig() {
    return NETWORK_CONFIG[this.currentNetwork];
  }

  getSupportedTokens() {
    return SUPPORTED_TOKENS[this.currentNetwork];
  }

  switchNetwork(network) {
    if (!NETWORK_CONFIG[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const oldNetwork = this.currentNetwork;
    this.currentNetwork = network;

    console.log(`Switched from ${oldNetwork} to ${network}`);
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(network, oldNetwork);
      } catch (error) {
        console.error('Network switch listener error:', error);
      }
    });
  }

  onNetworkChange(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  isTestnet() {
    return this.currentNetwork === 'testnet';
  }

  isMainnet() {
    return this.currentNetwork === 'mainnet';
  }

  getNetworkBanner() {
    if (this.isTestnet()) {
      return {
        show: true,
        message: 'You are on testnet. Funds have no real value.',
        type: 'warning',
        faucets: NETWORK_CONFIG.testnet.faucets
      };
    }
    return { show: false };
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();