// SynapPay Monitoring Service
export interface MonitoringEvent {
  type: 'error' | 'warning' | 'info' | 'success';
  service: string;
  message: string;
  details?: any;
  timestamp: number;
  environment: string;
}

export interface PerformanceMetrics {
  service: string;
  endpoint: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
}

export class MonitoringService {
  private events: MonitoringEvent[] = [];
  private metrics: PerformanceMetrics[] = [];
  private maxEvents = 1000;
  private maxMetrics = 1000;

  constructor(private environment: string) {}

  /**
   * Log an event
   */
  logEvent(type: MonitoringEvent['type'], service: string, message: string, details?: any): void {
    const event: MonitoringEvent = {
      type,
      service,
      message,
      details,
      timestamp: Date.now(),
      environment: this.environment
    };

    this.events.push(event);
    
    // Keep only the latest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (this.environment === 'development') {
      console.log(`[${type.toUpperCase()}] ${service}: ${message}`, details || '');
    }

    // In production, you would send to external monitoring service
    if (this.environment === 'production') {
      this.sendToExternalService(event);
    }
  }

  /**
   * Log performance metrics
   */
  logMetrics(service: string, endpoint: string, responseTime: number, statusCode: number): void {
    const metric: PerformanceMetrics = {
      service,
      endpoint,
      responseTime,
      statusCode,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): MonitoringEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    const recentEvents = this.getRecentEvents(100);
    const errors = recentEvents.filter(e => e.type === 'error');
    return recentEvents.length > 0 ? (errors.length / recentEvents.length) * 100 : 0;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(): number {
    const recentMetrics = this.getPerformanceMetrics(100);
    if (recentMetrics.length === 0) return 0;
    
    const totalTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return totalTime / recentMetrics.length;
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    avgResponseTime: number;
    recentErrors: number;
  } {
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();
    const recentErrors = this.getRecentEvents(10).filter(e => e.type === 'error').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 10 || avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 5 || avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      errorRate,
      avgResponseTime,
      recentErrors
    };
  }

  /**
   * Send event to external monitoring service (e.g., Sentry, DataDog)
   */
  private async sendToExternalService(event: MonitoringEvent): Promise<void> {
    try {
      // Example: Send to external monitoring service
      // await fetch('https://api.monitoring-service.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
      
      // For now, just log to console
      console.log('External monitoring event:', event);
    } catch (error) {
      console.error('Failed to send event to external service:', error);
    }
  }

  /**
   * Clear old events and metrics
   */
  clearOldData(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.events = this.events.filter(e => e.timestamp > oneHourAgo);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }

  /**
   * Get monitoring summary
   */
  getSummary(): {
    totalEvents: number;
    totalMetrics: number;
    errorRate: number;
    avgResponseTime: number;
    healthStatus: string;
  } {
    const health = this.getHealthStatus();
    
    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime,
      healthStatus: health.status
    };
  }
} 