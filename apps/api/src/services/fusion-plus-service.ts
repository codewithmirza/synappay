// SynapPay 1inch Fusion+ Service
import { FusionPlusQuote, FusionPlusOrder } from '../types';

export interface FusionQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  priceImpact: number;
  timeEstimate: number;
  orderId?: string;
}

export interface FusionOrder {
  orderId: string;
  status: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  timestamp: number;
}

export class FusionPlusService {
  private apiKey: string;
  private baseUrl = 'https://api.1inch.dev/fusion';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(request: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
  }): Promise<FusionQuote> {
    const response = await fetch(`${this.baseUrl}/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromToken: request.fromToken,
        toToken: request.toToken,
        amount: request.amount,
        slippage: request.slippage || 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`1inch Fusion+ API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.amount,
      toAmount: data.toAmount || '0',
      estimatedGas: data.estimatedGas || '0',
      priceImpact: data.priceImpact || 0,
      timeEstimate: data.timeEstimate || 180
    };
  }

  async createOrder(request: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
    userAddress: string;
  }): Promise<FusionOrder> {
    const response = await fetch(`${this.baseUrl}/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromToken: request.fromToken,
        toToken: request.toToken,
        amount: request.amount,
        slippage: request.slippage || 0.5,
        userAddress: request.userAddress
      })
    });

    if (!response.ok) {
      throw new Error(`1inch Fusion+ API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      orderId: data.orderId || `order_${Date.now()}`,
      status: data.status || 'pending',
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.amount,
      toAmount: data.toAmount || '0',
      estimatedGas: data.estimatedGas || '0',
      timestamp: Date.now()
    };
  }

  async getOrderStatus(orderId: string): Promise<{
    orderId: string;
    status: string;
    transactionHash?: string;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`1inch Fusion+ API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      orderId,
      status: data.status || 'unknown',
      transactionHash: data.transactionHash,
      timestamp: Date.now()
    };
  }

  async cancelOrder(orderId: string): Promise<{
    orderId: string;
    status: string;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/order/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`1inch Fusion+ API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      orderId,
      status: data.status || 'cancelled',
      timestamp: Date.now()
    };
  }
}