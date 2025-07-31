import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WalletConnectModal } from '@walletconnect/modal';

// WalletConnect Configuration
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Ethereum Provider Configuration
export const ethereumProvider = EthereumProvider.init({
  projectId,
  chains: [11155111], // Sepolia testnet
  showQrModal: true,
  metadata: {
    name: 'SynapPay',
    description: 'Cross-Chain ETH ↔ XLM Swaps',
    url: 'https://synappay.com',
    icons: ['https://synappay.com/icon.png']
  }
});

// Modal Configuration
export const modal = new WalletConnectModal({
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent-color': '#000000',
    '--w3m-background-color': '#ffffff',
    '--w3m-overlay-background-color': 'rgba(0,0,0,0.4)',
    '--w3m-container-border-radius': '20px',
    '--w3m-font-family': 'Inter, sans-serif',
  },
  walletConnectVersion: 2,
  defaultChain: 11155111, // Sepolia
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274ecc67e96b', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd1daaca4f5', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd7aa47', // Coinbase Wallet
    '225affb176778569276e484e1c926e508ba0f5b6', // Rainbow
    '19177a98252e07ddfc9af2083ba8e07ef627cb610', // Argent
  ]
});

// Wallet Connection State Management
class WalletConnectManager {
  constructor() {
    this.provider = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.listeners = new Set();
  }

  // Initialize WalletConnect
  async initialize() {
    try {
      this.provider = ethereumProvider;
      
      // Set up event listeners
      this.provider.on('accountsChanged', this.handleAccountsChanged.bind(this));
      this.provider.on('chainChanged', this.handleChainChanged.bind(this));
      this.provider.on('disconnect', this.handleDisconnect.bind(this));
      
      // Check if already connected
      if (this.provider.connected) {
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.address = accounts[0];
          this.chainId = await this.provider.request({ method: 'eth_chainId' });
          this.isConnected = true;
          this.notifyListeners();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      return false;
    }
  }

  // Connect wallet
  async connect() {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.address = accounts[0];
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      this.isConnected = true;
      
      this.notifyListeners();
      return { success: true, address: this.address };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (this.provider) {
        await this.provider.disconnect();
      }
      this.address = null;
      this.chainId = null;
      this.isConnected = false;
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current connection state
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      address: this.address,
      chainId: this.chainId,
      provider: this.provider
    };
  }

  // Event handlers
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.address = null;
      this.isConnected = false;
    } else {
      this.address = accounts[0];
      this.isConnected = true;
    }
    this.notifyListeners();
  }

  handleChainChanged(chainId) {
    this.chainId = chainId;
    this.notifyListeners();
  }

  handleDisconnect() {
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.notifyListeners();
  }

  // Listener management
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const state = this.getConnectionState();
    this.listeners.forEach(callback => callback(state));
  }

  // Sign message (for Stellar integration)
  async signMessage(message) {
    if (!this.provider || !this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.address]
      });
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  // Send transaction
  async sendTransaction(transaction) {
    if (!this.provider || !this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });
      return hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const walletConnectManager = new WalletConnectManager();

// Helper function to open modal
export const openWalletModal = () => {
  modal.open();
};

// Helper function to close modal
export const closeWalletModal = () => {
  modal.close();
}; 