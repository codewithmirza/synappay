// 1inch API Client for Frontend
// Uses our Vercel proxy to handle CORS and authorization

class OneInchClient {
  constructor() {
    this.baseUrl = '/api/proxy/1inch';
  }

  // Get quote for token swap
  async getQuote(fromToken, toToken, amount, chainId = 11155111) {
    try {
      const params = new URLSearchParams({
        src: fromToken,
        dst: toToken,
        amount: amount.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true'
      });

      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/quote?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Quote request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  // Get swap data for transaction
  async getSwapData(fromToken, toToken, amount, fromAddress, slippage = 1, chainId = 11155111) {
    try {
      const params = new URLSearchParams({
        src: fromToken,
        dst: toToken,
        amount: amount.toString(),
        from: fromAddress,
        slippage: slippage.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true'
      });

      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/swap?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Swap data request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap data:', error);
      throw error;
    }
  }

  // Get supported tokens
  async getSupportedTokens(chainId = 11155111) {
    try {
      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/tokens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Tokens request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      throw error;
    }
  }

  // Get token approval data
  async getApprovalData(tokenAddress, amount, chainId = 11155111) {
    try {
      const params = new URLSearchParams({
        tokenAddress: tokenAddress,
        amount: amount.toString()
      });

      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/approve/transaction?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Approval data request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting approval data:', error);
      throw error;
    }
  }

  // Get token allowance
  async getAllowance(tokenAddress, walletAddress, chainId = 11155111) {
    try {
      const params = new URLSearchParams({
        tokenAddress: tokenAddress,
        walletAddress: walletAddress
      });

      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/approve/allowance?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Allowance request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw error;
    }
  }

  // Get Fusion+ order status
  async getFusionOrderStatus(orderHash) {
    try {
      const response = await fetch(`${this.baseUrl}/fusion/orders/${orderHash}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Fusion order status request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Fusion order status:', error);
      throw error;
    }
  }

  // Create Fusion+ intent order
  async createFusionOrder(orderData) {
    try {
      const response = await fetch(`${this.baseUrl}/fusion/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Fusion order creation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Fusion order:', error);
      throw error;
    }
  }
}

export default OneInchClient; 