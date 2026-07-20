/**
 * WakeMyStop: Mission Constants & Routing Data
 * Built for 100% Traveler Safety.
 */

export const TRANSLATIONS = {
  en: {
    title: 'WakeMyStop',
    tagline: 'Reliable Travel Alarm & GPS Tracker',
    selectMode: 'Select Mission Mode',
    train: 'Train Journey',
    bus: 'Bus Travel',
    general: 'General GPS',
    settings: 'Settings',
    searchTrain: 'Search Train Number or Name',
    searchStop: 'Where to wake you up?',
    activate: 'Activate Mission',
    distance: 'Distance',
    arrival: 'Arrival ETA',
    tracking: 'Live Sat Tracking'
  },
  ta: {
    title: 'WakeMyStop',
    tagline: 'நம்பகமான பயண அலாரம் மற்றும் ஜிபிஎஸ் டிராக்கர்',
    selectMode: 'பயண முறையைத் தேர்ந்தெடுக்கவும்',
    train: 'இரயில் பயணம்',
    bus: 'பேருந்து பயணம்',
    general: 'பொது ஜிபிஎஸ்',
    settings: 'அமைப்புகள்',
    searchTrain: 'இரயில் எண் அல்லது பெயரைத் தேடுங்கள்',
    searchStop: 'எங்கு உங்களை எழுப்ப வேண்டும்?',
    activate: 'மிஷனைத் தொடங்கவும்',
    distance: 'தூரம்',
    arrival: 'வருகை நேரம்',
    tracking: 'நேரடி டிராக்கிங்'
  },
  id: {
    title: 'WakeMyStop',
    tagline: 'Alarm Perjalanan & Pelacak GPS Terpercaya',
    selectMode: 'Pilih Mode Misi',
    train: 'Perjalanan Kereta',
    bus: 'Perjalanan Bus',
    general: 'GPS Umum',
    settings: 'Pengaturan',
    searchTrain: 'Cari Nomor atau Nama Kereta',
    searchStop: 'Di mana Anda ingin dibangunkan?',
    activate: 'Aktifkan Misi',
    distance: 'Jarak',
    arrival: 'Perkiraan Tiba',
    tracking: 'Pelacakan Satelit Langsung'
  }
};

