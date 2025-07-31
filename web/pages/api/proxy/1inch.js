// 1inch API Proxy for Vercel
// This handles CORS and authorization for 1inch API calls from the frontend

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url, body } = req;
    
    // Get the 1inch API key from environment variables
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: '1inch API key not configured' 
      });
    }

    // Construct the 1inch API URL
    const baseUrl = 'https://api.1inch.dev';
    const apiUrl = `${baseUrl}${url}`;

    // Prepare headers for 1inch API
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Make the request to 1inch API
    const response = await fetch(apiUrl, {
      method: method,
      headers: headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    // Return the response with appropriate status
    res.status(response.status).json(data);

  } catch (error) {
    console.error('1inch API proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to 1inch API',
      details: error.message 
    });
  }
} 