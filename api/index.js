// WakeMyStop - Vercel Serverless API: /api (Health check)
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    message: 'WakeStop API Connected!',
    status: 'OK',
    version: '2.1.0',
    available_endpoints: [
      'GET /api - Health check',
      'GET /api/train - All trains',
      'GET /api/train?q=12637 - Single train lookup',
      'GET /api/bus - All bus routes',
      'POST /api/user/save-alarm - Save mission alarm'
    ],
    timestamp: new Date().toISOString()
  });
};
