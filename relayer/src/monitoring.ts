import { EventEmitter } from 'events';

export interface HealthMetrics {
  uptime: number;
  timestamp: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  system: SystemMetrics;
  network: NetworkMetrics;
  database: DatabaseMetrics;
  performance: PerformanceMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number;
  lastCheck: number;
  responseTime: number;
  errorRate: number;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  loadAverage: number[];
}

export interface NetworkMetrics {
  ethereum: {
    blockNumber: number;
    gasPrice: string;
    networkId: number;
    connected: boolean;
    responseTime: number;
  };
  stellar: {
    ledgerNumber: number;
    networkId: string;
    connected: boolean;
    responseTime: number;
  };
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeTransactions: number;
  queryTime: number;
  errorRate: number;
}

export interface PerformanceMetrics {
  ordersProcessed: number;
  averageOrderTime: number;
  successRate: number;
  throughput: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export class UptimeMonitor extends EventEmitter {
  private startTime: number;
  private metrics: HealthMetrics;
  private services: Map<string, ServiceHealth> = new Map();
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds: AlertThresholds;

  constructor() {
    super();
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.alertThresholds = {
      responseTime: 5000,
      errorRate: 0.1,
      memoryUsage: 0.9,
      diskUsage: 0.9,
      cpuUsage: 0.8
    };
  }

  private initializeMetrics(): HealthMetrics {
    return {
      uptime: 0,
      timestamp: Date.now(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: [],
      system: {
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        cpuUsage: 0,
        diskUsage: { used: 0, total: 0, percentage: 0 },
        loadAverage: [0, 0, 0]
      },
      network: {
        ethereum: {
          blockNumber: 0,
          gasPrice: '0',
          networkId: 1,
          connected: false,
          responseTime: 0
        },
        stellar: {
          ledgerNumber: 0,
          networkId: 'testnet',
          connected: false,
          responseTime: 0
        }
      },
      database: {
        connectionCount: 0,
        activeTransactions: 0,
        queryTime: 0,
        errorRate: 0
      },
      performance: {
        ordersProcessed: 0,
        averageOrderTime: 0,
        successRate: 1.0,
        throughput: 0,
        latency: { p50: 0, p95: 0, p99: 0 }
      }
    };
  }

  startMonitoring(interval: number = 30000): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      this.checkAlerts();
    }, interval);
    
    console.log('📊 Monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('📊 Monitoring stopped');
  }

  registerService(name: string, healthCheckFn: () => Promise<Partial<ServiceHealth>>): void {
    const service: ServiceHealth = {
      name,
      status: 'unknown',
      uptime: 0,
      lastCheck: 0,
      responseTime: 0,
      errorRate: 0
    };
    
    this.services.set(name, service);
    
    // Store the health check function for later use
    (this as any)[`healthCheck_${name}`] = healthCheckFn;
  }

  private async collectMetrics(): Promise<void> {
    const now = Date.now();
    this.metrics.uptime = now - this.startTime;
    this.metrics.timestamp = now;

    await Promise.all([
      this.collectSystemMetrics(),
      this.collectNetworkMetrics(),
      this.collectServiceMetrics()
    ]);

    this.emit('metrics_updated', this.metrics);
  }

  private async collectSystemMetrics(): Promise<void> {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal + memUsage.external;
    const usedMem = memUsage.heapUsed + memUsage.external;

    this.metrics.system = {
      memoryUsage: {
        used: usedMem,
        total: totalMem,
        percentage: (usedMem / totalMem) * 100
      },
      cpuUsage: Math.random() * 50, // Mock CPU usage
      diskUsage: {
        used: 1024 * 1024 * 1024 * 10, // 10GB
        total: 1024 * 1024 * 1024 * 100, // 100GB
        percentage: 10
      },
      loadAverage: [0.5, 0.3, 0.2]
    };
  }

  private async collectNetworkMetrics(): Promise<void> {
    // Mock network metrics
    this.metrics.network = {
      ethereum: {
        blockNumber: Math.floor(Date.now() / 1000),
        gasPrice: '20000000000',
        networkId: 1,
        connected: true,
        responseTime: Math.random() * 1000
      },
      stellar: {
        ledgerNumber: Math.floor(Date.now() / 1000),
        networkId: 'testnet',
        connected: true,
        responseTime: Math.random() * 500
      }
    };
  }

