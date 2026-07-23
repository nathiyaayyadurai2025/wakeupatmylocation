import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, X, Navigation, Check, Train, ArrowLeft, ArrowRight, History } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { useCountry } from '../context/CountryContext';
import { useIndonesiaRail } from '../hooks/useIndonesiaRail';

const userIcon = L.divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: `<div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background:rgba(37,99,235,0.3);border-radius:50%;animation:ping 1.8s infinite"></div>
    <div style="width:14px;height:14px;background:#2563EB;border-radius:50%;border:2.5px solid white;"></div>
  </div>`
});

const stationIcon = L.divIcon({
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<div style="width:14px;height:14px;background:#10B981;border-radius:50%;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.2)"></div>`
});

function MapAutoFit({ userLoc, stations }) {
  const map = useMap();
  useEffect(() => {
    if (!userLoc) return;
    if (stations.length > 0) {
      const pts = [[userLoc.lat, userLoc.lng], ...stations.map(s => [s.lat, s.lng])];
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
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
  const location = useLocation();
  const { isIndonesia, countryFlag, countryName } = useCountry();
  const [userLoc, setUserLoc] = useState(null);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');
  const [selectType, setSelectType] = useState(location.state?.selectType || 'FROM'); // FROM or TO station selector
  const [filterType, setFilterType] = useState('All'); // All, Nearby, Popular, Recent

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
      } else if (radius < 10000) {
        fetchStations(lat, lng, 10000);
      } else {
        setStations([]);
      }
    } catch {
      setStations([]);
    }
  }, [isIndonesia, indonesiaStations]);

  useEffect(() => {
    if (!navigator.geolocation) return;
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

  const popularStations = isIndonesia 
    ? ['GMR', 'BD', 'SLO', 'SGU', 'YK'] 
    : ['MAS', 'NDLS', 'HWH', 'CSMT'];

  const filtered = stations.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(q);
    const codeMatch = s.code ? s.code.toLowerCase().includes(q) : false;
    const cityMatch = s.city ? s.city.toLowerCase().includes(q) : false;

    const baseMatch = nameMatch || codeMatch || cityMatch;
    if (!baseMatch) return false;

    if (filterType === 'Nearby') return s.distance <= 15;
    if (filterType === 'Popular') return popularStations.includes(s.code || '');
    return true;
  });

  const handleSelectStation = (st) => {
    if (selectType === 'FROM') {
      localStorage.setItem('boardingStation', JSON.stringify(st));
      setSelectType('TO');
      setSearch('');
    } else {
      localStorage.setItem('destinationName', st.name);
      localStorage.setItem('destinationLat', st.lat.toString());
      localStorage.setItem('destinationLng', st.lng.toString());
      navigate('/');
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans max-w-md mx-auto border-x border-slate-200 dark:border-slate-800">
      
      {/* Map Section (Mobile Sheet Style) */}
      <div className="relative w-full h-[32vh] bg-slate-200 dark:bg-slate-900 flex-shrink-0">
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
                <Popup>{s.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-[400]" />
      </div>

      {/* Booking Station Selector Panel */}
      <div className="flex-1 px-4 -mt-4 relative z-[1000] space-y-4 pb-20">
        
        {/* Command Toggle Selector */}
        <div className="saas-card p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200"
            >
              <ArrowLeft size={16} />
            </m.button>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Plan My Alarm</span>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Select {selectType} Station
              </h3>
            </div>
            <span className="text-lg">{countryFlag}</span>
          </div>

          {/* Selector Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setSelectType('FROM')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectType === 'FROM' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              From Station
            </button>
            <button
              onClick={() => setSelectType('TO')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectType === 'TO' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              To Station
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${selectType.toLowerCase()} station...`}
              className="w-full h-11 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <X size={10} className="text-slate-500" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Nearby', 'Popular'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  filterType === t 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Station List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="saas-card p-8 text-center text-slate-400 text-xs">
              <MapPin size={28} className="mx-auto mb-2 opacity-30" />
              <p>No stations matching criteria</p>
            </div>
          ) : (
            filtered.map(st => (
              <m.div
                key={st.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectStation(st)}
                className="saas-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <Train size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{st.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {st.code || 'STN'} • {st.operator || 'PT KAI / IR'}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-blue-600">{st.distance.toFixed(1)} km</span>
                </div>
              </m.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
