export default function handler(req, res) {
  const { method } = req;
  
  if (method === 'GET') {
    res.status(200).json({
      message: 'ZK-PRET Core Engine API',
      version: '3.6.0',
      endpoints: [
        '/api/health',
        '/api/gleif',
        '/api/corporate',
        '/api/exim',
        '/api/risk'
      ]
    });
  } else if (method === 'POST') {
    // Handle generic API calls
    res.status(200).json({
      message: 'ZK-PRET Core Engine - Processing request',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}