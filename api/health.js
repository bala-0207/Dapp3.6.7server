export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'healthy',
      service: 'zk-pret-core-engine',
      timestamp: new Date().toISOString(),
      version: '3.6.0'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}