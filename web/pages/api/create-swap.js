import config from '../../lib/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      swapType, 
      fromToken, 
      toToken, 
      amount, 
      receiver, 
      slippage = 1 
    } = req.body;

    if (!swapType || !fromToken || !toToken || !amount || !receiver) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Call the backend CLI for swap creation
    const { execSync } = require('child_process');
    
    let command;
    if (swapType === 'ETH_TO_STELLAR') {
      command = `npm run cli create-eth-stellar \
        --contract ${config.ethereum.htlcContractAddress} \
        --receiver ${receiver} \
        --eth-amount ${amount} \
        --stellar-amount ${calculateStellarAmount(amount, fromToken, toToken)}`;
    } else if (swapType === 'STELLAR_TO_ETH') {
      command = `npm run cli create-stellar-eth \
        --contract ${config.ethereum.htlcContractAddress} \
        --receiver ${receiver} \
        --stellar-amount ${amount} \
        --eth-amount ${calculateEthAmount(amount, fromToken, toToken)}`;
    } else {
      return res.status(400).json({ error: 'Invalid swap type' });
    }

    try {
      const output = execSync(command, { 
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env }
      });

      // Parse the CLI output to extract swap information
      const swapInfo = parseSwapOutput(output, swapType);

      return res.status(200).json({
        success: true,
        data: swapInfo
      });

    } catch (error) {
      console.error('CLI execution error:', error);
      
      // Return error with details
      return res.status(500).json({
        success: false,
        error: 'Failed to create swap',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Create swap API error:', error);
    return res.status(500).json({ 
      error: 'Failed to create swap',
      details: error.message 
    });
  }
}

function parseSwapOutput(output, swapType) {
  // Parse the CLI output to extract structured swap data
  const lines = output.split('\n');
  const result = {
    swapId: '',
    secret: '',
    ethContractId: '',
    stellarBalanceId: '',
    fusionOrderHash: '',
    status: 'ACTIVE',
    type: swapType,
    createdAt: new Date().toISOString()
  };

  for (const line of lines) {
    if (line.includes('Swap ID:')) {
      result.swapId = line.split('Swap ID:')[1]?.trim();
    } else if (line.includes('Secret:')) {
      result.secret = line.split('Secret:')[1]?.trim();
    } else if (line.includes('ETH Contract ID:')) {
      result.ethContractId = line.split('ETH Contract ID:')[1]?.trim();
    } else if (line.includes('Stellar Balance ID:')) {
      result.stellarBalanceId = line.split('Stellar Balance ID:')[1]?.trim();
    } else if (line.includes('Fusion Order Hash:')) {
      result.fusionOrderHash = line.split('Fusion Order Hash:')[1]?.trim();
    }
  }

  return result;
}

function calculateStellarAmount(ethAmount, fromToken, toToken) {
  // Simple conversion for demo - in production, use real rates
  const conversionRate = 100000; // 1 ETH = 100,000 XLM (demo rate)
  return Math.floor(parseFloat(ethAmount) * conversionRate);
}

function calculateEthAmount(stellarAmount, fromToken, toToken) {
  // Simple conversion for demo - in production, use real rates
  const conversionRate = 0.00001; // 100,000 XLM = 1 ETH (demo rate)
  return (parseFloat(stellarAmount) * conversionRate).toFixed(6);
} 