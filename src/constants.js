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
  }
};

export const TRAIN_DATA = [
  {
    "trainNumber": "12637",
    "trainName": "Pandian Express",
    "from": "Chennai Egmore",
    "to": "Madurai",
    "stops": [
      {
        "station": "Chennai Egmore",
        "arrival": "--",
        "departure": "21:40",
        "lat": 13.0822,
        "lng": 80.2585,
        "km": 0
      },
      {
        "station": "Tambaram",
        "arrival": "22:08",
        "departure": "22:10",
        "lat": 12.9249,
        "lng": 80.1165,
        "km": 24
      },
      {
        "station": "Chengalpattu",
        "arrival": "22:38",
        "departure": "22:40",
        "lat": 12.6921,
        "lng": 79.9766,
        "km": 53
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
        "station": "Vriddhachalam",
        "arrival": "00:48",
        "departure": "00:50",
        "lat": 11.5165,
        "lng": 79.3245,
        "km": 202
      },
      {
        "station": "Tiruchirappalli",
        "arrival": "02:45",
        "departure": "02:50",
        "lat": 10.7905,
        "lng": 78.7047,
        "km": 308
      },
      {
        "station": "Dindigul",
        "arrival": "04:02",
        "departure": "04:05",
        "lat": 10.3673,
        "lng": 77.9803,
        "km": 401
      },
      {
        "station": "Madurai",
        "arrival": "05:25",
        "departure": "--",
        "lat": 9.9252,
        "lng": 78.1198,
        "km": 452
      }
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
  }
];

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
