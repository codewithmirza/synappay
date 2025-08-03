/**
 * CoinGecko Price Service
 * Fetches real-time token prices like OverSync
 */

class PriceService {
  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Get token prices from CoinGecko
   */
  async getTokenPrices(tokenIds) {
    const cacheKey = tokenIds.sort().join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      
      // Return cached data if available, otherwise mock data
      if (cached) {
        return cached.data;
      }
      
      return this.getMockPrices(tokenIds);
    }
  }

  /**
   * Get specific token price
   */
  async getTokenPrice(tokenId) {
    const prices = await this.getTokenPrices([tokenId]);
    return prices[tokenId];
  }

  /**
   * Get ETH price
   */
  async getEthPrice() {
    return await this.getTokenPrice('ethereum');
  }

  /**
   * Get XLM price
   */
  async getXlmPrice() {
    return await this.getTokenPrice('stellar');
  }

  /**
   * Get exchange rate between two tokens
   */
  async getExchangeRate(fromTokenId, toTokenId) {
    const prices = await this.getTokenPrices([fromTokenId, toTokenId]);
    
    const fromPrice = prices[fromTokenId]?.usd || 0;
    const toPrice = prices[toTokenId]?.usd || 0;
    
    if (fromPrice === 0 || toPrice === 0) {
      return 0;
    }
    
    return fromPrice / toPrice;
  }

  /**
   * Calculate swap quote with real prices
   */
  async calculateSwapQuote(fromToken, toToken, fromAmount) {
    try {
      const tokenMap = {
        'ETH': 'ethereum',
        'XLM': 'stellar',
        'USDC': 'usd-coin',
        'USDT': 'tether'
      };

      const fromTokenId = tokenMap[fromToken];
      const toTokenId = tokenMap[toToken];

      if (!fromTokenId || !toTokenId) {
        throw new Error(`Unsupported token: ${fromToken} or ${toToken}`);
      }

      const rate = await this.getExchangeRate(fromTokenId, toTokenId);
      const toAmount = parseFloat(fromAmount) * rate;

      // Apply a small spread (0.3% like OverSync)
      const spreadFactor = 0.997;
      const finalAmount = toAmount * spreadFactor;

      return {
        fromToken,
        toToken,
        fromAmount: parseFloat(fromAmount),
        toAmount: finalAmount,
        rate,
        spread: 0.3,
        priceImpact: 0.1,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to calculate swap quote:', error);
      
      // Fallback to mock quote
      return {
        fromToken,
        toToken,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(fromAmount) * 0.95, // Mock rate
        rate: 0.95,
        spread: 0.3,
        priceImpact: 0.1,
        timestamp: Date.now(),
        error: 'Using fallback pricing'
      };
    }
  }

  /**
   * Mock prices for fallback
   */
  getMockPrices(tokenIds) {
    const mockPrices = {
      'ethereum': { usd: 2000, usd_24h_change: 2.5 },
      'stellar': { usd: 0.12, usd_24h_change: -1.2 },
      'usd-coin': { usd: 1.0, usd_24h_change: 0.1 },
      'tether': { usd: 1.0, usd_24h_change: 0.0 }
    };

    const result = {};
    tokenIds.forEach(id => {
      if (mockPrices[id]) {
        result[id] = mockPrices[id];
      }
    });

    return result;
  }

  /**
   * Format price for display
   */
  formatPrice(price, decimals = 2) {
    if (price >= 1) {
      return `$${price.toFixed(decimals)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }

  /**
   * Format percentage change
   */
  formatPriceChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }
}

// Export singleton instance
export default new PriceService();