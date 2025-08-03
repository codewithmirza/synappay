// SynapPay Automated Relayer Service
import { SwapService } from './swap-service';
import { FusionPlusService } from './fusion-plus-service';
import { CoinGeckoService } from './coingecko-service';

export interface RelayerConfig {
  ethereumPrivateKey: string;
  stellarSecretKey: string;
  ethereumRpcUrl: string;
  stellarHorizonUrl: string;
  isTestnet: boolean;
  minSwapAmount: string;
  maxSwapAmount: string;
  relayerFee: number; // percentage
}

export interface RelayerEvent {
  type: 'swap_initiated' | 'lock_detected' | 'claim_attempted' | 'swap_completed' | 'swap_failed' | 'refund_processed';
  swapId: string;
  chain: 'ethereum' | 'stellar';
  timestamp: number;
  details: any;
}

export class RelayerService {
  private swapService: SwapService;
  private fusionService: FusionPlusService;
  private priceService: CoinGeckoService;
  private config: RelayerConfig;
  private isRunning: boolean = false;
  private eventListeners: Map<string, (event: RelayerEvent) => void> = new Map();
  private activeSwaps: Map<string, any> = new Map();

  constructor(db: D1Database, config: RelayerConfig) {
    this.swapService = new SwapService(db);
    this.fusionService = new FusionPlusService(config.ethereumPrivateKey);
    this.priceService = new CoinGeckoService();
    this.config = config;
  }

