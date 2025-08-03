// SynapPay Shared Types
import { z } from 'zod';

// Swap Intent Schema
export const SwapIntentSchema = z.object({
  id: z.string(),
  fromChain: z.enum(['ethereum', 'stellar']),
  toChain: z.enum(['ethereum', 'stellar']),
  fromToken: z.string(),
  toToken: z.string(),
  fromAmount: z.string(),
  toAmount: z.string(),
  sender: z.string(),
  receiver: z.string(),
  hashlock: z.string(),
  timelock: z.number(),
  status: z.enum(['pending', 'locked', 'completed', 'refunded', 'expired']),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type SwapIntent = z.infer<typeof SwapIntentSchema>;

// HTLC Contract Schema
export const HTLCContractSchema = z.object({
  contractId: z.string(),
  chain: z.enum(['ethereum', 'stellar']),
  sender: z.string(),
  receiver: z.string(),
  amount: z.string(),
  token: z.string(),
  hashlock: z.string(),
  timelock: z.number(),
  status: z.enum(['active', 'withdrawn', 'refunded']),
  preimage: z.string().optional(),
});

export type HTLCContract = z.infer<typeof HTLCContractSchema>;

// Network Configuration
export interface NetworkConfig {
  ethereum: {
    rpcUrl: string;
    htlcAddress: string;
    chainId: number;
  };
  stellar: {
    horizonUrl: string;
    htlcAddress: string;
    networkPassphrase: string;
  };
}

// API Response Types
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