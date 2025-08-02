// 1inch API Client for Frontend
// Uses our Vercel proxy to handle CORS and authorization

class OneInchClient {
  constructor() {
    this.baseUrl = '/api/proxy/1inch';
  }

  // Get quote for token swap
  async getQuote(fromToken, toToken, amount, chainId = 1) {
    try {
      // Convert token symbols to addresses for Ethereum mainnet
      const tokenAddresses = {
        'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH (1inch format)
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped ETH on mainnet
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on mainnet
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI on mainnet
        'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA' // LINK on mainnet
      };

      const fromAddress = tokenAddresses[fromToken] || fromToken;
      const toAddress = tokenAddresses[toToken] || toToken;

      // Convert amount to wei (18 decimals) for ETH, or use appropriate decimals for other tokens
      let amountInWei;
      if (fromToken === 'ETH') {
        // Convert ETH amount to wei (1 ETH = 10^18 wei)
        amountInWei = Math.floor(parseFloat(amount) * Math.pow(10, 18)).toString();
      } else if (fromToken === 'USDC') {
        // USDC has 6 decimals
        amountInWei = Math.floor(parseFloat(amount) * Math.pow(10, 6)).toString();
      } else {
        // Default to 18 decimals for other tokens
        amountInWei = Math.floor(parseFloat(amount) * Math.pow(10, 18)).toString();
      }

      // Use the correct 1inch API endpoint structure - v4.0 is the stable version
      const targetUrl = `https://api.1inch.dev/swap/v4.0/${chainId}/quote?src=${fromAddress}&dst=${toAddress}&amount=${amountInWei}`;
      
      console.log(`🔄 Requesting quote: ${fromToken} -> ${toToken}, amount: ${amount} (${amountInWei} wei)`);
      
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Quote request failed: ${response.status}`, errorData);
        
        // Handle specific 1inch API errors based on documentation
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 400) {
          if (errorData.details?.includes('Insufficient liquidity')) {
            throw new Error('Insufficient liquidity for this swap. Try a smaller amount.');
          } else if (errorData.details?.includes('Amount is not set')) {
            throw new Error('Invalid amount. Please check the amount format.');
          } else if (errorData.details?.includes('Cannot Estimate')) {
            throw new Error('Transaction cannot be estimated. Try adjusting slippage.');
          } else {
            throw new Error(`Quote request failed: ${errorData.details || errorData.error || 'Bad Request'}`);
          }
        } else {
          throw new Error(`Quote request failed: ${response.status} - ${errorData.details || errorData.error || 'Unknown error'}`);
        }
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
      const tokenAddresses = {
        'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA'
      };

      const fromAddressToken = tokenAddresses[fromToken] || fromToken;
      const toAddressToken = tokenAddresses[toToken] || toToken;

      const targetUrl = `https://api.1inch.dev/swap/v4.0/${chainId}/swap?src=${fromAddressToken}&dst=${toAddressToken}&amount=${amount}&from=${fromAddress}&slippage=${slippage}`;
      
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
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
      const targetUrl = `https://api.1inch.dev/swap/v4.0/${chainId}/tokens`;
      
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
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
      const targetUrl = `https://api.1inch.dev/swap/v4.0/${chainId}/approve/transaction?tokenAddress=${tokenAddress}&amount=${amount}`;
      
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
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
      const targetUrl = `https://api.1inch.dev/swap/v4.0/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;
      
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
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