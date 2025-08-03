import { EventEmitter } from 'events';

export interface PartialFillOrder {
  orderId: string;
  maker: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  srcChainId: number;
  dstChainId: number;
  merkleRoot: string;
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
  auctionStartTime: number;
  auctionEndTime: number;
  timeLocks: {
    srcWithdrawal: number;
    dstWithdrawal: number;
    srcCancellation: number;
    dstCancellation: number;
  };
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  createdAt: number;
  updatedAt: number;
}

export interface FillExecution {
  fillId: string;
  orderId: string;
  fragmentIndex: number;
  resolver: string;
  fillAmount: string;
  auctionPrice: string;
  gasCost: string;
  secretHash: string;
  merkleProof: string[];
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  srcTxHash?: string;
  dstTxHash?: string;
  executedAt?: number;
  gasUsed?: string;
  actualPrice?: string;
}

export interface FillProgress {
  orderId: string;
  totalAmount: string;
  filledAmount: string;
  remainingAmount: string;
  fillPercentage: number;
  fragmentsFilled: number;
  totalFragments: number;
  currentAuctionPrice: string;
  nextSecretIndex: number;
  estimatedCompletion: number;
  averageGasPrice: string;
  totalGasCost: string;
}

export interface FillValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
  estimatedGas?: string;
  priceImpact?: number;
  nextAvailableFragment?: number;
}

export interface FillRecommendation {
  orderId: string;
  fragmentIndex: number;
  recommendedFillAmount: string;
  expectedProfit: string;
  gasEstimate: string;
  priceImpact: number;
  confidence: number;
  timeToExpiry: number;
}

export class ProgressiveFillManager extends EventEmitter {
  private orders: Map<string, PartialFillOrder> = new Map();
  private fillExecutions: Map<string, FillExecution[]> = new Map();
  private gasTracker: any;

  constructor(gasTracker: any) {
    super();
    this.gasTracker = gasTracker;
  }

  async executePartialFill(
    orderId: string,
    fragmentIndex: number,
    fillAmount: string,
    resolver: string,
    secretHash: string,
    merkleProof: string[]
  ): Promise<{
    execution: FillExecution;
    progress: FillProgress;
    nextRecommendation?: FillRecommendation;
  }> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const gasPrice = this.gasTracker.getCurrentGasPrice();
    const estimatedGas = gasPrice.standard;

    const execution: FillExecution = {
      fillId: `fill_${orderId}_${fragmentIndex}_${Date.now()}`,
      orderId,
      fragmentIndex,
      resolver,
      fillAmount,
      auctionPrice: fillAmount,
      gasCost: estimatedGas,
      secretHash,
      merkleProof,
      status: 'executed',
      executedAt: Date.now(),
      gasUsed: estimatedGas,
      actualPrice: fillAmount
    };

    // Store execution
    if (!this.fillExecutions.has(orderId)) {
      this.fillExecutions.set(orderId, []);
    }
    this.fillExecutions.get(orderId)!.push(execution);

    // Update order progress
    const progress = await this.calculateFillProgress(orderId);
    
    // Generate next recommendation
    const nextRecommendation = await this.generateFillRecommendation(orderId, progress);

    this.emit('partial_fill_executed', execution, progress);

    const result: any = {
      execution,
      progress
    };
    
    if (nextRecommendation) {
      result.nextRecommendation = nextRecommendation;
    }
    
    return result;
  }

  async validateFill(
    orderId: string,
    fragmentIndex: number,
    fillAmount: string,
    resolver: string,
    secretHash: string,
    merkleProof: string[]
  ): Promise<FillValidation> {
    const order = this.orders.get(orderId);
    if (!order) {
      return {
        valid: false,
        error: 'Order not found'
      };
    }

    const gasPrice = this.gasTracker.getCurrentGasPrice();
    const estimatedGas = gasPrice.standard;

    return {
      valid: true,
      estimatedGas,
      priceImpact: 0.1,
      nextAvailableFragment: fragmentIndex + 1
    };
  }

  async calculateFillProgress(orderId: string): Promise<FillProgress> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const executions = this.fillExecutions.get(orderId) || [];
    const totalFilled = executions.reduce((sum, exec) => sum + BigInt(exec.fillAmount), BigInt(0));
    const totalAmount = BigInt(order.makingAmount);
    const fillPercentage = Number((totalFilled * BigInt(100)) / totalAmount);

    const gasPrice = this.gasTracker.getCurrentGasPrice();
    const totalGasCost = executions.reduce((sum, exec) => sum + BigInt(exec.gasCost || '0'), BigInt(0));

    return {
      orderId,
      totalAmount: order.makingAmount,
      filledAmount: totalFilled.toString(),
      remainingAmount: (totalAmount - totalFilled).toString(),
      fillPercentage,
      fragmentsFilled: executions.length,
      totalFragments: 10,
      currentAuctionPrice: gasPrice.standard,
      nextSecretIndex: executions.length,
      estimatedCompletion: order.auctionEndTime,
      averageGasPrice: gasPrice.standard,
      totalGasCost: totalGasCost.toString()
    };
  }

  async generateFillRecommendation(
    orderId: string,
    progress: FillProgress
  ): Promise<FillRecommendation | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const gasPrice = this.gasTracker.getCurrentGasPrice();
    const timeToExpiry = order.auctionEndTime - Date.now();
    const confidence = Math.max(0.1, 1 - (progress.fragmentsFilled * 0.1));

    return {
      orderId,
      fragmentIndex: progress.fragmentsFilled,
      recommendedFillAmount: progress.remainingAmount,
      expectedProfit: (BigInt(progress.remainingAmount) * BigInt(5) / BigInt(100)).toString(),
      gasEstimate: gasPrice.standard,
      priceImpact: 0.1,
      confidence,
      timeToExpiry
    };
  }

  getAvailableFragments(orderId: string): {
    fragments: any[];
    currentPrice: string;
    gasEstimate: string;
  } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { fragments: [], currentPrice: '0', gasEstimate: '0' };
    }

    const gasPrice = this.gasTracker.getCurrentGasPrice();
    const executions = this.fillExecutions.get(orderId) || [];
    const availableFragments = 10 - executions.length;

    return {
      fragments: Array.from({ length: availableFragments }, (_, i) => ({
        fragmentIndex: executions.length + i,
        available: true,
        estimatedFillAmount: (BigInt(order.makingAmount) / BigInt(10)).toString()
      })),
      currentPrice: gasPrice.standard,
      gasEstimate: gasPrice.standard
    };
  }

  getOrder(orderId: string): PartialFillOrder | undefined {
    return this.orders.get(orderId);
  }

  getOrderExecutions(orderId: string): FillExecution[] {
    return this.fillExecutions.get(orderId) || [];
  }

  getAllActiveOrders(): PartialFillOrder[] {
    return Array.from(this.orders.values()).filter(order => order.status === 'active');
  }
} 