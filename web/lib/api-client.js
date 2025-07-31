class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async createSwap(swapData) {
    return this.request('/create-swap', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async getSwapStatus(swapId) {
    return this.request(`/swap-status/${swapId}`);
  }

  async claimSwap(swapId, preimage) {
    return this.request('/claim-swap', {
      method: 'POST',
      body: JSON.stringify({ swapId, preimage }),
    });
  }

  async refundSwap(swapId) {
    return this.request('/refund-swap', {
      method: 'POST',
      body: JSON.stringify({ swapId }),
    });
  }

  async getSystemHealth() {
    return this.request('/system-health');
  }

  async getAuctionStatus(orderHash) {
    return this.request('/auction-status', {
      method: 'POST',
      body: JSON.stringify({ orderHash }),
    });
  }

  async getOrderHistory(address) {
    return this.request('/order-history', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  async getBestRate(fromToken, toToken, amount) {
    return this.request('/best-rate', {
      method: 'POST',
      body: JSON.stringify({ fromToken, toToken, amount }),
    });
  }

  async compareRoutes(fromToken, toToken, amount) {
    return this.request('/compare-routes', {
      method: 'POST',
      body: JSON.stringify({ fromToken, toToken, amount }),
    });
  }

  async get1inchQuote(fromToken, toToken, amount) {
    return this.request('/proxy/1inch/quote', {
      method: 'POST',
      body: JSON.stringify({ fromToken, toToken, amount }),
    });
  }

  async get1inchSwapData(fromToken, toToken, amount, fromAddress, slippage = 1) {
    return this.request('/proxy/1inch/swap', {
      method: 'POST',
      body: JSON.stringify({ fromToken, toToken, amount, fromAddress, slippage }),
    });
  }

  // Safe request wrapper with error handling
  async safeRequest(method, ...args) {
    try {
      return await this[method](...args);
    } catch (error) {
      console.error(`API ${method} failed:`, error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  // Real-time monitoring
  startMonitoring(swapId, callback) {
    const interval = setInterval(async () => {
      try {
        const status = await this.getSwapStatus(swapId);
        callback(status);
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }

  // Auction monitoring
  startAuctionMonitoring(orderHash, callback) {
    const interval = setInterval(async () => {
      try {
        const status = await this.getAuctionStatus(orderHash);
        callback(status);
      } catch (error) {
        console.error('Auction monitoring error:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }
}

export default ApiClient; 