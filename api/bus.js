// WakeMyStop - Vercel Serverless API: /api/bus
// Self-contained bus route data handler

const BUS_ROUTES = [
  {
    "routeId": "TN-CBE-MDU",
    "routeName": "Coimbatore to Madurai",
    "stops": [
      { "stopName": "CBE Omni Bus Stand", "lat": 11.0122, "lng": 76.9656, "arrival": "22:00", "departure": "22:00", "km": 0 },
      { "stopName": "Palladam", "lat": 11.0016, "lng": 77.2917, "arrival": "22:45", "departure": "22:50", "km": 36 },
      { "stopName": "Dharapuram", "lat": 10.7327, "lng": 77.519, "arrival": "23:45", "departure": "23:55", "km": 74 },
      { "stopName": "Oddanchatram", "lat": 10.4851, "lng": 77.7471, "arrival": "00:45", "departure": "00:50", "km": 112 },
      { "stopName": "Dindigul Bypass", "lat": 10.3644, "lng": 77.9622, "arrival": "01:30", "departure": "01:35", "km": 139 },
      { "stopName": "Madurai Matuthavani", "lat": 9.9419, "lng": 78.1561, "arrival": "02:30", "departure": "02:30", "km": 190 }
    ]
  },
  {
    "routeId": "TN-CHE-MDU",
    "routeName": "Chennai to Madurai (Private Luxury)",
    "stops": [
      { "stopName": "Koyambedu CMBT", "lat": 13.0732, "lng": 80.2012, "arrival": "21:00", "departure": "21:00", "km": 0 },
      { "stopName": "Tindivanam", "lat": 12.233, "lng": 79.645, "arrival": "23:30", "departure": "23:35", "km": 111 },
      { "stopName": "Villupuram", "lat": 11.9401, "lng": 79.4861, "arrival": "00:15", "departure": "00:25", "km": 148 },
      { "stopName": "Tiruchirappalli Bypass", "lat": 10.825, "lng": 78.694, "arrival": "03:30", "departure": "03:40", "km": 299 },
      { "stopName": "Melur", "lat": 10.05, "lng": 78.33, "arrival": "04:30", "departure": "04:35", "km": 394 },
      { "stopName": "Madurai Matuthavani", "lat": 9.9419, "lng": 78.1561, "arrival": "05:15", "departure": "05:15", "km": 417 }
    ]
  },
  {
    "routeId": "TN-CHE-CBE",
    "routeName": "Chennai to Coimbatore",
    "stops": [
      { "stopName": "Koyambedu CMBT", "lat": 13.0732, "lng": 80.2012, "arrival": "22:00", "departure": "22:00", "km": 0 },
      { "stopName": "Vellore", "lat": 12.9165, "lng": 79.1325, "arrival": "00:30", "departure": "00:35", "km": 135 },
      { "stopName": "Salem", "lat": 11.6643, "lng": 78.146, "arrival": "03:00", "departure": "03:10", "km": 337 },
      { "stopName": "Erode", "lat": 11.341, "lng": 77.7172, "arrival": "04:15", "departure": "04:20", "km": 396 },
      { "stopName": "Coimbatore Gandhipuram", "lat": 11.0173, "lng": 76.9695, "arrival": "06:00", "departure": "06:00", "km": 497 }
    ]
  },
  {
    "routeId": "TN-MDU-TEN",
    "routeName": "Madurai to Tirunelveli",
    "stops": [
      { "stopName": "Madurai Periyar Bus Stand", "lat": 9.9195, "lng": 78.1218, "arrival": "07:00", "departure": "07:00", "km": 0 },
      { "stopName": "Virudhunagar", "lat": 9.5851, "lng": 77.9616, "arrival": "08:00", "departure": "08:05", "km": 56 },
      { "stopName": "Kovilpatti", "lat": 9.1742, "lng": 77.8693, "arrival": "09:00", "departure": "09:05", "km": 100 },
      { "stopName": "Tirunelveli Jn", "lat": 8.7139, "lng": 77.7567, "arrival": "10:30", "departure": "10:30", "km": 156 }
    ]
  }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { q } = req.query;
    if (q) {
      const route = BUS_ROUTES.find(r =>
        r.routeId === q || r.routeName.toLowerCase().includes(q.toLowerCase())
      );
      if (!route) return res.status(404).json({ error: 'Bus Route Not Found' });
      return res.status(200).json(route);
    }
    return res.status(200).json(BUS_ROUTES);
  } catch (err) {
    console.error('Bus API Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
