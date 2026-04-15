import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet';
import {
  ArrowLeft, MapPin, Navigation, Zap, Check, Search, ArrowRight,
  Home, Briefcase, Landmark, Loader2, X, MapPinOff, LocateFixed
} from 'lucide-react';
import { AlarmContext } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default marker icons ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Custom destination pin icon ────────────────────────────────────────────
const createPinIcon = () => L.divIcon({
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  html: `
    <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <ellipse cx="20" cy="37" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
        <path d="M20 2 C11.2 2 4 9.2 4 18 C4 29 20 38 20 38 C20 38 36 29 36 18 C36 9.2 28.8 2 20 2Z" fill="#6366f1"/>
        <circle cx="20" cy="18" r="6" fill="white" opacity="0.95"/>
      </svg>
    </div>
  `,
});

// ─── Map utilities ────────────────────────────────────────────────────────────
const MapFlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.flyTo([target.lat, target.lng], target.zoom ?? 15, { animate: true, duration: 1.4 });
    }
  }, [map, target]);
  return null;
};

const MapCenterTracker = ({ onMove }) => {
  useMapEvents({
    moveend(e) { onMove(e.target.getCenter()); },
  });
  return null;
};

// ─── Nominatim autocomplete hook ──────────────────────────────────────────────
const useNominatimSearch = (userLocation) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback((query) => {
    clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const fetchNominatim = async (searchText) => {
          let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&addressdetails=1&limit=10&countrycodes=in&viewbox=77.9,10.6,78.3,10.3&bounded=0`;
          
          if (userLocation && userLocation.lat && userLocation.lng) {
            url += `&lat=${userLocation.lat}&lon=${userLocation.lng}`;
          }

          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(res.status === 429 ? 'rate_limit' : 'fetch_error');
          return await res.json();
        };

        // Primary generic search
        let data = await fetchNominatim(query.trim());

        // Tamil Nadu specific fallback hook
        if (!data || data.length === 0) {
          data = await fetchNominatim(`${query.trim()}, Tamil Nadu, India`);
        }

        if (data && data.length > 0) {
          setSuggestions(data.map(item => {
            const addr = item.address || {};
            // Subtitle should be Village / Area / District (gray)
            const villageOrArea = addr.village || addr.neighbourhood || addr.suburb || addr.town || addr.city || '';
            const district = addr.county || addr.state_district || '';
            const state = addr.state || '';
            
            // Unique clean subtitle parts
            const subtitleParts = [villageOrArea, district, state, addr.country].filter(Boolean);
            const subtitle = [...new Set(subtitleParts)].join(', ');

            // Place Name (bold)
            const placeName = item.name || item.display_name.split(',')[0].trim();

            return {
              id: item.place_id,
              displayName: placeName,
              shortName: placeName,
              subtitle: subtitle || 'Tamil Nadu, India',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              type: item.type,
              category: item.class,
            };
          }));
          setError(null);
        } else {
          setSuggestions([]);
          setError('no_results');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setSuggestions([]);
        setError(err.message === 'rate_limit' ? 'rate_limit' : 'fetch_error');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce requested
  }, [userLocation]);

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  return { suggestions, loading, error, search, clear };
};

// ─── Suggestion type icon ────────────────────────────────────────────────────
const SuggestionIcon = ({ category, type }) => {
  const cls = 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px]';
  if (category === 'railway' || type === 'station') return <div className={`${cls} bg-blue-500/15 text-blue-400`}>🚂</div>;
  if (category === 'highway' || type === 'bus_stop') return <div className={`${cls} bg-orange-500/15 text-orange-400`}>🚌</div>;
  if (category === 'aeroway') return <div className={`${cls} bg-sky-500/15 text-sky-400`}>✈️</div>;
  if (category === 'amenity' && (type === 'hospital' || type === 'clinic')) return <div className={`${cls} bg-red-500/15 text-red-400`}>🏥</div>;
  if (category === 'amenity' && type === 'school') return <div className={`${cls} bg-yellow-500/15 text-yellow-400`}>🏫</div>;
  if (category === 'natural' || category === 'waterway') return <div className={`${cls} bg-emerald-500/15 text-emerald-400`}>🌿</div>;
  if (type === 'administrative' || type === 'town' || type === 'city' || type === 'village') return <div className={`${cls} bg-violet-500/15 text-violet-400`}>🏙️</div>;
  return <div className={`${cls} bg-brand-indigo/15 text-brand-indigo`}><MapPin size={14} /></div>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const GeneralSelectionPage = () => {
  const navigate = useNavigate();
  const { userLocation, setTravelMode, setSelectedStops, settings } = useContext(AlarmContext);

  const [pinnedLocation, setPinnedLocation] = useState(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null
  );
  const [flyTarget, setFlyTarget] = useState(null);
  const [stopName, setStopName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pinIcon] = useState(() => createPinIcon());

  const { suggestions, loading, error, search, clear } = useNominatimSearch(userLocation);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ── Input change → trigger search ──────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(true);
    setIsConfirmed(false);
    search(val);
  };

  // ── When user picks a suggestion ────────────────────────────────────────────
  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.shortName);
    setStopName(suggestion.shortName);
    setPinnedLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setFlyTarget({ lat: suggestion.lat, lng: suggestion.lng, zoom: 16 });
    setIsConfirmed(true);
    setShowDropdown(false);
    clear();
    inputRef.current?.blur();
  };

  // ── Clear search ─────────────────────────────────────────────────────────
  const handleClearSearch = () => {
    setSearchQuery('');
    setStopName('');
    setShowDropdown(false);
    setIsConfirmed(false);
    clear();
    inputRef.current?.focus();
  };

  // ── Close dropdown when clicking outside ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Map center drag updates pinned location ──────────────────────────────
  const handleMapMove = (center) => {
    setPinnedLocation({ lat: center.lat, lng: center.lng });
    if (!loading) setIsConfirmed(true);
  };

  // ── Quick chip searches ──────────────────────────────────────────────────
  const handleQuickChip = (label) => {
    setSearchQuery(label);
    setShowDropdown(true);
    search(label);
  };

  // ── Activate mission ─────────────────────────────────────────────────────
  const handleStartMission = () => {
    if (!pinnedLocation) return;
    setTravelMode('general');
    setSelectedStops([{
      stopName: stopName || searchQuery || 'Custom Target',
      lat: pinnedLocation.lat,
      lng: pinnedLocation.lng,
    }]);
    navigate('/tracking');
  };

  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [13.0827, 80.2707];

  return (
    <div className="flex flex-col h-screen relative bg-slate-950 overflow-hidden">

      {/* ══════════ MAP BACKGROUND ══════════ */}
      <div className="absolute inset-0 z-0 opacity-75">
        <MapContainer
          center={mapCenter}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom={true}
          dragging={true}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFlyTo target={flyTarget} />
          <MapCenterTracker onMove={handleMapMove} />

          {/* Destination marker */}
          {pinnedLocation && isConfirmed && (
            <Marker position={[pinnedLocation.lat, pinnedLocation.lng]} icon={pinIcon} />
          )}

          {/* Alarm radius ring */}
          {pinnedLocation && (
            <Circle
              center={[pinnedLocation.lat, pinnedLocation.lng]}
              radius={(settings.distanceThreshold || 2) * 1000}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '6, 10',
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* ══════════ MAP CENTER RETICLE ══════════ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-2 border-brand-indigo/40 flex items-center justify-center bg-brand-indigo/5">
          <div className="w-2.5 h-2.5 bg-brand-indigo rounded-full shadow-[0_0_18px_rgba(99,102,241,0.9)]" />
        </div>
        <AnimatePresence>
          {!isConfirmed && (
            <m.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-darker px-4 py-2 rounded-2xl border border-white/10 mt-4 shadow-xl"
            >
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                Drag map to pin location
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ TOP SEARCH PANEL ══════════ */}
      <div className="absolute top-8 left-4 right-4 z-40 space-y-2">

        {/* ── Row: Back button + Search bar ── */}
        <div className="flex items-center space-x-2">
          {/* Back button — matches 48px search bar height */}
          <m.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/')}
            style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
            className="bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center text-slate-400 border border-white/10 shadow-xl"
          >
            <ArrowLeft size={20} />
          </m.button>

          {/* Search input wrapper — relative parent for dropdown */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="relative">
              {/* Search icon — left */}
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search any location..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                style={{
                  height: 48,
                  fontSize: 15,
                  borderRadius: 12,
                  paddingLeft: 40,
                  paddingRight: searchQuery.length > 0 ? 44 : 14,
                }}
                className="w-full bg-slate-900/90 backdrop-blur-3xl border border-white/10 text-white font-normal placeholder:text-slate-500 outline-none focus:border-brand-indigo/60 transition-all shadow-xl"
              />

              {/* Right side: spinner or clear */}
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                {loading && (
                  <Loader2 size={16} className="text-brand-indigo animate-spin" />
                )}
                {searchQuery.length > 0 && !loading && (
                  <button
                    onClick={handleClearSearch}
                    style={{ width: 28, height: 28, borderRadius: 8 }}
                    className="bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* ══ AUTOCOMPLETE DROPDOWN ══ */}
            <AnimatePresence>
              {showDropdown && (loading || suggestions.length > 0 || error) && (
                <m.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  style={{ borderRadius: 12, marginTop: 6 }}
                  className="absolute top-full left-0 right-0 bg-slate-900/97 backdrop-blur-3xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden z-50"
                >
                  {/* Loading skeleton */}
                  {loading && suggestions.length === 0 && (
                    <div className="px-3 py-3 space-y-2.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-2.5 animate-pulse">
                          <div className="w-7 h-7 bg-slate-800 rounded-lg flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2.5 bg-slate-800 rounded-full w-3/5" />
                            <div className="h-2 bg-slate-800/50 rounded-full w-2/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {error === 'no_results' && !loading && (
                    <div className="px-4 py-5 flex items-center space-x-2.5">
                      <MapPinOff size={18} className="text-slate-600 flex-shrink-0" />
                      <div>
                        <p style={{ fontSize: 14 }} className="font-semibold text-slate-500">No locations found</p>
                        <p className="text-[11px] text-slate-700 mt-0.5">Try a city, street, or landmark name</p>
                      </div>
                    </div>
                  )}

                  {/* Fetch / network error */}
                  {error === 'fetch_error' && !loading && (
                    <div className="px-5 py-5 flex items-start space-x-3">
                      <X size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-red-400 leading-relaxed">
                        Unable to fetch location results.<br />
                        <span className="text-red-500/70 font-normal">Please check your internet connection.</span>
                      </p>
                    </div>
                  )}

                  {/* Rate-limit error (HTTP 429) */}
                  {error === 'rate_limit' && !loading && (
                    <div className="px-5 py-5 flex items-start space-x-3">
                      <Loader2 size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-amber-400 leading-relaxed">
                        Too many requests.<br />
                        <span className="text-amber-500/70 font-normal">Please wait a moment and try again.</span>
                      </p>
                    </div>
                  )}

                  {/* Suggestion list — max 250px scrollable */}
                  {suggestions.length > 0 && (
                    <ul style={{ maxHeight: 250 }} className="overflow-y-auto divide-y divide-white/[0.04]">
                      {suggestions.map((s, idx) => (
                        <li key={s.id}>
                          <button
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full px-3 py-2.5 flex items-center space-x-2.5 text-left hover:bg-white/5 active:bg-white/8 transition-colors group"
                          >
                            {/* Location type icon — compact */}
                            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[12px]"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              {s.category === 'railway' || s.type === 'station' ? '🚂'
                                : s.category === 'aeroway' ? '✈️'
                                : s.category === 'amenity' && s.type === 'hospital' ? '🏥'
                                : s.type === 'city' || s.type === 'town' || s.type === 'administrative' ? '🏙️'
                                : <MapPin size={12} className="text-slate-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontSize: 15 }} className="font-medium text-white truncate group-hover:text-brand-indigo transition-colors leading-tight">
                                {s.shortName}
                              </p>
                              {s.subtitle && (
                                <p style={{ fontSize: 12 }} className="text-slate-500 truncate mt-0.5 leading-tight">
                                  {s.subtitle}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Nominatim attribution */}
                  {suggestions.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-white/[0.04]">
                      <span className="text-[9px] text-slate-800 tracking-wide">© OpenStreetMap contributors</span>
                    </div>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Quick Chips ── */}
        <div className="flex items-center space-x-2 overflow-x-auto" style={{ scrollbarWidth: 'none', paddingBottom: 2 }}>
          {[
            { label: 'Nearby', icon: '📍' },
            { label: 'Airport', icon: '✈️' },
            { label: 'Railway Station', icon: '🚂' },
            { label: 'Hospital', icon: '🏥' },
            { label: 'Mall', icon: '🛍️' },
          ].map(({ label, icon }) => (
            <m.button
              key={label}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleQuickChip(label)}
              style={{ borderRadius: 20, fontSize: 11, height: 32, flexShrink: 0 }}
              className="flex items-center space-x-1.5 pl-2.5 pr-3 bg-slate-900/85 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-brand-indigo/40 transition-all shadow-lg"
            >
              <span style={{ fontSize: 13 }}>{icon}</span>
              <span className="font-medium whitespace-nowrap tracking-wide">{label}</span>
            </m.button>
          ))}
        </div>
      </div>

      {/* ══════════ CONFIRMATION BOTTOM CARD ══════════ */}
      <AnimatePresence>
        {isConfirmed && pinnedLocation && (
          <m.div
            initial={{ y: 220, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 220, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute bottom-6 left-4 right-4 z-40"
          >
            <div className="bg-slate-900/95 backdrop-blur-3xl p-7 rounded-[3rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="scan-line opacity-10" />
              <div className="relative z-10">

                {/* Destination info row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse" />
                      <span className="text-[9px] font-black text-brand-indigo uppercase tracking-[0.25em]">Destination Identified</span>
                    </div>
                    <input
                      type="text"
                      value={stopName}
                      onChange={(e) => setStopName(e.target.value)}
                      placeholder="Name this location..."
                      className="bg-transparent text-2xl font-black text-white tracking-tight w-full border-none outline-none placeholder:text-white/20"
                    />
                    <p className="text-[10px] text-slate-600 font-mono mt-1">
                      {pinnedLocation.lat.toFixed(5)}, {pinnedLocation.lng.toFixed(5)}
                    </p>
                  </div>
                  <m.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5 }}
                    className="w-16 h-16 rounded-[1.4rem] bg-brand-indigo/20 flex items-center justify-center text-brand-indigo border border-brand-indigo/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                  >
                    <MapPin size={30} />
                  </m.div>
                </div>

                {/* Alarm radius badge */}
                <div className="flex items-center space-x-2 mb-5 px-1">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Alarm will trigger within <span className="text-violet-400 font-black">{settings.distanceThreshold || 2} km</span> of this location
                  </span>
                </div>

                {/* Activate button */}
                <m.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartMission}
                  className="w-full py-6 bg-gradient-to-r from-brand-indigo to-violet-600 rounded-[1.6rem] flex items-center justify-center space-x-3 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.55)] hover:shadow-[0_25px_60px_-10px_rgba(99,102,241,0.7)] transition-all group relative overflow-hidden"
                >
                  <div className="scan-line opacity-30 rounded-[1.6rem]" />
                  <Zap size={20} className="text-white fill-current relative z-10" />
                  <span className="text-white font-black uppercase tracking-[0.35em] text-[11px] relative z-10">
                    Activate Arrival Alarm
                  </span>
                  <ArrowRight size={18} className="text-white group-hover:translate-x-1 transition-transform relative z-10" />
                </m.button>

                <div className="flex items-center justify-center mt-5 space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">GPS Satellite Lock Active</p>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeneralSelectionPage;
