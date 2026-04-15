// WakeMyStop - Vercel Serverless API: /api/train
// Proper standalone handler - no require() chain issues
// All train data is self-contained in this function

const RAILWAY_STATIONS = {
  // Station Name → { lat, lng }
  "Chennai Egmore": { lat: 13.0822, lng: 80.2585 },
  "Chennai Central": { lat: 13.0827, lng: 80.2707 },
  "Tambaram": { lat: 12.9249, lng: 80.1165 },
  "Chengalpattu Junction": { lat: 12.6921, lng: 79.9766 },
  "Villupuram Junction": { lat: 11.9401, lng: 79.4861 },
  "Vridhachalam Junction": { lat: 11.5165, lng: 79.3245 },
  "Vriddhachalam Junction": { lat: 11.5165, lng: 79.3245 },
  "Ariyalur": { lat: 11.1396, lng: 79.0734 },
  "Lalgudi": { lat: 10.8667, lng: 78.8167 },
  "Srirangam": { lat: 10.8572, lng: 78.6933 },
  "Tiruchchirappalli Junction": { lat: 10.7905, lng: 78.7047 },
  "Manaparai": { lat: 10.603, lng: 78.421 },
  "Dindigul Junction": { lat: 10.3673, lng: 77.9803 },
  "Ambaturai": { lat: 10.29, lng: 77.87 },
  "Kodaikanal Road": { lat: 10.24, lng: 77.8 },
  "Madurai Junction": { lat: 9.9252, lng: 78.1198 },
  "Virudunagar Junction": { lat: 9.5851, lng: 77.9616 },
  "Satur": { lat: 9.3614, lng: 77.9068 },
  "Kovilpatti": { lat: 9.1742, lng: 77.8693 },
  "Tirunelveli Junction": { lat: 8.7139, lng: 77.7567 },
  "Nagercoil Junction": { lat: 8.1782, lng: 77.4324 },
  "Kanyakumari": { lat: 8.0883, lng: 77.5385 },
  "Arakkonam Junction": { lat: 13.085, lng: 79.6677 },
  "Katpadi Junction": { lat: 12.9692, lng: 79.1384 },
  "Ambur": { lat: 12.7953, lng: 78.718 },
  "Jolarpettai Junction": { lat: 12.5694, lng: 78.5772 },
  "Morappur": { lat: 12.0994, lng: 78.3484 },
  "Salem Junction": { lat: 11.6643, lng: 78.146 },
  "Erode Junction": { lat: 11.341, lng: 77.7172 },
  "Tiruppur": { lat: 11.1085, lng: 77.3411 },
  "Coimbatore Junction": { lat: 11.0168, lng: 76.9558 },
  "Vijayawada Junction": { lat: 16.5193, lng: 80.6375 },
  "Warangal": { lat: 17.9689, lng: 79.5941 },
  "Balharshah": { lat: 19.8333, lng: 79.35 },
  "Nagpur Junction": { lat: 21.145, lng: 79.088 },
  "Bhopal Junction": { lat: 23.2611, lng: 77.4054 },
  "Jhansi Junction": { lat: 25.4484, lng: 78.5685 },
  "Agra Cantt": { lat: 27.1767, lng: 78.0081 },
  "New Delhi": { lat: 28.6433, lng: 77.2199 },
  "Itarsi Junction": { lat: 22.6136, lng: 77.7546 },
  "Pudukkottai": { lat: 10.3797, lng: 78.8201 },
  "Karaikkudi Junction": { lat: 10.0737, lng: 78.7792 },
  "Ramanathapuram": { lat: 9.3697, lng: 78.8358 },
  "Mandapam": { lat: 9.2768, lng: 79.1198 },
  "Kuppam": { lat: 12.7448, lng: 78.3437 },
  "Bangarapet Junction": { lat: 12.9848, lng: 78.1741 },
  "Krishnarajapuram": { lat: 13.0094, lng: 77.6972 },
  "Bengaluru Seshadripuram": { lat: 12.9782, lng: 77.5694 },
  "Bengaluru City": { lat: 12.978, lng: 77.5695 },
  "Podanur Junction": { lat: 10.9786, lng: 76.9558 },
  "Palakkad Junction": { lat: 10.7867, lng: 76.6547 },
  "Shoranur Junction": { lat: 10.756, lng: 76.2827 },
  "Kozhikode Main": { lat: 11.2508, lng: 75.7844 },
  "Kannur": { lat: 11.868, lng: 75.3704 },
  "Mangaluru Central": { lat: 12.8706, lng: 74.8444 },
  "Sholavandan": { lat: 10.0283, lng: 78.0511 }
};

