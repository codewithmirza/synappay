// SynapPay Partial Fill Service
export interface PartialFillRequest {
  swapId: string;
  fillAmount: string;
  userAddress: string;
  chain: 'ethereum' | 'stellar';
}

export interface PartialFillResult {
  swapId: string;
  originalAmount: string;
  filledAmount: string;
  remainingAmount: string;
  fillPercentage: number;
  txHash: string;
  timestamp: number;
}

export class PartialFillService {
  private activeFills: Map<string, PartialFillResult[]> = new Map();

  constructor(private db: D1Database) {}

  /**
   * Process partial fill request
   */
  async processPartialFill(request: PartialFillRequest): Promise<PartialFillResult> {
    try {
      // Get original swap details
      const swap = await this.getSwapDetails(request.swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }

      // Validate fill amount
      const originalAmount = parseFloat(swap.fromAmount);
      const fillAmount = parseFloat(request.fillAmount);
      const remainingAmount = originalAmount - fillAmount;

      if (fillAmount <= 0 || fillAmount > originalAmount) {
        throw new Error('Invalid fill amount');
      }

      // Calculate fill percentage
      const fillPercentage = (fillAmount / originalAmount) * 100;

      // Process the partial fill
      const txHash = await this.executePartialFill(request, fillAmount);

      const result: PartialFillResult = {
        swapId: request.swapId,
        originalAmount: swap.fromAmount,
        filledAmount: request.fillAmount,
        remainingAmount: remainingAmount.toString(),
        fillPercentage,
        txHash,
        timestamp: Date.now()
      };

      // Store partial fill result
      await this.storePartialFill(result);

      // Update swap amount if fully filled
      if (fillPercentage >= 100) {
        await this.updateSwapStatus(request.swapId, 'completed');
      } else {
        await this.updateSwapAmount(request.swapId, remainingAmount.toString());
      }

      return result;

    } catch (error) {
      console.error('Partial fill error:', error);
      throw error;
    }
  }

  /**
   * Get partial fills for a swap
   */
  async getPartialFills(swapId: string): Promise<PartialFillResult[]> {
    const result = await this.db.prepare(`
      SELECT * FROM partial_fills WHERE swap_id = ? ORDER BY timestamp DESC
    `).bind(swapId).all();

    return result.results.map(row => ({
      swapId: row.swap_id as string,
      originalAmount: row.original_amount as string,
      filledAmount: row.filled_amount as string,
      remainingAmount: row.remaining_amount as string,
      fillPercentage: row.fill_percentage as number,
      txHash: row.tx_hash as string,
      timestamp: row.timestamp as number
    }));
  }

  /**
   * Get remaining amount for a swap
   */
  async getRemainingAmount(swapId: string): Promise<string> {
    const fills = await this.getPartialFills(swapId);
    
    if (fills.length === 0) {
      return '0';
    }
    
    const lastFill = fills[fills.length - 1];
    if (!lastFill) {
      return '0';
    }
    
    return lastFill.remainingAmount;
  }

  /**
   * Check if swap is eligible for partial fills
   */
  async isEligibleForPartialFill(swapId: string): Promise<boolean> {
    const swap = await this.getSwapDetails(swapId);
    if (!swap) return false;

    // Check if swap is in locked state
    if (swap.status !== 'locked') return false;

    // Check if there's remaining amount
    const remainingAmount = await this.getRemainingAmount(swapId);
    return parseFloat(remainingAmount) > 0;
  }

  /**
   * Execute partial fill on blockchain
   */
  private async executePartialFill(request: PartialFillRequest, amount: number): Promise<string> {
    try {
      if (request.chain === 'ethereum') {
        return await this.executeEthereumPartialFill(request, amount);
      } else if (request.chain === 'stellar') {
        return await this.executeStellarPartialFill(request, amount);
      } else {
        throw new Error('Unsupported chain for partial fill');
      }
    } catch (error) {
      console.error('Error executing partial fill:', error);
      throw error;
    }
  }

  /**
   * Execute partial fill on Ethereum
   */
  private async executeEthereumPartialFill(request: PartialFillRequest, amount: number): Promise<string> {
    // Implementation for Ethereum partial fill
    // This would interact with the Fusion+ contract to fill a portion of the order
    console.log(`Executing Ethereum partial fill: ${amount} for swap ${request.swapId}`);
    return `eth_partial_fill_${Date.now()}`;
  }

  /**
   * Execute partial fill on Stellar
   */
  private async executeStellarPartialFill(request: PartialFillRequest, amount: number): Promise<string> {
    // Implementation for Stellar partial fill
    // This would interact with the HTLC contract to claim a portion of the locked tokens
    console.log(`Executing Stellar partial fill: ${amount} for swap ${request.swapId}`);
    return `stellar_partial_fill_${Date.now()}`;
  }

  /**
   * Store partial fill result in database
   */
  private async storePartialFill(result: PartialFillResult): Promise<void> {
    await this.db.prepare(`
      INSERT INTO partial_fills (
        swap_id, original_amount, filled_amount, remaining_amount, 
        fill_percentage, tx_hash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      result.swapId,
      result.originalAmount,
      result.filledAmount,
      result.remainingAmount,
      result.fillPercentage,
      result.txHash,
      result.timestamp
    ).run();
  }

  /**
   * Get swap details from database
   */
  private async getSwapDetails(swapId: string): Promise<any> {
    const result = await this.db.prepare(`
      SELECT * FROM swap_intents WHERE id = ?
    `).bind(swapId).first();

    return result;
  }

  /**
   * Update swap status
   */
  private async updateSwapStatus(swapId: string, status: string): Promise<void> {
    await this.db.prepare(`
      UPDATE swap_intents SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), swapId).run();
  }

  /**
   * Update swap amount after partial fill
   */
  private async updateSwapAmount(swapId: string, newAmount: string): Promise<void> {
    await this.db.prepare(`
      UPDATE swap_intents SET from_amount = ?, updated_at = ? WHERE id = ?
    `).bind(newAmount, new Date().toISOString(), swapId).run();
  }

  /**
   * Get fill statistics for a swap
   */
  async getFillStatistics(swapId: string): Promise<{
    totalFilledAmount: number;
    remainingAmount: string;
    fillPercentage: number;
    fillCount: number;
    averageFillAmount: number;
  }> {
    const fills = await this.getPartialFills(swapId);
    
    if (fills.length === 0) {
      return {
        totalFilledAmount: 0,
        remainingAmount: '0',
        fillPercentage: 0,
        fillCount: 0,
        averageFillAmount: 0
      };
    }
    
    const totalFilledAmount = fills.reduce((sum, fill) => sum + parseFloat(fill.filledAmount), 0);
    const remainingAmount = fills[0]?.remainingAmount || '0';
    const fillPercentage = fills[0] ? (totalFilledAmount / parseFloat(fills[0].originalAmount)) * 100 : 0;
    const fillCount = fills.length;
    const averageFillAmount = totalFilledAmount / fillCount;
    
    return {
      totalFilledAmount,
      remainingAmount,
      fillPercentage,
      fillCount,
      averageFillAmount
    };
  }
} 