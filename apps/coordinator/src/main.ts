// SynapPay Coordinator - Simplified version following Synappay architecture
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SynapPayCoordinator {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private isRunning: boolean = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'synappay-coordinator',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        isRunning: this.isRunning
      });
    });

    // Status endpoint
    this.app.get('/status', (req: Request, res: Response) => {
      res.json({
        coordinator: {
          running: this.isRunning,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        config: {
          ethereumRpc: process.env.ETHEREUM_RPC_URL ? 'configured' : 'missing',
          stellarHorizon: process.env.STELLAR_HORIZON_URL ? 'configured' : 'missing',
          htlcContracts: {
            ethereum: process.env.ETHEREUM_HTLC_CONTRACT_ADDRESS ? 'configured' : 'missing',
            stellar: process.env.STELLAR_HTLC_CONTRACT_ADDRESS ? 'configured' : 'missing'
          }
        }
      });
    });

    // API endpoints for swap coordination
    this.app.post('/api/swaps/create', (req: Request, res: Response) => {
      console.log('Swap creation request:', req.body);
      res.json({
        success: true,
        message: 'Swap coordination initiated',
        swapId: `swap_${Date.now()}`,
        timestamp: Date.now()
      });
    });

    this.app.get('/api/swaps/:id', (req: Request, res: Response) => {
      const swapId = req.params.id;
      console.log('Swap status request:', swapId);
      res.json({
        swapId,
        status: 'pending',
        timestamp: Date.now()
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: any) => {
      console.log('🔗 Client connected to WebSocket');

      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to SynapPay Coordinator',
        timestamp: Date.now()
      }));

      ws.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 Client disconnected from WebSocket');
      });

      ws.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleWebSocketMessage(ws: any, data: any) {
    console.log('📨 WebSocket message received:', data);

    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        break;

      case 'subscribe_swap':
        ws.send(JSON.stringify({
          type: 'swap_subscribed',
          swapId: data.swapId,
          message: `Subscribed to swap ${data.swapId}`,
          timestamp: Date.now()
        }));
        break;

      case 'get_status':
        ws.send(JSON.stringify({
          type: 'status',
          coordinator: {
            running: this.isRunning,
            connections: this.wss.clients.size
          },
          timestamp: Date.now()
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`,
          timestamp: Date.now()
        }));
    }
  }

  async start() {
    const port = process.env.PORT || 3001;

    try {
      console.log('🚀 Starting SynapPay Coordinator...');
      console.log('📋 Configuration:');
      console.log(`   - Port: ${port}`);
      console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - Ethereum RPC: ${process.env.ETHEREUM_RPC_URL ? '✅ Configured' : '❌ Missing'}`);
      console.log(`   - Stellar Horizon: ${process.env.STELLAR_HORIZON_URL ? '✅ Configured' : '❌ Missing'}`);
      console.log(`   - CORS Origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);

      // Start server
      this.server.listen(port, () => {
        this.isRunning = true;
        console.log(`✅ SynapPay Coordinator running on port ${port}`);
        console.log(`📡 WebSocket server ready`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`📊 Status endpoint: http://localhost:${port}/status`);
      });

    } catch (error) {
      console.error('❌ Failed to start coordinator:', error);
      process.exit(1);
    }
  }

  stop() {
    console.log('🛑 Stopping SynapPay Coordinator...');
    this.isRunning = false;
    this.server.close();
    this.wss.close();
  }
}

// Start the coordinator
const coordinator = new SynapPayCoordinator();
coordinator.start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📨 Received SIGTERM, shutting down gracefully');
  coordinator.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📨 Received SIGINT, shutting down gracefully');
  coordinator.stop();
  process.exit(0);
});

export default coordinator;