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
    const { url } = req.query;
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: '1inch API key not configured' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    // Validate that the URL is a 1inch API URL
    if (!url.includes('api.1inch.dev')) {
      return res.status(400).json({ error: 'Invalid 1inch API URL' });
    }

    console.log(`🔄 1inch API request: ${req.method} ${url}`);

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(req.headers['content-type'] && { 'Content-Type': req.headers['content-type'] })
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 1inch API error: ${response.status} - ${errorText}`);
      console.error(`🔍 Request URL: ${url}`);
      console.error(`🔍 Request method: ${req.method}`);
      return res.status(response.status).json({
        error: `1inch API error: ${response.status}`,
        details: errorText,
        requestUrl: url
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