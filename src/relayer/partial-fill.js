import { ethers } from 'ethers';
import StellarSdk from 'stellar-sdk';
import config from '../../web/lib/config.js';

export class PartialFillRelayer {
  constructor() {
    this.ethereumProvider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    this.stellarServer = new StellarSdk.Server(config.stellar.horizonUrl);
    this.activeOrders = new Map();
    this.partialFills = new Map();
  }

  /**
   * Create a cross-chain swap with partial fill support
   */
  async createCrossChainSwap(swapData) {
    const {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      ethAddress,
      stellarPublicKey,
      swapType,
      partialFillEnabled = true,
      maxPartialFill = 0.8,
      minPartialFill = 0.1
    } = swapData;

    console.log('🔄 Creating cross-chain swap with partial fills...');

    // Generate HTLC parameters
    const secret = crypto.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Create swap order
    const swapOrder = {
      id: ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'uint256', 'uint256'],
        [swapType, Date.now(), Math.random()]
      )),
      swapType,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      ethAddress,
      stellarPublicKey,
      hashlock,
      secret: secret.toString('hex'),
      timelock,
      partialFillEnabled,
      maxPartialFill,
      minPartialFill,
      status: 'ANNOUNCEMENT',
      createdAt: Date.now(),
      fills: [],
      totalFilled: 0
    };

    // Store order
    this.activeOrders.set(swapOrder.id, swapOrder);

    // Start monitoring for partial fills
    if (partialFillEnabled) {
      this.startPartialFillMonitoring(swapOrder.id);
    }

    return swapOrder;
  }

  /**
   * Monitor and execute partial fills
   */
  async startPartialFillMonitoring(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    console.log(`📊 Monitoring partial fills for order ${orderId}`);

    // Monitor 1inch Fusion+ for partial fill opportunities
    const monitoringInterval = setInterval(async () => {
      try {
        const fillOpportunity = await this.checkPartialFillOpportunity(order);
        
        if (fillOpportunity && fillOpportunity.amount > 0) {
          await this.executePartialFill(orderId, fillOpportunity);
        }

        // Check if order is complete or expired
        if (this.isOrderComplete(order) || this.isOrderExpired(order)) {
          clearInterval(monitoringInterval);
          await this.finalizeOrder(orderId);
        }
      } catch (error) {
        console.error('❌ Partial fill monitoring error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Store monitoring interval
    this.partialFills.set(orderId, monitoringInterval);
  }

  /**
   * Check for partial fill opportunities
   */
  async checkPartialFillOpportunity(order) {
    try {
      // Get current market conditions from 1inch
      const quote = await this.get1inchQuote(order.fromToken, order.toToken, order.fromAmount);
      
      // Calculate optimal fill amount based on market conditions
      const optimalFillAmount = this.calculateOptimalFillAmount(order, quote);
      
      if (optimalFillAmount > 0 && optimalFillAmount >= order.fromAmount * order.minPartialFill) {
        return {
          amount: optimalFillAmount,
          rate: quote.exchangeRate,
          source: '1inch_fusion',
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking partial fill opportunity:', error);
      return null;
    }
  }

  /**
   * Execute a partial fill
   */
  async executePartialFill(orderId, fillOpportunity) {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    console.log(`💰 Executing partial fill for order ${orderId}: ${fillOpportunity.amount} ${order.fromToken}`);

    try {
      // Create HTLC on source chain
      const htlcResult = await this.createHTLC(
        order.swapType,
        fillOpportunity.amount,
        order.hashlock,
        order.timelock,
        order.ethAddress,
        order.stellarPublicKey
      );

      // Record the fill
      const fill = {
        id: ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'uint256'],
          [orderId, Date.now()]
        )),
        amount: fillOpportunity.amount,
        rate: fillOpportunity.rate,
        htlcContractId: htlcResult.contractId,
        txHash: htlcResult.txHash,
        timestamp: Date.now(),
        status: 'PENDING'
      };

      order.fills.push(fill);
      order.totalFilled += fillOpportunity.amount;

      // Update order status
      if (order.totalFilled >= order.fromAmount * order.maxPartialFill) {
        order.status = 'DEPOSIT_COMPLETE';
      } else {
        order.status = 'PARTIAL_DEPOSIT';
      }

      this.activeOrders.set(orderId, order);

      console.log(`✅ Partial fill executed: ${fillOpportunity.amount} ${order.fromToken}`);
      return fill;

    } catch (error) {
      console.error('❌ Partial fill execution failed:', error);
      throw error;
    }
  }

  /**
   * Create HTLC on appropriate chain
   */
  async createHTLC(swapType, amount, hashlock, timelock, ethAddress, stellarPublicKey) {
    if (swapType === 'ETH_TO_STELLAR') {
      return await this.createEthereumHTLC(amount, hashlock, timelock, stellarPublicKey);
    } else if (swapType === 'STELLAR_TO_ETH') {
      return await this.createStellarHTLC(amount, hashlock, timelock, ethAddress);
    } else {
      throw new Error('Invalid swap type');
    }
  }

  /**
   * Create Ethereum HTLC
   */
  async createEthereumHTLC(amount, hashlock, timelock, receiver) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethereumProvider);
    
    const htlcABI = [
      'function newContract(address receiver, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 contractId)'
    ];

    const htlcContract = new ethers.Contract(config.ethereum.htlcContractAddress, htlcABI, wallet);

    const tx = await htlcContract.newContract(
      receiver,
      hashlock,
      timelock,
      { value: ethers.parseEther(amount.toString()) }
    );

    const receipt = await tx.wait();
    const contractId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint256', 'bytes32', 'uint256'],
        [wallet.address, receiver, ethers.parseEther(amount.toString()), hashlock, timelock]
      )
    );

    return {
      contractId,
      txHash: receipt.hash,
      chain: 'ethereum'
    };
  }

  /**
   * Create Stellar HTLC
   */
  async createStellarHTLC(amount, hashlock, timelock, receiver) {
    // This would require Stellar Soroban smart contract deployment
    // For now, we'll simulate the HTLC creation
    console.log('🌟 Creating Stellar HTLC (simulated)');
    
    return {
      contractId: ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'uint256'],
        ['stellar_htlc', Date.now()]
      )),
      txHash: 'stellar_simulation_hash',
      chain: 'stellar'
    };
  }

  /**
   * Calculate optimal fill amount based on market conditions
   */
  calculateOptimalFillAmount(order, quote) {
    const remainingAmount = order.fromAmount - order.totalFilled;
    const maxFillAmount = order.fromAmount * order.maxPartialFill;
    
    // Consider market conditions, slippage, and gas costs
    const marketOptimalAmount = Math.min(
      remainingAmount,
      maxFillAmount,
      quote.optimalAmount || remainingAmount
    );

    return Math.max(marketOptimalAmount, order.fromAmount * order.minPartialFill);
  }

  /**
   * Check if order is complete
   */
  isOrderComplete(order) {
    return order.totalFilled >= order.fromAmount * order.maxPartialFill;
  }

  /**
   * Check if order is expired
   */
  isOrderExpired(order) {
    return Date.now() / 1000 > order.timelock;
  }

  /**
   * Finalize order and execute cross-chain transfer
   */
  async finalizeOrder(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    console.log(`🏁 Finalizing order ${orderId}`);

    try {
      // Execute cross-chain transfer for all fills
      for (const fill of order.fills) {
        await this.executeCrossChainTransfer(order, fill);
      }

      order.status = 'COMPLETED';
      this.activeOrders.set(orderId, order);

      console.log(`✅ Order ${orderId} finalized successfully`);
    } catch (error) {
      console.error('❌ Order finalization failed:', error);
      order.status = 'FAILED';
      this.activeOrders.set(orderId, order);
    }
  }

  /**
   * Execute cross-chain transfer for a fill
   */
  async executeCrossChainTransfer(order, fill) {
    console.log(`🌉 Executing cross-chain transfer for fill ${fill.id}`);

    if (order.swapType === 'ETH_TO_STELLAR') {
      // Claim on Stellar using the preimage
      await this.claimStellarHTLC(fill.htlcContractId, order.secret);
    } else if (order.swapType === 'STELLAR_TO_ETH') {
      // Claim on Ethereum using the preimage
      await this.claimEthereumHTLC(fill.htlcContractId, order.secret);
    }

    fill.status = 'COMPLETED';
  }

  /**
   * Get 1inch quote for partial fill calculation
   */
  async get1inchQuote(fromToken, toToken, amount) {
    // This would call the 1inch API for real-time quotes
    // For now, return a simulated quote
    return {
      exchangeRate: 1.5, // 1 ETH = 1.5 XLM
      optimalAmount: amount * 0.3, // 30% of amount
      priceImpact: 0.5,
      estimatedGas: 0.001
    };
  }

  /**
   * Get order status
   */
  getOrderStatus(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      totalFilled: order.totalFilled,
      totalAmount: order.fromAmount,
      fillPercentage: (order.totalFilled / order.fromAmount) * 100,
      fills: order.fills,
      createdAt: order.createdAt,
      expiresAt: order.timelock * 1000
    };
  }

  /**
   * Get all active orders
   */
  getActiveOrders() {
    return Array.from(this.activeOrders.values());
  }
}

export const partialFillRelayer = new PartialFillRelayer(); 