export const TRAIN_DATA = [
  {
    "trainNumber": "12637",
    "trainName": "Pandian Express",
    "from": "Chennai Egmore",
    "to": "Madurai Junction",
    "stops": [
      { "station": "Chennai Egmore", "arrival": "START", "departure": "21:40", "lat": 13.0822, "lng": 80.2585, "km": 0 },
      { "station": "Tambaram", "arrival": "22:08", "departure": "22:10", "lat": 12.9249, "lng": 80.1165, "km": 24 },
      { "station": "Chengalpattu Junction", "arrival": "22:38", "departure": "22:40", "lat": 12.6921, "lng": 79.9766, "km": 53 },
      { "station": "Villupuram Junction", "arrival": "23:55", "departure": "00:05", "lat": 11.9401, "lng": 79.4861, "km": 152 },
      { "station": "Vridhachalam Junction", "arrival": "00:48", "departure": "00:50", "lat": 11.5165, "lng": 79.3245, "km": 202 },
      { "station": "Ariyalur", "arrival": "01:24", "departure": "01:25", "lat": 11.1396, "lng": 79.0734, "km": 253 },
      { "station": "Lalgudi", "arrival": "02:00", "departure": "02:01", "lat": 10.8667, "lng": 78.8167, "km": 285 },
      { "station": "Srirangam", "arrival": "02:15", "departure": "02:17", "lat": 10.8572, "lng": 78.6933, "km": 298 },
      { "station": "Tiruchchirappalli Junction", "arrival": "02:45", "departure": "02:50", "lat": 10.7905, "lng": 78.7047, "km": 308 },
      { "station": "Manaparai", "arrival": "03:15", "departure": "03:16", "lat": 10.603, "lng": 78.421, "km": 345 },
      { "station": "Dindigul Junction", "arrival": "04:02", "departure": "04:05", "lat": 10.3673, "lng": 77.9803, "km": 401 },
      { "station": "Ambaturai", "arrival": "04:20", "departure": "04:21", "lat": 10.29, "lng": 77.87, "km": 412 },
      { "station": "Kodaikanal Road", "arrival": "04:35", "departure": "04:36", "lat": 10.24, "lng": 77.8, "km": 423 },
      { "station": "Madurai Junction", "arrival": "05:25", "departure": "END", "lat": 9.9252, "lng": 78.1198, "km": 452 }
    ]
  },
  {
    "trainNumber": "12631",
    "trainName": "Nellai Express",
    "from": "Chennai Egmore",
    "to": "Tirunelveli",
    "stops": [
      {
        "station": "Chennai Egmore",
        "arrival": "--",
        "departure": "20:10",
        "lat": 13.0822,
        "lng": 80.2585,
        "km": 0
      },
      {
        "station": "Villupuram",
        "arrival": "23:55",
        "departure": "00:05",
        "lat": 11.9401,
        "lng": 79.4861,
        "km": 152
      },
      {
        "station": "Tiruchirappalli",
        "arrival": "02:45",
        "departure": "02:50",
        "lat": 10.7905,
        "lng": 78.7047,
        "km": 306
      },
      {
        "station": "Madurai",
        "arrival": "05:25",
        "departure": "--",
        "lat": 9.9252,
        "lng": 78.1198,
        "km": 421
      },
      {
        "station": "Tirunelveli",
        "arrival": "07:10",
        "departure": "--",
        "lat": 8.7139,
        "lng": 77.7567,
        "km": 562
      }
    ]
  },
  {
    "trainNumber": "12635",
    "trainName": "Vaigai Express",
    "from": "Chennai Egmore",
    "to": "Madurai",
    "stops": [
      {
        "station": "Chennai Egmore",
        "arrival": "--",
        "departure": "13:50",
        "lat": 13.0822,
        "lng": 80.2585,
        "km": 0
      },
      {
        "station": "Villupuram",
        "arrival": "16:00",
        "departure": "16:05",
        "lat": 11.9401,
        "lng": 79.4861,
        "km": 152
      },
      {
        "station": "Vriddhachalam",
        "arrival": "16:45",
        "departure": "16:47",
        "lat": 11.5165,
        "lng": 79.3245,
        "km": 202
      },
      {
        "station": "Ariyalur",
        "arrival": "17:24",
        "departure": "17:25",
        "lat": 11.1396,
        "lng": 79.0734,
        "km": 253
      },
      {
        "station": "Tiruchirappalli",
        "arrival": "18:40",
        "departure": "18:45",
        "lat": 10.7905,
        "lng": 78.7047,
        "km": 308
      },
      {
        "station": "Dindigul",
        "arrival": "19:52",
        "departure": "19:55",
        "lat": 10.3673,
        "lng": 77.9803,
        "km": 401
      },
      {
        "station": "Madurai",
        "arrival": "21:15",
        "departure": "--",
        "lat": 9.9252,
        "lng": 78.1198,
        "km": 452
      }
    ]
  },
  {
    "trainNumber": "12675",
    "trainName": "Kovai Express",
    "from": "Chennai Central",
    "to": "Coimbatore",
    "stops": [
      {
        "station": "Chennai Central",
        "arrival": "--",
        "departure": "06:10",
        "lat": 13.0827,
        "lng": 80.2707,
        "km": 0
      },
      {
        "station": "Arakkonam",
        "arrival": "07:08",
        "departure": "07:10",
        "lat": 13.085,
        "lng": 79.6677,
        "km": 65
      },
      {
        "station": "Katpadi",
        "arrival": "07:58",
        "departure": "08:00",
        "lat": 12.9692,
        "lng": 79.1384,
        "km": 124
      },
      {
        "station": "Jolarpettai",
        "arrival": "09:23",
        "departure": "09:25",
        "lat": 12.5694,
        "lng": 78.5772,
        "km": 199
      },
      {
        "station": "Salem",
        "arrival": "11:02",
        "departure": "11:05",
        "lat": 11.6643,
        "lng": 78.146,
        "km": 310
      },
      {
        "station": "Erode",
        "arrival": "12:05",
        "departure": "12:10",
        "lat": 11.341,
        "lng": 77.7172,
        "km": 369
      },
      {
        "station": "Tiruppur",
        "arrival": "12:53",
        "departure": "12:55",
        "lat": 11.1085,
        "lng": 77.3411,
        "km": 418
      },
      {
        "station": "Coimbatore",
        "arrival": "14:05",
        "departure": "--",
        "lat": 11.0168,
        "lng": 76.9558,
        "km": 461
      }
    ]
  },
  {
    "trainNumber": "12633",
    "trainName": "Kanyakumari Express",
    "from": "Chennai Egmore",
    "to": "Kanyakumari",
    "stops": [
      {
        "station": "Chennai Egmore",
        "arrival": "--",
        "departure": "17:15",
        "lat": 13.0822,
        "lng": 80.2585,
        "km": 0
      },
      {
        "station": "Tiruchirappalli",
        "arrival": "22:25",
        "departure": "22:30",
        "lat": 10.7905,
        "lng": 78.7047,
        "km": 306
      },
      {
        "station": "Dindigul",
        "arrival": "23:42",
        "departure": "23:45",
        "lat": 10.3673,
        "lng": 77.9803,
        "km": 398
      },
      {
        "station": "Madurai",
        "arrival": "01:00",
        "departure": "01:05",
        "lat": 9.9252,
        "lng": 78.1198,
        "km": 449
      },
      {
        "station": "Tirunelveli",
        "arrival": "04:35",
        "departure": "04:40",
        "lat": 8.7139,
        "lng": 77.7567,
        "km": 590
      },
      {
        "station": "Kanyakumari",
        "arrival": "06:10",
        "departure": "--",
        "lat": 8.0883,
        "lng": 77.5385,
        "km": 663
      }
    ]
  },
  {
    "trainNumber": "12610",
    "trainName": "Vande Bharat Express",
    "from": "Chennai Central",
    "to": "Mysuru",
    "stops": [
      {
        "station": "Chennai Central",
        "arrival": "--",
        "departure": "05:50",
        "lat": 13.0827,
        "lng": 80.2707,
        "km": 0
      },
      {
        "station": "Katpadi",
        "arrival": "07:13",
        "departure": "07:14",
        "lat": 12.9692,
        "lng": 79.1384,
        "km": 123
      },
      {
        "station": "KSR Bengaluru",
        "arrival": "10:15",
        "departure": "10:20",
        "lat": 12.978,
        "lng": 77.5695,
        "km": 293
      },
      {
        "station": "Mysuru",
        "arrival": "12:20",
        "departure": "--",
        "lat": 12.3168,
        "lng": 76.6493,
        "km": 417
      }
    ]
  },
  {
    "trainNumber": "12639",
    "trainName": "Brindavan Express",
    "from": "Chennai Central",
    "to": "KSR Bengaluru",
    "stops": [
      {
        "station": "Chennai Central",
        "arrival": "--",
        "departure": "07:40",
        "lat": 13.0827,
        "lng": 80.2707,
        "km": 0
      },
      {
        "station": "Arakkonam",
        "arrival": "08:38",
        "departure": "08:40",
        "lat": 13.085,
        "lng": 79.6677,
        "km": 65
      },
      {
        "station": "Katpadi",
        "arrival": "09:28",
        "departure": "09:30",
        "lat": 12.9692,
        "lng": 79.1384,
        "km": 124
      },
      {
        "station": "Jolarpettai",
        "arrival": "10:58",
        "departure": "11:00",
        "lat": 12.5694,
        "lng": 78.5772,
        "km": 199
      },
      {
        "station": "KSR Bengaluru",
        "arrival": "13:40",
        "departure": "--",
        "lat": 12.978,
        "lng": 77.5695,
        "km": 318
      }
    ]
  },
  {
    "trainNumber": "22637",
    "trainName": "West Coast Express",
    "from": "Chennai Central",
    "to": "Mangaluru",
    "stops": [
      {
        "station": "Chennai Central",
        "arrival": "--",
        "departure": "12:05",
        "lat": 13.0827,
        "lng": 80.2707,
        "km": 0
      },
      {
        "station": "Jolarpettai",
        "arrival": "14:58",
        "departure": "15:00",
        "lat": 12.5694,
        "lng": 78.5772,
        "km": 192
      },
      {
        "station": "Salem",
        "arrival": "16:37",
        "departure": "16:40",
        "lat": 11.6643,
        "lng": 78.146,
        "km": 303
      },
      {
        "station": "Erode",
        "arrival": "17:35",
        "departure": "17:40",
        "lat": 11.341,
        "lng": 77.7172,
        "km": 362
      },
      {
        "station": "Palakkad",
        "arrival": "21:07",
        "departure": "21:10",
        "lat": 10.7867,
        "lng": 76.6547,
        "km": 494
      },
      {
        "station": "Kozhikode",
        "arrival": "23:52",
        "departure": "23:55",
        "lat": 11.2508,
        "lng": 75.7844,
        "km": 602
      },
      {
        "station": "Mangaluru",
        "arrival": "04:50",
        "departure": "--",
        "lat": 12.8706,
        "lng": 74.8444,
        "km": 809
      }
    ]
  },
  {
    "trainNumber": "ABA-1",
    "trainName": "Argo Bromo Anggrek",
    "from": "Stasiun Gambir",
    "to": "Stasiun Surabaya Gubeng",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Gambir", "arrival": "START", "departure": "08:20", "lat": -6.1767, "lng": 106.8306, "km": 0 },
      { "station": "Stasiun Surabaya Gubeng", "arrival": "16:45", "departure": "END", "lat": -7.2653, "lng": 112.7521, "km": 720 }
    ]
  },
  {
    "trainNumber": "AP-36",
    "trainName": "Argo Parahyangan",
    "from": "Stasiun Gambir",
    "to": "Stasiun Bandung",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Gambir", "arrival": "START", "departure": "06:30", "lat": -6.1767, "lng": 106.8306, "km": 0 },
      { "station": "Stasiun Bandung", "arrival": "09:15", "departure": "END", "lat": -6.9147, "lng": 107.6025, "km": 150 }
    ]
  },
  {
    "trainNumber": "LD-92",
    "trainName": "Lodaya",
    "from": "Stasiun Bandung",
    "to": "Stasiun Solo Balapan",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Bandung", "arrival": "START", "departure": "07:00", "lat": -6.9147, "lng": 107.6025, "km": 0 },
      { "station": "Stasiun Yogyakarta / Tugu", "arrival": "14:20", "departure": "14:25", "lat": -7.7892, "lng": 110.3635, "km": 380 },
      { "station": "Stasiun Solo Balapan", "arrival": "15:20", "departure": "END", "lat": -7.5583, "lng": 110.8214, "km": 440 }
    ]
  },
  {
    "trainNumber": "GJ-56",
    "trainName": "Gajayana",
    "from": "Stasiun Gambir",
    "to": "Stasiun Malang",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Gambir", "arrival": "START", "departure": "18:40", "lat": -6.1767, "lng": 106.8306, "km": 0 },
      { "station": "Stasiun Yogyakarta / Tugu", "arrival": "01:30", "departure": "01:35", "lat": -7.7892, "lng": 110.3635, "km": 512 },
      { "station": "Stasiun Solo Balapan", "arrival": "02:30", "departure": "02:35", "lat": -7.5583, "lng": 110.8214, "km": 572 },
      { "station": "Stasiun Malang", "arrival": "06:50", "departure": "END", "lat": -7.9772, "lng": 112.6373, "km": 870 }
    ]
  },
  {
    "trainNumber": "MM-233",
    "trainName": "Matarmaja",
    "from": "Stasiun Pasar Senen",
    "to": "Stasiun Malang",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Pasar Senen", "arrival": "START", "departure": "10:30", "lat": -6.1856, "lng": 106.8450, "km": 0 },
      { "station": "Stasiun Solo Balapan", "arrival": "18:45", "departure": "18:50", "lat": -7.5583, "lng": 110.8214, "km": 570 },
      { "station": "Stasiun Malang", "arrival": "23:05", "departure": "END", "lat": -7.9772, "lng": 112.6373, "km": 870 }
    ]
  },
  {
    "trainNumber": "SC-100",
    "trainName": "Sancaka",
    "from": "Stasiun Yogyakarta / Tugu",
    "to": "Stasiun Surabaya Gubeng",
    "category": "Intercity Trains",
    "stops": [
      { "station": "Stasiun Yogyakarta / Tugu", "arrival": "START", "departure": "06:45", "lat": -7.7892, "lng": 110.3635, "km": 0 },
      { "station": "Stasiun Solo Balapan", "arrival": "07:35", "departure": "07:40", "lat": -7.5583, "lng": 110.8214, "km": 60 },
      { "station": "Stasiun Surabaya Gubeng", "arrival": "10:45", "departure": "END", "lat": -7.2653, "lng": 112.7521, "km": 320 }
    ]
  },
  {
    "trainNumber": "CL-4101",
    "trainName": "Commuter Line Bogor (Tujuan Bogor)",
    "from": "Stasiun Jakarta Kota",
    "to": "Stasiun Bogor",
    "category": "Commuter Line Trains",
    "stops": [
      { "station": "Stasiun Jakarta Kota", "arrival": "START", "departure": "06:15", "lat": -6.1375, "lng": 106.8146, "km": 0 },
      { "station": "Stasiun Manggarai", "arrival": "06:30", "departure": "06:31", "lat": -6.2099, "lng": 106.8502, "km": 10 },
      { "station": "Stasiun Depok", "arrival": "07:05", "departure": "07:06", "lat": -6.4058, "lng": 106.8188, "km": 32 },
      { "station": "Stasiun Citayam", "arrival": "07:15", "departure": "07:16", "lat": -6.4488, "lng": 106.8021, "km": 38 },
      { "station": "Stasiun Bojong Gede", "arrival": "07:25", "departure": "07:26", "lat": -6.4932, "lng": 106.7951, "km": 44 },
      { "station": "Stasiun Cilebut", "arrival": "07:32", "departure": "07:33", "lat": -6.5305, "lng": 106.8006, "km": 48 },
      { "station": "Stasiun Bogor", "arrival": "07:45", "departure": "END", "lat": -6.5962, "lng": 106.7907, "km": 55 }
    ]
  },
  {
    "trainNumber": "CL-4102",
    "trainName": "Commuter Line Jakarta (Tujuan Jakarta Kota)",
    "from": "Stasiun Bogor",
    "to": "Stasiun Jakarta Kota",
    "category": "Commuter Line Trains",
    "stops": [
      { "station": "Stasiun Bogor", "arrival": "START", "departure": "06:30", "lat": -6.5962, "lng": 106.7907, "km": 0 },
      { "station": "Stasiun Cilebut", "arrival": "06:40", "departure": "06:41", "lat": -6.5305, "lng": 106.8006, "km": 7 },
      { "station": "Stasiun Bojong Gede", "arrival": "06:47", "departure": "06:48", "lat": -6.4932, "lng": 106.7951, "km": 11 },
      { "station": "Stasiun Citayam", "arrival": "06:57", "departure": "06:58", "lat": -6.4488, "lng": 106.8021, "km": 17 },
      { "station": "Stasiun Depok", "arrival": "07:07", "departure": "07:08", "lat": -6.4058, "lng": 106.8188, "km": 23 },
      { "station": "Stasiun Manggarai", "arrival": "07:42", "departure": "07:43", "lat": -6.2099, "lng": 106.8502, "km": 45 },
      { "station": "Stasiun Jakarta Kota", "arrival": "08:00", "departure": "END", "lat": -6.1375, "lng": 106.8146, "km": 55 }
    ]
  }
];

