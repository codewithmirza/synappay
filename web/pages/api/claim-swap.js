import config from '../../lib/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { swapId, preimage } = req.body;

    if (!swapId || !preimage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Call the backend CLI for swap claiming
    const { execSync } = require('child_process');
    
    const command = `npm run cli claim \
      --contract ${config.ethereum.htlcContractAddress} \
      --swap-id ${swapId} \
      --preimage ${preimage}`;

    try {
      const output = execSync(command, { 
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env }
      });

      // Parse the CLI output to extract claim information
      const claimInfo = parseClaimOutput(output);

      return res.status(200).json({
        success: true,
        data: claimInfo
      });

    } catch (error) {
      console.error('CLI execution error:', error);
      
      // Return error with details
      return res.status(500).json({
        success: false,
        error: 'Failed to claim swap',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Claim swap API error:', error);
    return res.status(500).json({ 
      error: 'Failed to claim swap',
      details: error.message 
    });
  }
}

function parseClaimOutput(output) {
  // Parse the CLI output to extract structured claim data
  const lines = output.split('\n');
  const result = {
    success: false,
    message: '',
    completedAt: new Date().toISOString()
  };

  for (const line of lines) {
    if (line.includes('✅ Swap claimed successfully!')) {
      result.success = true;
      result.message = 'Swap claimed successfully';
    } else if (line.includes('💰 Funds have been transferred')) {
      result.message = 'Funds have been transferred to the receiver';
    } else if (line.includes('❌ Claim failed:')) {
      result.success = false;
      result.message = line.split('❌ Claim failed:')[1]?.trim() || 'Claim failed';
    }
  }

  return result;
} 