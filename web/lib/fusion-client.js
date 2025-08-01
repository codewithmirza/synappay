import axios from 'axios';

class FusionClient {
  constructor(apiKey = process.env.ONEINCH_API_KEY, network = 'ethereum', rpcUrl = process.env.SEPOLIA_RPC_URL) {
    this.apiKey = apiKey;
    this.network = network;
    this.rpcUrl = rpcUrl;
    this.baseUrl = 'https://api.1inch.dev';
    this.chainId = 11155111; // Sepolia testnet
    
    // Swap phases for tracking
    this.swapPhases = {
      ANNOUNCEMENT: 'ANNOUNCEMENT',
      DEPOSIT: 'DEPOSIT', 
      WITHDRAWAL: 'WITHDRAWAL',
      RECOVERY: 'RECOVERY'
    };
    
    // Auction states
    this.auctionStates = {
      ACTIVE: 'ACTIVE',
      FILLED: 'FILLED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED'
    };
  }

  async getOrderStatus(orderHash) {
    try {
      const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        }
      });
      
      return {
        success: true,
        order: response.data
      };
    } catch (error) {
      console.error('Error getting order status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAuctionStatus(orderHash) {
    try {
      const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}/auction`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        }
      });
      
      return {
        success: true,
        status: response.data.status,
        resolvers: response.data.resolvers || 0,
        bestOffer: response.data.bestOffer,
        elapsed: response.data.elapsed || 0
      };
    } catch (error) {
      console.error('Error getting auction status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAuctionStats(orderHash) {
    try {
      const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}/stats`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        }
      });
      
      return {
        success: true,
        stats: response.data
      };
    } catch (error) {
      console.error('Error getting auction stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSupportedTokens() {
    try {
      const response = await axios.get(`${this.baseUrl}/swap/v6.0/${this.chainId}/tokens`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        }
      });
      
      return {
        success: true,
        tokens: response.data.tokens
      };
    } catch (error) {
      console.error('Error getting supported tokens:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getQuote(fromToken, toToken, amount) {
    try {
      const response = await axios.get(`${this.baseUrl}/swap/v6.0/${this.chainId}/quote`, {
        params: {
          src: fromToken,
          dst: toToken,
          amount: amount,
          includeTokensInfo: true,
          includeProtocols: true
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        }
      });
      
      return {
        success: true,
        quote: response.data
      };
    } catch (error) {
      console.error('Error getting quote:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  determinePhase(auctionStatus) {
    if (!auctionStatus) return this.swapPhases.ANNOUNCEMENT;
    
    switch (auctionStatus.status) {
      case 'ACTIVE':
        return this.swapPhases.DEPOSIT;
      case 'FILLED':
        return this.swapPhases.WITHDRAWAL;
      case 'EXPIRED':
        return this.swapPhases.RECOVERY;
      default:
        return this.swapPhases.ANNOUNCEMENT;
    }
  }

  calculateDutchAuctionMetrics(auctionStatus) {
    if (!auctionStatus) return null;
    
    return {
      currentPrice: auctionStatus.bestOffer || 0,
      timeElapsed: auctionStatus.elapsed || 0,
      resolverCount: auctionStatus.resolvers || 0,
      isActive: auctionStatus.status === 'ACTIVE'
    };
  }
}

export default FusionClient; 