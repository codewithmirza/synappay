// Synappay-style Cross-Chain Coordinator
// Orchestrates swaps between Ethereum (1inch Fusion+) and Stellar (HTLC)

import { FusionPlusClient, CrossChainSwapParams, FusionOrder } from '../../protocols/src/fusion-plus/client';
import { StellarHTLCManager, StellarHTLCParams } from './stellar/htlc-manager';
import { Asset, Keypair } from 'stellar-sdk';

export interface SwapRequest {
  id: string;
  fromChain: 'ethereum' | 'stellar';
  toChain: 'ethereum' | 'stellar';
  fromToken: string;
  toToken: string;
  amount: string;
  userAddress: string;
  stellarAddress?: string;
  status: 'pending' | 'locked' | 'completed' | 'failed' | 'refunded';
  createdAt: number;
  expiresAt: number;
}

export interface SwapState {
  request: SwapRequest;
  hashlock: string;
  preimage: string;
  ethereumOrderId?: string;
  stellarBalanceId?: string;
  step: 'init' | 'ethereum_locked' | 'stellar_locked' | 'completed' | 'failed';
}

export class CrossChainCoordinator {
  private fusionClient: FusionPlusClient;
  private stellarManager: StellarHTLCManager;
  private activeSwaps: Map<string, SwapState> = new Map();
  private isTestnet: boolean;

  constructor(
    ethereumPrivateKey: string,
    ethereumRpcUrl: string,
    stellarHorizonUrl: string,
    isTestnet: boolean = true
  ) {
    this.isTestnet = isTestnet;
    this.fusionClient = new FusionPlusClient(ethereumPrivateKey, ethereumRpcUrl, isTestnet);
    this.stellarManager = new StellarHTLCManager(stellarHorizonUrl, isTestnet);
  }

  /**
   * Initiate a cross-chain swap (Synappay flow)
   */
  async initiateSwap(request: SwapRequest): Promise<SwapState> {
    // Generate hashlock for this swap
    const { preimage, hashlock } = this.stellarManager.generateHashlock();
    
    const swapState: SwapState = {
      request,
      hashlock,
      preimage,
      step: 'init'
    };

    this.activeSwaps.set(request.id, swapState);

    try {
      if (request.fromChain === 'ethereum' && request.toChain === 'stellar') {
        return await this.executeEthereumToStellar(swapState);
      } else if (request.fromChain === 'stellar' && request.toChain === 'ethereum') {
        return await this.executeStellarToEthereum(swapState);
      } else {
        throw new Error('Unsupported swap direction');
      }
    } catch (error) {
      swapState.step = 'failed';
      swapState.request.status = 'failed';
      console.error('Swap initiation failed:', error);
      throw error;
    }
  }  
/**
   * Execute Ethereum -> Stellar swap
   * 1. Create 1inch Fusion+ order on Ethereum (locks tokens)
   * 2. Wait for user to create Stellar HTLC
   * 3. User claims Stellar tokens with preimage
   * 4. Relayer uses preimage to claim Ethereum tokens
   */
  private async executeEthereumToStellar(swapState: SwapState): Promise<SwapState> {
    const { request, hashlock } = swapState;

    // Step 1: Create Fusion+ order on Ethereum
    const fusionParams: CrossChainSwapParams = {
      fromToken: request.fromToken,
      toToken: request.toToken,
      amount: request.amount,
      fromChain: 'ethereum',
      toChain: 'stellar',
      userAddress: request.userAddress,
      stellarAddress: request.stellarAddress,
      hashlock: hashlock,
      timelock: request.expiresAt
    };

    const order = await this.fusionClient.createCrossChainOrder(fusionParams);
    swapState.ethereumOrderId = order.orderId;
    swapState.step = 'ethereum_locked';
    swapState.request.status = 'locked';

    console.log('Ethereum side locked via Fusion+:', {
      orderId: order.orderId,
      amount: request.amount,
      hashlock: hashlock
    });

    return swapState;
  }

  /**
   * Execute Stellar -> Ethereum swap
   * 1. User creates Stellar HTLC (locks XLM/tokens)
   * 2. Create 1inch Fusion+ order that releases when HTLC is detected
   * 3. User claims Ethereum tokens with preimage
   * 4. Relayer uses preimage to claim Stellar tokens
   */
  private async executeStellarToEthereum(swapState: SwapState): Promise<SwapState> {
    const { request, hashlock } = swapState;

    // For Stellar -> Ethereum, we first need the user to create the Stellar HTLC
    // This would typically be done through the frontend
    console.log('Waiting for Stellar HTLC creation:', {
      amount: request.amount,
      hashlock: hashlock,
      timelock: request.expiresAt
    });

    swapState.step = 'stellar_locked';
    swapState.request.status = 'locked';

    return swapState;
  }

