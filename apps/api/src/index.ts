// SynapPay API - Cloudflare Workers
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SwapService } from './services/swap-service';
import { FusionPlusService } from './services/fusion-plus-service';
import { CoinGeckoService } from './services/coingecko-service';
import { PartialFillService } from './services/partial-fill-service';
import { RelayerService } from './services/relayer-service';
import { MonitoringService } from './services/monitoring-service';

// Cloudflare Workers types
interface Env {
  DB: D1Database;
  ONEINCH_API_KEY: string;
  ENVIRONMENT: string;
  RELAYER_PRIVATE_KEY: string;
  RELAYER_STELLAR_SECRET: string;
  ETHEREUM_RPC_URL: string;
  STELLAR_HORIZON_URL: string;
}

const app = new Hono();

// Initialize monitoring service with environment from context
let monitoring: MonitoringService;

// Monitoring middleware
app.use('*', async (c, next) => {
  // Initialize monitoring service with proper environment
  if (!monitoring) {
    const environment = c.env?.ENVIRONMENT || 'development';
    monitoring = new MonitoringService(environment);
  }
  
  const startTime = Date.now();
  
  try {
    await next();
    
    // Log successful request
    const responseTime = Date.now() - startTime;
    monitoring.logMetrics('api', c.req.path, responseTime, c.res.status);
    
  } catch (error) {
    // Log error
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'api', `Request failed: ${c.req.path}`, {
      error: errorMessage,
      path: c.req.path,
      responseTime
    });
    monitoring.logMetrics('api', c.req.path, responseTime, 500);
    throw error;
  }
});

