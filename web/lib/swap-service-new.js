// Updated Swap Service - Integrated with new backend architecture
import apiClient from './api-client';
import { useCoordinator } from '../hooks/use-coordinator';

/**
 * Cross-Chain Swap Service - New Backend Integration
 * Handles atomic swaps using our Cloudflare API and Railway coordinator
 */
export class SwapService {
  constructor() {
    this.apiClient = apiClient;
    this.swaps = new Map(); // Track active swaps locally
    this.eventEmitter = new EventTarget();
  }

  /**
   * Initialize the swap service
   */
  async initialize() {
    try {
      console.log('🔄 Initializing SwapService with new backend...');
      
      // Test API connection
      const health = await this.apiClient.healthCheck();
      console.log('✅ API Health:', health);
      
      if (health.status !== 'healthy') {
        throw new Error('API is not healthy');
      }
      
      // Load active swaps from backend
      const activeSwaps = await this.apiClient.getActiveSwaps();
      console.log('📊 Active swaps loaded:', activeSwaps.length);
      
      // Store active swaps locally
      activeSwaps.forEach(swap => {
        this.swaps.set(swap.id, swap);
      });
      
      console.log('✅ SwapService initialized with new backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize SwapService:', error);
      return false;
    }
  }

  /**
   * Create a cross-chain swap intent using new backend
   */
  async createSwapIntent(params) {
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      sender,
      receiver
    } = params;

    try {
      console.log('🔄 Creating swap intent via backend API...');
      
      // Generate hashlock and timelock
      const secret = this.generateSecret();
      const hashlock = await this.createHashlock(secret);
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Create swap intent via API
      const swapIntent = await this.apiClient.createSwapIntent({
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        sender,
        receiver,
        hashlock,
        timelock
      });
      
      // Store locally
      this.swaps.set(swapIntent.id, {
        ...swapIntent,
        secret, // Keep secret locally for claiming
        status: 'created'
      });
      
      console.log('✅ Swap intent created:', swapIntent.id);
      
      // Emit event
      this.eventEmitter.dispatchEvent(new CustomEvent('swapCreated', {
        detail: swapIntent
      }));
      
      return swapIntent;
    } catch (error) {
      console.error('❌ Failed to create swap intent:', error);
      throw error;
    }
  }

  /**
   * Get quote using 1inch Fusion+ via our API
   */
  async getQuote(params) {
    const {
      fromTokenAddress,
      toTokenAddress,
      amount,
      fromChainId = 11155111, // Sepolia
      toChainId = 11155111
    } = params;

    try {
      console.log('🔄 Getting Fusion+ quote via API...');
      
      const quote = await this.apiClient.getFusionPlusQuote({
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromChainId,
        toChainId
      });
      
      console.log('✅ Quote received:', quote);
      return quote;
    } catch (error) {
      console.error('❌ Failed to get quote:', error);
      throw error;
    }
  }

  /**
   * Execute Ethereum to Stellar swap
   */
  async executeEthToStellarSwap(params) {
    const { swapId, ethAmount, stellarAddress } = params;
    
    try {
      console.log('🔄 Executing ETH → Stellar swap...');
      
      const swap = this.swaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }
      
      // Update swap status
      swap.status = 'executing_eth_lock';
      this.swaps.set(swapId, swap);
      
      // Create Fusion+ order via API
      const order = await this.apiClient.createFusionPlusOrder({
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.fromAmount,
        toAmount: swap.toAmount,
        fromChainId: 11155111,
        toChainId: 11155111,
        sender: swap.sender,
        receiver: swap.receiver
      });
      
      console.log('✅ Fusion+ order created:', order.orderId);
      
      // Update swap with order info
      swap.fusionOrderId = order.orderId;
      swap.status = 'eth_locked';
      this.swaps.set(swapId, swap);
      
      // Emit event
      this.eventEmitter.dispatchEvent(new CustomEvent('swapProgress', {
        detail: { swapId, status: 'eth_locked', order }
      }));
      
      return order;
    } catch (error) {
      console.error('❌ ETH → Stellar swap failed:', error);
      throw error;
    }
  }

  /**
   * Execute Stellar to Ethereum swap
   */
  async executeStellarToEthSwap(params) {
    const { swapId, stellarAmount, ethAddress } = params;
    
    try {
      console.log('🔄 Executing Stellar → ETH swap...');
      
      const swap = this.swaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }
      
      // Update swap status
      swap.status = 'executing_stellar_lock';
      this.swaps.set(swapId, swap);
      
      // For now, simulate stellar lock
      // TODO: Implement actual Stellar HTLC creation
      console.log('🔄 Creating Stellar HTLC...');
      
      // Update swap status
      swap.status = 'stellar_locked';
      this.swaps.set(swapId, swap);
      
      // Emit event
      this.eventEmitter.dispatchEvent(new CustomEvent('swapProgress', {
        detail: { swapId, status: 'stellar_locked' }
      }));
      
      return { success: true, swapId };
    } catch (error) {
      console.error('❌ Stellar → ETH swap failed:', error);
      throw error;
    }
  }

  /**
   * Get swap status from backend
   */
  async getSwapStatus(swapId) {
    try {
      const swapStatus = await this.apiClient.getSwapStatus(swapId);
      
      // Update local cache
      if (swapStatus) {
        this.swaps.set(swapId, swapStatus);
      }
      
      return swapStatus;
    } catch (error) {
      console.error('❌ Failed to get swap status:', error);
      // Return local cache if API fails
      return this.swaps.get(swapId) || null;
    }
  }

  /**
   * Get all active swaps
   */
  async getActiveSwaps() {
    try {
      const activeSwaps = await this.apiClient.getActiveSwaps();
      
      // Update local cache
      activeSwaps.forEach(swap => {
        this.swaps.set(swap.id, swap);
      });
      
      return activeSwaps;
    } catch (error) {
      console.error('❌ Failed to get active swaps:', error);
      // Return local cache if API fails
      return Array.from(this.swaps.values());
    }
  }

  /**
   * Generate random secret for HTLC
   */
  generateSecret() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create hashlock from secret
   */
  async createHashlock(secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique swap ID
   */
  generateSwapId() {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Subscribe to events
   */
  on(eventType, callback) {
    this.eventEmitter.addEventListener(eventType, callback);
  }

  /**
   * Unsubscribe from events
   */
  off(eventType, callback) {
    this.eventEmitter.removeEventListener(eventType, callback);
  }
}

// Create singleton instance
const swapService = new SwapService();

export default swapService;