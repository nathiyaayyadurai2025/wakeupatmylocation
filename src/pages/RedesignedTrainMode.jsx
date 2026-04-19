import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, X, Settings2, ChevronUp } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// ── Custom Map Icons ──────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="position:relative;width:22px;height:22px">
    <div style="position:absolute;inset:0;background:rgba(59,130,246,0.3);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
    <div style="position:absolute;inset:3px;background:#3B82F6;border-radius:50%;border:2.5px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6)"></div>
  </div>`
});

const stationIcon = L.divIcon({
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<div style="width:14px;height:14px;background:#10B981;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`
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
  const [phase, setPhase] = useState('loading'); // loading | error | ready
  const [errorMsg, setErrorMsg] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported on this device.');
      setPhase('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLoc({ lat, lng });
        fetchStations(lat, lng, 5000);
      },
      err => {
        setErrorMsg('Location access denied. Please enable GPS in settings.');
        setPhase('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function fetchStations(lat, lng, radius) {
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
  }

  const filtered = stations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="relative w-44 h-44 flex items-center justify-center mb-8">
          {[0, 1, 2].map(i => (
            <m.div
              key={i}
              className="absolute rounded-full border border-[#3B82F6]/40"
              style={{ inset: i * -18 - 8 }}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
            />
          ))}
          <div className="w-16 h-16 bg-[#3B82F6] rounded-full shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center justify-center z-10">
            <MapPin size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-white text-[18px] font-bold tracking-tight">Finding your location...</h2>
        <p className="text-[#9CA3AF] text-sm mt-2 font-medium">Please allow location access</p>
        <div className="flex gap-1.5 mt-5">
          {[0, 1, 2].map(i => (
            <m.div
              key={i} className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── ERROR SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <m.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C2537] rounded-2xl p-8 border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#EF4444]/20">
            <MapPin size={30} className="text-[#EF4444]" />
          </div>
          <h2 className="text-[#F9FAFB] font-bold text-xl mb-2 tracking-tight">Location Denied</h2>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-7">{errorMsg}</p>
          <button className="w-full h-12 bg-[#3B82F6] hover:bg-blue-400 active:scale-95 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Settings2 size={18} /> Open Settings
          </button>
        </m.div>
      </div>
    );
  }

  // ── MAIN STATION LIST ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0A0F1E] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Map — 45% */}
      <div className="flex-shrink-0" style={{ height: '45%' }}>
        {userLoc && (
          <MapContainer
            center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false}
            className="w-full h-full"
            style={{ background: '#0d1117' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapAutoFit userLoc={userLoc} stations={stations} />
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
            {stations.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
                <Popup>{s.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        {/* gradient fade */}
        <div className="absolute" style={{ bottom: '55%', left: 0, right: 0, height: 48, background: 'linear-gradient(to top, #111827, transparent)', zIndex: 400 }} />
      </div>

      {/* Bottom Sheet — 55% */}
      <m.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="flex flex-col bg-[#111827] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] z-10 overflow-hidden"
        style={{ flex: 1 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-[#374151] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-[#F9FAFB] font-bold text-xl tracking-tight">Nearby Stations</h3>
            <div className="bg-[#1C2537] border border-white/5 px-2.5 py-1 rounded-full">
              <span className="text-[#9CA3AF] text-xs font-bold">{stations.length} found</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search stations..."
              className="w-full h-11 bg-[#1C2537] border text-[#F9FAFB] pl-10 pr-10 rounded-xl text-sm outline-none transition-all"
              style={{ borderColor: search ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
            <AnimatePresence>
              {search && (
                <m.button
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#374151] rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-[#9CA3AF]" />
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#4B5563]">
              <MapPin size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No stations found nearby</p>
            </div>
          ) : (
            <m.div className="space-y-3" initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
              {filtered.map((st, i) => {
                const badgeColor = st.distance < 1
                  ? { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.2)' }
                  : st.distance < 3
                  ? { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' }
                  : { bg: 'rgba(75,85,99,0.2)', text: '#9CA3AF', border: 'rgba(75,85,99,0.3)' };

                return (
                  <m.div
                    key={st.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    className="bg-[#1C2537] border rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    {/* Distance badge */}
                    <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-center min-w-[52px]"
                      style={{ background: badgeColor.bg, borderColor: badgeColor.border }}>
                      <div className="text-xs font-black" style={{ color: badgeColor.text }}>{st.distance.toFixed(1)}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: badgeColor.text }}>km</div>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#F9FAFB] font-bold text-[15px] truncate">{st.name}</h4>
                      <p className="text-[#4B5563] text-[10px] font-bold uppercase tracking-wider mt-0.5">Railway Station</p>
                    </div>

                    {/* Select button */}
                    <m.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { localStorage.setItem('boardingStation', JSON.stringify(st)); navigate('/trains'); }}
                      className="flex-shrink-0 bg-[#3B82F6] hover:bg-blue-400 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-[0_0_16px_rgba(59,130,246,0.2)]"
                    >
                      Select
                    </m.button>
                  </m.div>
                );
              })}
            </m.div>
          )}
        </div>
      </m.div>
    </div>
  );
}