app.use('*', cors({
  origin: ['https://synappay.com', 'https://app.synappay.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  if (!monitoring) {
    const environment = c.env?.ENVIRONMENT || 'development';
    monitoring = new MonitoringService(environment);
  }
  
  const health = monitoring.getHealthStatus();
  
  return c.json({ 
    status: health.status, 
    service: 'synappay-api',
    environment: c.env?.ENVIRONMENT || 'development',
    timestamp: Date.now(),
    metrics: {
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime,
      recentErrors: health.recentErrors
    }
  });
});

// Monitoring endpoints
app.get('/api/v1/monitoring/status', (c) => {
  if (!monitoring) {
    const environment = c.env?.ENVIRONMENT || 'development';
    monitoring = new MonitoringService(environment);
  }
  
  const summary = monitoring.getSummary();
  
  return c.json({ 
    success: true, 
    data: summary,
    timestamp: Date.now()
  });
});

app.get('/api/v1/monitoring/events', (c) => {
  if (!monitoring) {
    const environment = c.env?.ENVIRONMENT || 'development';
    monitoring = new MonitoringService(environment);
  }
  
  const limit = parseInt(c.req.query('limit') || '50');
  const events = monitoring.getRecentEvents(limit);
  
  return c.json({ 
    success: true, 
    data: events,
    timestamp: Date.now()
  });
});

app.get('/api/v1/monitoring/metrics', (c) => {
  if (!monitoring) {
    const environment = c.env?.ENVIRONMENT || 'development';
    monitoring = new MonitoringService(environment);
  }
  
  const limit = parseInt(c.req.query('limit') || '100');
  const metrics = monitoring.getPerformanceMetrics(limit);
  
  return c.json({ 
    success: true, 
    data: metrics,
    timestamp: Date.now()
  });
});

// Swap endpoints
app.post('/api/v1/swaps/intent', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const swapService = new SwapService(c.env.DB);
    const body = await c.req.json();
    
    const result = await swapService.createSwapIntent(body);
    monitoring.logEvent('success', 'swap-service', 'Swap intent created', { swapId: result.id });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'swap-service', 'Failed to create swap intent', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.get('/api/v1/swaps/:swapId', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const swapService = new SwapService(c.env.DB);
    const swapId = c.req.param('swapId');
    
    const result = await swapService.getSwapIntent(swapId);
    monitoring.logEvent('success', 'swap-service', 'Swap intent retrieved', { swapId });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'swap-service', 'Failed to get swap intent', { swapId: c.req.param('swapId'), error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.get('/api/v1/swaps', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const swapService = new SwapService(c.env.DB);
    const result = await swapService.getActiveSwaps();
    monitoring.logEvent('success', 'swap-service', 'Active swaps retrieved');
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'swap-service', 'Failed to get active swaps', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

// 1inch Fusion+ endpoints
app.post('/api/v1/fusion-plus/quote', async (c) => {
  try {
    if (!c.env?.ONEINCH_API_KEY) {
      return c.json({ success: false, error: '1inch API key not configured' }, 500);
    }
    
    const fusionService = new FusionPlusService(c.env.ONEINCH_API_KEY);
    const body = await c.req.json();
    
    const result = await fusionService.getQuote(body);
    monitoring.logEvent('success', 'fusion-plus', 'Quote retrieved', { fromToken: body.fromToken, toToken: body.toToken });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'fusion-plus', 'Failed to get quote', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.post('/api/v1/fusion-plus/order', async (c) => {
  try {
    if (!c.env?.ONEINCH_API_KEY) {
      return c.json({ success: false, error: '1inch API key not configured' }, 500);
    }
    
    const fusionService = new FusionPlusService(c.env.ONEINCH_API_KEY);
    const body = await c.req.json();
    
    const result = await fusionService.createOrder(body);
    monitoring.logEvent('success', 'fusion-plus', 'Order created', { orderId: result.orderId });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'fusion-plus', 'Failed to create order', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

// Price endpoints
app.get('/api/v1/prices/:tokenId', async (c) => {
  try {
    const priceService = new CoinGeckoService();
    const tokenId = c.req.param('tokenId');
    
    const result = await priceService.getTokenPrice(tokenId);
    monitoring.logEvent('success', 'price-service', 'Token price retrieved', { tokenId });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'price-service', 'Failed to get token price', { tokenId: c.req.param('tokenId'), error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.get('/api/v1/prices/exchange-rate/:fromToken/:toToken', async (c) => {
  try {
    const priceService = new CoinGeckoService();
    const fromToken = c.req.param('fromToken');
    const toToken = c.req.param('toToken');
    
    const result = await priceService.getExchangeRate(fromToken, toToken);
    monitoring.logEvent('success', 'price-service', 'Exchange rate retrieved', { fromToken, toToken });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'price-service', 'Failed to get exchange rate', { 
      fromToken: c.req.param('fromToken'), 
      toToken: c.req.param('toToken'), 
      error: errorMessage 
    });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

// Partial fill endpoints
app.post('/api/v1/partial-fills', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const partialFillService = new PartialFillService(c.env.DB);
    const body = await c.req.json();
    
    const result = await partialFillService.processPartialFill(body);
    monitoring.logEvent('success', 'partial-fill', 'Partial fill processed', { swapId: body.swapId });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'partial-fill', 'Failed to process partial fill', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.get('/api/v1/partial-fills/:swapId', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const partialFillService = new PartialFillService(c.env.DB);
    const swapId = c.req.param('swapId');
    
    const result = await partialFillService.getPartialFills(swapId);
    monitoring.logEvent('success', 'partial-fill', 'Partial fills retrieved', { swapId });
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'partial-fill', 'Failed to get partial fills', { swapId: c.req.param('swapId'), error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

// Relayer endpoints
app.get('/api/v1/relayer/status', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const relayerConfig = {
      ethereumPrivateKey: c.env.RELAYER_PRIVATE_KEY || '',
      stellarSecretKey: c.env.RELAYER_STELLAR_SECRET || '',
      ethereumRpcUrl: c.env.ETHEREUM_RPC_URL || '',
      stellarHorizonUrl: c.env.STELLAR_HORIZON_URL || '',
      isTestnet: c.env.ENVIRONMENT === 'development',
    };
    
    const relayerService = new RelayerService(c.env.DB, relayerConfig);
    const result = relayerService.getStatus();
    monitoring.logEvent('success', 'relayer', 'Relayer status retrieved');
    
    return c.json({ success: true, data: result });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'relayer', 'Failed to get relayer status', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.post('/api/v1/relayer/start', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const relayerConfig = {
      ethereumPrivateKey: c.env.RELAYER_PRIVATE_KEY || '',
      stellarSecretKey: c.env.RELAYER_STELLAR_SECRET || '',
      ethereumRpcUrl: c.env.ETHEREUM_RPC_URL || '',
      stellarHorizonUrl: c.env.STELLAR_HORIZON_URL || '',
      isTestnet: c.env.ENVIRONMENT === 'development',
    };
    
    const relayerService = new RelayerService(c.env.DB, relayerConfig);
    await relayerService.start();
    monitoring.logEvent('success', 'relayer', 'Relayer started');
    
    return c.json({ success: true, message: 'Relayer started successfully' });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'relayer', 'Failed to start relayer', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

app.post('/api/v1/relayer/stop', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }
    
    const relayerConfig = {
      ethereumPrivateKey: c.env.RELAYER_PRIVATE_KEY || '',
      stellarSecretKey: c.env.RELAYER_STELLAR_SECRET || '',
      ethereumRpcUrl: c.env.ETHEREUM_RPC_URL || '',
      stellarHorizonUrl: c.env.STELLAR_HORIZON_URL || '',
      isTestnet: c.env.ENVIRONMENT === 'development',
    };
    
    const relayerService = new RelayerService(c.env.DB, relayerConfig);
    relayerService.stop();
    monitoring.logEvent('success', 'relayer', 'Relayer stopped');
    
    return c.json({ success: true, message: 'Relayer stopped successfully' });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitoring.logEvent('error', 'relayer', 'Failed to stop relayer', { error: errorMessage });
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      timestamp: Date.now()
    }, 500);
  }
});

export default app;