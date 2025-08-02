import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWalletKit } from '@stellar/wallet-kit';

/**
 * Unified Wallet Manager for Ethereum and Stellar
 * Handles wallet connections for both chains
 */
export class WalletManager {
  constructor() {
    this.ethereumWallet = null;
    this.stellarWallet = null;
    this.listeners = [];
  }

  /**
   * Initialize wallet connections
   */
  async initialize() {
    try {
      // Initialize Ethereum wallet (Wagmi)
      await this.initializeEthereumWallet();
      
      // Initialize Stellar wallet (WalletKit)
      await this.initializeStellarWallet();
      
      console.log('✅ Wallets initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallets:', error);
      return false;
    }
  }

  /**
   * Initialize Ethereum wallet using Wagmi
   */
  async initializeEthereumWallet() {
    try {
      // This would be handled by Wagmi hooks in React components
      console.log('🔗 Ethereum wallet ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Ethereum wallet:', error);
      return false;
    }
  }

  /**
   * Initialize Stellar wallet using WalletKit
   */
  async initializeStellarWallet() {
    try {
      // This would be handled by WalletKit in React components
      console.log('⭐ Stellar wallet ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Stellar wallet:', error);
      return false;
    }
  }

  /**
   * Get Ethereum account
   */
  getEthereumAccount() {
    return this.ethereumWallet?.account;
  }

  /**
   * Get Stellar account
   */
  getStellarAccount() {
    return this.stellarWallet?.account;
  }

  /**
   * Check if both wallets are connected
   */
  areWalletsConnected() {
    return this.ethereumWallet && this.stellarWallet;
  }

  /**
   * Sign Ethereum transaction
   */
  async signEthereumTransaction(transaction) {
    if (!this.ethereumWallet) {
      throw new Error('Ethereum wallet not connected');
    }
    
    try {
      const signature = await this.ethereumWallet.signTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Error signing Ethereum transaction:', error);
      throw error;
    }
  }

  /**
   * Sign Stellar transaction
   */
  async signStellarTransaction(transaction) {
    if (!this.stellarWallet) {
      throw new Error('Stellar wallet not connected');
    }
    
    try {
      const signature = await this.stellarWallet.signTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Error signing Stellar transaction:', error);
      throw error;
    }
  }

  /**
   * Disconnect all wallets
   */
  async disconnect() {
    try {
      if (this.ethereumWallet) {
        await this.ethereumWallet.disconnect();
      }
      
      if (this.stellarWallet) {
        await this.stellarWallet.disconnect();
      }
      
      this.ethereumWallet = null;
      this.stellarWallet = null;
      
      console.log('✅ Wallets disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting wallets:', error);
    }
  }

  /**
   * Add event listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in wallet listener:', error);
      }
    });
  }
}

/**
 * React hook for wallet management
 */
export function useWalletManager() {
  const { address: ethereumAddress, isConnected: isEthereumConnected } = useAccount();
  const { connect: connectEthereum, disconnect: disconnectEthereum } = useConnect();
  const { disconnect: disconnectWagmi } = useDisconnect();
  
  // Stellar wallet would be handled by WalletKit hooks
  // This is a simplified version

  const connectEthereumWallet = async () => {
    try {
      await connectEthereum();
      return true;
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error);
      return false;
    }
  };

  const connectStellarWallet = async () => {
    try {
      // This would use WalletKit's connect function
      console.log('Connecting Stellar wallet...');
      return true;
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
      return false;
    }
  };

  const disconnectWallets = async () => {
    try {
      disconnectWagmi();
      // Disconnect Stellar wallet
      console.log('Wallets disconnected');
    } catch (error) {
      console.error('Error disconnecting wallets:', error);
    }
  };

  return {
    ethereumAddress,
    isEthereumConnected,
    connectEthereumWallet,
    connectStellarWallet,
    disconnectWallets,
  };
} 