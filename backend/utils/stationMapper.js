const STATIONS_GEO_DATA = {
  "MS": { name: "Chennai Egmore", lat: 13.0822, lon: 80.2585 },
  "MAS": { name: "Chennai Central", lat: 13.0827, lon: 80.2707 },
  "TBM": { name: "Tambaram", lat: 12.9249, lon: 80.1165 },
  "CGL": { name: "Chengalpattu", lat: 12.6921, lon: 79.9766 },
  "VM": { name: "Villupuram", lat: 11.9401, lon: 79.4861 },
  "VRI": { name: "Vriddhachalam", lat: 11.5165, lon: 79.3245 },
  "TPJ": { name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047 },
  "DG": { name: "Dindigul", lat: 10.3673, lon: 77.9803 },
  "MDU": { name: "Madurai", lat: 9.9252, lon: 78.1198 },
  "TEN": { name: "Tirunelveli", lat: 8.7139, lon: 77.7567 },
  "CAPE": { name: "Kanyakumari", lat: 8.0877, lon: 77.5385 },
  "SA": { name: "Salem", lat: 11.6643, lon: 78.1460 },
  "ED": { name: "Erode", lat: 11.3410, lon: 77.7172 },
  "CBE": { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
  "TJ": { name: "Thanjavur", lat: 10.7870, lon: 79.1378 },
  "KRR": { name: "Karur", lat: 10.9601, lon: 78.0766 }
};

const mapStationCoordinates = (stationNameOrCode) => {
  // Try exact match with code
  if (STATIONS_GEO_DATA[stationNameOrCode]) {
    return STATIONS_GEO_DATA[stationNameOrCode];
  }
  
  // Try matching name (case-insensitive)
  const normalizedSearch = stationNameOrCode.toLowerCase();
  const station = Object.values(STATIONS_GEO_DATA).find(s => 
    s.name.toLowerCase().includes(normalizedSearch)
  );

  return station || { name: stationNameOrCode, lat: 0, lon: 0 };
};

module.exports = { mapStationCoordinates };
