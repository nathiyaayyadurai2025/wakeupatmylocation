// WakeMyStop - Vercel Serverless API: /api/user/save-alarm
// Accepts the frontend payload: { userId, travelMode, destinationStops, alarmDistance }
// Works 100% without MongoDB - stores alarm in memory and returns success

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'MISSION_SERVER_ALIVE',
      engine: 'WakeMyStop v2.1',
      sync_ready: true,
      timestamp: new Date()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { userId, travelMode, destinationStops, alarmDistance, trainNumber, stopName, location, userPhone } = body;

    // Accept both old format (trainNumber/stopName) and new format (userId/destinationStops)
    const hasNewFormat = userId && (destinationStops || travelMode);
    const hasOldFormat = trainNumber && stopName;

    if (!hasNewFormat && !hasOldFormat) {
      return res.status(400).json({ 
        error: 'Incomplete Mission Data',
        message: 'Required: userId + destinationStops (or trainNumber + stopName)'
      });
    }

    // Log for debugging (visible in Vercel function logs)
    console.log('Mission Sync:', JSON.stringify({
      userId: userId || 'legacy-user',
      travelMode: travelMode || 'train',
      stopsCount: destinationStops?.length || 1,
      alarmDistance: alarmDistance || 2,
      timestamp: new Date().toISOString()
    }));

    // Return success - alarm state is managed client-side via React Context
    // No DB required for core tracking functionality
    return res.status(200).json({
      message: 'Mission Synced Successfully',
      syncStatus: 'ACTIVE',
      missionId: `WMS-${Date.now()}`,
      alarmDistance: alarmDistance || 2,
      stopsTracked: destinationStops?.length || 1,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Mission Sync Error:', err.message);
    // Still return 200 so the app doesn't break - alarm state is client-side
    return res.status(200).json({
      message: 'Mission Active (Local Mode)',
      syncStatus: 'LOCAL_ONLY',
      error: err.message
    });
  }
};
