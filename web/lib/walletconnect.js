import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WalletConnectModal } from '@walletconnect/modal';

// WalletConnect Configuration
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Get the current domain dynamically
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://www.synappay.com'; // fallback
};

// WalletConnect Configuration
const ethereumProvider = EthereumProvider.init({
  projectId: projectId,
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
  showQrModal: false, // We'll use our own modal
  metadata: {
    name: 'SynapPay',
    description: 'Cross-chain swaps between Ethereum and Stellar',
    url: getCurrentDomain(),
    icons: [`${getCurrentDomain()}/icons/icon-512.png`],
  },
});

// Modal Configuration
const modal = new WalletConnectModal({
  projectId: projectId,
  walletConnectVersion: 2,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '9999',
    '--w3m-accent-color': '#6366f1',
    '--w3m-background-color': '#1f2937',
    '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
  },
  mobileWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask://',
        universal: 'https://metamask.app.link',
      },
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      links: {
        native: 'trust://',
        universal: 'https://link.trustwallet.com',
      },
    },
  ],
  desktopWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask://',
        universal: 'https://metamask.app.link',
      },
    },
  ],
});

// WalletConnect Manager Class
class WalletConnectManager {
  constructor() {
    this.provider = null;
    this.accounts = [];
    this.chainId = null;
    this.isConnected = false;
    this.listeners = [];
  }

  async initialize() {
    try {
      if (!ethereumProvider) {
        throw new Error('EthereumProvider not initialized');
      }

      // Wait for provider to be ready
      await ethereumProvider.connect();
      
      this.provider = ethereumProvider;
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check if already connected
      if (this.provider.connected) {
        this.accounts = this.provider.accounts;
        this.chainId = this.provider.chainId;
        this.isConnected = true;
        this.notifyListeners();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      return false;
    }
  }

  async connect() {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      if (!this.provider) {
        throw new Error('Provider not available');
      }

      // Open modal for connection
      modal.open();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 30000); // 30 second timeout

        const handleConnect = () => {
          clearTimeout(timeout);
          this.accounts = this.provider.accounts;
          this.chainId = this.provider.chainId;
          this.isConnected = true;
          this.notifyListeners();
          resolve(true);
        };

        // Listen for connection
        this.provider.on('connect', handleConnect);
        
        // Clean up listener after connection
        setTimeout(() => {
          this.provider.off('connect', handleConnect);
        }, 30000);
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.provider) {
        await this.provider.disconnect();
        this.accounts = [];
        this.chainId = null;
        this.isConnected = false;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      accounts: this.accounts,
      chainId: this.chainId,
      address: this.accounts[0] || null,
    };
  }

  setupEventListeners() {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts) => {
      this.accounts = accounts;
      this.notifyListeners();
    });

    this.provider.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      this.notifyListeners();
    });

    this.provider.on('disconnect', () => {
      this.accounts = [];
      this.chainId = null;
      this.isConnected = false;
      this.notifyListeners();
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getConnectionState());
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }

  async signMessage(message) {
    if (!this.provider || !this.accounts[0]) {
      throw new Error('Not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.accounts[0]],
      });
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  async sendTransaction(transaction) {
    if (!this.provider || !this.accounts[0]) {
      throw new Error('Not connected');
    }

    try {
      const hash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });
      return hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }
}

// Export instances
export const walletConnectManager = new WalletConnectManager();
export const openWalletModal = () => {
  modal.open();
};
export const closeWalletModal = () => {
  modal.close();
}; 