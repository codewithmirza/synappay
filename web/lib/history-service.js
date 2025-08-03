/**
 * History Service - Manages real swap history
 * Stores swap data locally and integrates with SynappayBridge
 */

class HistoryService {
  constructor() {
    this.storageKey = 'synappay_swap_history';
    this.maxHistorySize = 100; // Keep last 100 swaps
  }

  /**
   * Get all swap history
   */
  getSwapHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to load swap history:', error);
      return [];
    }
  }

  /**
   * Add a new swap to history
   */
  addSwap(swapData) {
    try {
      const history = this.getSwapHistory();
      
      const newSwap = {
        id: swapData.id || `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromToken: swapData.fromToken,
        toToken: swapData.toToken,
        amount: swapData.amount,
        quote: swapData.quote,
        status: swapData.status || 'pending',
        timestamp: swapData.timestamp || Date.now(),
        txHash: swapData.txHash || null,
        stellarTxHash: swapData.stellarTxHash || null,
        rate: swapData.rate || 0,
        error: swapData.error || null,
        userAddress: swapData.userAddress,
        stellarAddress: swapData.stellarAddress,
        fromChain: swapData.fromChain,
        toChain: swapData.toChain
      };

      // Add to beginning of array (most recent first)
      history.unshift(newSwap);

      // Keep only the last maxHistorySize swaps
      if (history.length > this.maxHistorySize) {
        history.splice(this.maxHistorySize);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(history));
      
      console.log('Added swap to history:', newSwap);
      return newSwap;
    } catch (error) {
      console.error('Failed to add swap to history:', error);
      return null;
    }
  }

  /**
   * Update swap status
   */
  updateSwapStatus(swapId, status, additionalData = {}) {
    try {
      const history = this.getSwapHistory();
      const swapIndex = history.findIndex(swap => swap.id === swapId);
      
      if (swapIndex !== -1) {
        history[swapIndex] = {
          ...history[swapIndex],
          status,
          ...additionalData,
          lastUpdated: Date.now()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        console.log(`Updated swap ${swapId} status to: ${status}`);
        return history[swapIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Failed to update swap status:', error);
      return null;
    }
  }

  /**
   * Get swap by ID
   */
  getSwapById(swapId) {
    const history = this.getSwapHistory();
    return history.find(swap => swap.id === swapId) || null;
  }

  /**
   * Get swaps by status
   */
  getSwapsByStatus(status) {
    const history = this.getSwapHistory();
    return history.filter(swap => swap.status === status);
  }

  /**
   * Get recent swaps (last N swaps)
   */
  getRecentSwaps(limit = 10) {
    const history = this.getSwapHistory();
    return history.slice(0, limit);
  }

  /**
   * Clear all history
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Cleared swap history');
    } catch (error) {
      console.error('Failed to clear swap history:', error);
    }
  }

  /**
   * Export history as JSON
   */
  exportHistory() {
    return this.getSwapHistory();
  }

  /**
   * Import history from JSON
   */
  importHistory(historyData) {
    try {
      if (Array.isArray(historyData)) {
        localStorage.setItem(this.storageKey, JSON.stringify(historyData));
        console.log('Imported swap history:', historyData.length, 'swaps');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import swap history:', error);
      return false;
    }
  }
}

// Export singleton instance
export const historyService = new HistoryService(); 