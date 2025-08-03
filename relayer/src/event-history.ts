export interface EventQuery {
  limit?: number;
  offset?: number;
  eventTypes?: string[];
  orderHashes?: string[];
  resolvers?: string[];
  chainIds?: number[];
  timeRange?: {
    start: number;
    end: number;
  };
  includeMetadata?: boolean;
  sortBy?: 'timestamp' | 'eventType' | 'orderHash';
  sortOrder?: 'asc' | 'desc';
}

export interface EventRecord {
  id: string;
  eventType: string;
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
  };
  source: string;
  version: string;
}

export interface EventHistoryStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByTime: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  averageEventsPerHour: number;
  mostActiveOrder: string;
  mostActiveResolver: string;
  errorRate: number;
}

export class EventHistoryManager {
  private events: EventRecord[] = [];
  private readonly MAX_EVENTS = 10000;
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  addEvent(event: Omit<EventRecord, 'id' | 'version'>): string {
    const eventRecord: EventRecord = {
      ...event,
      id: this.generateId(),
      version: '1.0.0'
    };

    this.events.push(eventRecord);

    // Keep events under limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    return eventRecord.id;
  }

  queryEvents(query: EventQuery): EventRecord[] {
    let filteredEvents = [...this.events];

    // Filter by event types
    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        query.eventTypes!.includes(event.eventType)
      );
    }

    // Filter by order hashes
    if (query.orderHashes && query.orderHashes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        event.metadata.orderHash && query.orderHashes!.includes(event.metadata.orderHash)
      );
    }

    // Filter by resolvers
    if (query.resolvers && query.resolvers.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        event.metadata.resolver && query.resolvers!.includes(event.metadata.resolver)
      );
    }

    // Filter by chain IDs
    if (query.chainIds && query.chainIds.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        event.metadata.chainId && query.chainIds!.includes(event.metadata.chainId)
      );
    }

    // Filter by time range
    if (query.timeRange) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= query.timeRange!.start && event.timestamp <= query.timeRange!.end
      );
    }

    // Sort events
    if (query.sortBy) {
      filteredEvents.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (query.sortBy) {
          case 'timestamp':
            aValue = a.timestamp;
            bValue = b.timestamp;
            break;
          case 'eventType':
            aValue = a.eventType;
            bValue = b.eventType;
            break;
          case 'orderHash':
            aValue = a.metadata.orderHash || '';
            bValue = b.metadata.orderHash || '';
            break;
          default:
            aValue = a.timestamp;
            bValue = b.timestamp;
        }

        if (query.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    } else {
      // Default sort by timestamp descending
      filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Apply pagination
    if (query.offset) {
      filteredEvents = filteredEvents.slice(query.offset);
    }

    if (query.limit) {
      filteredEvents = filteredEvents.slice(0, query.limit);
    }

    return filteredEvents;
  }

  getEventsByOrder(orderHash: string, limit: number = 50): EventRecord[] {
    return this.queryEvents({
      orderHashes: [orderHash],
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  getEventsByResolver(resolver: string, limit: number = 50): EventRecord[] {
    return this.queryEvents({
      resolvers: [resolver],
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  getEventsByType(eventType: string, limit: number = 50): EventRecord[] {
    return this.queryEvents({
      eventTypes: [eventType],
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  getRecentEvents(limit: number = 50): EventRecord[] {
    return this.queryEvents({
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  getEventsInTimeRange(start: number, end: number): EventRecord[] {
    return this.queryEvents({
      timeRange: { start, end },
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  getEventById(eventId: string): EventRecord | undefined {
    return this.events.find(event => event.id === eventId);
  }

  getEventStats(): EventHistoryStats {
    const now = Date.now();
    const oneHour = 3600000;
    const oneDay = 86400000;
    const oneWeek = 604800000;
    const oneMonth = 2592000000;

    const eventsByType: Record<string, number> = {};
    const orderCounts: Record<string, number> = {};
    const resolverCounts: Record<string, number> = {};
    let errorCount = 0;

    this.events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      // Count by order
      if (event.metadata.orderHash) {
        orderCounts[event.metadata.orderHash] = (orderCounts[event.metadata.orderHash] || 0) + 1;
      }

      // Count by resolver
      if (event.metadata.resolver) {
        resolverCounts[event.metadata.resolver] = (resolverCounts[event.metadata.resolver] || 0) + 1;
      }

      // Count errors
      if (event.eventType.includes('error') || event.metadata.error) {
        errorCount++;
      }
    });

    const recentEvents = this.events.filter(event => 
      event.timestamp >= now - oneMonth
    );

    const eventsByTime = {
      lastHour: this.events.filter(event => event.timestamp >= now - oneHour).length,
      lastDay: this.events.filter(event => event.timestamp >= now - oneDay).length,
      lastWeek: this.events.filter(event => event.timestamp >= now - oneWeek).length,
      lastMonth: this.events.filter(event => event.timestamp >= now - oneMonth).length
    };

    const mostActiveOrder = Object.entries(orderCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const mostActiveResolver = Object.entries(resolverCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByTime,
      averageEventsPerHour: eventsByTime.lastHour,
      mostActiveOrder,
      mostActiveResolver,
      errorRate: this.events.length > 0 ? errorCount / this.events.length : 0
    };
  }

  searchEvents(searchTerm: string, limit: number = 50): EventRecord[] {
    const term = searchTerm.toLowerCase();
    
    return this.events.filter(event => 
      event.eventType.toLowerCase().includes(term) ||
      event.metadata.orderHash?.toLowerCase().includes(term) ||
      event.metadata.resolver?.toLowerCase().includes(term) ||
      JSON.stringify(event.data).toLowerCase().includes(term)
    ).slice(0, limit);
  }

  getEventTimeline(orderHash: string): EventRecord[] {
    return this.queryEvents({
      orderHashes: [orderHash],
      sortBy: 'timestamp',
      sortOrder: 'asc'
    });
  }

  getErrorEvents(limit: number = 50): EventRecord[] {
    return this.events.filter(event => 
      event.eventType.includes('error') || 
      event.metadata.error ||
      event.metadata.status === 'failed'
    ).slice(0, limit);
  }

  getRecoveryEvents(limit: number = 50): EventRecord[] {
    return this.events.filter(event => 
      event.eventType.includes('recovery') ||
      event.metadata.recoveryId
    ).slice(0, limit);
  }

  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'eventType', 'timestamp', 'orderHash', 'resolver', 'chainId', 'data'];
      const rows = this.events.map(event => [
        event.id,
        event.eventType,
        event.timestamp,
        event.metadata.orderHash || '',
        event.metadata.resolver || '',
        event.metadata.chainId || '',
        JSON.stringify(event.data)
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      return JSON.stringify(this.events, null, 2);
    }
  }

  clearOldEvents(olderThan: number): number {
    const cutoff = Date.now() - olderThan;
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp >= cutoff);
    
    const removedCount = initialCount - this.events.length;
    console.log(`🧹 Cleared ${removedCount} old events`);
    
    return removedCount;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.clearOldEvents(24 * 60 * 60 * 1000); // Clear events older than 24 hours
    }, this.CLEANUP_INTERVAL);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
} 