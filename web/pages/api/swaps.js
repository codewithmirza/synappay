export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create swap - simplified for demo
    try {
      const { direction, amount, receiver, asset, timelock } = req.body;

      // Demo response - in production this would call the actual relayer
      const swapId = `swap_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      res.status(200).json({
        success: true,
        swapId: swapId,
        fusionStatus: 'AUCTION_ACTIVE',
        fusionOrderHash: `order_${Math.random().toString(36).substring(7)}`,
        auctionActive: true,
        message: 'Demo swap created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Get system status
    try {
      res.status(200).json({
        success: true,
        status: {
          ethereum: 'connected',
          stellar: 'connected',
          fusion: 'active',
          relayer: 'running'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 