const TRAIN_DATA = [
  { "trainNumber": "12637", "trainName": "Pandian Express", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "21:40" },
    { "station": "Tambaram", "arrivalTime": "22:08", "departureTime": "22:10" },
    { "station": "Chengalpattu Junction", "arrivalTime": "22:38", "departureTime": "22:40" },
    { "station": "Villupuram Junction", "arrivalTime": "23:55", "departureTime": "00:05" },
    { "station": "Vridhachalam Junction", "arrivalTime": "00:48", "departureTime": "00:50" },
    { "station": "Ariyalur", "arrivalTime": "01:24", "departureTime": "01:25" },
    { "station": "Lalgudi", "arrivalTime": "02:00", "departureTime": "02:01" },
    { "station": "Srirangam", "arrivalTime": "02:15", "departureTime": "02:17" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "02:45", "departureTime": "02:50" },
    { "station": "Manaparai", "arrivalTime": "03:15", "departureTime": "03:16" },
    { "station": "Dindigul Junction", "arrivalTime": "04:02", "departureTime": "04:05" },
    { "station": "Ambaturai", "arrivalTime": "04:20", "departureTime": "04:21" },
    { "station": "Kodaikanal Road", "arrivalTime": "04:35", "departureTime": "04:36" },
    { "station": "Madurai Junction", "arrivalTime": "05:25", "departureTime": "END" }
  ]},
  { "trainNumber": "12631", "trainName": "Nellai Express", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "20:10" },
    { "station": "Tambaram", "arrivalTime": "20:38", "departureTime": "20:40" },
    { "station": "Villupuram Junction", "arrivalTime": "22:28", "departureTime": "22:30" },
    { "station": "Vriddhachalam Junction", "arrivalTime": "23:30", "departureTime": "23:32" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "01:10", "departureTime": "01:15" },
    { "station": "Dindigul Junction", "arrivalTime": "02:25", "departureTime": "02:28" },
    { "station": "Madurai Junction", "arrivalTime": "03:40", "departureTime": "03:45" },
    { "station": "Virudunagar Junction", "arrivalTime": "04:18", "departureTime": "04:20" },
    { "station": "Satur", "arrivalTime": "04:43", "departureTime": "04:45" },
    { "station": "Kovilpatti", "arrivalTime": "05:08", "departureTime": "05:10" },
    { "station": "Tirunelveli Junction", "arrivalTime": "07:10", "departureTime": "END" }
  ]},
  { "trainNumber": "12635", "trainName": "Vaigai Express", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "13:50" },
    { "station": "Tambaram", "arrivalTime": "14:18", "departureTime": "14:20" },
    { "station": "Chengalpattu Junction", "arrivalTime": "14:48", "departureTime": "14:50" },
    { "station": "Villupuram Junction", "arrivalTime": "16:00", "departureTime": "16:05" },
    { "station": "Vriddhachalam Junction", "arrivalTime": "16:45", "departureTime": "16:47" },
    { "station": "Ariyalur", "arrivalTime": "17:24", "departureTime": "17:25" },
    { "station": "Srirangam", "arrivalTime": "18:15", "departureTime": "18:17" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "18:40", "departureTime": "18:45" },
    { "station": "Manaparai", "arrivalTime": "19:15", "departureTime": "19:16" },
    { "station": "Dindigul Junction", "arrivalTime": "19:52", "departureTime": "19:55" },
    { "station": "Sholavandan", "arrivalTime": "20:25", "departureTime": "20:26" },
    { "station": "Madurai Junction", "arrivalTime": "21:15", "departureTime": "END" }
  ]},
  { "trainNumber": "12633", "trainName": "Kanyakumari Express", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "17:15" },
    { "station": "Tambaram", "arrivalTime": "17:43", "departureTime": "17:45" },
    { "station": "Villupuram Junction", "arrivalTime": "19:50", "departureTime": "19:55" },
    { "station": "Vriddhachalam Junction", "arrivalTime": "20:45", "departureTime": "20:47" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "22:25", "departureTime": "22:30" },
    { "station": "Dindigul Junction", "arrivalTime": "23:42", "departureTime": "23:45" },
    { "station": "Madurai Junction", "arrivalTime": "01:00", "departureTime": "01:05" },
    { "station": "Virudunagar Junction", "arrivalTime": "01:43", "departureTime": "01:45" },
    { "station": "Tirunelveli Junction", "arrivalTime": "04:35", "departureTime": "04:40" },
    { "station": "Nagercoil Junction", "arrivalTime": "05:40", "departureTime": "05:45" },
    { "station": "Kanyakumari", "arrivalTime": "06:10", "departureTime": "END" }
  ]},
  { "trainNumber": "12675", "trainName": "Kovai Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "06:10" },
    { "station": "Arakkonam Junction", "arrivalTime": "07:08", "departureTime": "07:10" },
    { "station": "Katpadi Junction", "arrivalTime": "07:58", "departureTime": "08:00" },
    { "station": "Ambur", "arrivalTime": "08:38", "departureTime": "08:40" },
    { "station": "Jolarpettai Junction", "arrivalTime": "09:23", "departureTime": "09:25" },
    { "station": "Morappur", "arrivalTime": "10:08", "departureTime": "10:10" },
    { "station": "Salem Junction", "arrivalTime": "11:02", "departureTime": "11:05" },
    { "station": "Erode Junction", "arrivalTime": "12:05", "departureTime": "12:10" },
    { "station": "Tiruppur", "arrivalTime": "12:53", "departureTime": "12:55" },
    { "station": "Coimbatore Junction", "arrivalTime": "14:05", "departureTime": "END" }
  ]},
  { "trainNumber": "12673", "trainName": "Cheran Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "22:10" },
    { "station": "Katpadi Junction", "arrivalTime": "23:53", "departureTime": "23:55" },
    { "station": "Jolarpettai Junction", "arrivalTime": "01:13", "departureTime": "01:15" },
    { "station": "Salem Junction", "arrivalTime": "02:52", "departureTime": "02:55" },
    { "station": "Erode Junction", "arrivalTime": "03:55", "departureTime": "04:00" },
    { "station": "Tiruppur", "arrivalTime": "04:43", "departureTime": "04:45" },
    { "station": "Coimbatore Junction", "arrivalTime": "06:00", "departureTime": "END" }
  ]},
  { "trainNumber": "12615", "trainName": "Grand Trunk Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "18:50" },
    { "station": "Vijayawada Junction", "arrivalTime": "01:55", "departureTime": "02:05" },
    { "station": "Warangal", "arrivalTime": "04:55", "departureTime": "04:57" },
    { "station": "Balharshah", "arrivalTime": "08:50", "departureTime": "08:55" },
    { "station": "Nagpur Junction", "arrivalTime": "11:55", "departureTime": "12:00" },
    { "station": "Bhopal Junction", "arrivalTime": "18:20", "departureTime": "18:25" },
    { "station": "Jhansi Junction", "arrivalTime": "22:50", "departureTime": "22:58" },
    { "station": "Agra Cantt", "arrivalTime": "01:45", "departureTime": "01:50" },
    { "station": "New Delhi", "arrivalTime": "05:05", "departureTime": "END" }
  ]},
  { "trainNumber": "12621", "trainName": "Tamil Nadu Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "22:00" },
    { "station": "Vijayawada Junction", "arrivalTime": "03:55", "departureTime": "04:05" },
    { "station": "Balharshah", "arrivalTime": "09:40", "departureTime": "09:45" },
    { "station": "Nagpur Junction", "arrivalTime": "13:50", "departureTime": "13:55" },
    { "station": "Itarsi Junction", "arrivalTime": "17:50", "departureTime": "17:55" },
    { "station": "Bhopal Junction", "arrivalTime": "20:00", "departureTime": "20:10" },
    { "station": "Jhansi Junction", "arrivalTime": "23:50", "departureTime": "23:58" },
    { "station": "Agra Cantt", "arrivalTime": "03:50", "departureTime": "03:52" },
    { "station": "New Delhi", "arrivalTime": "07:05", "departureTime": "END" }
  ]},
  { "trainNumber": "22661", "trainName": "Sethu Express", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "17:45" },
    { "station": "Villupuram Junction", "arrivalTime": "20:15", "departureTime": "20:20" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "23:15", "departureTime": "23:25" },
    { "station": "Pudukkottai", "arrivalTime": "00:15", "departureTime": "00:17" },
    { "station": "Karaikkudi Junction", "arrivalTime": "01:05", "departureTime": "01:10" },
    { "station": "Ramanathapuram", "arrivalTime": "03:15", "departureTime": "03:17" },
    { "station": "Mandapam", "arrivalTime": "04:00", "departureTime": "END" }
  ]},
  { "trainNumber": "22637", "trainName": "West Coast Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "13:25" },
    { "station": "Katpadi Junction", "arrivalTime": "15:20", "departureTime": "15:25" },
    { "station": "Salem Junction", "arrivalTime": "18:12", "departureTime": "18:15" },
    { "station": "Erode Junction", "arrivalTime": "19:20", "departureTime": "19:25" },
    { "station": "Podanur Junction", "arrivalTime": "21:18", "departureTime": "21:20" },
    { "station": "Palakkad Junction", "arrivalTime": "22:12", "departureTime": "22:15" },
    { "station": "Shoranur Junction", "arrivalTime": "23:15", "departureTime": "23:20" },
    { "station": "Kozhikode Main", "arrivalTime": "00:47", "departureTime": "00:50" },
    { "station": "Kannur", "arrivalTime": "02:37", "departureTime": "02:40" },
    { "station": "Mangaluru Central", "arrivalTime": "05:50", "departureTime": "END" }
  ]},
  { "trainNumber": "20665", "trainName": "Vande Bharat Express (MS-TEN)", "stations": [
    { "station": "Chennai Egmore", "arrivalTime": "START", "departureTime": "14:50" },
    { "station": "Tambaram", "arrivalTime": "15:13", "departureTime": "15:15" },
    { "station": "Villupuram Junction", "arrivalTime": "16:38", "departureTime": "16:40" },
    { "station": "Tiruchchirappalli Junction", "arrivalTime": "18:40", "departureTime": "18:45" },
    { "station": "Dindigul Junction", "arrivalTime": "19:42", "departureTime": "19:44" },
    { "station": "Madurai Junction", "arrivalTime": "20:30", "departureTime": "20:35" },
    { "station": "Virudunagar Junction", "arrivalTime": "21:03", "departureTime": "21:05" },
    { "station": "Tirunelveli Junction", "arrivalTime": "22:40", "departureTime": "END" }
  ]},
  { "trainNumber": "12639", "trainName": "Brindavan Express", "stations": [
    { "station": "Chennai Central", "arrivalTime": "START", "departureTime": "07:40" },
    { "station": "Arakkonam Junction", "arrivalTime": "08:38", "departureTime": "08:40" },
    { "station": "Katpadi Junction", "arrivalTime": "09:28", "departureTime": "09:30" },
    { "station": "Ambur", "arrivalTime": "10:03", "departureTime": "10:05" },
    { "station": "Jolarpettai Junction", "arrivalTime": "10:53", "departureTime": "10:55" },
    { "station": "Kuppam", "arrivalTime": "11:24", "departureTime": "11:25" },
    { "station": "Bangarapet Junction", "arrivalTime": "11:48", "departureTime": "11:50" },
    { "station": "Krishnarajapuram", "arrivalTime": "12:48", "departureTime": "12:50" },
    { "station": "Bengaluru Seshadripuram", "arrivalTime": "13:08", "departureTime": "13:10" },
    { "station": "Bengaluru City", "arrivalTime": "13:40", "departureTime": "END" }
  ]}
];

