import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function RedesignedTrainMode() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Location access lost. Please enable GPS.");
      setLoading(false);
      return;
    }
    
    // Request GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = position = pos.coords.longitude;
        setUserLoc({ lat, lng });
        fetchStations(lat, lng, 5000);
      },
      (err) => {
        console.error(err);
        setErrorMsg("Location access lost. Please enable GPS.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const fetchStations = async (lat, lon, radius) => {
    setLoading(true);
    try {
      const query = `[out:json];node["railway"="station"](around:${radius},${lat},${lon});out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const parsed = data.elements.map(el => ({
          id: el.id,
          name: el.tags.name || 'Unnamed Station',
          lat: el.lat,
          lng: el.lon,
          distance: haversine(lat, lon, el.lat, el.lon)
        })).sort((a, b) => a.distance - b.distance);
        setStations(parsed);
      } else if (radius === 5000) {
        fetchStations(lat, lon, 10000); // auto expand
      } else {
        setStations([]);
        setErrorMsg("No stations found nearby");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("No stations found nearby");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStation = (station) => {
    localStorage.setItem("boardingStation", JSON.stringify(station));
    navigate('/trains');
  };

  if (loading && !stations.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Finding your location...</h2>
        <p className="text-slate-500 text-sm mt-2">Searching for railway stations within 5km</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 pt-[3.5rem]">
      {/* Map half */}
      <div className="h-64 sm:h-80 w-full relative z-0 flex-shrink-0">
        {userLoc && (
          <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLoc.lat, userLoc.lng]}>
              <Popup>You are Here</Popup>
            </Marker>
            {stations.map(st => (
              <Marker key={st.id} position={[st.lat, st.lng]}>
                <Popup>{st.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* List half */}
      <div className="flex-1 overflow-y-auto p-4 z-10 bg-slate-950 rounded-t-3xl -mt-6">
        <h3 className="text-white font-bold text-lg mb-4 ml-1 flex items-center">
          <MapPin size={18} className="text-blue-500 mr-2" />
          Nearby Stations
        </h3>
        
        {errorMsg ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center">
            {errorMsg}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No stations found nearby</div>
        ) : (
          <div className="space-y-3">
            {stations.map(st => (
              <div key={st.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div>
                  <h4 className="text-white font-bold text-base">{st.name}</h4>
                  <p className="text-slate-400 text-xs mt-1">{st.distance.toFixed(1)} km away</p>
                </div>
                <button 
                  onClick={() => handleSelectStation(st)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Select Station
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
