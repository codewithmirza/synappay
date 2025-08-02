// 1inch API Client for Frontend
// Uses our Vercel proxy to handle CORS and authorization

class OneInchClient {
  constructor() {
    this.baseUrl = '/api/proxy/1inch';
  }

  // Get quote for token swap
  async getQuote(fromToken, toToken, amount, chainId = 11155111) {
    try {
      // Convert token symbols to addresses for Sepolia testnet
      const tokenAddresses = {
        'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
        'WETH': '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Wrapped ETH on Sepolia
        'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
        'DAI': '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // DAI on Sepolia
        'LINK': '0x779877A7B0D9E8603169DdbD7836e478b4624789' // LINK on Sepolia
      };

      const fromAddress = tokenAddresses[fromToken] || fromToken;
      const toAddress = tokenAddresses[toToken] || toToken;

      const response = await fetch(`${this.baseUrl}?path=quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          src: fromAddress,
          dst: toAddress,
          amount: amount.toString()
        })
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
      const response = await fetch(`${this.baseUrl}?path=swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          src: fromToken,
          dst: toToken,
          amount: amount.toString(),
          from: fromAddress,
          slippage: slippage.toString()
        })
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
      const response = await fetch(`${this.baseUrl}?path=tokens`, {
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
      const response = await fetch(`${this.baseUrl}?path=approve/transaction&tokenAddress=${tokenAddress}&amount=${amount}`, {
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
      const response = await fetch(`${this.baseUrl}?path=approve/allowance&tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`, {
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