function resolveGeo(stationName) {
  if (!stationName) return { lat: 13.0827, lng: 80.2707 };
  // Exact match first
  if (RAILWAY_STATIONS[stationName]) return RAILWAY_STATIONS[stationName];
  // Fuzzy match
  const nameUpper = stationName.toLowerCase();
  const match = Object.entries(RAILWAY_STATIONS).find(([key]) => 
    key.toLowerCase().includes(nameUpper) || nameUpper.includes(key.toLowerCase())
  );
  return match ? match[1] : { lat: 13.0827, lng: 80.2707 };
}

function addDelay(timeStr, delayMins) {
  if (!timeStr || timeStr === 'START' || timeStr === 'END' || timeStr === '--') return timeStr;
  if (!timeStr.includes(':')) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + delayMins;
  const newH = Math.floor((total / 60) % 24);
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function processTrainData(t) {
  const now = new Date();
  const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
  const startTimeStr = t.stations[0].departureTime || "00:00";
  const [startH, startM] = startTimeStr.includes(':') ? startTimeStr.split(':').map(Number) : [0, 0];
  const startTimeInMins = startH * 60 + startM;

  let delay = 0;
  if (currentTimeInMins >= startTimeInMins) {
    delay = Math.random() > 0.3 ? Math.floor(Math.random() * 25) : 0;
  }
  const status = delay > 0 ? `${delay} mins late` : 'On Time';

  let currentDayOffset = 0;
  let prevMinutes = -1;

  const stops = t.stations.map(s => {
    const geo = resolveGeo(s.station);
    
    // Track day crossings
    if (s.arrivalTime && s.arrivalTime !== 'START' && s.arrivalTime !== 'END' && s.arrivalTime.includes(':')) {
      const [h, m] = s.arrivalTime.split(':').map(Number);
      const mins = h * 60 + m;
      if (prevMinutes !== -1 && mins < prevMinutes) currentDayOffset++;
      prevMinutes = mins;
    }

    const d = new Date();
    d.setDate(d.getDate() + currentDayOffset);
    const expectedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return {
      station: s.station,
      arrival: s.arrivalTime,
      departure: s.departureTime,
      expectedArrival: addDelay(s.arrivalTime, delay),
      expectedDate,
      lat: geo.lat,
      lng: geo.lng,
      km: s.km || null
    };
  });

  return {
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    from: t.stations[0].station,
    to: t.stations[t.stations.length - 1].station,
    liveStatus: {
      delayMinutes: delay,
      statusMessage: status,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    },
    stops
  };
}

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { q } = req.query; // Optional: filter by train number/name

    if (q) {
      // Single train lookup
      const trainData = TRAIN_DATA.find(t => 
        t.trainNumber === q || 
        t.trainName.toLowerCase().includes(q.toLowerCase())
      );
      if (!trainData) {
        return res.status(404).json({ error: 'Train Not Found', message: `No train found for query: ${q}` });
      }
      return res.status(200).json(processTrainData(trainData));
    }

    // Return all trains
    const allTrains = TRAIN_DATA.map(processTrainData);
    return res.status(200).json(allTrains);

  } catch (err) {
    console.error('Train API Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
