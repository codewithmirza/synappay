import config from '../../lib/config';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromToken, toToken, amount } = req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Call the backend CLI for rate discovery
    const { execSync } = require('child_process');
    
    const command = `npm run cli get-best-rate --from ${fromToken} --to ${toToken} --amount ${amount}`;
    
    try {
      const output = execSync(command, { 
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env }
      });

      // Parse the CLI output to extract rate information
      const rateInfo = parseCLIOutput(output);

      return res.status(200).json({
        success: true,
        data: rateInfo
      });

    } catch (error) {
      console.error('CLI execution error:', error);
      
      // Fallback to 1inch API through our proxy
      const fallbackRate = await getFallbackRate(fromToken, toToken, amount);
      
      return res.status(200).json({
        success: true,
        data: fallbackRate,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Best rate API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get best rate',
      details: error.message 
    });
  }
}

function parseCLIOutput(output) {
  // Parse the CLI output to extract structured data
  const lines = output.split('\n');
  const result = {
    fromToken: '',
    toToken: '',
    inputAmount: '',
    outputAmount: '',
    exchangeRate: 0,
    route: '',
    estimatedGas: '',
    priceImpact: 0,
    savings: {
      vsCEX: 0
    }
  };

  for (const line of lines) {
    if (line.includes('From:')) {
      result.fromToken = line.split('From:')[1]?.trim();
    } else if (line.includes('To:')) {
      result.toToken = line.split('To:')[1]?.trim();
    } else if (line.includes('Input Amount:')) {
      result.inputAmount = line.split('Input Amount:')[1]?.trim();
    } else if (line.includes('Output Amount:')) {
      result.outputAmount = line.split('Output Amount:')[1]?.trim();
    } else if (line.includes('Exchange Rate:')) {
      const rate = line.split('Exchange Rate:')[1]?.trim();
      result.exchangeRate = parseFloat(rate) || 0;
    } else if (line.includes('Route:')) {
      result.route = line.split('Route:')[1]?.trim();
    } else if (line.includes('Estimated Gas:')) {
      result.estimatedGas = line.split('Estimated Gas:')[1]?.trim();
    } else if (line.includes('Price Impact:')) {
      const impact = line.split('Price Impact:')[1]?.trim();
      result.priceImpact = parseFloat(impact) || 0;
    } else if (line.includes('Savings vs CEX:')) {
      const savings = line.split('Savings vs CEX:')[1]?.trim();
      result.savings.vsCEX = parseFloat(savings) || 0;
    }
  }

  return result;
}

async function getFallbackRate(fromToken, toToken, amount) {
  // Use our proxy endpoint instead of direct API call
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/proxy/1inch/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`
    },
    body: JSON.stringify({
      src: getTokenAddress(fromToken),
      dst: getTokenAddress(toToken),
      amount: amount
    })
  });

  if (!response.ok) {
    throw new Error('1inch API request failed');
  }

  const data = await response.json();
  
  return {
    fromToken,
    toToken,
    inputAmount: data.fromAmount,
    outputAmount: data.toAmount,
    exchangeRate: parseFloat(data.toAmount) / parseFloat(data.fromAmount),
    route: '1inch',
    estimatedGas: data.tx?.gas || 'Unknown',
    priceImpact: 0,
    savings: {
      vsCEX: 0
    }
  };
}

function getTokenAddress(symbol) {
  const addresses = {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6'
  };
  
  return addresses[symbol] || symbol;
} 