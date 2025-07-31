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
    const { src, dst, amount } = req.body;

    if (!src || !dst || !amount) {
      return res.status(400).json({ error: 'Missing required parameters: src, dst, amount' });
    }

    // Get the API key from environment (server-side only)
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: '1inch API key not configured' });
    }

    // Construct the 1inch quote API URL
    const url = `https://api.1inch.dev/swap/v6.0/1/quote?src=${src}&dst=${dst}&amount=${amount}`;

    console.log(`🔄 Getting quote from 1inch API: ${src} → ${dst}, amount: ${amount}`);

    // Make the request to 1inch API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 1inch quote API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: `1inch API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    console.log(`✅ Successfully retrieved quote from 1inch API`);
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Quote proxy error:', error);
    return res.status(500).json({
      error: 'Quote proxy error',
      details: error.message
    });
  }
} 