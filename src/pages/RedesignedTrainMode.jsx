import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, X, Settings2 } from 'lucide-react';
import { motion as m } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;

const customUserIcon = L.divIcon({
  className: '',
  iconSize: [24, 24],
  html: `<div style="width:24px;height:24px;background:#3B82F6;border-radius:50%;border:4px solid white;box-shadow:0 0 20px #3B82F6;animation:pulse 2s infinite"></div>`
});

const stationIcon = L.divIcon({
  className: '',
  iconSize: [16, 16],
  html: `<div style="width:16px;height:16px;background:#10B981;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5)"></div>`
});

function MapFitter({ center, stations }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const a = Math.sin(toRad(lat2 - lat1)/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1)/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function RedesignedTrainMode() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Location access lost. Please enable GPS.");
      setLoading(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      // In case geolocation gets stuck waiting
      if(loading) {
        setErrorMsg("Location request timed out. Please check permissions.");
        setLoading(false);
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLoc({ lat, lng });
        fetchStations(lat, lng, 5000);
      },
      (err) => {
        clearTimeout(timeoutId);
        setErrorMsg("Location access denied. Please open settings and allow.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    
    return () => clearTimeout(timeoutId);
  }, []);

  const fetchStations = async (lat, lon, radius) => {
    try {
      const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["railway"="station"](around:${radius},${lat},${lon});out;`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.elements?.length > 0) {
        const parsed = data.elements.map(el => ({
          id: el.id,
          name: el.tags.name || 'Unnamed Station',
          lat: el.lat,
          lng: el.lon,
          distance: haversine(lat, lon, el.lat, el.lon)
        })).sort((a, b) => a.distance - b.distance);
        setStations(parsed);
      } else if (radius === 5000) {
        fetchStations(lat, lon, 10000); 
      } else {
        setErrorMsg("No stations found nearby");
      }
    } catch {
      setErrorMsg("Network error finding stations");
    } finally {
      setLoading(false);
    }
  };

  const selectStation = (st) => {
    localStorage.setItem("boardingStation", JSON.stringify(st));
    navigate('/trains');
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#1C2537] p-8 rounded-2xl border border-white/5 shadow-2xl max-w-sm w-full">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <MapPin size={32} />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Location Denied</h2>
          <p className="text-[#9CA3AF] text-sm mb-6 leading-relaxed">{errorMsg}</p>
          <button className="w-full bg-[#3B82F6] hover:bg-blue-500 active:scale-95 text-white py-3 rounded-xl font-bold flex items-center justify-center transition-all">
            <Settings2 size={18} className="mr-2" /> Open Settings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center overflow-hidden">
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          {[1, 2, 3].map(i => (
            <m.div
              key={i}
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute inset-0 rounded-full bg-[#3B82F6]/30 border border-[#3B82F6]/50"
            />
          ))}
          <div className="w-10 h-10 bg-[#3B82F6] rounded-full shadow-[0_0_20px_#3B82F6] z-10" />
        </div>
        <h2 className="text-[18px] font-bold text-white tracking-tight">Finding your location</h2>
        <p className="text-[#9CA3AF] text-sm mt-1">Please allow location access</p>
        <div className="flex space-x-1 mt-4">
          {[0, 1, 2].map(i => (
            <m.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = stations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen flex flex-col bg-[#0A0F1E] font-sans">
      {/* 45% Map */}
      <div className="h-[45%] w-full relative z-0">
        {userLoc && (
          <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" />
            <MapFitter center={userLoc} stations={stations} />
            <Marker position={[userLoc.lat, userLoc.lng]} icon={customUserIcon} />
            {stations.map(st => (
              <Marker key={st.id} position={[st.lat, st.lng]} icon={stationIcon}>
                <Popup className="custom-popup">{st.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#111827] to-transparent z-[400]" />
      </div>

      {/* 55% Bottom Sheet style view */}
      <div className="h-[55%] bg-[#111827] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] z-[500] -mt-4 relative flex flex-col">
        {/* Drag handle */}
        <div className="absolute top-0 inset-x-0 flex justify-center py-3">
          <div className="w-10 h-1.5 bg-[#4B5563] rounded-full" />
        </div>

        <div className="px-6 pt-8 pb-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-white font-bold text-xl tracking-tight">Nearby Stations</h3>
            <span className="bg-[#1C2537] text-[#9CA3AF] text-xs font-bold px-2 py-1 rounded-full border border-white/5">
              {stations.length} found
            </span>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input 
              type="text" 
              placeholder="Search stations..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1C2537] text-white pl-10 pr-10 h-11 rounded-xl text-sm border border-white/5 outline-none focus:border-[#3B82F6]/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3" style={{ scrollbarWidth: 'none' }}>
          <m.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-3"
          >
            {filtered.map(st => {
              const bdgColor = st.distance < 1 ? 'bg-green-500/20 text-green-400' : st.distance < 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300';
              return (
                <m.div 
                  key={st.id}
                  variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                  className="bg-[#1C2537] border border-white/5 p-4 rounded-2xl flex items-center shadow-sm"
                >
                  <div className={`px-2 py-1 rounded-md text-[10px] font-black mr-4 uppercase tracking-wider whitespace-nowrap w-16 text-center ${bdgColor}`}>
                    {st.distance.toFixed(1)} km
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-[#F9FAFB] font-bold text-base truncate">{st.name}</h4>
                    <p className="text-[#4B5563] text-xs font-medium uppercase tracking-wide mt-0.5">Railway Station</p>
                  </div>
                  <button 
                    onClick={() => selectStation(st)}
                    className="bg-[#3B82F6] hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-transform whitespace-nowrap"
                  >
                    Select
                  </button>
                </m.div>
              );
            })}
          </m.div>
        </div>
      </div>
    </div>
  );
}
