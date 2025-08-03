export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
  baseFee: string;
  priorityFee: string;
  timestamp: number;
}

export interface NetworkCongestion {
  level: 'low' | 'medium' | 'high' | 'extreme';
  score: number; // 0-1 scale
  pendingTransactions: number;
  blockUtilization: number;
  averageWaitTime: number;
}

export interface GasPriceHistory {
  timestamp: number;
  price: string;
  baseFee: string;
  priorityFee: string;
  blockNumber: number;
}

export class GasPriceTracker {
  private currentGasPrice: GasPrice;
  private priceHistory: GasPriceHistory[] = [];
  private congestionData: NetworkCongestion;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY_SIZE = 100;

  constructor() {
    this.currentGasPrice = this.getDefaultGasPrice();
    this.congestionData = this.getDefaultCongestion();
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.updateInterval) {
      this.stopMonitoring();
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateGasPrices();
        await this.updateCongestionData();
      } catch (error) {
        console.error('Error updating gas prices:', error);
      }
    }, intervalMs);

    // Initial update
    this.updateGasPrices();
    this.updateCongestionData();
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getCurrentGasPrice(): GasPrice {
    return this.currentGasPrice;
  }

  getNetworkCongestion(): NetworkCongestion {
    return this.congestionData;
  }

  getGasPriceHistory(limit?: number): GasPriceHistory[] {
    const history = [...this.priceHistory];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  getOptimalGasPrice(transactionType: 'fast' | 'standard' | 'slow' = 'standard'): string {
    const congestionMultiplier = this.getCongestionMultiplier();
    
    switch (transactionType) {
      case 'fast':
        return (BigInt(this.currentGasPrice.fast) * BigInt(Math.ceil(congestionMultiplier * 100)) / BigInt(100)).toString();
      case 'slow':
        return (BigInt(this.currentGasPrice.slow) * BigInt(Math.ceil(congestionMultiplier * 100)) / BigInt(100)).toString();
      default:
        return (BigInt(this.currentGasPrice.standard) * BigInt(Math.ceil(congestionMultiplier * 100)) / BigInt(100)).toString();
    }
  }

  predictGasPriceTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.priceHistory.length < 3) {
      return 'stable';
    }

    const recent = this.priceHistory.slice(-3);
    const prices = recent.map(p => BigInt(p.price));
    
    if (prices[2] && prices[1] && prices[0] && prices[2] > prices[1] && prices[1] > prices[0]) {
      return 'increasing';
    } else if (prices[2] && prices[1] && prices[0] && prices[2] < prices[1] && prices[1] < prices[0]) {
      return 'decreasing';
    }
    
    return 'stable';
  }

  getAuctionGasRecommendation(auctionDuration: number): {
    startGasPrice: string;
    endGasPrice: string;
    averageGasPrice: string;
  } {
    const trend = this.predictGasPriceTrend();
    const currentPrice = BigInt(this.currentGasPrice.standard);
    
    let startPrice: bigint;
    let endPrice: bigint;
    
    switch (trend) {
      case 'increasing':
        startPrice = currentPrice;
        endPrice = currentPrice * BigInt(120) / BigInt(100); // 20% increase
        break;
      case 'decreasing':
        startPrice = currentPrice * BigInt(120) / BigInt(100); // 20% higher start
        endPrice = currentPrice;
        break;
      default:
        startPrice = currentPrice;
        endPrice = currentPrice;
    }
    
    const averagePrice = (startPrice + endPrice) / BigInt(2);
    
    return {
      startGasPrice: startPrice.toString(),
      endGasPrice: endPrice.toString(),
      averageGasPrice: averagePrice.toString()
    };
  }

  isGasPriceAcceptable(gasPrice: string, maxAcceptablePrice: string): boolean {
    return BigInt(gasPrice) <= BigInt(maxAcceptablePrice);
  }

  private async updateGasPrices(): Promise<void> {
    try {
      // In a real implementation, this would fetch from a gas price API
      const newGasPrice = await this.fetchMockGasPrice();
      
      this.currentGasPrice = newGasPrice;
      
      // Add to history
      this.priceHistory.push({
        timestamp: Date.now(),
        price: newGasPrice.standard,
        baseFee: newGasPrice.baseFee,
        priorityFee: newGasPrice.priorityFee,
        blockNumber: Math.floor(Date.now() / 1000)
      });
      
      // Keep history size manageable
      if (this.priceHistory.length > this.MAX_HISTORY_SIZE) {
        this.priceHistory.shift();
      }
    } catch (error) {
      console.error('Failed to update gas prices:', error);
    }
  }

  private async fetchMockGasPrice(): Promise<GasPrice> {
    // Mock implementation - in real app, this would call an API
    const basePrice = 20000000000n; // 20 gwei base
    const congestion = this.getCongestionMultiplier();
    const adjustedPrice = basePrice * BigInt(Math.ceil(congestion * 100)) / BigInt(100);
    
    return {
      slow: (adjustedPrice * BigInt(80) / BigInt(100)).toString(),
      standard: adjustedPrice.toString(),
      fast: (adjustedPrice * BigInt(120) / BigInt(100)).toString(),
      instant: (adjustedPrice * BigInt(150) / BigInt(100)).toString(),
      baseFee: (adjustedPrice * BigInt(70) / BigInt(100)).toString(),
      priorityFee: (adjustedPrice * BigInt(30) / BigInt(100)).toString(),
      timestamp: Date.now()
    };
  }

  private async updateCongestionData(): Promise<void> {
    try {
      this.congestionData = await this.fetchMockCongestion();
    } catch (error) {
      console.error('Failed to update congestion data:', error);
    }
  }

  private async fetchMockCongestion(): Promise<NetworkCongestion> {
    // Mock implementation - in real app, this would analyze network data
    const score = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
    
    let level: NetworkCongestion['level'];
    if (score < 0.4) level = 'low';
    else if (score < 0.6) level = 'medium';
    else if (score < 0.8) level = 'high';
    else level = 'extreme';
    
    return {
      level,
      score,
      pendingTransactions: Math.floor(score * 100000),
      blockUtilization: score * 100,
      averageWaitTime: Math.floor(score * 300) // 0-300 seconds
    };
  }

  private getCongestionMultiplier(): number {
    const level = this.congestionData.level;
    switch (level) {
      case 'low': return 1.0;
      case 'medium': return 1.2;
      case 'high': return 1.5;
      case 'extreme': return 2.0;
      default: return 1.0;
    }
  }

  private getDefaultGasPrice(): GasPrice {
    return {
      slow: '15000000000', // 15 gwei
      standard: '20000000000', // 20 gwei
      fast: '25000000000', // 25 gwei
      instant: '30000000000', // 30 gwei
      baseFee: '15000000000', // 15 gwei
      priorityFee: '5000000000', // 5 gwei
      timestamp: Date.now()
    };
  }

  private getDefaultCongestion(): NetworkCongestion {
    return {
      level: 'medium',
      score: 0.5,
      pendingTransactions: 50000,
      blockUtilization: 50,
      averageWaitTime: 150
    };
  }

  getGasPriceStatistics(): {
    average: string;
    median: string;
    min: string;
    max: string;
    volatility: number;
  } {
    if (this.priceHistory.length === 0) {
      return {
        average: '0',
        median: '0',
        min: '0',
        max: '0',
        volatility: 0
      };
    }

    const prices = this.priceHistory.map(p => BigInt(p.price));
    const sum = prices.reduce((a, b) => a + b, BigInt(0));
    const average = sum / BigInt(prices.length);
    
    const sorted = [...prices].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const median = sorted[Math.floor(sorted.length / 2)] || BigInt(0);
    
    const min = sorted[0] || BigInt(0);
    const max = sorted[sorted.length - 1] || BigInt(0);
    
    // Calculate volatility (simplified)
    const avgPrice = Number(average);
    const variance = prices.reduce((sum, price) => {
      const diff = Number(price) - avgPrice;
      return sum + (diff * diff);
    }, 0) / prices.length;
    const volatility = Math.sqrt(variance) / avgPrice;

    return {
      average: average.toString(),
      median: median.toString(),
      min: min.toString(),
      max: max.toString(),
      volatility
    };
  }
} 