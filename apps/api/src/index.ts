// SynapPay API - Cloudflare Workers
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SwapService } from './services/swap-service';
import { FusionPlusService } from './services/fusion-plus-service';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    ONEINCH_API_KEY: string;
    ENVIRONMENT: string;
  };
}>();

app.use('*', cors({
  origin: ['https://synappay.com', 'https://app.synappay.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'synappay-api',
    environment: c.env.ENVIRONMENT,
    timestamp: Date.now()
  });
});

// Swap Intent Management
app.post('/api/v1/swaps/create', async (c) => {
  try {
    const body = await c.req.json();
    const swapService = new SwapService(c.env.DB);
    const swapIntent = await swapService.createSwapIntent(body);
    
    return c.json({ 
      success: true, 
      data: swapIntent,
      timestamp: Date.now()
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    }, 400);
  }
});

app.get('/api/v1/swaps/:id', async (c) => {
  try {
    const swapId = c.req.param('id');
    const swapService = new SwapService(c.env.DB);
    const swapIntent = await swapService.getSwapIntent(swapId);
    
    return c.json({ 
      success: true, 
      data: swapIntent,
      timestamp: Date.now()
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    }, 404);
  }
});

app.get('/api/v1/swaps', async (c) => {
  try {
    const swapService = new SwapService(c.env.DB);
    const swaps = await swapService.getActiveSwaps();
    
    return c.json({ 
      success: true, 
      data: swaps,
      timestamp: Date.now()
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    }, 500);
  }
});

// 1inch Fusion+ Proxy
app.post('/api/v1/fusion-plus/quote', async (c) => {
  try {
    const body = await c.req.json();
    const fusionService = new FusionPlusService(c.env.ONEINCH_API_KEY);
    const quote = await fusionService.getQuote(body);
    
    return c.json({ 
      success: true, 
      data: quote,
      timestamp: Date.now()
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    }, 400);
  }
});

app.post('/api/v1/fusion-plus/order', async (c) => {
  try {
    const body = await c.req.json();
    const fusionService = new FusionPlusService(c.env.ONEINCH_API_KEY);
    const order = await fusionService.createOrder(body);
    
    return c.json({ 
      success: true, 
      data: order,
      timestamp: Date.now()
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    }, 400);
  }
});

export default app;