  private async collectServiceMetrics(): Promise<void> {
    const serviceChecks = Array.from(this.services.keys()).map(async (serviceName) => {
      const healthCheckFn = (this as any)[`healthCheck_${serviceName}`];
      if (healthCheckFn) {
        try {
          const startTime = Date.now();
          const result = await healthCheckFn();
          const responseTime = Date.now() - startTime;

          const service = this.services.get(serviceName)!;
          service.lastCheck = Date.now();
          service.responseTime = responseTime;
          service.status = result.status || 'healthy';
          service.errorRate = result.errorRate || 0;
          service.details = result.details;
        } catch (error: any) {
          const service = this.services.get(serviceName)!;
          service.status = 'unhealthy';
          service.errorRate = 1.0;
          service.lastCheck = Date.now();
        }
      }
    });

    await Promise.all(serviceChecks);
    this.metrics.services = Array.from(this.services.values());
  }

  private async performHealthCheck(serviceName: string): Promise<Partial<ServiceHealth>> {
    const healthCheckFn = (this as any)[`healthCheck_${serviceName}`];
    if (!healthCheckFn) {
      return { status: 'unknown' };
    }

    try {
      return await healthCheckFn();
    } catch (error: any) {
      return {
        status: 'unhealthy',
        errorRate: 1.0,
        details: { error: error?.message || 'Unknown error' }
      };
    }
  }

  private checkAlerts(): void {
    // Check system alerts
    if (this.metrics.system.memoryUsage.percentage > this.alertThresholds.memoryUsage * 100) {
      this.emit('alert', {
        type: 'system',
        severity: 'warning',
        message: 'High memory usage detected',
        details: this.metrics.system.memoryUsage
      });
    }

    // Check service alerts
    this.services.forEach((service, name) => {
      if (service.errorRate > this.alertThresholds.errorRate) {
        this.emit('alert', {
          type: 'service',
          severity: 'error',
          message: `High error rate in ${name}`,
          details: { service: name, errorRate: service.errorRate }
        });
      }
    });
  }

  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.services.get(serviceName);
  }

  getSystemStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const memoryUsage = this.metrics.system.memoryUsage.percentage;
    const cpuUsage = this.metrics.system.cpuUsage;
    const errorRate = this.metrics.performance.successRate;

    if (memoryUsage > 90 || cpuUsage > 80 || errorRate < 0.8) {
      return 'unhealthy';
    } else if (memoryUsage > 70 || cpuUsage > 60 || errorRate < 0.9) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  logEvent(type: 'error' | 'warning' | 'info' | 'success', service: string, message: string, details?: any): void {
    const event = {
      type,
      service,
      message,
      details,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    };

    this.emit('event_logged', event);
    console.log(`[${type.toUpperCase()}] ${service}: ${message}`, details || '');
  }

  logMetrics(service: string, endpoint: string, responseTime: number, statusCode: number): void {
    const metric = {
      service,
      endpoint,
      responseTime,
      statusCode,
      timestamp: Date.now()
    };

    this.emit('metric_logged', metric);
  }

  getRecentEvents(limit: number = 50): any[] {
    // In a real implementation, this would return recent events from storage
    return [];
  }

  getPerformanceMetrics(limit: number = 100): any[] {
    // In a real implementation, this would return performance metrics from storage
    return [];
  }

  getErrorRate(): number {
    const services = Array.from(this.services.values());
    if (services.length === 0) return 0;
    
    const totalErrorRate = services.reduce((sum, service) => sum + service.errorRate, 0);
    return totalErrorRate / services.length;
  }

  getAverageResponseTime(): number {
    const services = Array.from(this.services.values());
    if (services.length === 0) return 0;
    
    const totalResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0);
    return totalResponseTime / services.length;
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    avgResponseTime: number;
    recentErrors: number;
  } {
    return {
      status: this.getSystemStatus(),
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      recentErrors: 0 // Would be calculated from recent events
    };
  }

  private async sendToExternalService(event: any): Promise<void> {
    // In a real implementation, this would send to external monitoring service
    // like DataDog, New Relic, etc.
    try {
      // Mock external service call
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('📤 Sent event to external service:', event.type);
    } catch (error) {
      console.error('Failed to send event to external service:', error);
    }
  }

  clearOldData(): void {
    // In a real implementation, this would clean up old metrics and events
    console.log('🧹 Cleared old monitoring data');
  }

  getSummary(): {
    totalEvents: number;
    totalMetrics: number;
    errorRate: number;
    avgResponseTime: number;
    healthStatus: string;
  } {
    return {
      totalEvents: 0, // Would be calculated from stored events
      totalMetrics: this.services.size,
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      healthStatus: this.getSystemStatus()
    };
  }
}

interface AlertThresholds {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
}

interface Alert {
  type: 'system' | 'network' | 'service' | 'performance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
}

// Singleton instance
let monitorInstance: UptimeMonitor | null = null;

export const getMonitor = (): UptimeMonitor => {
  if (!monitorInstance) {
    monitorInstance = new UptimeMonitor();
  }
  return monitorInstance;
}; 