import CrossChainRelayer from '../../../src/relayer/index';

let relayer = null;

// Initialize relayer
async function initializeRelayer() {
  if (!relayer) {
    relayer = new CrossChainRelayer();
    
    // Use environment variable for contract address
    const contractAddress = process.env.HTLC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('HTLC_CONTRACT_ADDRESS environment variable is required');
    }
    
    await relayer.initialize(contractAddress);
  }
  return relayer;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create swap
    try {
      const relayer = await initializeRelayer();
      const { direction, amount, receiver, asset, timelock } = req.body;

      let result;
      if (direction === 'eth_to_stellar') {
        result = await relayer.createEthToStellarSwap({
          stellarReceiver: receiver,
          ethAmount: parseFloat(amount),
          stellarAmount: (parseFloat(amount) * 1000000).toString(),
          stellarAssetCode: asset,
          stellarAssetIssuer: null,
          timelock: parseInt(timelock)
        });
      } else {
        result = await relayer.createStellarToEthSwap({
          ethReceiver: receiver,
          stellarAmount: (parseFloat(amount) * 1000000).toString(),
          ethAmount: parseFloat(amount),
          stellarAssetCode: asset,
          stellarAssetIssuer: null,
          timelock: parseInt(timelock)
        });
      }

      if (result.success) {
        res.status(200).json({
          success: true,
          swapId: result.swapId,
          fusionStatus: result.fusionStatus,
          fusionOrderHash: result.fusionOrderHash,
          auctionActive: result.auctionActive
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Get system status
    try {
      const relayer = await initializeRelayer();
      const status = relayer.getSystemStatus();
      
      res.status(200).json({
        success: true,
        status: status
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