import FusionClient from '../../../src/fusion/client';

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
    const { maker } = req.query;
    
    if (!maker) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maker address is required' 
      });
    }

    const client = await initializeFusionClient();
    
    // Get all orders for the maker
    const ordersResult = await client.getActiveOrders(maker);
    
    if (!ordersResult.success) {
      return res.status(500).json({
        success: false,
        error: ordersResult.error
      });
    }

    // Enhance each order with detailed status and auction information
    const enhancedOrders = await Promise.all(
      ordersResult.orders.map(async (order) => {
        try {
          // Get detailed status for each order
          const [orderStatus, auctionStatus, auctionStats] = await Promise.all([
            client.getOrderStatus(order.orderHash),
            client.getAuctionStatus(order.orderHash),
            client.getAuctionStats(order.orderHash)
          ]);

          return {
            orderHash: order.orderHash,
            maker: order.maker,
            makerAsset: order.makerAsset,
            takerAsset: order.takerAsset,
            makingAmount: order.makingAmount,
            takingAmount: order.takingAmount,
            createdAt: order.createdAt || Date.now(),
            
            // Enhanced status information
            status: {
              current: auctionStatus.status || 'ACTIVE',
              description: getStatusDescription(auctionStatus.status),
              canRefund: auctionStatus.status === 'EXPIRED',
              canClaim: auctionStatus.status === 'FILLED'
            },
            
            // Auction details
            auction: {
              isActive: auctionStatus.status === 'ACTIVE',
              resolverCount: auctionStatus.resolvers || 0,
              bestOffer: auctionStatus.bestOffer,
              timeElapsed: auctionStatus.elapsed || 0,
              finalResolver: auctionStatus.status === 'FILLED' ? auctionStatus.bestOffer : null
            },
            
            // Fill information
            fill: {
              wasFilled: auctionStatus.status === 'FILLED',
              wasExpired: auctionStatus.status === 'EXPIRED',
              wasRefunded: auctionStatus.status === 'EXPIRED',
              finalPrice: auctionStats.success ? auctionStats.stats?.finalPrice : null,
              slippage: calculateSlippage(order, auctionStats.success ? auctionStats.stats : null),
              fillTime: auctionStatus.status === 'FILLED' ? Date.now() : null
            },
            
            // Price and slippage information
            pricing: {
              initialPrice: order.makingAmount / order.takingAmount,
              finalPrice: auctionStats.success ? auctionStats.stats?.finalPrice : null,
              slippage: calculateSlippage(order, auctionStats.success ? auctionStats.stats : null),
              priceImpact: calculatePriceImpact(order, auctionStats.success ? auctionStats.stats : null)
            }
          };
        } catch (error) {
          console.error(`Error enhancing order ${order.orderHash}:`, error);
          return {
            ...order,
            status: { current: 'ERROR', description: 'Error loading status' },
            auction: { isActive: false, resolverCount: 0 },
            fill: { wasFilled: false, wasExpired: false, wasRefunded: false },
            pricing: { initialPrice: 0, finalPrice: 0, slippage: 0, priceImpact: 0 }
          };
        }
      })
    );

    // Group orders by status for better organization
    const organizedHistory = {
      active: enhancedOrders.filter(order => order.auction.isActive),
      completed: enhancedOrders.filter(order => order.fill.wasFilled),
      expired: enhancedOrders.filter(order => order.fill.wasExpired),
      refunded: enhancedOrders.filter(order => order.fill.wasRefunded)
    };

    res.status(200).json({
      success: true,
      orders: enhancedOrders,
      organized: organizedHistory,
      summary: {
        total: enhancedOrders.length,
        active: organizedHistory.active.length,
        completed: organizedHistory.completed.length,
        expired: organizedHistory.expired.length,
        refunded: organizedHistory.refunded.length
      }
    });

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