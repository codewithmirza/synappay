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
    const { orderHash } = req.query;
    
    if (!orderHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order hash is required' 
      });
    }

    const client = await initializeFusionClient();
    
    // Get comprehensive auction status
    const [orderStatus, auctionStatus, auctionStats] = await Promise.all([
      client.getOrderStatus(orderHash),
      client.getAuctionStatus(orderHash),
      client.getAuctionStats(orderHash)
    ]);

    if (!orderStatus.success) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or invalid'
      });
    }

    // Combine all status information
    const comprehensiveStatus = {
      success: true,
      orderHash: orderHash,
      order: orderStatus.order,
      auction: {
        status: auctionStatus.status || 'UNKNOWN',
        resolvers: auctionStatus.resolvers || 0,
        bestOffer: auctionStatus.bestOffer,
        elapsed: auctionStatus.elapsed || 0
      },
      stats: auctionStats.success ? auctionStats.stats : null,
      // Enhanced status mapping
      status: {
        current: auctionStatus.status || 'ACTIVE',
        description: getStatusDescription(auctionStatus.status),
        canRefund: auctionStatus.status === 'EXPIRED',
        canClaim: auctionStatus.status === 'FILLED',
        timeRemaining: calculateTimeRemaining(orderStatus.order?.deadline)
      },
      // Auction visualization data
      auction: {
        isActive: auctionStatus.status === 'ACTIVE',
        resolverCount: auctionStatus.resolvers || 0,
        bestOffer: auctionStatus.bestOffer,
        timeElapsed: auctionStatus.elapsed || 0,
        priceCurve: generatePriceCurve(auctionStats.success ? auctionStats.stats : null)
      }
    };

    res.status(200).json(comprehensiveStatus);

  } catch (error) {
    console.error('Error getting auction status:', error);
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
    'FILLED': 'Resolver found - Swap in progress',
    'EXPIRED': 'Auction expired - Refund available',
    'CANCELLED': 'Order cancelled',
    'UNKNOWN': 'Status unknown'
  };
  return descriptions[status] || 'Processing';
}

function calculateTimeRemaining(deadline) {
  if (!deadline) return null;
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;
  return remaining > 0 ? remaining : 0;
}

function generatePriceCurve(stats) {
  if (!stats) return null;
  
  // Generate price curve data for visualization
  return {
    currentPrice: stats.currentPrice || 0,
    bestPrice: stats.bestPrice || 0,
    priceHistory: stats.priceHistory || [],
    trend: stats.trend || 'stable'
  };
} 