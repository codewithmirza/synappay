// SynapPay API Types (Standalone for Cloudflare Workers)

// Swap Intent Type
export interface SwapIntent {
  id: string;
  fromChain: 'ethereum' | 'stellar';
  toChain: 'ethereum' | 'stellar';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  sender: string;
  receiver: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'locked' | 'completed' | 'refunded' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// HTLC Contract Type
export interface HTLCContract {
  contractId: string;
  chain: 'ethereum' | 'stellar';
  sender: string;
  receiver: string;
  amount: string;
  token: string;
  hashlock: string;
  timelock: number;
  status: 'active' | 'withdrawn' | 'refunded';
  preimage?: string;
}

// API Response Type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// 1inch Integration Types
export interface FusionPlusQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChainId: number;
  toChainId: number;
  estimatedGas: string;
  priceImpact: string;
}

export interface FusionPlusOrder {
  orderId: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  createdAt: number;
  expiresAt: number;
}

// Validation function for SwapIntent
export function validateSwapIntent(data: any): SwapIntent {
  // Basic validation - in production, use a proper validation library
  if (!data.fromChain || !data.toChain || !data.fromToken || !data.toToken) {
    throw new Error('Missing required swap intent fields');
  }
  
  return {
    id: data.id || generateSwapId(),
    fromChain: data.fromChain,
    toChain: data.toChain,
    fromToken: data.fromToken,
    toToken: data.toToken,
    fromAmount: data.fromAmount,
    toAmount: data.toAmount,
    sender: data.sender,
    receiver: data.receiver,
    hashlock: data.hashlock,
    timelock: data.timelock,
    status: data.status || 'pending',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
}

// Utility function to generate swap ID
export function generateSwapId(): string {
  return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}