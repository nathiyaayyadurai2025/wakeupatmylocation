import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, X, Navigation, Clock, Sparkles, Train, ArrowRight } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { useCountry } from '../context/CountryContext';
import { useIndonesiaRail } from '../hooks/useIndonesiaRail';

// Custom Map Icons
const userIcon = L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background:rgba(37,99,235,0.3);border-radius:50%;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
    <div style="position:relative;width:18px;height:18px;background:#2563EB;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(37,99,235,0.8);z-index:1"></div>
  </div>`
});

const stationIcon = L.divIcon({
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<div style="width:16px;height:16px;background:#10B981;border-radius:50%;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3)"></div>`
});

function MapAutoFit({ userLoc, stations }) {
  const map = useMap();
  useEffect(() => {
    if (!userLoc) return;
    if (stations.length > 0) {
      const pts = [[userLoc.lat, userLoc.lng], ...stations.map(s => [s.lat, s.lng])];
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([userLoc.lat, userLoc.lng], 13);
    }
  }, [userLoc, stations, map]);
  return null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, t = d => d * Math.PI / 180;
  const a = Math.sin(t(lat2 - lat1) / 2) ** 2 + Math.cos(t(lat1)) * Math.cos(t(lat2)) * Math.sin(t(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RedesignedTrainMode() {
  const navigate = useNavigate();
  const { isIndonesia, countryFlag, countryName } = useCountry();
  const [phase, setPhase] = useState('loading');
  const [userLoc, setUserLoc] = useState(null);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('All');

  const {
    setStationQuery,
    stations: indonesiaStations,
    nearestStationResult
  } = useIndonesiaRail(userLoc);

  useEffect(() => {
    setStationQuery(search || '');
  }, [search, setStationQuery]);

  const fetchStations = useCallback(async (lat, lng, radius) => {
    if (isIndonesia) {
      const allIdStations = indonesiaStations.map(st => ({
        id: st.stationCode,
        code: st.stationCode,
        name: st.stationName,
        lat: st.latitude,
        lng: st.longitude,
        city: st.city,
        province: st.province,
        operator: st.operator,
        distance: haversine(lat, lng, st.latitude, st.longitude)
      })).sort((a, b) => a.distance - b.distance);

      setStations(allIdStations);
      setPhase('ready');
      return;
    }

    try {
      const q = `[out:json];node["railway"="station"](around:${radius},${lat},${lng});out;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.elements?.length) {
        const parsed = data.elements.map(el => ({
          id: el.id,
          name: el.tags?.name || 'Unnamed Station',
          lat: el.lat, lng: el.lon,
          distance: haversine(lat, lng, el.lat, el.lon)
        })).sort((a, b) => a.distance - b.distance);
        setStations(parsed);
        setPhase('ready');
      } else if (radius < 10000) {
        fetchStations(lat, lng, 10000);
      } else {
        setStations([]);
        setPhase('ready');
      }
    } catch {
      setStations([]);
      setPhase('ready');
    }
  }, [isIndonesia, indonesiaStations]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPhase('ready');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLoc({ lat, lng });
        fetchStations(lat, lng, 5000);
      },
      () => {
        const fallbackLat = isIndonesia ? -6.1767 : 13.0827;
        const fallbackLng = isIndonesia ? 106.8306 : 80.2707;
        setUserLoc({ lat: fallbackLat, lng: fallbackLng });
        fetchStations(fallbackLat, fallbackLng, 10000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isIndonesia, fetchStations]);

  const filtered = stations.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(q);
    const codeMatch = s.code ? s.code.toLowerCase().includes(q) : false;
    const cityMatch = s.city ? s.city.toLowerCase().includes(q) : false;
    const provMatch = s.province ? s.province.toLowerCase().includes(q) : false;

    if (tabFilter === 'Nearby') return (nameMatch || codeMatch || cityMatch || provMatch) && s.distance <= 15;
    if (tabFilter === 'Popular') return (nameMatch || codeMatch || cityMatch || provMatch) && (s.distance <= 50 || s.code === 'GMR' || s.code === 'BD' || s.code === 'SLO');
    return nameMatch || codeMatch || cityMatch || provMatch;
  });

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Map Section (40% height) */}
      <div className="relative w-full h-[40vh] bg-slate-200 dark:bg-slate-900 flex-shrink-0">
        {userLoc && (
          <MapContainer
            center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapAutoFit userLoc={userLoc} stations={stations} />
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
            {stations.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
                <Popup>{s.name} {s.code ? `(${s.code})` : ''}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-[400]" />
      </div>

      {/* Main Content Sheet (60% height / scrollable) */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 -mt-6 relative z-10 space-y-6 pb-24">
        {/* Nearest Station Alert Card */}
        {isIndonesia && nearestStationResult && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                <Navigation size={20} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Nearest Station Detected</span>
                <h4 className="font-bold text-base">{nearestStationResult.station.stationName} ({nearestStationResult.station.stationCode})</h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-emerald-300">{nearestStationResult.distanceKm} km</div>
              <div className="text-[10px] text-blue-200">~{nearestStationResult.etaMinutes} min ETA</div>
            </div>
          </m.div>
        )}

        {/* Command Palette Search Header */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Select Boarding Station</span>
                <span>{countryFlag}</span>
              </h2>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Search PT KAI & Commuter stations across {countryName}</p>
            </div>
            <span className="self-start sm:self-auto text-xs font-extrabold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {filtered.length} stations found
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by station name, station code, city, province..."
              className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
            {['All', 'Nearby', 'Popular'].map(tab => (
              <button
                key={tab}
                onClick={() => setTabFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  tabFilter === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Station Cards Grid */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="saas-card p-12 text-center text-slate-400">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No stations found matching your search</p>
            </div>
          ) : (
            filtered.map((st) => (
              <m.div
                key={st.id}
                whileHover={{ scale: 1.01 }}
                className="saas-card p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Distance badge */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-extrabold">
                    <span className="text-base leading-none">{st.distance.toFixed(1)}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold">km</span>
                  </div>

                  {/* Name & details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">{st.name}</h4>
                      {st.code && (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {st.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                        {st.operator || 'Railway Station'}
                      </span>
                      {st.province && <span>• {st.city}, {st.province}</span>}
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    localStorage.setItem('boardingStation', JSON.stringify(st));
                    navigate('/trains');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Select</span>
                  <ArrowRight size={14} />
                </m.button>
              </m.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