  /**
   * User creates Stellar HTLC (called from frontend)
   */
  async createStellarHTLC(
    swapId: string,
    senderKeypair: Keypair,
    receiverAddress: string,
    amount: string,
    asset: Asset
  ): Promise<string> {
    const swapState = this.activeSwaps.get(swapId);
    if (!swapState) {
      throw new Error('Swap not found');
    }

    const htlcParams: StellarHTLCParams = {
      sender: senderKeypair,
      receiver: receiverAddress,
      amount: amount,
      asset: asset,
      hashlock: swapState.hashlock,
      timelock: swapState.request.expiresAt
    };

    const balanceId = await this.stellarManager.createHTLC(htlcParams);
    swapState.stellarBalanceId = balanceId;

    return balanceId;
  }

  /**
   * Claim tokens on destination chain by revealing preimage
   */
  async claimTokens(swapId: string, claimerKeypair?: Keypair): Promise<string> {
    const swapState = this.activeSwaps.get(swapId);
    if (!swapState) {
      throw new Error('Swap not found');
    }

    const { request, preimage, hashlock } = swapState;

    if (request.toChain === 'stellar' && swapState.stellarBalanceId) {
      // Claim Stellar tokens
      if (!claimerKeypair) {
        throw new Error('Claimer keypair required for Stellar claims');
      }

      const txHash = await this.stellarManager.claimHTLC({
        claimer: claimerKeypair,
        balanceId: swapState.stellarBalanceId,
        preimage: preimage,
        expectedHashlock: hashlock
      });

      swapState.step = 'completed';
      swapState.request.status = 'completed';

      return txHash;
    } else if (request.toChain === 'ethereum' && swapState.ethereumOrderId) {
      // Claim Ethereum tokens via Fusion+
      const txHash = await this.fusionClient.fillOrder(swapState.ethereumOrderId, preimage);

      swapState.step = 'completed';
      swapState.request.status = 'completed';

      return txHash;
    }

    throw new Error('Invalid claim configuration');
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<SwapState | null> {
    const swapState = this.activeSwaps.get(swapId);
    if (!swapState) {
      return null;
    }

    // Update status by checking blockchain states
    await this.updateSwapStatus(swapState);
    
    return swapState;
  }

  /**
   * Update swap status by checking blockchain states
   */
  private async updateSwapStatus(swapState: SwapState): Promise<void> {
    const { request } = swapState;

    // Check if swap has expired
    const now = Math.floor(Date.now() / 1000);
    if (now > request.expiresAt && swapState.step !== 'completed') {
      swapState.request.status = 'refunded';
      return;
    }

    // Check Ethereum order status
    if (swapState.ethereumOrderId) {
      const order = await this.fusionClient.getOrderStatus(swapState.ethereumOrderId);
      if (order?.status === 'filled') {
        swapState.step = 'completed';
        swapState.request.status = 'completed';
      }
    }

    // Check Stellar HTLC status
    if (swapState.stellarBalanceId) {
      const htlcStatus = await this.stellarManager.getHTLCStatus(swapState.stellarBalanceId);
      if (!htlcStatus) {
        // HTLC claimed or doesn't exist
        swapState.step = 'completed';
        swapState.request.status = 'completed';
      }
    }
  }

  /**
   * Refund expired swap
   */
  async refundSwap(swapId: string, refunderKeypair?: Keypair): Promise<string> {
    const swapState = this.activeSwaps.get(swapId);
    if (!swapState) {
      throw new Error('Swap not found');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= swapState.request.expiresAt) {
      throw new Error('Swap has not expired yet');
    }

    if (swapState.ethereumOrderId) {
      // Cancel Ethereum order
      return await this.fusionClient.cancelOrder(swapState.ethereumOrderId);
    }

    if (swapState.stellarBalanceId && refunderKeypair) {
      // Refund Stellar HTLC
      return await this.stellarManager.refundHTLC({
        sender: refunderKeypair,
        balanceId: swapState.stellarBalanceId
      });
    }

    throw new Error('No refundable positions found');
  }

  /**
   * Get all active swaps
   */
  getActiveSwaps(): SwapState[] {
    return Array.from(this.activeSwaps.values());
  }

  /**
   * Get preimage for a swap (for relayer use)
   */
  getPreimage(swapId: string): string | null {
    const swapState = this.activeSwaps.get(swapId);
    return swapState?.preimage || null;
  }
}