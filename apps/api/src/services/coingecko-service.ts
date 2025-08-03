// SynapPay CoinGecko Service for Real-time Exchange Rates
export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

export interface ExchangeRate {
  fromToken: string;
  toToken: string;
  rate: number;
  timestamp: number;
}

export class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {}

  async getTokenPrice(tokenId: string): Promise<TokenPrice> {
    const cacheKey = `price_${tokenId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await fetch(`${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${tokenId}: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;
    const tokenData = data[tokenId] as any;
    
    if (!tokenData) {
      throw new Error(`Token ${tokenId} not found`);
    }

    const price: TokenPrice = {
      id: tokenId,
      symbol: tokenId.toUpperCase(),
      name: tokenId,
      current_price: tokenData.usd || 0,
      price_change_24h: tokenData.usd_24h_change || 0,
      price_change_percentage_24h: tokenData.usd_24h_change || 0,
      market_cap: tokenData.usd_market_cap || 0,
      total_volume: tokenData.usd_24h_vol || 0,
      last_updated: new Date().toISOString()
    };

    this.cache.set(cacheKey, { data: price, timestamp: Date.now() });
    return price;
  }

  async getExchangeRate(fromToken: string, toToken: string): Promise<ExchangeRate> {
    const cacheKey = `rate_${fromToken}_${toToken}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const fromPrice = await this.getTokenPrice(fromToken);
    const toPrice = await this.getTokenPrice(toToken);
    
    const rate = fromPrice.current_price / toPrice.current_price;
    
    const exchangeRate: ExchangeRate = {
      fromToken,
      toToken,
      rate,
      timestamp: Date.now()
    };

    this.cache.set(cacheKey, { data: exchangeRate, timestamp: Date.now() });
    return exchangeRate;
  }

  async getMultipleTokenPrices(tokenIds: string[]): Promise<TokenPrice[]> {
    const cacheKey = `prices_${tokenIds.join(',')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await fetch(`${this.baseUrl}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;
    const prices: TokenPrice[] = [];

    for (const id of tokenIds) {
      const tokenData = data[id] as any;
      if (tokenData) {
        prices.push({
          id,
          symbol: id.toUpperCase(),
          name: id,
          current_price: tokenData.usd || 0,
          price_change_24h: tokenData.usd_24h_change || 0,
          price_change_percentage_24h: tokenData.usd_24h_change || 0,
          market_cap: tokenData.usd_market_cap || 0,
          total_volume: tokenData.usd_24h_vol || 0,
          last_updated: new Date().toISOString()
        });
      }
    }

    this.cache.set(cacheKey, { data: prices, timestamp: Date.now() });
    return prices;
  }

  getSupportedTokens(): { [key: string]: string } {
    return {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'stellar': 'XLM',
      'usd-coin': 'USDC',
      'tether': 'USDT',
      'dai': 'DAI',
      'wrapped-bitcoin': 'WBTC',
      'wrapped-ether': 'WETH'
    };
  }

  async calculateSwapQuote(
    fromToken: string, 
    toToken: string, 
    amount: string, 
    slippage: number = 0.5
  ): Promise<{
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    rate: number;
    slippage: number;
    estimatedGas: string;
    timestamp: number;
  }> {
    const rate = await this.getExchangeRate(fromToken, toToken);
    const fromAmount = parseFloat(amount);
    const toAmount = fromAmount * rate.rate;
    
    // Apply slippage
    const slippageAdjustedAmount = toAmount * (1 - slippage / 100);
    
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: slippageAdjustedAmount.toFixed(6),
      rate: rate.rate,
      slippage,
      estimatedGas: '0.005', // Estimated gas cost
      timestamp: Date.now()
    };
  }

  formatPrice(price: number, decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(price);
  }

  formatPriceChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }
} 