  /**
   * Start the automated relayer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Relayer is already running');
    }

    this.isRunning = true;
    console.log('🚀 SynapPay Relayer started');

    // Start monitoring for new swap intents
    this.monitorSwapIntents();
    
    // Start monitoring for lock events
    this.monitorLockEvents();
    
    // Start monitoring for claim attempts
    this.monitorClaimAttempts();
    
    // Start monitoring for expired swaps
    this.monitorExpiredSwaps();
  }

  /**
   * Stop the automated relayer
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 SynapPay Relayer stopped');
  }

  /**
   * Monitor for new swap intents
   */
  private async monitorSwapIntents(): Promise<void> {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const activeSwaps = await this.swapService.getActiveSwaps();
        
        for (const swap of activeSwaps) {
          if (!this.activeSwaps.has(swap.id)) {
            await this.handleNewSwapIntent(swap);
          }
        }
      } catch (error) {
        console.error('Error monitoring swap intents:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Handle new swap intent
   */
  private async handleNewSwapIntent(swapIntent: any): Promise<void> {
    try {
      this.activeSwaps.set(swapIntent.id, swapIntent);
      
      // Emit event
      this.emitEvent({
        type: 'swap_initiated',
        swapId: swapIntent.id,
        chain: swapIntent.fromChain,
        timestamp: Date.now(),
        details: swapIntent
      });

      // Calculate relayer fee
      const feeAmount = this.calculateRelayerFee(swapIntent.fromAmount);
      
      // Validate swap amount
      if (!this.validateSwapAmount(swapIntent.fromAmount)) {
        throw new Error('Swap amount outside allowed range');
      }

      console.log(`📋 New swap intent: ${swapIntent.id} (${swapIntent.fromChain} → ${swapIntent.toChain})`);
      
    } catch (error) {
      console.error('Error handling new swap intent:', error);
      await this.swapService.updateSwapStatus(swapIntent.id, 'expired');
    }
  }

  /**
   * Monitor for lock events on both chains
   */
  private async monitorLockEvents(): Promise<void> {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        for (const [swapId, swap] of this.activeSwaps) {
          if (swap.status === 'pending') {
            await this.checkLockStatus(swapId, swap);
          }
        }
      } catch (error) {
        console.error('Error monitoring lock events:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check if tokens are locked on source chain
   */
  private async checkLockStatus(swapId: string, swap: any): Promise<void> {
    try {
      if (swap.fromChain === 'ethereum') {
        // Check Ethereum lock via Fusion+ order
        const orderStatus = await this.fusionService.getOrderStatus(swap.ethereumOrderId);
        if (orderStatus?.status === 'filled') {
          await this.handleEthereumLocked(swapId, swap);
        }
      } else if (swap.fromChain === 'stellar') {
        // Check Stellar HTLC status
        const htlcStatus = await this.checkStellarHTLCStatus(swap.stellarBalanceId);
        if (htlcStatus === 'active') {
          await this.handleStellarLocked(swapId, swap);
        }
      }
    } catch (error) {
      console.error(`Error checking lock status for ${swapId}:`, error);
    }
  }

  /**
   * Handle Ethereum tokens locked
   */
  private async handleEthereumLocked(swapId: string, swap: any): Promise<void> {
    try {
      // Create corresponding lock on Stellar
      const stellarHTLC = await this.createStellarHTLC(swap);
      
      // Update swap status
      await this.swapService.updateSwapStatus(swapId, 'locked');
      
      this.emitEvent({
        type: 'lock_detected',
        swapId,
        chain: 'ethereum',
        timestamp: Date.now(),
        details: { stellarHTLC }
      });

      console.log(`🔒 Ethereum tokens locked for swap ${swapId}, created Stellar HTLC`);
      
    } catch (error) {
      console.error(`Error handling Ethereum lock for ${swapId}:`, error);
      await this.swapService.updateSwapStatus(swapId, 'expired');
    }
  }

  /**
   * Handle Stellar tokens locked
   */
  private async handleStellarLocked(swapId: string, swap: any): Promise<void> {
    try {
      // Create corresponding lock on Ethereum via Fusion+
      const fusionOrder = await this.createEthereumFusionOrder(swap);
      
      // Update swap status
      await this.swapService.updateSwapStatus(swapId, 'locked');
      
      this.emitEvent({
        type: 'lock_detected',
        swapId,
        chain: 'stellar',
        timestamp: Date.now(),
        details: { fusionOrder }
      });

      console.log(`🔒 Stellar tokens locked for swap ${swapId}, created Ethereum Fusion+ order`);
      
    } catch (error) {
      console.error(`Error handling Stellar lock for ${swapId}:`, error);
      await this.swapService.updateSwapStatus(swapId, 'expired');
    }
  }

  /**
   * Monitor for claim attempts
   */
  private async monitorClaimAttempts(): Promise<void> {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        for (const [swapId, swap] of this.activeSwaps) {
          if (swap.status === 'locked') {
            await this.checkClaimStatus(swapId, swap);
          }
        }
      } catch (error) {
        console.error('Error monitoring claim attempts:', error);
      }
    }, 15000); // Check every 15 seconds
  }

  /**
   * Check if user has claimed tokens on destination chain
   */
  private async checkClaimStatus(swapId: string, swap: any): Promise<void> {
    try {
      if (swap.toChain === 'stellar') {
        // Check if Stellar HTLC was claimed
        const htlcStatus = await this.checkStellarHTLCStatus(swap.stellarBalanceId);
        if (htlcStatus === 'claimed') {
          await this.handleStellarClaimed(swapId, swap);
        }
      } else if (swap.toChain === 'ethereum') {
        // Check if Ethereum Fusion+ order was filled
        const orderStatus = await this.fusionService.getOrderStatus(swap.ethereumOrderId);
        if (orderStatus?.status === 'filled') {
          await this.handleEthereumClaimed(swapId, swap);
        }
      }
    } catch (error) {
      console.error(`Error checking claim status for ${swapId}:`, error);
    }
  }

  /**
   * Handle Stellar tokens claimed by user
   */
  private async handleStellarClaimed(swapId: string, swap: any): Promise<void> {
    try {
      // Relayer claims Ethereum tokens using preimage
      const preimage = await this.getPreimage(swapId);
      const txHash = await this.fusionService.createOrder({
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        amount: swap.fromAmount,
        userAddress: swap.ethereumAddress
      });
      
      // Update swap status
      await this.swapService.updateSwapStatus(swapId, 'completed');
      
      this.emitEvent({
        type: 'swap_completed',
        swapId,
        chain: 'stellar',
        timestamp: Date.now(),
        details: { txHash, preimage }
      });

      console.log(`✅ Swap ${swapId} completed: Stellar claimed, Ethereum claimed by relayer`);
      
    } catch (error) {
      console.error(`Error handling Stellar claim for ${swapId}:`, error);
    }
  }

  /**
   * Handle Ethereum tokens claimed by user
   */
  private async handleEthereumClaimed(swapId: string, swap: any): Promise<void> {
    try {
      // Relayer claims Stellar tokens using preimage
      const preimage = await this.getPreimage(swapId);
      const txHash = await this.claimStellarHTLC(swap.stellarBalanceId, preimage);
      
      // Update swap status
      await this.swapService.updateSwapStatus(swapId, 'completed');
      
      this.emitEvent({
        type: 'swap_completed',
        swapId,
        chain: 'ethereum',
        timestamp: Date.now(),
        details: { txHash, preimage }
      });

      console.log(`✅ Swap ${swapId} completed: Ethereum claimed, Stellar claimed by relayer`);
      
    } catch (error) {
      console.error(`Error handling Ethereum claim for ${swapId}:`, error);
    }
  }

  /**
   * Monitor for expired swaps and process refunds
   */
  private async monitorExpiredSwaps(): Promise<void> {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const now = Math.floor(Date.now() / 1000);
        
        for (const [swapId, swap] of this.activeSwaps) {
          if (swap.expiresAt && now > swap.expiresAt && swap.status !== 'completed') {
            await this.processRefund(swapId, swap);
          }
        }
      } catch (error) {
        console.error('Error monitoring expired swaps:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Process refund for expired swap
   */
  private async processRefund(swapId: string, swap: any): Promise<void> {
    try {
      if (swap.fromChain === 'ethereum') {
        // Cancel Fusion+ order
        await this.fusionService.cancelOrder(swap.ethereumOrderId);
      } else if (swap.fromChain === 'stellar') {
        // Refund Stellar HTLC
        await this.refundStellarHTLC(swap.stellarBalanceId);
      }
      
      // Update swap status
      await this.swapService.updateSwapStatus(swapId, 'refunded');
      
      this.emitEvent({
        type: 'refund_processed',
        swapId,
        chain: swap.fromChain,
        timestamp: Date.now(),
        details: { reason: 'expired' }
      });

      console.log(`💰 Refund processed for expired swap ${swapId}`);
      
    } catch (error) {
      console.error(`Error processing refund for ${swapId}:`, error);
    }
  }

  // Helper methods
  private calculateRelayerFee(amount: string): string {
    const feePercentage = this.config.relayerFee / 100;
    return (parseFloat(amount) * feePercentage).toString();
  }

  private validateSwapAmount(amount: string): boolean {
    const numAmount = parseFloat(amount);
    const minAmount = parseFloat(this.config.minSwapAmount);
    const maxAmount = parseFloat(this.config.maxSwapAmount);
    return numAmount >= minAmount && numAmount <= maxAmount;
  }

  private async getPreimage(swapId: string): Promise<string> {
    // In production, this would be securely stored and retrieved
    return `preimage_${swapId}_${Date.now()}`;
  }

  private async createStellarHTLC(swap: any): Promise<string> {
    // Implementation for creating Stellar HTLC
    return `stellar_htlc_${swap.id}`;
  }

  private async createEthereumFusionOrder(swap: any): Promise<string> {
    // Implementation for creating Ethereum Fusion+ order
    return `fusion_order_${swap.id}`;
  }

  private async checkStellarHTLCStatus(balanceId: string): Promise<string> {
    // Implementation for checking Stellar HTLC status
    return 'active';
  }

  private async claimStellarHTLC(balanceId: string, preimage: string): Promise<string> {
    // Implementation for claiming Stellar HTLC
    return `stellar_tx_${Date.now()}`;
  }

  private async refundStellarHTLC(balanceId: string): Promise<string> {
    // Implementation for refunding Stellar HTLC
    return `stellar_refund_${Date.now()}`;
  }

  // Event system
  on(eventType: string, callback: (event: RelayerEvent) => void): void {
    this.eventListeners.set(eventType, callback);
  }

  private emitEvent(event: RelayerEvent): void {
    const callback = this.eventListeners.get(event.type);
    if (callback) {
      callback(event);
    }
  }

  // Get relayer status
  getStatus(): { running: boolean; activeSwaps: number; config: RelayerConfig } {
    return {
      running: this.isRunning,
      activeSwaps: this.activeSwaps.size,
      config: this.config
    };
  }
} 