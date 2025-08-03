import { ethers } from 'ethers';

/**
 * Wallet Connection Service
 * Handles MetaMask and Freighter wallet connections with proper popup triggers
 */
class WalletConnectionService {
  constructor() {
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.ethereumAccount = null;
    this.stellarAccount = null;
    this.isConnected = false;
  }

  /**
   * Connect to Ethereum wallet (MetaMask) - Triggers popup
   */
  async connectEthereum() {
    try {
      console.log('🔗 Connecting to MetaMask...');
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        return {
          success: false,
          error: 'MetaMask not installed. Please install MetaMask first.'
        };
      }

      // Request account access - This triggers the MetaMask popup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found. Please unlock MetaMask.'
        };
      }

      this.ethereumAccount = accounts[0];
      this.ethereumProvider = new ethers.BrowserProvider(window.ethereum);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.ethereumAccount = null;
          this.ethereumProvider = null;
        } else {
          this.ethereumAccount = accounts[0];
        }
      });

      console.log('✅ MetaMask connected:', this.ethereumAccount);
      return {
        success: true,
        account: this.ethereumAccount
      };

    } catch (error) {
      console.error('❌ MetaMask connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect MetaMask wallet'
      };
    }
  }

  /**
   * Connect to Stellar wallet (Freighter) - Triggers popup
   */
  async connectStellar() {
    try {
      console.log('🔗 Connecting to Freighter...');
      
      // Check if Freighter is installed
      if (typeof window.freighterApi === 'undefined') {
        return {
          success: false,
          error: 'Freighter not installed. Please install Freighter wallet.'
        };
      }

      // Check if already connected
      const isConnected = await window.freighterApi.isConnected();
      
      if (!isConnected) {
        // This triggers the Freighter popup
        await window.freighterApi.connect();
      }

      const publicKey = await window.freighterApi.getPublicKey();
      const network = await window.freighterApi.getNetwork();

      this.stellarAccount = publicKey;
      this.stellarProvider = window.freighterApi;

      console.log('✅ Freighter connected:', publicKey, 'Network:', network);
      return {
        success: true,
        publicKey,
        network
      };

    } catch (error) {
      console.error('❌ Freighter connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect Freighter wallet'
      };
    }
  }

  /**
   * Send Ethereum transaction
   */
  async sendEthereumTransaction(transaction) {
    if (!this.ethereumProvider) {
      throw new Error('Ethereum wallet not connected');
    }

    try {
      const signer = await this.ethereumProvider.getSigner();
      const tx = await signer.sendTransaction(transaction);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Ethereum transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet status
   */
  getStatus() {
    return {
      ethereumConnected: !!this.ethereumAccount,
      stellarConnected: !!this.stellarAccount,
      bothConnected: !!this.ethereumAccount && !!this.stellarAccount,
      ethereumAccount: this.ethereumAccount,
      stellarAccount: this.stellarAccount,
      ethereumProvider: this.ethereumProvider,
      stellarProvider: this.stellarProvider
    };
  }

  /**
   * Disconnect wallets
   */
  disconnect() {
    this.ethereumAccount = null;
    this.stellarAccount = null;
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.isConnected = false;
    console.log('🔌 Wallets disconnected');
  }

  /**
   * Format Ethereum address
   */
  formatEthAddress(address) {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format Stellar address
   */
  formatStellarAddress(address) {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const walletConnectionService = new WalletConnectionService(); 