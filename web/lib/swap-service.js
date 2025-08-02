import { FusionPlusClient } from './fusion-plus-client.js';
import { StellarHTLCManager } from './stellar-htlc-manager.js';
import { ethers } from 'ethers';

/**
 * Cross-Chain Swap Service
 * Handles atomic swaps between Ethereum and Stellar using 1inch Fusion+ and HTLCs
 */
export class SwapService {
  constructor() {
    this.fusionClient = new FusionPlusClient();
    this.stellarHTLC = new StellarHTLCManager();
    this.swaps = new Map(); // Track active swaps
  }

  /**
   * Initialize the swap service
   */
  async initialize() {
    try {
      await this.fusionClient.initialize();
      await this.stellarHTLC.initialize();
      console.log('✅ Swap service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize swap service:', error);
      return false;
    }
  }

  /**
   * Create a cross-chain swap intent
   */
  async createSwapIntent(params) {
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      fromAddress,
      toAddress,
    } = params;

    try {
      // Generate secret for HTLC
      const secret = StellarHTLCManager.generateSecret();
      const hashlock = await StellarHTLCManager.createHashlock(secret);
      
      // Calculate timelock (1 hour from now)
      const timelock = Math.floor(Date.now() / 1000) + 3600;

      // Create swap record
      const swapId = this.generateSwapId();
      const swapRecord = {
        id: swapId,
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        fromAddress,
        toAddress,
        hashlock,
        secret,
        timelock,
        status: 'PENDING',
        createdAt: Date.now(),
      };

      // Store swap record
      this.swaps.set(swapId, swapRecord);

      return {
        swapId,
        hashlock,
        timelock,
        secret,
        swapRecord,
      };
    } catch (error) {
      console.error('Error creating swap intent:', error);
      throw error;
    }
  }

  /**
   * Execute Ethereum to Stellar swap
   */
  async executeEthToStellarSwap(params) {
    const {
      swapId,
      fromToken,
      toToken,
      amount,
      fromAddress,
      toAddress,
      hashlock,
      timelock,
    } = params;

    try {
      // Step 1: Get quote from 1inch Fusion+
      const quote = await this.fusionClient.getQuote(fromToken, toToken, amount);
      
      // Step 2: Create Fusion+ order
      const orderParams = this.fusionClient.calculateSwapParams(quote, fromAddress, toAddress);
      const order = await this.fusionClient.createOrder(orderParams);

      // Step 3: Create Stellar HTLC
      const stellarParams = {
        senderSecretKey: process.env.STELLAR_PRIVATE_KEY, // In production, this would be user's key
        receiverPublicKey: toAddress,
        amount: quote.toTokenAmount,
        assetCode: toToken,
        hashlock,
        timelock,
      };
      
      const stellarHTLC = await this.stellarHTLC.createHTLC(stellarParams);

      // Step 4: Update swap record
      const swapRecord = this.swaps.get(swapId);
      if (swapRecord) {
        swapRecord.status = 'EXECUTING';
        swapRecord.ethereumOrder = order;
        swapRecord.stellarHTLC = stellarHTLC;
        this.swaps.set(swapId, swapRecord);
      }

      return {
        success: true,
        swapId,
        ethereumOrder: order,
        stellarHTLC,
      };
    } catch (error) {
      console.error('Error executing ETH to Stellar swap:', error);
      throw error;
    }
  }

  /**
   * Execute Stellar to Ethereum swap
   */
  async executeStellarToEthSwap(params) {
    const {
      swapId,
      fromToken,
      toToken,
      amount,
      fromAddress,
      toAddress,
      hashlock,
      timelock,
    } = params;

    try {
      // Step 1: Create Stellar HTLC first
      const stellarParams = {
        senderSecretKey: process.env.STELLAR_PRIVATE_KEY, // In production, this would be user's key
        receiverPublicKey: toAddress,
        amount,
        assetCode: fromToken,
        hashlock,
        timelock,
      };
      
      const stellarHTLC = await this.stellarHTLC.createHTLC(stellarParams);

      // Step 2: Get quote from 1inch Fusion+
      const quote = await this.fusionClient.getQuote(fromToken, toToken, amount);
      
      // Step 3: Create Fusion+ order
      const orderParams = this.fusionClient.calculateSwapParams(quote, fromAddress, toAddress);
      const order = await this.fusionClient.createOrder(orderParams);

      // Step 4: Update swap record
      const swapRecord = this.swaps.get(swapId);
      if (swapRecord) {
        swapRecord.status = 'EXECUTING';
        swapRecord.ethereumOrder = order;
        swapRecord.stellarHTLC = stellarHTLC;
        this.swaps.set(swapId, swapRecord);
      }

      return {
        success: true,
        swapId,
        ethereumOrder: order,
        stellarHTLC,
      };
    } catch (error) {
      console.error('Error executing Stellar to ETH swap:', error);
      throw error;
    }
  }

  /**
   * Complete swap by revealing secret
   */
  async completeSwap(swapId, secret) {
    try {
      const swapRecord = this.swaps.get(swapId);
      if (!swapRecord) {
        throw new Error('Swap not found');
      }

      // Verify secret matches hashlock
      const isValid = await StellarHTLCManager.verifyPreimage(secret, swapRecord.hashlock);
      if (!isValid) {
        throw new Error('Invalid secret');
      }

      // Complete on both chains
      if (swapRecord.stellarHTLC) {
        await this.stellarHTLC.claimHTLC({
          receiverSecretKey: process.env.STELLAR_PRIVATE_KEY, // In production, user's key
          balanceId: swapRecord.stellarHTLC.balanceId,
          preimage: secret,
        });
      }

      // Update swap status
      swapRecord.status = 'COMPLETED';
      swapRecord.completedAt = Date.now();
      this.swaps.set(swapId, swapRecord);

      return {
        success: true,
        swapId,
        status: 'COMPLETED',
      };
    } catch (error) {
      console.error('Error completing swap:', error);
      throw error;
    }
  }

  /**
   * Refund swap after timelock expires
   */
  async refundSwap(swapId) {
    try {
      const swapRecord = this.swaps.get(swapId);
      if (!swapRecord) {
        throw new Error('Swap not found');
      }

      // Check if timelock has expired
      const now = Math.floor(Date.now() / 1000);
      if (now < swapRecord.timelock) {
        throw new Error('Timelock not yet expired');
      }

      // Refund on Stellar if HTLC exists
      if (swapRecord.stellarHTLC) {
        await this.stellarHTLC.refundHTLC({
          senderSecretKey: process.env.STELLAR_PRIVATE_KEY, // In production, user's key
          balanceId: swapRecord.stellarHTLC.balanceId,
        });
      }

      // Update swap status
      swapRecord.status = 'REFUNDED';
      swapRecord.refundedAt = Date.now();
      this.swaps.set(swapId, swapRecord);

      return {
        success: true,
        swapId,
        status: 'REFUNDED',
      };
    } catch (error) {
      console.error('Error refunding swap:', error);
      throw error;
    }
  }

  /**
   * Get swap status
   */
  getSwapStatus(swapId) {
    const swapRecord = this.swaps.get(swapId);
    if (!swapRecord) {
      return null;
    }

    return {
      id: swapRecord.id,
      status: swapRecord.status,
      fromChain: swapRecord.fromChain,
      toChain: swapRecord.toChain,
      fromToken: swapRecord.fromToken,
      toToken: swapRecord.toToken,
      amount: swapRecord.amount,
      hashlock: swapRecord.hashlock,
      timelock: swapRecord.timelock,
      createdAt: swapRecord.createdAt,
      completedAt: swapRecord.completedAt,
      refundedAt: swapRecord.refundedAt,
    };
  }

  /**
   * Get all active swaps
   */
  getActiveSwaps() {
    return Array.from(this.swaps.values()).filter(swap => 
      swap.status === 'PENDING' || swap.status === 'EXECUTING'
    );
  }

  /**
   * Generate unique swap ID
   */
  generateSwapId() {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Monitor swap status
   */
  startMonitoring(swapId, callback) {
    const interval = setInterval(() => {
      const status = this.getSwapStatus(swapId);
      if (status) {
        callback(status);
        
        // Stop monitoring if swap is completed or refunded
        if (status.status === 'COMPLETED' || status.status === 'REFUNDED') {
          clearInterval(interval);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }
} 