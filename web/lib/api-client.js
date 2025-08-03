// SynapPay API Client - Connects to our Cloudflare Workers API
class SynapPayAPIClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_SYNAPPAY_API_URL;
    this.coordinatorWS = process.env.NEXT_PUBLIC_COORDINATOR_WS_URL;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('API health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Create swap intent
  async createSwapIntent(swapData) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/swaps/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapData)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create swap intent');
      }
      
      return result.data;
    } catch (error) {
      console.error('Create swap intent failed:', error);
      throw error;
    }
  }

  // Get swap status
  async getSwapStatus(swapId) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/swaps/${swapId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get swap status');
      }
      
      return result.data;
    } catch (error) {
      console.error('Get swap status failed:', error);
      throw error;
    }
  }

  // Get active swaps
  async getActiveSwaps() {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/swaps`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get active swaps');
      }
      
      return result.data;
    } catch (error) {
      console.error('Get active swaps failed:', error);
      return [];
    }
  }

  // Get 1inch Fusion+ quote
  async getFusionPlusQuote(quoteParams) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/fusion-plus/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteParams)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get quote');
      }
      
      return result.data;
    } catch (error) {
      console.error('Get Fusion+ quote failed:', error);
      throw error;
    }
  }

  // Create 1inch Fusion+ order
  async createFusionPlusOrder(orderData) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/fusion-plus/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }
      
      return result.data;
    } catch (error) {
      console.error('Create Fusion+ order failed:', error);
      throw error;
    }
  }

  // WebSocket connection to coordinator
  connectToCoordinator(callbacks = {}) {
    try {
      const wsUrl = this.coordinatorWS.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔗 Connected to SynapPay Coordinator');
        if (callbacks.onOpen) callbacks.onOpen();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Coordinator message:', data);
          if (callbacks.onMessage) callbacks.onMessage(data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('📡 Disconnected from SynapPay Coordinator');
        if (callbacks.onClose) callbacks.onClose();
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (callbacks.onError) callbacks.onError(error);
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to connect to coordinator:', error);
      return null;
    }
  }
}

// Create singleton instance
const apiClient = new SynapPayAPIClient();

export default apiClient;