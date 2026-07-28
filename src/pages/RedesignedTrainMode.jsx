import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

function MapAutoFit({ userLoc }) {
  const map = useMap();
  useEffect(() => {
    if (!userLoc) return;
    map.setView([userLoc.lat, userLoc.lng], 13);
  }, [userLoc, map]);
  return null;
}

function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
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

  // Selection Workflow Tab States
  const [activeTab, setActiveTab] = useState('search'); // search or mapTap
  const [geocodeResults, setGeocodeResults] = useState([]);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [isManualCoords, setIsManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [selectedMapTapDest, setSelectedMapTapDest] = useState(null);

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

    const q = `[out:json];node["railway"="station"](around:${radius},${lat},${lng});out;`;
    const mirrors = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass-api.de/api/interpreter',
      'https://overpass.nchc.org.tw/api/interpreter',
      'https://z.overpass-api.de/api/interpreter'
    ];

    let success = false;
    let data = null;

    for (const mirror of mirrors) {
      try {
        const res = await fetch(`${mirror}?data=${encodeURIComponent(q)}`);
        if (res.ok) {
          data = await res.json();
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`Overpass mirror ${mirror} failed or blocked by CORS:`, err);
      }
    }

    if (success && data && data.elements?.length) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndonesia]);

  // Debounced Global Station Search (India Mode)
  useEffect(() => {
    if (isIndonesia) return;
    if (!search || search.trim().length < 3) return;

    const delayDebounce = setTimeout(async () => {
      const q = `[out:json];node["railway"="station"]["name"~"${search.trim()}",i](around:1500000,20.5937,78.9629);out 30;`;
      const mirrors = [
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass-api.de/api/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter',
        'https://z.overpass-api.de/api/interpreter'
      ];

      for (const mirror of mirrors) {
        try {
          const res = await fetch(`${mirror}?data=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.elements?.length) {
              const parsed = data.elements.map(el => ({
                id: el.id,
                name: el.tags?.name || 'Unnamed Station',
                lat: el.lat, lng: el.lon,
                distance: userLoc ? haversine(userLoc.lat, userLoc.lng, el.lat, el.lon) : 0
              })).sort((a, b) => a.distance - b.distance);
              setStations(parsed);
              break;
            }
          }
        } catch (err) {
          console.warn(`Global Overpass mirror query failed for ${mirror}:`, err);
        }
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [search, isIndonesia, userLoc]);

  // Restore nearby stations if search is cleared
  useEffect(() => {
    if (!search && userLoc) {
      fetchStations(userLoc.lat, userLoc.lng, 5000);
    }
  }, [search, userLoc, fetchStations]);

  // Reset filter tab to All on active search
  useEffect(() => {
    if (search && search.trim().length >= 3) {
      setFilterType('All');
    }
  }, [search]);

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

  const handleSelectCustomStation = () => {
    if (!search.trim()) return;
    const customSt = {
      id: 'custom-' + Date.now(),
      name: search.trim(),
      lat: userLoc ? userLoc.lat : (isIndonesia ? -6.5962 : 9.9252),
      lng: userLoc ? userLoc.lng : (isIndonesia ? 106.7907 : 78.1198),
      code: 'CUST',
      distance: 0
    };
    handleSelectStation(customSt);
  };

  const handleGeocodeSearch = async (queryText) => {
    if (!queryText.trim()) return;
    setGeocodeLoading(true);
    setGeocodeError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const parsed = data.map(item => ({
            id: 'geo-' + item.place_id,
            name: item.display_name.split(',')[0] + ', ' + (item.display_name.split(',')[1] || ''),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            code: 'ADDR',
            distance: userLoc ? haversine(userLoc.lat, userLoc.lng, parseFloat(item.lat), parseFloat(item.lon)) : 0
          }));
          setGeocodeResults(parsed);
        } else {
          setGeocodeResults([]);
          setGeocodeError("Stop not found, try adding city or station name");
        }
      } else {
        setGeocodeError("Search failed, check internet connection");
      }
    } catch {
      setGeocodeError("Search failed (You may be offline). Input raw coordinates below.");
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleMapClick = (lat, lng) => {
    const tappedSt = {
      id: 'tapped-' + Date.now(),
      name: `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat: lat,
      lng: lng,
      code: 'MAP',
      distance: userLoc ? haversine(userLoc.lat, userLoc.lng, lat, lng) : 0
    };
    setSelectedMapTapDest(tappedSt);
  };

  const handleConfirmManualCoords = () => {
    const latNum = parseFloat(manualLat);
    const lngNum = parseFloat(manualLng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      alert("Please enter valid Latitude (-90 to 90) and Longitude (-180 to 180)");
      return;
    }
    const manualSt = {
      id: 'manual-' + Date.now(),
      name: `Custom Location (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`,
      lat: latNum,
      lng: lngNum,
      code: 'COORD',
      distance: userLoc ? haversine(userLoc.lat, userLoc.lng, latNum, lngNum) : 0
    };
    handleSelectStation(manualSt);
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
            <MapAutoFit userLoc={userLoc} />
            <MapClickListener onMapClick={handleMapClick} />
            
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>

            {selectedMapTapDest && (
              <Marker position={[selectedMapTapDest.lat, selectedMapTapDest.lng]} icon={L.divIcon({
                className: '',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                html: `<div style="width:22px;height:22px;background:#EF4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`
              })}>
                <Popup>{selectedMapTapDest.name}</Popup>
              </Marker>
            )}

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
                Select Destination Stop
              </h3>
            </div>
            <span className="text-lg">{countryFlag}</span>
          </div>

          {/* Workflow Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 rounded-lg text-[11px] font-black transition-all ${
                activeTab === 'search' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              🔍 Search Stop / Address
            </button>
            <button
              onClick={() => setActiveTab('mapTap')}
              className={`py-2 rounded-lg text-[11px] font-black transition-all ${
                activeTab === 'mapTap' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              📍 GPS & Map Tap
            </button>
          </div>
        </div>

        {/* Tab content 1: Nominatim Search and Address queries */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search inputs */}
            <div className="saas-card p-4 space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-400">Search Address or Landmark</span>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search size={16} className="absolute left-3 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGeocodeSearch(search)}
                    placeholder="Search e.g. Central Station..."
                    className="w-full h-11 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <X size={10} className="text-slate-500" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleGeocodeSearch(search)}
                  className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  Search
                </button>
              </div>

              {/* Manual Coord Trigger toggle for precise testing or offline fallbacks */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Type coordinates manually (Offline)</span>
                <button
                  onClick={() => setIsManualCoords(!isManualCoords)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${isManualCoords ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${isManualCoords ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Manual Raw Lat/Lng inputs */}
              {isManualCoords && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">Latitude</span>
                      <input
                        value={manualLat}
                        onChange={e => setManualLat(e.target.value)}
                        placeholder="e.g. 13.0827"
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">Longitude</span>
                      <input
                        value={manualLng}
                        onChange={e => setManualLng(e.target.value)}
                        placeholder="e.g. 80.2707"
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmManualCoords}
                    className="w-full h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs"
                  >
                    Confirm Custom Coordinates
                  </button>
                </div>
              )}
            </div>

            {/* Geocode Search Results */}
            {geocodeLoading && (
              <div className="saas-card p-4 text-center text-xs text-slate-500 animate-pulse">
                Geocoding address queries...
              </div>
            )}
            
            {geocodeError && (
              <div className="saas-card p-4 bg-red-500/5 border-red-500/10 text-red-500 text-xs font-bold text-center">
                {geocodeError}
              </div>
            )}

            {geocodeResults.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 pl-1">Geocoded Matches</span>
                {geocodeResults.map(item => (
                  <m.div
                    key={item.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectStation(item)}
                    className="saas-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Address Stop Target
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-indigo-600">{item.distance.toFixed(1)} km</span>
                    </div>
                  </m.div>
                ))}
              </div>
            )}

            {/* Standard Near Railway Station List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Or Select Nearby Train Station</span>
                {/* Quick Filters */}
                <div className="flex gap-1">
                  {['All', 'Nearby', 'Popular'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                        filterType === t 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {search && search.trim() && (
                <m.div
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSelectCustomStation}
                  className="saas-card p-4 flex items-center justify-between gap-3 cursor-pointer border-dashed border-2 border-blue-500/30 hover:bg-blue-500/5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-600">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-blue-600 truncate">Use custom station: "{search.trim()}"</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Set custom destination manually
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-blue-500" />
                </m.div>
              )}

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
        )}

        {/* Tab content 2: Interactive map selection */}
        {activeTab === 'mapTap' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="saas-card p-4 text-center space-y-2 bg-blue-500/5 border-blue-500/20">
              <span className="text-xs font-extrabold text-blue-600">Map Pin Mode Active</span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Tap anywhere on the satellite map section above to drop a custom red target destination pin for your location alarm.
              </p>
            </div>

            {selectedMapTapDest ? (
              <div className="saas-card p-4 bg-emerald-500/5 border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 animate-bounce" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Destination Pinned!</span>
                  </div>
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                    MAP PIN
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{selectedMapTapDest.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Lat: {selectedMapTapDest.lat.toFixed(5)}, Lng: {selectedMapTapDest.lng.toFixed(5)} • {selectedMapTapDest.distance.toFixed(1)} km away
                  </p>
                </div>
                <m.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectStation(selectedMapTapDest)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Confirm Target & Start Journey</span>
                </m.button>
              </div>
            ) : (
              <div className="saas-card p-8 text-center text-slate-400 text-xs">
                <MapPin size={28} className="mx-auto mb-2 opacity-30 animate-pulse" />
                <p>Waiting for you to tap the map above...</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
