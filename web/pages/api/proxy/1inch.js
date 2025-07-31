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

  const { method, path } = req.query;

  if (!method || !path) {
    return res.status(400).json({ error: 'Missing method or path parameter' });
  }

  try {
    // Get the API key from environment (server-side only)
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: '1inch API key not configured' });
    }

    // Construct the 1inch API URL
    const baseUrl = 'https://api.1inch.dev';
    let url = `${baseUrl}${path}`;

    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Prepare request options
    const options = {
      method: method.toUpperCase(),
      headers: headers
    };

    // Add body for POST requests
    if (method.toUpperCase() === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Add query parameters for GET requests
    if (method.toUpperCase() === 'GET' && Object.keys(req.query).length > 2) {
      const queryParams = new URLSearchParams();
      Object.keys(req.query).forEach(key => {
        if (key !== 'method' && key !== 'path') {
          queryParams.append(key, req.query[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    console.log(`🔄 Proxying ${method} request to: ${url}`);

    // Make the request to 1inch API
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 1inch API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: `1inch API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    console.log(`✅ Successfully proxied ${method} request to 1inch API`);
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      details: error.message
    });
  }
} 