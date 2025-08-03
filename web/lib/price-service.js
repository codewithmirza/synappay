// SynapPay Price Service with CoinGecko Integration
class PriceService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  async getTokenPrices(tokenIds) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/prices/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIds }),
      });

      if (!response.ok) {
        throw new Error(`Price API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching token prices:', error);
      // Fallback to mock prices
      return this.getMockPrices(tokenIds);
    }
  }

  async getTokenPrice(tokenId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/prices/${tokenId}`);
      
      if (!response.ok) {
        throw new Error(`Price API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching token price:', error);
      // Fallback to mock price
      return this.getMockPrice(tokenId);
    }
  }

  async getExchangeRate(fromToken, toToken) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/prices/exchange-rate/${fromToken}/${toToken}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Fallback to mock rate
      return this.getMockExchangeRate(fromToken, toToken);
    }
  }

  async calculateSwapQuote(fromToken, toToken, amount, slippage = 0.5) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/prices/swap-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          slippage
        }),
      });

      if (!response.ok) {
        throw new Error(`Swap quote API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error calculating swap quote:', error);
      // Fallback to mock quote
      return this.calculateMockSwapQuote(fromToken, toToken, amount);
    }
  }

  async getEthPrice() {
    return this.getTokenPrice('ethereum');
  }

  async getXlmPrice() {
    return this.getTokenPrice('stellar');
  }

  // Mock data for fallback
  getMockPrices(tokenIds) {
    const mockPrices = {
      'ethereum': { current_price: 2500, price_change_24h: 2.5 },
      'stellar': { current_price: 0.12, price_change_24h: -1.2 },
      'usd-coin': { current_price: 1.00, price_change_24h: 0.0 },
      'tether': { current_price: 1.00, price_change_24h: 0.0 },
      'dai': { current_price: 1.00, price_change_24h: 0.0 }
    };

    return tokenIds.map(id => ({
      id,
      symbol: id.toUpperCase(),
      name: id,
      current_price: mockPrices[id]?.current_price || 0,
      price_change_24h: mockPrices[id]?.price_change_24h || 0,
      price_change_percentage_24h: mockPrices[id]?.price_change_24h || 0,
      last_updated: new Date().toISOString()
    }));
  }

  getMockPrice(tokenId) {
    const mockPrices = {
      'ethereum': { current_price: 2500, price_change_24h: 2.5 },
      'stellar': { current_price: 0.12, price_change_24h: -1.2 },
      'usd-coin': { current_price: 1.00, price_change_24h: 0.0 },
      'tether': { current_price: 1.00, price_change_24h: 0.0 },
      'dai': { current_price: 1.00, price_change_24h: 0.0 }
    };

    return {
      id: tokenId,
      symbol: tokenId.toUpperCase(),
      name: tokenId,
      current_price: mockPrices[tokenId]?.current_price || 0,
      price_change_24h: mockPrices[tokenId]?.price_change_24h || 0,
      price_change_percentage_24h: mockPrices[tokenId]?.price_change_24h || 0,
      last_updated: new Date().toISOString()
    };
  }

  getMockExchangeRate(fromToken, toToken) {
    const rates = {
      'ethereum-stellar': 20833.33, // 1 ETH = ~20,833 XLM
      'stellar-ethereum': 0.000048, // 1 XLM = ~0.000048 ETH
      'ethereum-usd-coin': 2500, // 1 ETH = 2500 USDC
      'stellar-usd-coin': 0.12, // 1 XLM = 0.12 USDC
    };

    const key = `${fromToken}-${toToken}`;
    const rate = rates[key] || 1;

    return {
      fromToken,
      toToken,
      rate,
      inverseRate: 1 / rate,
      lastUpdated: Date.now()
    };
  }

  calculateMockSwapQuote(fromToken, toToken, amount) {
    const exchangeRate = this.getMockExchangeRate(fromToken, toToken);
    const fromAmount = parseFloat(amount);
    const toAmount = fromAmount * exchangeRate.rate;

    return {
      fromAmount: amount,
      toAmount: toAmount.toFixed(6),
      rate: exchangeRate.rate,
      priceImpact: 0.1,
      estimatedGas: fromToken === 'ethereum' ? '150000' : '0',
      timeEstimate: fromToken === 'ethereum' ? 180 : 5
    };
  }

  formatPrice(price, decimals = 2) {
    if (!price) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price);
  }

  formatPriceChange(change) {
    if (!change) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  // Get supported tokens for SynapPay
  getSupportedTokens() {
    return {
      'ethereum': 'ethereum',
      'stellar': 'stellar',
      'ETH': 'ethereum',
      'XLM': 'stellar',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai'
    };
  }
}

export default new PriceService();