export const INDONESIA_COMMUTER_ROUTES = [
  {
    id: "commuter-bogor-line",
    name: "KAI Commuter Line Bogor (Jakarta Kota - Bogor)",
    type: "commuter",
    stations: [
      { id: "JAKK", name: "Stasiun Jakarta Kota", lat: -6.1375, lng: 106.8146 },
      { id: "MRI", name: "Stasiun Manggarai", lat: -6.2099, lng: 106.8502 },
      { id: "DPK", name: "Stasiun Depok", lat: -6.4058, lng: 106.8188 },
      { id: "CTA", name: "Stasiun Citayam", lat: -6.4488, lng: 106.8021 },
      { id: "BJG", name: "Stasiun Bojong Gede", lat: -6.4932, lng: 106.7951 },
      { id: "CLT", name: "Stasiun Cilebut", lat: -6.5305, lng: 106.8006 },
      { id: "BOO", name: "Stasiun Bogor", lat: -6.5962, lng: 106.7907 }
    ],
    trains: [
      {
        id: "KRL-4101",
        number: "CL-4101",
        name: "Commuter Line Bogor (Tujuan Bogor)",
        depTime: "06:15",
        origin: "Stasiun Jakarta Kota",
        destination: "Stasiun Bogor",
        type: "Commuter"
      },
      {
        id: "KRL-4102",
        number: "CL-4102",
        name: "Commuter Line Jakarta (Tujuan Jakarta Kota)",
        depTime: "06:30",
        origin: "Stasiun Bogor",
        destination: "Stasiun Jakarta Kota",
        type: "Commuter"
      }
    ]
  }
];

