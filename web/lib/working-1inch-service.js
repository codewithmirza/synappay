/**
 * Working 1inch Fusion+ Service
 * Based on proven implementation for real 1inch integration
 */

class Working1inchService {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
    this.baseUrl = 'https://api.1inch.dev/fusion';
  }

  /**
   * Get quote from 1inch Fusion+
   */
  async getQuote(params) {
    try {
      const { fromToken, toToken, amount, fromAddress, chainId = 1 } = params;

      const response = await fetch(`${this.baseUrl}/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: fromToken,
          destination: toToken,
          amount: amount,
          wallet: fromAddress,
          chain: chainId
        })
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: data.destinationAmount,
          priceImpact: data.priceImpact,
          gasEstimate: data.gasEstimate,
          route: data.route
        }
      };

    } catch (error) {
      console.error('❌ 1inch quote error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Fusion+ order
   */
  async createOrder(params) {
    try {
      const { fromToken, toToken, amount, fromAddress, chainId = 1, slippage = 1 } = params;

      const response = await fetch(`${this.baseUrl}/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: fromToken,
          destination: toToken,
          amount: amount,
          wallet: fromAddress,
          chain: chainId,
          slippage: slippage
        })
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          orderId: data.orderId,
          status: 'pending',
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: data.destinationAmount
        }
      };

    } catch (error) {
      console.error('❌ 1inch order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId) {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          orderId,
          status: data.status,
          txHash: data.txHash,
          fromAmount: data.sourceAmount,
          toAmount: data.destinationAmount
        }
      };

    } catch (error) {
      console.error('❌ 1inch order status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          orderId,
          status: 'cancelled'
        }
      };

    } catch (error) {
      console.error('❌ 1inch order cancellation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const working1inchService = new Working1inchService(); 