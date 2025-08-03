import { EventEmitter } from 'events';

export type EventType = 'order_created' | 'order_filled' | 'order_cancelled' | 'progress_update' | 'gas_update';

export interface ClientSubscriptionConfig {
  maxSubscriptionsPerClient: number;
  maxEventsPerSecond: number;
  subscriptionTimeout: number;
  enablePriorityQueuing: boolean;
  enableCompression: boolean;
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number;
}

export interface ClientInfo {
  id: string;
  connectionType: 'websocket' | 'sse' | 'polling';
  connected: boolean;
  connectedAt: number;
  lastActivity: number;
  userAgent?: string;
  ipAddress?: string;
  subscription?: ClientSubscription;
  quotaUsage: QuotaUsage;
  metadata: Record<string, any>;
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  eventTypes: Set<EventType>;
  filters: SubscriptionFilters;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  deliveryConfig: DeliveryConfig;
  statistics: SubscriptionStatistics;
}

export interface SubscriptionFilters {
  orderHashes?: Set<string>;
  resolvers?: Set<string>;
  chainIds?: Set<number>;
  eventProperties?: Record<string, any>;
  timeRange?: {
    start: number;
    end: number;
  };
  minConfidence?: number;
  maxLatency?: number;
  includeMetadata?: boolean;
  excludeTestEvents?: boolean;
}

export interface DeliveryConfig {
  deliveryMethod: 'push' | 'pull' | 'batch';
  maxRetries: number;
  retryDelay: number;
  batchEnabled: boolean;
  batchSize: number;
  batchTimeout: number;
  compressionEnabled: boolean;
  ackRequired: boolean;
  maxBuffer: number;
}

export interface QuotaUsage {
  eventsReceived: number;
  subscriptionCount: number;
  historyRequests: number;
  bandwidthUsed: number;
  resetTime: number;
  quotaExceeded: boolean;
}

export interface SubscriptionStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  averageLatency: number;
  deliverySuccess: number;
  deliveryFailures: number;
  lastDelivery: number;
  messagesQueued: number;
  bytesTransferred: number;
}

export interface QueuedEvent {
  id: string;
  event: any;
  clientId: string;
  priority: number;
  timestamp: number;
  retryCount: number;
  acknowledged: boolean;
}

export interface SubscriptionUpdateRequest {
  clientId: string;
  eventTypes?: EventType[];
  filters?: Partial<SubscriptionFilters>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deliveryConfig?: Partial<DeliveryConfig>;
}

