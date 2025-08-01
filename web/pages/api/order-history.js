import FusionClient from '../../lib/fusion-client';

let fusionClient = null;

// Initialize Fusion client
async function initializeFusionClient() {
  if (!fusionClient) {
    fusionClient = new FusionClient();
  }
  return fusionClient;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    const client = await initializeFusionClient();
    
    // Mock order history for now
    const mockOrders = [
      {
        orderHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'FILLED',
        makerAsset: 'ETH',
        takerAsset: 'USDC',
        makerAmount: '1000000000000000000', // 1 ETH
        takerAmount: '2847000000', // 2847 USDC
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        filledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        price: '2847',
        priceImpact: '0.15%'
      },
      {
        orderHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: 'ACTIVE',
        makerAsset: 'ETH',
        takerAsset: 'USDC',
        makerAmount: '500000000000000000', // 0.5 ETH
        takerAmount: '1423500000', // 1423.5 USDC
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        filledAt: null,
        price: '2847',
        priceImpact: '0.08%'
      },
      {
        orderHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        status: 'EXPIRED',
        makerAsset: 'ETH',
        takerAsset: 'USDC',
        makerAmount: '200000000000000000', // 0.2 ETH
        takerAmount: '569400000', // 569.4 USDC
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        filledAt: null,
        price: '2847',
        priceImpact: '0.05%'
      }
    ];

    const orderHistory = {
      success: true,
      address: address,
      orders: mockOrders,
      stats: {
        totalOrders: mockOrders.length,
        filledOrders: mockOrders.filter(o => o.status === 'FILLED').length,
        activeOrders: mockOrders.filter(o => o.status === 'ACTIVE').length,
        expiredOrders: mockOrders.filter(o => o.status === 'EXPIRED').length,
        totalVolume: mockOrders.reduce((sum, o) => sum + parseFloat(o.makerAmount) / 1e18, 0).toFixed(2) + ' ETH'
      }
    };

    res.status(200).json(orderHistory);

  } catch (error) {
    console.error('Error getting order history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper functions
function getStatusDescription(status) {
  const descriptions = {
    'ACTIVE': 'Waiting for resolver',
    'FILLED': 'Resolver found - Swap completed',
    'EXPIRED': 'Auction expired - Refund available',
    'CANCELLED': 'Order cancelled',
    'UNKNOWN': 'Status unknown'
  };
  return descriptions[status] || 'Processing';
}

function calculateSlippage(order, stats) {
  if (!stats || !stats.finalPrice) return 0;
  
  const initialPrice = order.makingAmount / order.takingAmount;
  const finalPrice = stats.finalPrice;
  const slippage = Math.abs((initialPrice - finalPrice) / initialPrice) * 100;
  
  return Math.round(slippage * 100) / 100; // Round to 2 decimal places
}

function calculatePriceImpact(order, stats) {
  if (!stats || !stats.finalPrice) return 0;
  
  // Simplified price impact calculation
  const expectedRate = order.makingAmount / order.takingAmount;
  const actualRate = stats.finalPrice;
  const impact = Math.abs((expectedRate - actualRate) / expectedRate) * 100;
  
  return Math.round(impact * 100) / 100; // Round to 2 decimal places
} 