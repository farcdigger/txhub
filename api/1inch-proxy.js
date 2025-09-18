// Vercel serverless function to proxy 1inch API requests
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { endpoint, ...queryParams } = req.query
    
    if (!endpoint) {
      res.status(400).json({ error: 'Missing endpoint parameter' })
      return
    }

    // 1inch API configuration
    const INCH_API_KEY = 'HWcp63JDwcGFuSoQOt0figfwVW8a2tmU'
    const INCH_API_URL = 'https://api.1inch.dev'
    
    console.log('API request:', { endpoint, queryParams })
    
    // Build the full URL
    const params = new URLSearchParams(queryParams)
    const apiUrl = `${INCH_API_URL}${endpoint}?${params.toString()}`
    
    console.log('Proxying request to:', apiUrl)
    
    // Make request to 1inch API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${INCH_API_KEY}`,
        'accept': 'application/json',
        'User-Agent': 'BaseHub/1.0'
      }
    })

    if (!response.ok) {
      console.error('1inch API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      console.error('Request URL:', apiUrl)
      res.status(response.status).json({ 
        error: `1inch API error: ${response.status}`,
        details: errorText,
        requestUrl: apiUrl
      })
      return
    }

    const data = await response.json()
    
    // Return the data
    res.status(200).json(data)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