export class ClientSubscriptionManager {
  private config: ClientSubscriptionConfig;
  private clients: Map<string, ClientInfo> = new Map();
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private eventManager: any;
  private deliveryQueue: QueuedEvent[] = [];
  private processingQueue = false;
  private quotaResetInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    eventManager: any,
    config: Partial<ClientSubscriptionConfig> = {}
  ) {
    this.eventManager = eventManager;
    this.config = {
      maxSubscriptionsPerClient: 5,
      maxEventsPerSecond: 100,
      subscriptionTimeout: 300000, // 5 minutes
      enablePriorityQueuing: true,
      enableCompression: false,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 1000,
      ...config
    };

    this.setupEventHandlers();
    this.startQuotaResetInterval();
    this.startCleanupInterval();
  }

  registerClient(clientInfo: Omit<ClientInfo, 'quotaUsage' | 'connectedAt' | 'lastActivity'>): string {
    const clientId = clientInfo.id;
    
    const client: ClientInfo = {
      ...clientInfo,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      quotaUsage: this.initializeQuotaUsage(),
      metadata: clientInfo.metadata || {}
    };

    this.clients.set(clientId, client);
    console.log(`📱 Client registered: ${clientId}`);
    
    return clientId;
  }

  unregisterClient(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    // Cancel any active subscription
    if (client.subscription) {
      this.cancelSubscription(clientId);
    }

    this.clients.delete(clientId);
    console.log(`📱 Client unregistered: ${clientId}`);
    
    return true;
  }

  createSubscription(request: SubscriptionUpdateRequest): string {
    const { clientId, eventTypes = ['order_created'], filters = {}, priority = 'medium', deliveryConfig = {} } = request;
    
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Cancel existing subscription if any
    this.cancelSubscription(clientId);

    const subscriptionId = this.generateId();
    const subscription: ClientSubscription = {
      id: subscriptionId,
      clientId,
      eventTypes: new Set(eventTypes),
      filters,
      priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      deliveryConfig: {
        deliveryMethod: 'push',
        maxRetries: 3,
        retryDelay: 1000,
        batchEnabled: this.config.enableBatching,
        batchSize: this.config.batchSize,
        batchTimeout: this.config.batchTimeout,
        compressionEnabled: this.config.enableCompression,
        ackRequired: false,
        maxBuffer: 1000,
        ...deliveryConfig
      },
      statistics: this.initializeSubscriptionStatistics()
    };

    this.subscriptions.set(subscriptionId, subscription);
    client.subscription = subscription;
    client.lastActivity = Date.now();

    console.log(`📡 Subscription created: ${subscriptionId} for client ${clientId}`);
    
    return subscriptionId;
  }

  updateSubscription(request: SubscriptionUpdateRequest): boolean {
    const { clientId, eventTypes, filters, priority, deliveryConfig } = request;
    
    const client = this.clients.get(clientId);
    if (!client || !client.subscription) {
      return false;
    }

    const subscription = client.subscription;
    
    if (eventTypes) {
      subscription.eventTypes = new Set(eventTypes);
    }
    
    if (filters) {
      subscription.filters = { ...subscription.filters, ...filters };
    }
    
    if (priority) {
      subscription.priority = priority;
    }
    
    if (deliveryConfig) {
      subscription.deliveryConfig = { ...subscription.deliveryConfig, ...deliveryConfig };
    }
    
    subscription.updatedAt = Date.now();
    client.lastActivity = Date.now();

    console.log(`📡 Subscription updated: ${subscription.id}`);
    
    return true;
  }

  cancelSubscription(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client || !client.subscription) {
      return false;
    }

    const subscription = client.subscription;
    subscription.isActive = false;
    this.subscriptions.delete(subscription.id);
    delete client.subscription;

    console.log(`📡 Subscription cancelled: ${subscription.id}`);
    
    return true;
  }

  getSubscription(clientId: string): ClientSubscription | undefined {
    const client = this.clients.get(clientId);
    return client?.subscription;
  }

  getAllSubscriptions(): ClientSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  getClient(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }

  getSubscriptionStatistics(): {
    totalClients: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    eventsByType: Record<EventType, number>;
    averageLatency: number;
    queueSize: number;
  } {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
    const eventsByType: Record<EventType, number> = {} as any;
    
    activeSubscriptions.forEach(sub => {
      sub.eventTypes.forEach(eventType => {
        eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
      });
    });

    const averageLatency = activeSubscriptions.length > 0 
      ? activeSubscriptions.reduce((sum, sub) => sum + sub.statistics.averageLatency, 0) / activeSubscriptions.length
      : 0;

    return {
      totalClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      eventsByType,
      averageLatency,
      queueSize: this.deliveryQueue.length
    };
  }

  private async processDeliveryQueue(): Promise<void> {
    if (this.processingQueue || this.deliveryQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      const batch = this.deliveryQueue.splice(0, this.config.batchSize);
      
      for (const queuedEvent of batch) {
        const client = this.clients.get(queuedEvent.clientId);
        if (!client || !client.subscription) {
          continue;
        }

        const success = await this.deliverEvent(queuedEvent);
        if (success) {
          queuedEvent.acknowledged = true;
        } else if (queuedEvent.retryCount < client.subscription.deliveryConfig.maxRetries) {
          queuedEvent.retryCount++;
          this.deliveryQueue.push(queuedEvent);
        }
      }
    } finally {
      this.processingQueue = false;
      
      // Continue processing if there are more events
      if (this.deliveryQueue.length > 0) {
        setTimeout(() => this.processDeliveryQueue(), 100);
      }
    }
  }

  private async deliverEvent(queuedEvent: QueuedEvent): Promise<boolean> {
    const client = this.clients.get(queuedEvent.clientId);
    if (!client || !client.subscription) {
      return false;
    }

    try {
      // In a real implementation, this would send the event to the client
      // For now, we'll just log it
      console.log(`📤 Delivering event to client ${queuedEvent.clientId}:`, queuedEvent.event.eventType);
      
      // Update statistics
      const subscription = client.subscription!;
      subscription.statistics.totalEvents++;
      const eventType = queuedEvent.event.eventType as string;
      subscription.statistics.eventsByType[eventType] = 
        (subscription.statistics.eventsByType[eventType] || 0) + 1;
      subscription.statistics.deliverySuccess++;
      subscription.statistics.lastDelivery = Date.now();
      
      client.lastActivity = Date.now();
      
      return true;
    } catch (error) {
      console.error('Failed to deliver event:', error);
      
      const subscription = client.subscription!;
      subscription.statistics.deliveryFailures++;
      
      return false;
    }
  }

  private handleEventForSubscription(subscription: ClientSubscription, event: any): void {
    // Check if event matches subscription filters
    if (!this.eventMatchesFilters(event, subscription.filters)) {
      return;
    }

    // Calculate priority
    const priority = this.calculateEventPriority(event, subscription);
    
    // Create queued event
    const queuedEvent: QueuedEvent = {
      id: this.generateId(),
      event,
      clientId: subscription.clientId,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      acknowledged: false
    };

    // Add to delivery queue
    this.deliveryQueue.push(queuedEvent);
    
    // Update statistics
    subscription.statistics.messagesQueued++;
    subscription.statistics.bytesTransferred += this.estimateEventSize(event);

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processDeliveryQueue();
    }
  }

  private eventMatchesFilters(event: any, filters: SubscriptionFilters): boolean {
    if (filters.orderHashes && event.metadata?.orderHash) {
      if (!filters.orderHashes.has(event.metadata.orderHash)) {
        return false;
      }
    }

    if (filters.resolvers && event.metadata?.resolver) {
      if (!filters.resolvers.has(event.metadata.resolver)) {
        return false;
      }
    }

    if (filters.chainIds && event.metadata?.chainId) {
      if (!filters.chainIds.has(event.metadata.chainId)) {
        return false;
      }
    }

    if (filters.timeRange) {
      const eventTime = event.timestamp;
      if (eventTime < filters.timeRange.start || eventTime > filters.timeRange.end) {
        return false;
      }
    }

    return true;
  }

  private calculateEventPriority(event: any, subscription: ClientSubscription): number {
    let priority = 0;
    
    // Base priority from subscription
    switch (subscription.priority) {
      case 'urgent': priority += 100; break;
      case 'high': priority += 75; break;
      case 'medium': priority += 50; break;
      case 'low': priority += 25; break;
    }
    
    // Event type priority
    switch (event.eventType) {
      case 'order_created': priority += 10; break;
      case 'order_filled': priority += 20; break;
      case 'gas_update': priority += 5; break;
    }
    
    // Urgent flag
    if (event.metadata?.urgent) {
      priority += 50;
    }
    
    return priority;
  }

  private calculateAverageLatency(subscription: ClientSubscription, newLatency: number): number {
    const current = subscription.statistics.averageLatency;
    const count = subscription.statistics.totalEvents;
    
    if (count === 0) return newLatency;
    
    return (current * (count - 1) + newLatency) / count;
  }

  private estimateEventSize(event: any): number {
    return JSON.stringify(event).length;
  }

  private setupEventHandlers(): void {
    if (this.eventManager) {
      this.eventManager.on('event', (event: any) => {
        // Find all subscriptions that match this event
        this.subscriptions.forEach(subscription => {
          if (subscription.isActive && subscription.eventTypes.has(event.eventType)) {
            this.handleEventForSubscription(subscription, event);
          }
        });
      });
    }
  }

  private cleanupInactiveSubscriptions(): void {
    const now = Date.now();
    const timeout = this.config.subscriptionTimeout;
    
    this.subscriptions.forEach((subscription, id) => {
      if (now - subscription.updatedAt > timeout) {
        subscription.isActive = false;
        console.log(`📡 Subscription timed out: ${id}`);
      }
    });
  }

  private startQuotaResetInterval(): void {
    this.quotaResetInterval = setInterval(() => {
      this.resetQuotas();
    }, 60000); // Reset every minute
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, 30000); // Cleanup every 30 seconds
  }

  private resetQuotas(): void {
    this.clients.forEach(client => {
      client.quotaUsage.eventsReceived = 0;
      client.quotaUsage.subscriptionCount = 0;
      client.quotaUsage.historyRequests = 0;
      client.quotaUsage.bandwidthUsed = 0;
      client.quotaUsage.resetTime = Date.now();
      client.quotaUsage.quotaExceeded = false;
    });
  }

  private initializeQuotaUsage(): QuotaUsage {
    return {
      eventsReceived: 0,
      subscriptionCount: 0,
      historyRequests: 0,
      bandwidthUsed: 0,
      resetTime: Date.now(),
      quotaExceeded: false
    };
  }

  private initializeSubscriptionStatistics(): SubscriptionStatistics {
    return {
      totalEvents: 0,
      eventsByType: {} as Record<string, number>,
      averageLatency: 0,
      deliverySuccess: 0,
      deliveryFailures: 0,
      lastDelivery: 0,
      messagesQueued: 0,
      bytesTransferred: 0
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  cleanup(): void {
    if (this.quotaResetInterval) {
      clearInterval(this.quotaResetInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
} 