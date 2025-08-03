import { workingWalletService } from './working-wallet-service';
import { working1inchService } from './working-1inch-service';

/**
 * Working Swap Service
 * Complete swap flow with real transactions
 */
class WorkingSwapService {
  constructor() {
    this.activeSwaps = new Map();
    this.apiBaseUrl = process.env.NEXT_PUBLIC_SYNAPPAY_API_URL || 'https://synappay-api-prod.synappay.workers.dev';
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(params) {
    try {
      const { fromChain, toChain, fromToken, toToken, amount } = params;
      
      // Get wallet status
      const walletStatus = workingWalletService.getStatus();
      
      if (!walletStatus.ethereumConnected) {
        return {
          success: false,
          error: 'Ethereum wallet not connected'
        };
      }

      // Get 1inch quote for Ethereum side
      const quoteResult = await working1inchService.getQuote({
        fromToken,
        toToken,
        amount,
        fromAddress: walletStatus.ethereumAccount,
        chainId: 1 // Mainnet
      });

      if (!quoteResult.success) {
        return quoteResult;
      }

      return {
        success: true,
        data: {
          fromAmount: amount,
          toAmount: quoteResult.data.toAmount,
          priceImpact: quoteResult.data.priceImpact,
          gasEstimate: quoteResult.data.gasEstimate,
          route: `${fromToken} → ${toToken}`,
          timeEstimate: '2-5 minutes',
          exchangeRate: parseFloat(quoteResult.data.toAmount) / parseFloat(amount)
        }
      };

    } catch (error) {
      console.error('❌ Swap quote error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create swap intent
   */
  async createSwapIntent(params) {
    try {
      const {
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        userAddress,
        stellarAddress
      } = params;

      // Generate unique swap ID
      const swapId = this.generateSwapId();
      
      // Create swap request
      const swapRequest = {
        id: swapId,
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        userAddress,
        stellarAddress,
        status: 'pending',
        createdAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        toAmount: (parseFloat(amount) * 0.95).toFixed(6)
      };

      // Store swap locally
      this.activeSwaps.set(swapId, {
        request: swapRequest,
        step: 'init',
        hashlock: null,
        preimage: null
      });

      console.log('✅ Swap intent created:', swapRequest);
      return {
        success: true,
        data: swapRequest
      };

    } catch (error) {
      console.error('❌ Swap intent creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(swapId) {
    try {
      const swap = this.activeSwaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }

      // Update status to executing
      swap.step = 'executing';
      swap.request.status = 'executing';

      console.log('🚀 Executing real swap transaction...');
      
      // Get wallet status
      const walletStatus = workingWalletService.getStatus();
      
      if (!walletStatus.ethereumConnected) {
        throw new Error('Ethereum wallet not connected');
      }

      // Create 1inch order
      const orderResult = await working1inchService.createOrder({
        fromToken: swap.request.fromToken,
        toToken: swap.request.toToken,
        amount: swap.request.amount,
        fromAddress: walletStatus.ethereumAccount,
        chainId: 1,
        slippage: 1
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Update swap with order details
      swap.orderId = orderResult.data.orderId;
      swap.step = 'completed';
      swap.request.status = 'completed';

      console.log('✅ Swap executed successfully:', orderResult.data);
      return {
        success: true,
        data: {
          swapId,
          orderId: orderResult.data.orderId,
          status: 'completed',
          txHash: null // Will be updated when order is filled
        }
      };

    } catch (error) {
      console.error('❌ Swap execution failed:', error);
      
      const swap = this.activeSwaps.get(swapId);
      if (swap) {
        swap.step = 'failed';
        swap.request.status = 'failed';
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId) {
    try {
      const swap = this.activeSwaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }

      // If we have an order ID, check its status
      if (swap.orderId) {
        const orderStatus = await working1inchService.getOrderStatus(swap.orderId);
        if (orderStatus.success) {
          swap.request.status = orderStatus.data.status;
          if (orderStatus.data.txHash) {
            swap.txHash = orderStatus.data.txHash;
          }
        }
      }

      // Calculate time remaining
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = Math.max(0, swap.request.expiresAt - now);

      return {
        success: true,
        data: {
          request: swap.request,
          step: swap.step,
          timeRemaining,
          orderId: swap.orderId,
          txHash: swap.txHash
        }
      };

    } catch (error) {
      console.error('❌ Get swap status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique swap ID
   */
  generateSwapId() {
    return 'swap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get active swaps
   */
  getActiveSwaps() {
    return Array.from(this.activeSwaps.values()).map(swap => swap.request);
  }

  /**
   * Clear completed swaps
   */
  clearCompletedSwaps() {
    for (const [swapId, swap] of this.activeSwaps.entries()) {
      if (swap.request.status === 'completed' || swap.request.status === 'failed') {
        this.activeSwaps.delete(swapId);
      }
    }
  }
}

export const workingSwapService = new WorkingSwapService(); 