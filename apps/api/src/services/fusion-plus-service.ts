// SynapPay 1inch Fusion+ Service
import { FusionPlusQuote, FusionPlusOrder } from '../types';

export class FusionPlusService {
  private baseUrl = 'https://api.1inch.dev';

  constructor(private apiKey: string) {}

  async getQuote(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    toChainId: number;
  }): Promise<FusionPlusQuote> {
    const response = await fetch(`${this.baseUrl}/fusion-plus/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      fromToken: params.fromTokenAddress,
      toToken: params.toTokenAddress,
      fromAmount: params.amount,
      toAmount: data.toAmount,
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      estimatedGas: data.estimatedGas || '0',
      priceImpact: data.priceImpact || '0',
    };
  }

  async createOrder(orderData: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    fromChainId: number;
    toChainId: number;
    sender: string;
    receiver: string;
  }): Promise<FusionPlusOrder> {
    const response = await fetch(`${this.baseUrl}/fusion-plus/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      orderId: data.orderId,
      status: 'pending',
      fromToken: orderData.fromToken,
      toToken: orderData.toToken,
      fromAmount: orderData.fromAmount,
      toAmount: orderData.toAmount,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async getOrderStatus(orderId: string): Promise<FusionPlusOrder> {
    const response = await fetch(`${this.baseUrl}/fusion-plus/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    return response.json();
  }
}