export const TRAIN_ROUTES = TRAIN_DATA.map(t => {
  const fromStation = t.stops[0]?.station || t.stops[0]?.name || '';
  const toStation = t.stops[t.stops.length - 1]?.station || t.stops[t.stops.length - 1]?.name || '';
  return {
    id: t.trainNumber.toLowerCase().replace(/\s+/g, '-'),
    name: `${t.trainName} (${fromStation} - ${toStation})`,
    type: t.category === "Commuter Line Trains" ? "commuter" : "train",
    category: t.category || "Intercity Trains",
    stations: t.stops.map(s => {
      const sName = s.station || s.name || '';
      return {
        id: sName.toLowerCase().replace(/\s+/g, '-'),
        name: sName,
        lat: s.lat,
        lng: s.lng,
        distanceFromStart: s.km !== undefined ? s.km : (s.distanceFromOriginKm !== undefined ? s.distanceFromOriginKm : 0)
      };
    })
  };
});

export const BUS_ROUTES = [
  {
    "routeId": "TN-CBE-MDU",
    "routeName": "Coimbatore to Madurai",
    "stops": [
      {
        "stopName": "CBE Omni Bus Stand",
        "lat": 11.0122,
        "lng": 76.9656,
        "arrival": "14:00",
        "departure": "22:00",
        "km": 0
      },
      {
        "stopName": "Palladam",
        "lat": 11.0016,
        "lng": 77.2917,
        "arrival": "22:45",
        "departure": "22:50",
        "km": 36
      },
      {
        "stopName": "Dharapuram",
        "lat": 10.7327,
        "lng": 77.519,
        "arrival": "23:45",
        "departure": "23:55",
        "km": 74
      },
      {
        "stopName": "Oddanchatram",
        "lat": 10.4851,
        "lng": 77.7471,
        "arrival": "00:45",
        "departure": "00:50",
        "km": 112
      },
      {
        "stopName": "Dindigul Bypass",
        "lat": 10.3644,
        "lng": 77.9622,
        "arrival": "01:30",
        "departure": "01:35",
        "km": 139
      },
      {
        "stopName": "Madurai Matuthavani",
        "lat": 9.9419,
        "lng": 78.1561,
        "arrival": "02:30",
        "departure": "00:00",
        "km": 190
      }
    ]
  },
  {
    "routeId": "TN-CHE-MDU",
    "routeName": "Chennai to Madurai (Private Luxury)",
    "stops": [
      {
        "stopName": "Koyambedu CMBT",
        "lat": 13.0732,
        "lng": 80.2012,
        "arrival": "14:00",
        "departure": "21:00",
        "km": 0
      },
      {
        "stopName": "Tindivanam",
        "lat": 12.233,
        "lng": 79.645,
        "arrival": "23:30",
        "departure": "23:35",
        "km": 111
      },
      {
        "stopName": "Villupuram",
        "lat": 11.9401,
        "lng": 79.4861,
        "arrival": "00:15",
        "departure": "00:25",
        "km": 148
      },
      {
        "stopName": "Tiruchirappalli Bypass",
        "lat": 10.825,
        "lng": 78.694,
        "arrival": "03:30",
        "departure": "03:40",
        "km": 299
      },
      {
        "stopName": "Melur",
        "lat": 10.05,
        "lng": 78.33,
        "arrival": "04:30",
        "departure": "04:35",
        "km": 394
      },
      {
        "stopName": "Madurai Matuthavani",
        "lat": 9.9419,
        "lng": 78.1561,
        "arrival": "05:15",
        "departure": "00:00",
        "km": 417
      }
    ]
  }
];

export const CALCULATE_DISTANCE = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const ESTIMATE_TIME = (distance, speed = 60) => {
  // distance in km, speed in km/h
  const hours = distance / speed;
  return Math.round(hours * 60); // minutes
};

export const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:5500/api' 
  : '/api';

let audioCtx = null;
let alarmOscillator = null;

export const TRIGGER_ALARM_SOUND = () => {
  try {
    if (typeof window === 'undefined') return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (alarmOscillator) return;

    alarmOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    alarmOscillator.type = 'sine';
    alarmOscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    alarmOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    alarmOscillator.start();
  } catch (err) {
    console.warn("Audio Context playback error:", err);
  }
};

export const STOP_ALARM_SOUND = () => {
  try {
    if (alarmOscillator) {
      alarmOscillator.stop();
      alarmOscillator.disconnect();
      alarmOscillator = null;
    }
  } catch (err) {
    console.warn("Error stopping alarm audio:", err);
  }
};
