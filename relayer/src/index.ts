import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { EventEmitter } from 'events';
import { ethers } from 'ethers';

// Advanced Services
import { FusionEventManager } from './event-handlers';
import { OrdersService } from './orders';
import { ProgressiveFillManager } from './partial-fills';
import { GasPriceTracker } from './gas-tracker';
import { UptimeMonitor } from './monitoring';
import { ClientSubscriptionManager } from './client-subscriptions';
import { EventHistoryManager } from './event-history';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize advanced services
const ordersService = new OrdersService();
const eventManager = new FusionEventManager(ordersService);
const gasTracker = new GasPriceTracker();
const progressiveFillManager = new ProgressiveFillManager(gasTracker);
const monitoringService = new UptimeMonitor();
const clientSubscriptionManager = new ClientSubscriptionManager(eventManager);
const eventHistoryManager = new EventHistoryManager();

// Connect services
eventManager.setProgressiveFillManager(progressiveFillManager);

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthMetrics = monitoringService.getMetrics();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    metrics: healthMetrics
  });
});

// Advanced API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    service: 'SynapPay Advanced Relayer',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/api/v1/status',
      websocket: '/ws',
      orders: '/api/v1/orders',
      events: '/api/v1/events',
      gas: '/api/v1/gas',
      monitoring: '/api/v1/monitoring'
    }
  });
});

// Orders API
app.get('/api/v1/orders', (req, res) => {
  const { page = 1, limit = 10, srcChain, dstChain } = req.query;
  const orders = ordersService.getActiveOrders(
    Number(page), 
    Number(limit), 
    srcChain ? Number(srcChain) : undefined,
    dstChain ? Number(dstChain) : undefined
  );
  res.json(orders);
});

// Events API
app.get('/api/v1/events', (req, res) => {
  const { limit = 50, eventType, orderHash } = req.query;
  const events = eventHistoryManager.queryEvents({
    limit: Number(limit),
    eventTypes: eventType ? [eventType as any] : undefined,
    orderHashes: orderHash ? [orderHash as string] : undefined
  });
  res.json(events);
});

// Gas API
app.get('/api/v1/gas', (req, res) => {
  const gasPrice = gasTracker.getCurrentGasPrice();
  const congestion = gasTracker.getNetworkCongestion();
  res.json({
    gasPrice,
    congestion,
    recommendations: {
      optimal: gasTracker.getOptimalGasPrice('standard'),
      fast: gasTracker.getOptimalGasPrice('fast'),
      slow: gasTracker.getOptimalGasPrice('slow')
    }
  });
});

// Monitoring API
app.get('/api/v1/monitoring', (req, res) => {
  const metrics = monitoringService.getMetrics();
  const health = monitoringService.getHealthStatus();
  res.json({
    metrics,
    health,
    summary: monitoringService.getSummary()
  });
});

// Partial Fills API
app.post('/api/v1/partial-fills', async (req, res) => {
  try {
    const { orderId, fragmentIndex, fillAmount, resolver, secretHash, merkleProof } = req.body;
    const result = await progressiveFillManager.executePartialFill(
      orderId,
      fragmentIndex,
      fillAmount,
      resolver,
      secretHash,
      merkleProof
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection established');

  // Register client
  const clientId = clientSubscriptionManager.registerClient({
    id: `client_${Date.now()}`,
    connectionType: 'websocket',
    connected: true,
    userAgent: req.headers['user-agent'],
    ipAddress: req.socket.remoteAddress,
    metadata: {}
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    message: 'Connected to SynapPay Advanced Relayer',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);

      // Handle subscription requests
      if (message.type === 'subscribe') {
        const subscriptionId = clientSubscriptionManager.createSubscription({
          clientId,
          eventTypes: message.eventTypes || ['order_created', 'order_filled'],
          filters: message.filters || {},
          priority: message.priority || 'medium'
        });

        ws.send(JSON.stringify({
          type: 'subscription_created',
          subscriptionId,
          timestamp: new Date().toISOString()
        }));
      }

      // Handle order creation
      if (message.type === 'create_order') {
        const orderHash = ordersService.addOrder(message.order);
        ws.send(JSON.stringify({
          type: 'order_created',
          orderHash,
          timestamp: new Date().toISOString()
        }));
      }

      // Echo back for other messages
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clientSubscriptionManager.unregisterClient(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start monitoring services
monitoringService.startMonitoring();
gasTracker.startMonitoring();

// Register services for monitoring
monitoringService.registerService('orders', async () => ({
  status: 'healthy',
  uptime: process.uptime(),
  lastCheck: Date.now(),
  responseTime: 0,
  errorRate: 0,
  details: {
    activeOrders: ordersService.getOrderCount(),
    totalOrders: ordersService.getOrderCount()
  }
}));

monitoringService.registerService('gas_tracker', async () => ({
  status: 'healthy',
  uptime: process.uptime(),
  lastCheck: Date.now(),
  responseTime: 0,
  errorRate: 0,
  details: {
    currentGasPrice: gasTracker.getCurrentGasPrice(),
    networkCongestion: gasTracker.getNetworkCongestion()
  }
}));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  monitoringService.logEvent('error', 'server', err.message, err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api/v1/status',
      'GET /api/v1/orders',
      'GET /api/v1/events',
      'GET /api/v1/gas',
      'GET /api/v1/monitoring',
      'POST /api/v1/partial-fills',
      'WS /ws'
    ]
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SynapPay Advanced Relayer running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`🔒 CORS Origin: ${CORS_ORIGIN}`);
  console.log(`📊 Monitoring: http://localhost:${PORT}/api/v1/monitoring`);
  console.log(`⛽ Gas tracking: http://localhost:${PORT}/api/v1/gas`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  monitoringService.stopMonitoring();
  gasTracker.stopMonitoring();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  monitoringService.stopMonitoring();
  gasTracker.stopMonitoring();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 