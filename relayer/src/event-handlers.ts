import { EventEmitter } from 'events';

export enum EventType {
  OrderCreated = 'order_created',
  OrderInvalid = 'order_invalid', 
  OrderBalanceChange = 'order_balance_change',
  OrderAllowanceChange = 'order_allowance_change',
  OrderFilled = 'order_filled',
  OrderFilledPartially = 'order_filled_partially',
  OrderCancelled = 'order_cancelled',
  SecretShared = 'secret_shared',
  ProgressUpdate = 'progress_update',
  RecommendationGenerated = 'recommendation_generated',
  FragmentReady = 'fragment_ready',
  Recovery = 'recovery'
}

export interface EventMessage {
  eventId: string;
  eventType: EventType;
  timestamp: number;
  data: any;
  metadata: {
    orderHash?: string;
    resolver?: string;
    chainId?: number;
    urgent?: boolean;
    recoveryId?: string;
    recoveryType?: string;
    recoveryStatus?: string;
    error?: string;
    type?: string;
    status?: string;
    timestamp?: number;
  };
}

export interface EventListener {
  id: string;
  eventTypes: Set<EventType>;
  filters: {
    orderHashes?: Set<string>;
    resolvers?: Set<string>;
    chainIds?: Set<number>;
  };
  callback: (event: EventMessage) => void;
  lastNotified: number;
}

export class FusionEventManager extends EventEmitter {
  private eventListeners: Map<string, EventListener> = new Map();
  private eventHistory: EventMessage[] = [];
  private readonly MAX_HISTORY_SIZE = 500;
  private ordersService: any;
  private progressiveFillManager?: any;

  constructor(ordersService: any) {
    super();
    this.ordersService = ordersService;
    this.setupOrderServiceListeners();
  }

  setProgressiveFillManager(manager: any): void {
    this.progressiveFillManager = manager;
    this.setupProgressiveFillListeners();
  }

  private setupOrderServiceListeners(): void {
    // Listen to order service events
    this.ordersService.on('order_created', (orderHash: string, order: any) => {
      this.emitEvent(EventType.OrderCreated, {
        orderHash,
        order,
        maker: order.maker,
        receiver: order.receiver,
        fromToken: order.makerAsset,
        toToken: order.takerAsset,
        fromAmount: order.makingAmount,
        toAmount: order.takingAmount
      }, { orderHash, chainId: order.srcChainId });
    });

    this.ordersService.on('order_filled', (orderHash: string, fillData: any) => {
      this.emitEvent(EventType.OrderFilled, {
        orderHash,
        fillAmount: fillData.fillAmount,
        resolver: fillData.resolver,
        txHash: fillData.txHash,
        gasUsed: fillData.gasUsed,
        effectivePrice: fillData.effectivePrice
      }, { orderHash, resolver: fillData.resolver });
    });

    this.ordersService.on('order_cancelled', (orderHash: string, reason: string) => {
      this.emitEvent(EventType.OrderCancelled, {
        orderHash,
        reason,
        cancelledBy: 'user'
      }, { orderHash });
    });
  }

  private setupProgressiveFillListeners(): void {
    if (!this.progressiveFillManager) return;

    this.progressiveFillManager.on('fragment_ready', (orderId: string, fragmentIndex: number) => {
      this.emitEvent(EventType.FragmentReady, {
        orderId,
        fragmentIndex,
        readyForFill: true
      }, { orderHash: orderId });
    });

    this.progressiveFillManager.on('progress_update', (orderId: string, progress: any) => {
      this.emitEvent(EventType.ProgressUpdate, {
        orderId,
        previousPercentage: progress.previousPercentage,
        currentPercentage: progress.currentPercentage,
        fragmentsFilled: progress.fragmentsFilled,
        totalFragments: progress.totalFragments,
        estimatedCompletion: progress.estimatedCompletion
      }, { orderHash: orderId });
    });

    this.progressiveFillManager.on('recommendation_generated', (orderId: string, recommendation: any) => {
      this.emitEvent(EventType.RecommendationGenerated, {
        orderId,
        fragmentIndex: recommendation.fragmentIndex,
        recommendedFillAmount: recommendation.recommendedFillAmount,
        expectedProfit: recommendation.expectedProfit,
        confidence: recommendation.confidence
      }, { orderHash: orderId });
    });
  }

  addEventListener(listener: Omit<EventListener, 'id' | 'lastNotified'>): string {
    const id = this.generateId();
    const eventListener: EventListener = {
      ...listener,
      id,
      lastNotified: Date.now()
    };
    this.eventListeners.set(id, eventListener);
    return id;
  }

  removeEventListener(id: string): boolean {
    return this.eventListeners.delete(id);
  }

  emitEvent(eventType: EventType, data: any, metadata: EventMessage['metadata'] = {}): void {
    const event: EventMessage = {
      eventId: this.generateId(),
      eventType,
      timestamp: Date.now(),
      data,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }

    // Notify listeners
    this.eventListeners.forEach((listener) => {
      if (this.shouldNotifyListener(listener, event)) {
        try {
          listener.callback(event);
          listener.lastNotified = Date.now();
        } catch (error) {
          console.error('Error in event listener callback:', error);
        }
      }
    });

    // Emit for other parts of the system
    this.emit('event', event);
  }

  private shouldNotifyListener(listener: EventListener, event: EventMessage): boolean {
    // Check if listener is interested in this event type
    if (!listener.eventTypes.has(event.eventType)) {
      return false;
    }

    // Check filters
    if (listener.filters.orderHashes && event.metadata.orderHash) {
      if (!listener.filters.orderHashes.has(event.metadata.orderHash)) {
        return false;
      }
    }

    if (listener.filters.resolvers && event.metadata.resolver) {
      if (!listener.filters.resolvers.has(event.metadata.resolver)) {
        return false;
      }
    }

    if (listener.filters.chainIds && event.metadata.chainId) {
      if (!listener.filters.chainIds.has(event.metadata.chainId)) {
        return false;
      }
    }

    return true;
  }

  getEventHistory(options?: {
    eventTypes?: EventType[];
    orderHash?: string;
    limit?: number;
    offset?: number;
  }): EventMessage[] {
    let events = [...this.eventHistory];

    if (options?.eventTypes) {
      events = events.filter(event => options.eventTypes!.includes(event.eventType));
    }

    if (options?.orderHash) {
      events = events.filter(event => event.metadata.orderHash === options.orderHash);
    }

    if (options?.offset) {
      events = events.slice(options.offset);
    }

    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  getStatistics(): {
    totalEvents: number;
    eventTypes: Record<EventType, number>;
    activeListeners: number;
    recentActivity: number;
  } {
    const eventTypes: Record<EventType, number> = {} as any;
    this.eventHistory.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
    });

    const recentActivity = this.eventHistory.filter(
      event => Date.now() - event.timestamp < 60000
    ).length;

    return {
      totalEvents: this.eventHistory.length,
      eventTypes,
      activeListeners: this.eventListeners.size,
      recentActivity
    };
  }

  triggerTestEvents(orderHash: string): void {
    this.emitEvent(EventType.OrderCreated, {
      orderHash,
      test: true
    }, { orderHash });

    setTimeout(() => {
      this.emitEvent(EventType.OrderFilled, {
        orderHash,
        test: true
      }, { orderHash });
    }, 1000);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  getListenerCount(): number {
    return this.eventListeners.size;
  }

  getEventHistorySize(): number {
    return this.eventHistory.length;
  }
} 