import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Train,
  MapPin,
  ArrowUpDown,
  Search,
  Bell,
  Clock,
  Settings,
  Shield,
  HelpCircle,
  TrendingUp,
  Map,
  Compass,
  ArrowRight,
  User,
  Star,
  ChevronRight,
  Share2,
  X,
  AlertCircle
} from 'lucide-react';
import { TRIGGER_ALARM_SOUND, STOP_ALARM_SOUND, API_BASE_URL } from '../constants';
import indianStations from '../data/indianStations.json';

// Global cache variables to ensure station database is loaded only once and cached
let cachedStations = null;
let isFetchingStations = false;
let stationFetchPromise = null;

const loadStations = async () => {
  if (cachedStations) return cachedStations;
  
  if (isFetchingStations) {
    return stationFetchPromise;
  }

  isFetchingStations = true;
  stationFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/train`);
      if (res.ok) {
        const trains = await res.json();
        const stationMap = new Map();
        
        trains.forEach(train => {
          if (train.stations && Array.isArray(train.stations)) {
            train.stations.forEach(st => {
              const name = st.station;
              const localMatch = indianStations.find(
                ls => ls.name.toLowerCase() === name.toLowerCase()
              );
              if (localMatch) {
                stationMap.set(name.toLowerCase(), {
                  name: localMatch.name,
                  code: localMatch.code,
                  state: localMatch.state || 'Tamil Nadu',
                  lat: localMatch.lat,
                  lng: localMatch.lng
                });
              } else {
                stationMap.set(name.toLowerCase(), {
                  name,
                  code: name.slice(0, 3).toUpperCase(),
                  state: 'Tamil Nadu',
                  lat: 13.0827,
                  lng: 80.2707
                });
              }
            });
          }
        });

        // Mix in local database stations
        indianStations.forEach(ls => {
          if (!stationMap.has(ls.name.toLowerCase())) {
            stationMap.set(ls.name.toLowerCase(), {
              name: ls.name,
              code: ls.code,
              state: ls.state || 'Tamil Nadu',
              lat: ls.lat,
              lng: ls.lng
            });
          }
        });

        cachedStations = Array.from(stationMap.values());
      } else {
        throw new Error('API Response not OK');
      }
    } catch (err) {
      console.warn("Station API fetch failed, falling back to local database:", err);
      cachedStations = indianStations.map(ls => ({
        name: ls.name,
        code: ls.code,
        state: ls.state || 'Tamil Nadu',
        lat: ls.lat,
        lng: ls.lng
      }));
    } finally {
      isFetchingStations = false;
    }
    return cachedStations;
  })();

  return stationFetchPromise;
};

function StationAutocomplete({
  label,
  placeholder,
  selectedStation,
  onSelectStation,
  icon: Icon,
  iconColor,
  excludeStation
}) {
  const [query, setQuery] = useState(selectedStation ? `${selectedStation.name} (${selectedStation.code || ''})` : '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedStation) {
      setQuery(`${selectedStation.name} (${selectedStation.code || ''})`);
    } else {
      setQuery('');
    }
  }, [selectedStation]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const handleFocus = async () => {
    setIsOpen(true);
    if (stations.length === 0) {
      setLoading(true);
      const data = await loadStations();
      setStations(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (selectedStation) {
          setQuery(`${selectedStation.name} (${selectedStation.code || ''})`);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedStation]);

  const filteredStations = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const isExactSelected = selectedStation && `${selectedStation.name} (${selectedStation.code || ''})`.toLowerCase() === q;
    
    let list = stations;
    if (q && !isExactSelected) {
      list = stations.filter(s => {
        if (excludeStation && s.code === excludeStation.code) return false;
        const nameMatch = s.name.toLowerCase().includes(q);
        const codeMatch = s.code.toLowerCase().includes(q);
        const stateMatch = s.state ? s.state.toLowerCase().includes(q) : false;
        return nameMatch || codeMatch || stateMatch;
      });
      
      list = [...list].sort((a, b) => {
        const aStartName = a.name.toLowerCase().startsWith(q);
        const bStartName = b.name.toLowerCase().startsWith(q);
        if (aStartName && !bStartName) return -1;
        if (!aStartName && bStartName) return 1;

        const aStartCode = a.code.toLowerCase().startsWith(q);
        const bStartCode = b.code.toLowerCase().startsWith(q);
        if (aStartCode && !bStartCode) return -1;
        if (!aStartCode && bStartCode) return 1;

        return a.name.localeCompare(b.name);
      });
    } else if (excludeStation) {
      list = stations.filter(s => s.code !== excludeStation.code);
    }

    return list.slice(0, 15);
  }, [debouncedQuery, stations, excludeStation, selectedStation]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredStations.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredStations.length) % filteredStations.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredStations.length) {
        handleSelect(filteredStations[activeIndex]);
      } else if (filteredStations.length > 0) {
        handleSelect(filteredStations[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (st) => {
    onSelectStation(st);
    setQuery(`${st.name} (${st.code})`);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="text-blue-600 dark:text-blue-400 font-extrabold bg-blue-100/50 dark:bg-blue-500/20 px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 transition-all hover:bg-slate-100/50 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
        <Icon className={`${iconColor} flex-shrink-0`} size={18} />
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>
        {query && (
          <button 
            type="button" 
            onClick={() => {
              setQuery('');
              onSelectStation(null);
              inputRef.current?.focus();
            }} 
            className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={10} className="text-slate-500 dark:text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] p-2 space-y-0.5"
          >
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <m.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                />
                <span>Loading stations...</span>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                No stations found
              </div>
            ) : (
              filteredStations.map((st, index) => (
                <div
                  key={st.code}
                  onClick={() => handleSelect(st)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    index === activeIndex || (selectedStation && selectedStation.code === st.code)
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-bold text-xs truncate">
                      {highlightText(st.name, debouncedQuery)}
                    </h4>
                    {st.state && (
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                        {highlightText(st.state, debouncedQuery)}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                      {highlightText(st.code, debouncedQuery)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RedesignedHome() {
  const navigate = useNavigate();
  const countryFlag = '🇮🇳';

  // Booking Widget States
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelMode, setTravelMode] = useState('Train'); // Train, Bus, General GPS
  const [activeTracking, setActiveTracking] = useState(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const fromSt = localStorage.getItem('boardingStation');
    const destName = localStorage.getItem('destinationName');
    
    if (fromSt) {
      setFromStation(JSON.parse(fromSt));
    }
    if (destName) {
      const destLat = localStorage.getItem('destinationLat');
      const destLng = localStorage.getItem('destinationLng');
      const destCode = localStorage.getItem('destinationCode') || 'DEST';
      setToStation({ 
        name: destName,
        code: destCode,
        lat: destLat ? parseFloat(destLat) : 9.9252,
        lng: destLng ? parseFloat(destLng) : 78.1198
      });
      setActiveTracking({
        destination: destName,
        trainName: localStorage.getItem('trainName') || 'Active Journey',
        trainNumber: localStorage.getItem('trainNumber') || 'TRN'
      });
    }
  }, []);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    setValidationError('');
    if (fromStation) {
      localStorage.setItem('destinationName', fromStation.name);
      localStorage.setItem('destinationLat', (fromStation.lat || 9.9252).toString());
      localStorage.setItem('destinationLng', (fromStation.lng || 78.1198).toString());
      localStorage.setItem('destinationCode', fromStation.code || 'DEST');
    } else {
      localStorage.removeItem('destinationName');
      localStorage.removeItem('destinationLat');
      localStorage.removeItem('destinationLng');
      localStorage.removeItem('destinationCode');
    }
    if (toStation) {
      localStorage.setItem('boardingStation', JSON.stringify(toStation));
    } else {
      localStorage.removeItem('boardingStation');
    }
  };

  const handleSearchTrains = () => {
    if (!fromStation) {
      setValidationError('Please select a Boarding (From) station first.');
      return;
    }
    setValidationError('');
    navigate('/trains');
  };

  const handleSetAlarm = () => {
    if (!fromStation && !toStation) {
      setValidationError('Please select both From and To stations to proceed.');
      return;
    }
    if (!fromStation) {
      setValidationError('Please select a Boarding (From) station.');
      return;
    }
    if (!toStation) {
      setValidationError('Please select a Destination (To) station.');
      return;
    }
    if (fromStation.code === toStation.code) {
      setValidationError('Boarding and Destination stations cannot be the same.');
      return;
    }

    setValidationError('');

    try {
      TRIGGER_ALARM_SOUND();
      setTimeout(() => {
        STOP_ALARM_SOUND();
      }, 50);
    } catch (e) {
      console.warn(e);
    }

    const finalLat = toStation.lat ? toStation.lat.toString() : '9.9252';
    const finalLng = toStation.lng ? toStation.lng.toString() : '78.1198';

    localStorage.setItem('boardingStation', JSON.stringify(fromStation));
    localStorage.setItem('destinationName', toStation.name);
    localStorage.setItem('destinationLat', finalLat);
    localStorage.setItem('destinationLng', finalLng);
    localStorage.setItem('destinationCode', toStation.code || 'DEST');
    localStorage.setItem('trainName', travelMode + ' Journey');
    localStorage.setItem('trainNumber', 'GPS-ALARM');
    localStorage.setItem('alarmTriggered', 'false');

    navigate('/tracking');
  };

  const quickActions = [
    { label: 'Book Alarm', icon: Bell, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', path: '/train' },
    { label: 'Live Status', icon: Clock, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', path: '/tracking' },
    { label: 'Map View', icon: Map, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', path: '/tracking' },
    { label: 'Near Me', icon: Compass, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', path: '/train' },
    { label: 'Schedules', icon: Train, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', path: '/trains' },
    { label: 'Saved Trips', icon: Star, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', path: '/' },
  ];

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-6 font-sans bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Dynamic Native-App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            <User size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome traveler</span>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Happy Journey!</h3>
          </div>
        </div>
 
        {/* Dynamic Country Selector IRCTC / PT KAI Accent */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 shadow-sm text-xs font-bold text-blue-700 dark:text-blue-400"
        >
          <span>🇮🇳</span>
          <span>Indian Railways</span>
        </div>
      </div>
 
      {/* Floating Active Journey Alert Banner */}
      {activeTracking && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/tracking')}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
              <Train size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Active Journey Tracking</span>
              <h4 className="font-bold text-sm truncate max-w-[180px]">{activeTracking.trainName}</h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-100">
            <span>Live View</span>
            <ChevronRight size={14} />
          </div>
        </m.div>
      )}
 
      {/* "Plan My Journey" Card (IRCTC Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* IRCTC Colors Top Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-base tracking-wide uppercase flex items-center gap-2">
              <Train size={18} />
              <span>Plan My Journey</span>
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-white/20">
              {travelMode} Mode
            </span>
          </div>
        </div>
 
        <div className="p-5 space-y-4">
          {/* Validation Warning Alert */}
          {validationError && (
            <m.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{validationError}</span>
            </m.div>
          )}

          {/* Station Selection Fields */}
          <div className="relative space-y-3">
            {/* FROM Station */}
            <StationAutocomplete
              label="From Station"
              placeholder="Search boarding station..."
              selectedStation={fromStation}
              onSelectStation={(st) => {
                setFromStation(st);
                setValidationError('');
                if (st) localStorage.setItem('boardingStation', JSON.stringify(st));
                else localStorage.removeItem('boardingStation');
              }}
              icon={MapPin}
              iconColor="text-emerald-500"
              excludeStation={toStation}
            />
 
            {/* Swapping Icon Button */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <m.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwapStations();
                }}
                className="w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowUpDown size={16} />
              </m.button>
            </div>
 
            {/* TO Station */}
            <StationAutocomplete
              label="To Station"
              placeholder="Search destination stop..."
              selectedStation={toStation}
              onSelectStation={(st) => {
                setToStation(st);
                setValidationError('');
                if (st) {
                  localStorage.setItem('destinationName', st.name);
                  localStorage.setItem('destinationLat', (st.lat || 9.9252).toString());
                  localStorage.setItem('destinationLng', (st.lng || 78.1198).toString());
                  localStorage.setItem('destinationCode', st.code || 'DEST');
                } else {
                  localStorage.removeItem('destinationName');
                  localStorage.removeItem('destinationLat');
                  localStorage.removeItem('destinationLng');
                  localStorage.removeItem('destinationCode');
                }
              }}
              icon={MapPin}
              iconColor="text-rose-500"
              excludeStation={fromStation}
            />
          </div>
 
          {/* Date Picker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <Clock className="text-blue-500 flex-shrink-0" size={18} />
            <div className="flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departure Date</span>
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 w-full focus:outline-none"
              />
            </div>
          </div>
 
          {/* Travel Mode Toggle Button Chips */}
          <div className="grid grid-cols-3 gap-2">
            {['Train', 'Bus', 'General'].map((mode) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                  travelMode === mode
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>
 
          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-2">
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSetAlarm}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              <span>Set Alarm & Start Journey</span>
            </m.button>
 
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSearchTrains}
              className="w-full h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Search size={16} />
              <span>Search Trains</span>
            </m.button>
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider pl-1">
          Quick Services
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <m.div
                key={idx}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(action.path)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-slate-300 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${action.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {action.label}
                </span>
              </m.div>
            );
          })}
        </div>
      </div>

      {/* Recent Trips & Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">100% Safe Sleeping</h4>
            <p className="text-[10px] text-slate-500">Offline alarms wake you up securely</p>
          </div>
        </div>
        <HelpCircle size={16} className="text-slate-400 cursor-pointer" />
      </div>

      {/* Privacy Badge */}
      <div className="text-center py-2 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>🔒 100% Private — Location processed entirely on your device.</span>
      </div>

    </div>
  );
}
