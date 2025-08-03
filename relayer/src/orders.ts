import { EventEmitter } from 'events';

export interface SignedOrderInput {
  orderHash: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  srcChainId: number;
  dstChainId: number;
  signature: string;
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
}

export interface ActiveOrder {
  orderHash: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  srcChainId: number;
  dstChainId: number;
  signature: string;
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  filledAmount: string;
  remainingAmount: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ResolverDataOutput {
  orderHash: string;
  secrets: string[];
  preimages: string[];
  fillAmounts: string[];
  timestamps: number[];
}

export class OrdersService extends EventEmitter {
  private activeOrders: Map<string, ActiveOrder> = new Map();
  private orderSecrets: Map<string, string[]> = new Map();
  private completedOrders: Set<string> = new Set();

  constructor() {
    super();
  }

  addOrder(signedOrder: SignedOrderInput): string {
    const order: ActiveOrder = {
      ...signedOrder,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      filledAmount: '0',
      remainingAmount: signedOrder.makingAmount
    };

    this.activeOrders.set(signedOrder.orderHash, order);
    this.emit('order_created', signedOrder.orderHash, order);
    
    return signedOrder.orderHash;
  }

  getActiveOrders(
    page: number = 1, 
    limit: number = 10, 
    srcChain?: number, 
    dstChain?: number
  ): PaginatedResponse<ActiveOrder> {
    let orders = Array.from(this.activeOrders.values());

    // Filter by chain if specified
    if (srcChain !== undefined) {
      orders = orders.filter(order => order.srcChainId === srcChain);
    }

    if (dstChain !== undefined) {
      orders = orders.filter(order => order.dstChainId === dstChain);
    }

    // Sort by creation time (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);

    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = orders.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  getOrdersByMaker(
    makerAddress: string,
    page: number = 1,
    limit: number = 10
  ): PaginatedResponse<ActiveOrder> {
    const orders = Array.from(this.activeOrders.values())
      .filter(order => order.maker.toLowerCase() === makerAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);

    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = orders.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  getOrderByHash(orderHash: string): ActiveOrder | null {
    return this.activeOrders.get(orderHash) || null;
  }

  getOrderStatus(orderHash: string): any {
    const order = this.activeOrders.get(orderHash);
    if (!order) {
      return {
        orderHash,
        status: 'not_found',
        error: 'Order not found'
      };
    }

    const secrets = this.orderSecrets.get(orderHash) || [];
    const fillPercentage = this.calculateFillPercentage(order);

    return {
      orderHash,
      status: order.status,
      maker: order.maker,
      receiver: order.receiver,
      makerAsset: order.makerAsset,
      takerAsset: order.takerAsset,
      makingAmount: order.makingAmount,
      takingAmount: order.takingAmount,
      filledAmount: order.filledAmount,
      remainingAmount: order.remainingAmount,
      fillPercentage,
      srcChainId: order.srcChainId,
      dstChainId: order.dstChainId,
      allowPartialFills: order.allowPartialFills,
      allowMultipleFills: order.allowMultipleFills,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
      secretsCount: secrets.length,
      isExpired: Date.now() > order.expiresAt
    };
  }

  getOrderStatuses(orderHashes: string[]): any[] {
    return orderHashes.map(hash => this.getOrderStatus(hash));
  }

  submitSecret(secretInput: { orderHash: string; secret: string; resolver: string }): boolean {
    const { orderHash, secret, resolver } = secretInput;
    const order = this.activeOrders.get(orderHash);
    
    if (!order) {
      return false;
    }

    if (!this.orderSecrets.has(orderHash)) {
      this.orderSecrets.set(orderHash, []);
    }

    const secrets = this.orderSecrets.get(orderHash)!;
    secrets.push(secret);

    this.emit('secret_submitted', orderHash, secret, resolver);
    return true;
  }

  getOrderSecrets(orderHash: string): ResolverDataOutput | null {
    const secrets = this.orderSecrets.get(orderHash);
    if (!secrets || secrets.length === 0) {
      return null;
    }

    const order = this.activeOrders.get(orderHash);
    if (!order) {
      return null;
    }

    // Generate preimages from secrets (in real implementation, this would be cryptographic)
    const preimages = secrets.map(secret => `preimage_${secret}`);
    const fillAmounts = secrets.map(() => order.makingAmount);
    const timestamps = secrets.map(() => Date.now());

    return {
      orderHash,
      secrets,
      preimages,
      fillAmounts,
      timestamps
    };
  }

  getReadyToAcceptSecretFills(orderHash?: string): any {
    const orders = orderHash 
      ? [this.activeOrders.get(orderHash)].filter(Boolean)
      : Array.from(this.activeOrders.values());

    const readyOrders = orders.filter(order => {
      if (!order || order.status !== 'active') return false;
      if (Date.now() > order.expiresAt) return false;
      
      const secrets = this.orderSecrets.get(order.orderHash) || [];
      return secrets.length > 0;
    });

    return {
      orders: readyOrders.map(order => ({
        orderHash: order!.orderHash,
        makerAddress: order!.maker,
        fills: this.orderSecrets.get(order!.orderHash)?.map((secret, index) => ({
          idx: index,
          srcEscrowDeployTxHash: `escrow_${order!.orderHash}_${index}`,
          dstEscrowDeployTxHash: `stellar_escrow_${order!.orderHash}_${index}`
        })) || []
      }))
    };
  }

  completeOrder(orderHash: string): void {
    const order = this.activeOrders.get(orderHash);
    if (order) {
      order.status = 'filled';
      this.completedOrders.add(orderHash);
      this.emit('order_filled', orderHash, order);
    }
  }

  private getDstChainId(srcChainId: number): number {
    // In a real implementation, this would determine the destination chain
    // For now, we'll use a simple mapping
    const chainMapping: { [key: number]: number } = {
      1: 2, // Ethereum to Stellar
      2: 1  // Stellar to Ethereum
    };
    return chainMapping[srcChainId] || 2;
  }

  getOrderCount(): number {
    return this.activeOrders.size;
  }

  getAllReadyToAcceptSecretFills(): { orders: Array<{ orderHash: string; makerAddress: string; fills: Array<{ idx: number; srcEscrowDeployTxHash: string; dstEscrowDeployTxHash: string; }> }> } {
    return this.getReadyToAcceptSecretFills();
  }

  getPublishedSecrets(orderHash: string): ResolverDataOutput {
    const result = this.getOrderSecrets(orderHash);
    if (!result) {
      return {
        orderHash,
        secrets: [],
        preimages: [],
        fillAmounts: [],
        timestamps: []
      };
    }
    return result;
  }

  getMultipleOrderStatuses(orderHashes: string[]): Array<{ orderHash: string; status: string; validation: string; }> {
    return orderHashes.map(hash => {
      const order = this.activeOrders.get(hash);
      return {
        orderHash: hash,
        status: order?.status || 'not_found',
        validation: order ? 'valid' : 'invalid'
      };
    });
  }

  getReadyToExecutePublicActions(): { actions: Array<{ action: string; immutables: any; chainId: number; escrow: string; secret?: string; }> } {
    const actions: Array<{ action: string; immutables: any; chainId: number; escrow: string; secret?: string; }> = [];
    
    this.activeOrders.forEach((order, orderHash) => {
      const secrets = this.orderSecrets.get(orderHash) || [];
      if (secrets.length > 0) {
        const action: any = {
          action: 'withdraw',
          immutables: {
            orderHash,
            maker: order.maker,
            receiver: order.receiver
          },
          chainId: order.srcChainId,
          escrow: `escrow_${orderHash}`
        };
        
        if (secrets[0]) {
          action.secret = secrets[0];
        }
        
        actions.push(action);
      }
    });

    return { actions };
  }

  submitPartialFill(fillData: {
    orderHash: string;
    fragmentIndex: number;
    fillAmount: string;
    resolver: string;
    secretHash: string;
    merkleProof: string[];
  }): { fillId: string; status: string; progress: number; } {
    const { orderHash, fragmentIndex, fillAmount, resolver } = fillData;
    const order = this.activeOrders.get(orderHash);
    
    if (!order) {
      return {
        fillId: `fill_${Date.now()}`,
        status: 'failed',
        progress: 0
      };
    }

    // Update order fill amount
    const currentFilled = BigInt(order.filledAmount);
    const newFillAmount = BigInt(fillAmount);
    order.filledAmount = (currentFilled + newFillAmount).toString();
    order.remainingAmount = (BigInt(order.makingAmount) - BigInt(order.filledAmount)).toString();

    const progress = this.calculateFillPercentage(order);

    this.emit('partial_fill_submitted', orderHash, fillData, progress);

    return {
      fillId: `fill_${orderHash}_${fragmentIndex}_${Date.now()}`,
      status: 'success',
      progress
    };
  }

  getOrderFragments(orderHash: string): { fragments: Array<{ fragmentIndex: number; fillPercentage: number; secretHash: string; status: string; }> } {
    const order = this.activeOrders.get(orderHash);
    if (!order) {
      return { fragments: [] };
    }

    const totalFragments = 10; // Example: 10 fragments per order
    const filledAmount = BigInt(order.filledAmount);
    const totalAmount = BigInt(order.makingAmount);
    const fillPercentage = Number((filledAmount * BigInt(100)) / totalAmount);

    const fragments = Array.from({ length: totalFragments }, (_, index) => ({
      fragmentIndex: index,
      fillPercentage: Math.min(100, (fillPercentage / totalFragments) * (index + 1)),
      secretHash: `hash_${orderHash}_${index}`,
      status: index < Math.floor(fillPercentage / 10) ? 'filled' : 'pending'
    }));

    return { fragments };
  }

  getOrderProgress(orderHash: string): { 
    orderId: string;
    totalAmount: string;
    filledAmount: string;
    fillPercentage: number;
    fragmentsFilled: number;
    totalFragments: number;
    estimatedCompletion: number;
  } {
    const order = this.activeOrders.get(orderHash);
    if (!order) {
      return {
        orderId: orderHash,
        totalAmount: '0',
        filledAmount: '0',
        fillPercentage: 0,
        fragmentsFilled: 0,
        totalFragments: 10,
        estimatedCompletion: 0
      };
    }

    const fillPercentage = this.calculateFillPercentage(order);
    const fragmentsFilled = Math.floor(fillPercentage / 10);
    const estimatedCompletion = order.expiresAt;

    return {
      orderId: orderHash,
      totalAmount: order.makingAmount,
      filledAmount: order.filledAmount,
      fillPercentage,
      fragmentsFilled,
      totalFragments: 10,
      estimatedCompletion
    };
  }

  getFillRecommendations(orderHash: string): { 
    recommendations: Array<{
      fragmentIndex: number;
      recommendedFillAmount: string;
      expectedProfit: string;
      confidence: number;
      timeToExpiry: number;
    }> 
  } {
    const order = this.activeOrders.get(orderHash);
    if (!order) {
      return { recommendations: [] };
    }

    const timeToExpiry = order.expiresAt - Date.now();
    const remainingAmount = BigInt(order.remainingAmount);
    const fragmentSize = remainingAmount / BigInt(10); // 10 fragments

    const recommendations = Array.from({ length: 10 }, (_, index) => ({
      fragmentIndex: index,
      recommendedFillAmount: fragmentSize.toString(),
      expectedProfit: (BigInt(fragmentSize) * BigInt(5) / BigInt(100)).toString(), // 5% profit
      confidence: Math.max(0.1, 1 - (index * 0.1)),
      timeToExpiry
    }));

    return { recommendations };
  }

  clearExpiredOrders(): number {
    const now = Date.now();
    let clearedCount = 0;

    this.activeOrders.forEach((order, orderHash) => {
      if (now > order.expiresAt && order.status === 'active') {
        order.status = 'expired';
        this.emit('order_expired', orderHash, order);
        clearedCount++;
      }
    });

    return clearedCount;
  }

  private calculateFillPercentage(order: ActiveOrder): number {
    const filled = BigInt(order.filledAmount);
    const total = BigInt(order.makingAmount);
    if (total === BigInt(0)) return 0;
    return Number((filled * BigInt(100)) / total);
  }
} 