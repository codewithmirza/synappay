import { ethers } from 'ethers';

/**
 * Working Wallet Service - Based on synappay's working implementation
 * Simple, direct wallet connections that actually work
 */
class WorkingWalletService {
  constructor() {
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.ethereumAccount = null;
    this.stellarAccount = null;
    this.isConnected = false;
  }

  /**
   * Connect to Ethereum wallet (MetaMask)
   */
  async connectEthereum() {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        return {
          success: false,
          error: 'MetaMask not installed. Please install MetaMask first.'
        };
      }

      // Request account access
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

      console.log('✅ Ethereum connected:', this.ethereumAccount);
      return {
        success: true,
        account: this.ethereumAccount
      };

    } catch (error) {
      console.error('❌ Ethereum connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect Ethereum wallet'
      };
    }
  }

  /**
   * Connect to Stellar wallet (Freighter)
   */
  async connectStellar() {
    try {
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
        await window.freighterApi.connect();
      }

      const publicKey = await window.freighterApi.getPublicKey();
      const network = await window.freighterApi.getNetwork();

      this.stellarAccount = publicKey;
      this.stellarProvider = window.freighterApi;

      console.log('✅ Stellar connected:', publicKey, 'Network:', network);
      return {
        success: true,
        publicKey,
        network
      };

    } catch (error) {
      console.error('❌ Stellar connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect Stellar wallet'
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
      
      console.log('✅ Transaction sent:', tx.hash);
      return {
        success: true,
        hash: tx.hash
      };
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get wallet status
   */
  getStatus() {
    return {
      ethereumConnected: !!this.ethereumAccount,
      stellarConnected: !!this.stellarAccount,
      ethereumAccount: this.ethereumAccount,
      stellarAccount: this.stellarAccount,
      bothConnected: !!this.ethereumAccount && !!this.stellarAccount
    };
  }

  /**
   * Disconnect wallets
   */
  disconnect() {
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.ethereumAccount = null;
    this.stellarAccount = null;
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

export const workingWalletService = new WorkingWalletService(); 