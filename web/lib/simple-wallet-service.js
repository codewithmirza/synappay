import { ethers } from 'ethers';

/**
 * Simple Wallet Service - Basic Web3 wallet connection
 * Avoids conflicts with multiple wallet extensions
 */
class SimpleWalletService {
  constructor() {
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
  }

  /**
   * Detect and connect to Ethereum wallet
   */
  async connectEthereum() {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          this.account = accounts[0];
          this.ethereumProvider = new ethers.BrowserProvider(window.ethereum);
          
          // Get network info
          const network = await this.ethereumProvider.getNetwork();
          this.chainId = network.chainId;
          
          this.isConnected = true;
          
          console.log('Connected to Ethereum wallet:', this.account);
          console.log('Chain ID:', this.chainId);
          
          return {
            success: true,
            account: this.account,
            chainId: this.chainId
          };
        }
      } else {
        // MetaMask not installed
        window.open('https://metamask.io/download/', '_blank');
        return {
          success: false,
          error: 'MetaMask not installed. Please install MetaMask first.'
        };
      }
    } catch (error) {
      console.error('Error connecting to Ethereum wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connect to Stellar wallet using Freighter or other Stellar wallets
   */
  async connectStellar() {
    try {
      // Check for Freighter wallet
      if (window.freighterApi) {
        const isConnected = await window.freighterApi.isConnected();
        
        if (!isConnected) {
          await window.freighterApi.connect();
        }
        
        const publicKey = await window.freighterApi.getPublicKey();
        const network = await window.freighterApi.getNetwork();
        
        this.stellarProvider = window.freighterApi;
        
        console.log('Connected to Stellar wallet:', publicKey);
        console.log('Network:', network);
        
        return {
          success: true,
          publicKey,
          network
        };
      } else {
        // Try other Stellar wallets
        if (window.stellarWallet) {
          const publicKey = await window.stellarWallet.getPublicKey();
          this.stellarProvider = window.stellarWallet;
          
          return {
            success: true,
            publicKey
          };
        } else {
          return {
            success: false,
            error: 'No Stellar wallet detected. Please install Freighter or another Stellar wallet.'
          };
        }
      }
    } catch (error) {
      console.error('Error connecting to Stellar wallet:', error);
      return {
        success: false,
        error: error.message
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
      
      console.log('Transaction sent:', tx.hash);
      return {
        success: true,
        hash: tx.hash
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Stellar transaction
   */
  async sendStellarTransaction(transaction) {
    if (!this.stellarProvider) {
      throw new Error('Stellar wallet not connected');
    }

    try {
      const result = await this.stellarProvider.signTransaction(transaction);
      
      console.log('Stellar transaction signed:', result);
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('Stellar transaction failed:', error);
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
      ethereumConnected: !!this.ethereumProvider,
      stellarConnected: !!this.stellarProvider,
      account: this.account,
      chainId: this.chainId
    };
  }

  /**
   * Disconnect wallets
   */
  disconnect() {
    this.ethereumProvider = null;
    this.stellarProvider = null;
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    
    console.log('Wallets disconnected');
  }
}

export const simpleWalletService = new SimpleWalletService(); 