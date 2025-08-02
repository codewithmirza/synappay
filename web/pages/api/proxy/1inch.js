import config from '../../../lib/config';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { path } = req.query;
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: '1inch API key not configured' });
    }

    // Route to appropriate 1inch API endpoint
    let url;
    let method = 'GET';
    let headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    };
    let body = null;

    if (path === 'quote' && req.method === 'POST') {
      const { src, dst, amount } = req.body;
      if (!src || !dst || !amount) {
        return res.status(400).json({ error: 'Missing required parameters: src, dst, amount' });
      }
      url = `https://api.1inch.dev/swap/v6.0/11155111/quote?src=${src}&dst=${dst}&amount=${amount}`;
    } else if (path === 'swap' && req.method === 'POST') {
      const { src, dst, amount, from, slippage } = req.body;
      if (!src || !dst || !amount || !from) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      url = `https://api.1inch.dev/swap/v6.0/11155111/swap?src=${src}&dst=${dst}&amount=${amount}&from=${from}&slippage=${slippage || 1}`;
    } else if (path === 'tokens') {
      url = 'https://api.1inch.dev/swap/v6.0/11155111/tokens';
    } else if (path === 'approve/transaction') {
      const { tokenAddress, amount } = req.query;
      if (!tokenAddress || !amount) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      url = `https://api.1inch.dev/swap/v6.0/11155111/approve/transaction?tokenAddress=${tokenAddress}&amount=${amount}`;
    } else if (path === 'approve/allowance') {
      const { tokenAddress, walletAddress } = req.query;
      if (!tokenAddress || !walletAddress) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      url = `https://api.1inch.dev/swap/v6.0/11155111/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;
    } else {
      return res.status(404).json({ error: 'Invalid endpoint' });
    }

    console.log(`🔄 1inch API request: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 1inch API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: `1inch API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully retrieved data from 1inch API`);
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ 1inch proxy error:', error);
    return res.status(500).json({
      error: '1inch proxy error',
      details: error.message
    });
  }
} 