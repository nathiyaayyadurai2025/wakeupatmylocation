import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion as m, AnimatePresence } from 'framer-motion';
import { MapPin, Train, Search, Navigation, Bell, AlertTriangle, Check, Loader2, Play, X, WifiOff } from 'lucide-react';
import { TRAIN_DATA } from '../constants';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
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

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in KM
}

// Custom Icons
const createBlueDot = () => L.divIcon({
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;border:4px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8);animation: pulse 2s infinite;"></div>`
});

const createDestPin = () => L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
    <svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>
      <path d='M18 2 C10.3 2 4 8.3 4 16 C4 26 18 34 18 34 C18 34 32 26 32 16 C32 8.3 25.7 2 18 2Z' fill='#ef4444'/>
      <circle cx='18' cy='16' r='6' fill='white'/>
    </svg>
  </div>`
});

const createStationPin = () => L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#1e293b;border-radius:50%;border:2px solid #64748b;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M4 12h16"></path><path d="M12 4v16"></path></svg>
  </div>`
});

// Web Audio API Setup
let audioCtx = null;
let oscillator = null;

function startAlarmSound() {
  audioCtx =
    new (window.AudioContext ||
         window.webkitAudioContext)();

  oscillator =
    audioCtx.createOscillator();

  const gainNode =
    audioCtx.createGain();

  oscillator.type = "square";

  oscillator.frequency
    .setValueAtTime(
      880,
      audioCtx.currentTime
    );

  gainNode.gain
    .setValueAtTime(
      1,
      audioCtx.currentTime
    );

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
}

function stopAlarmSound() {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
  }

  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

// Map Auto Center Hook
const MapAutoCenter = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { animate: true, duration: 1.5 });
    }
  }, [position, map, zoom]);
  return null;
};

const STEPS = ['Location', 'Stations', 'Trains', 'Set Alarm', 'Tracking'];

export default function TrainAlarmFlow() {
  const [step, setStep] = useState(1);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Geolocation states
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const watchIdRef = useRef(null);
  
  // Station search states
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Train search states
  const [trains, setTrains] = useState([]);
  const [searchTrainQuery, setSearchTrainQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState(null);
  
  // Alarm destination state
  const [selectedDestStop, setSelectedDestStop] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Active states
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [existingAlarmPrompt, setExistingAlarmPrompt] = useState(false);
  const [dataError, setDataError] = useState('');
  const alarmFiredRef = useRef(false);

  // Online offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resume state from localStorage on load
  useEffect(() => {
    const savedDest = localStorage.getItem('wakeMyStop_dest');
    
    if (savedDest) {
      const parsed = JSON.parse(savedDest);
      setDestination(parsed);
      setSelectedTrain({ trainName: parsed.trainName, trainNumber: parsed.trainNumber });
      setStep(5);
      
      const storedTriggered = localStorage.getItem('alarmTriggered') === 'true';
      if (storedTriggered) {
        setAlarmTriggered(true);
        alarmFiredRef.current = true;
      }
      startLiveTracking(parsed);
    } else {
      locateUser();
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      stopAlarmSound();
    };
  }, []);

  // STEP 1: AUTO LOCATION ON LOAD
  const locateUser = () => {
    setStep(1);
    setLocationError(false);
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchStations(latitude, longitude, 5000);
      },
      (err) => {
        console.error(err);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // STEP 2: FIND NEARBY RAILWAY STATIONS
  const fetchStations = async (lat, lon, radius) => {
    setStep(2);
    try {
      const query = `[out:json];node["railway"="station"](around:${radius},${lat},${lon});out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const parsedStations = data.elements.map(el => {
          const dist = haversine(lat, lon, el.lat, el.lon);
          return {
            id: el.id,
            name: el.tags.name || 'Unnamed Station',
            lat: el.lat,
            lng: el.lon,
            distance: dist
          };
        }).sort((a, b) => a.distance - b.distance);
        setStations(parsedStations);
      } else if (radius === 5000) {
        fetchStations(lat, lon, 10000); // fallback expand
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error('Overpass API error:', err);
      setStations([]);
    }
  };

  // STEP 3: SHOW AVAILABLE TRAINS
  const handleViewTrains = async (station) => {
    setSelectedStation(station);
    setSearchTrainQuery('');
    setStep(3);
    
    // In real scenario we'd call an API. Falling back to TRAIN_DATA.
    setTrains(TRAIN_DATA);
  };

  // Apply search filtering on trains list
  const filteredTrains = trains.filter(t => 
    t.trainName.toLowerCase().includes(searchTrainQuery.toLowerCase()) || 
    t.trainNumber.toLowerCase().includes(searchTrainQuery.toLowerCase())
  );

  // Set selected train, open stop list (Step 4 setup)
  const handleSelectTrain = (train) => {
    if (localStorage.getItem('wakeMyStop_dest')) {
      setExistingAlarmPrompt(true);
      return;
    }
    setSelectedTrain(train);
    setSelectedDestStop(null);
    setDataError('');
    setStep(4);
  };

  // STEP 4: SET DESTINATION & ALARM
  const confirmAlarm = () => {
    if (!selectedDestStop) {
      setDataError('Cannot set alarm: stop location data unavailable');
      return;
    }
    const lat = selectedDestStop.lat;
    const lng = selectedDestStop.lng || selectedDestStop.lon;
    if (!lat || !lng) {
      setDataError('Cannot set alarm: stop location data unavailable');
      return;
    }
    
    // Attempt origin coordinates logic for progress bar
    let originCoord = null;
    if (selectedTrain?.stops?.length > 0) {
      originCoord = { lat: selectedTrain.stops[0].lat, lng: selectedTrain.stops[0].lng };
    }

    const destData = {
      name: selectedDestStop.station,
      lat, lng,
      trainName: selectedTrain.trainName,
      trainNumber: selectedTrain.trainNumber,
      origin: originCoord
    };
    
    setDestination(destData);
    localStorage.setItem('wakeMyStop_dest', JSON.stringify(destData));
    
    // FIX 2: Store strict numbers properly as requested
    localStorage.setItem('destinationLat', lat.toString());
    localStorage.setItem('destinationLng', lng.toString());
    localStorage.setItem('alarmTriggered', 'false');
    alarmFiredRef.current = false;
    setAlarmTriggered(false);

    setStep(5);
    startLiveTracking(destData);
  };

  // STEP 5: LIVE GPS TRACKING
  const startLiveTracking = (dest) => {
    if (!navigator.geolocation) return;
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        
        // FIX 2: Read Destination Coordinates Safely
        const destLat = parseFloat(localStorage.getItem('destinationLat'));
        const destLng = parseFloat(localStorage.getItem('destinationLng'));
        
        if (isNaN(destLat) || isNaN(destLng)) {
          console.error("Invalid destination coordinates");
          return;
        }

        // FIX 3: USE GPS PROPERLY
        const distance = haversine(userLat, userLng, destLat, destLng);
        console.log("Distance to destination:", distance, "km");
        setDistanceRemaining(distance);
        
        // Compute static progress bar percentage
        if (dest.origin) {
          const totalDist = haversine(dest.origin.lat, dest.origin.lng, dest.lat, dest.lng);
          if (totalDist > 0) {
            const p = Math.max(0, Math.min(100, ((totalDist - distance) / totalDist) * 100));
            setProgressPercent(p);
          }
        }
        
        // FIX 4: ALARM MUST FIRE ONLY ONCE
        const storedAlarmTriggered = localStorage.getItem("alarmTriggered") === "true";
        if (distance < 2 && !storedAlarmTriggered && !alarmFiredRef.current) {
          alarmFiredRef.current = true;
          setAlarmTriggered(true); // show overlay
          
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
          startAlarmSound();
        }
      },
      (err) => {
        console.error("GPS tracking error", err);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // FIX 6: DISMISS BUTTON CLEANUP
  const handleDismissAlarm = () => {
    stopAlarmSound();
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    alarmFiredRef.current = true;
    localStorage.setItem("alarmTriggered", "true");
    setAlarmTriggered(false);
  };
  
  const handleCancelMission = () => {
    localStorage.removeItem('wakeMyStop_dest');
    localStorage.removeItem('destinationLat');
    localStorage.removeItem('destinationLng');
    localStorage.removeItem('alarmTriggered');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setDestination(null);
    setAlarmTriggered(false);
    stopAlarmSound();
    if (navigator.vibrate) navigator.vibrate(0);
    setStep(2); // Go back to stations
  };

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [13.0827, 80.2707];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 z-[500] bg-orange-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-center shadow-lg">
          <WifiOff size={14} className="mr-2" />
          Offline mode — alarm still active
        </div>
      )}

      {/* Step Indicator */}
      <div className={`absolute left-0 right-0 z-[400] overflow-x-auto whitespace-nowrap px-4 pb-2 transition-all ${isOffline ? 'top-10' : 'top-4'}`}>
        <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-max mx-auto shadow-xl">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <div key={s} className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'text-blue-400' : 'text-slate-500'}
                `}>
                  {isCompleted && <Check size={12} />}
                  <span>{stepNum}. {s}</span>
                </div>
                {idx < STEPS.length - 1 && <span className="text-slate-700">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Layers */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={14} zoomControl={false} className="w-full h-full pb-32">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
          />
          {userLocation && <MapAutoCenter position={[userLocation.lat, userLocation.lng]} zoom={step === 5 ? 15 : 14} />}
          
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createBlueDot()} />
          )}

          {step === 2 && stations.map(st => (
            <Marker key={st.id} position={[st.lat, st.lng]} icon={createStationPin()}>
              <Popup>{st.name}</Popup>
            </Marker>
          ))}
          
          {step === 5 && destination && (
            <>
              <Marker position={[destination.lat, destination.lng]} icon={createDestPin()}>
                <Popup>Destination: {destination.name}</Popup>
              </Marker>
              <Circle 
                center={[destination.lat, destination.lng]} 
                radius={2000} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }} 
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Error: GPS Access Lost during tracking */}
      {step === 5 && locationError && (
        <div className="absolute top-20 left-4 right-4 z-[400]">
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center">
            <AlertTriangle className="mr-3" />
            <div className="text-sm font-bold">Location access lost. Please re-enable GPS.</div>
          </div>
        </div>
      )}

      {/* Overlays / Bottom Sheets */}
      <AnimatePresence>
        
        {/* Step 1: Loading Details */}
        {step === 1 && (
          <m.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center p-6 text-center"
          >
            {locationError ? (
              <div className="bg-slate-900 border border-red-500/30 p-6 rounded-3xl max-w-sm">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Please enable location</h3>
                <p className="text-slate-400 text-sm mb-6">Location access is required for tracking securely.</p>
                <div className="space-y-3">
                  <button onClick={locateUser} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">Try Again</button>
                  <button 
                    onClick={() => {
                      setUserLocation({ lat: 13.0827, lng: 80.2707 }); // Chennai Demo
                      fetchStations(13.0827, 80.2707, 5000);
                    }} 
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                  >
                    Start Demo Mode
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse mb-6 border border-blue-500/30">
                  <Navigation size={32} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Finding your location...</h2>
                <Loader2 size={24} className="animate-spin text-slate-500 mt-4 mx-auto" />
              </>
            )}
          </m.div>
        )}

        {/* Existing Alarm Error State */}
        {existingAlarmPrompt && (
          <m.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-[600] bg-black/60 flex items-center justify-center p-6"
          >
            <div className="bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-sm">
              <h3 className="text-lg font-bold text-white mb-2">Alarm already active</h3>
              <p className="text-sm text-slate-400 mb-6">You already have a destination alarm tracking. Please cancel the existing alarm first.</p>
              <div className="space-y-3">
                <button onClick={() => { handleCancelMission(); setExistingAlarmPrompt(false); setStep(2); }} className="w-full py-3 bg-red-600 font-bold rounded-xl active:scale-95 transition-all text-white">Cancel Existing Alarm</button>
                <button onClick={() => setExistingAlarmPrompt(false)} className="w-full py-3 bg-slate-700 font-bold rounded-xl active:scale-95 transition-all text-white">Nevermind</button>
              </div>
            </div>
          </m.div>
        )}

        {/* Step 2: Stations Sheet */}
        {step === 2 && (
          <BottomSheet>
            <h3 className="text-sm font-bold text-white mb-4">Nearby Railway Stations</h3>
            {stations.length === 0 ? (
               <div className="py-8 text-center text-slate-400 text-sm">
                 <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                 No stations found. Expanding search radius...
               </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pb-6 pr-2 custom-scrollbar">
                {stations.map(st => (
                  <div key={st.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base mb-0.5">{st.name}</h4>
                      <p className="text-xs text-blue-400 font-bold">{st.distance.toFixed(1)} km</p>
                    </div>
                    <button 
                      onClick={() => handleViewTrains(st)}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold whitespace-nowrap active:scale-95 transition-all"
                    >
                      View Trains
                    </button>
                  </div>
                ))}
              </div>
            )}
          </BottomSheet>
        )}

        {/* Step 3: Train List Screen */}
        {step === 3 && (
          <m.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 top-16 z-[100] bg-slate-900 shadow-2xl flex flex-col rounded-t-[2rem]"
          >
            <div className="p-4 border-b border-white/5 flex items-center space-x-3">
               <button onClick={() => setStep(2)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white"><X size={18}/></button>
               <h3 className="text-base font-bold text-white truncate flex-1">{selectedStation?.name} Trains</h3>
            </div>
            
            <div className="p-4">
               <div className="relative">
                 <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search trains by name or number..." 
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
                   value={searchTrainQuery}
                   onChange={(e) => setSearchTrainQuery(e.target.value)}
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-3 custom-scrollbar">
              {filteredTrains.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <Train size={32} className="mx-auto mb-3 opacity-30" />
                  No trains available at this station right now.
                </div>
              ) : (
                filteredTrains.map(train => (
                  <div key={train.trainNumber} className="bg-slate-800 p-4 rounded-2xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-black text-slate-800 bg-slate-300 px-2 py-0.5 rounded uppercase">{train.trainNumber}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departs {train.stops[0].departure}</span>
                        </div>
                        <h4 className="font-bold text-white text-lg">{train.trainName}</h4>
                        <p className="text-xs text-slate-400 font-medium">To {train.to}</p>
                      </div>
                      <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-slate-500">
                        <Train size={18} />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSelectTrain(train)}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                    >
                      Set Alarm
                    </button>
                  </div>
                ))
              )}
            </div>
          </m.div>
        )}

        {/* Step 4: Set Alarm Bottom Sheet */}
        {step === 4 && (
          <BottomSheet onBack={() => { setStep(3); setDataError(''); }}>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-black text-white">{selectedTrain?.trainName}</h3>
              <p className="text-xs text-slate-400">{selectedTrain?.trainNumber}</p>
            </div>
            
            {dataError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center font-bold">
                {dataError}
              </div>
            )}

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pb-4 custom-scrollbar">
              {selectedTrain?.stops.map((stop, idx) => {
                const isSelected = selectedDestStop?.station === stop.station;
                return (
                  <button 
                    key={idx}
                    onClick={() => { setSelectedDestStop(stop); setDataError(''); }}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/40' 
                        : 'bg-slate-800 border-transparent hover:bg-slate-700/80'
                    }`}
                  >
                    <div>
                      <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>{stop.station}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>Arrival: {stop.arrival}</p>
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center"><Check size={14} strokeWidth={3}/></div>}
                  </button>
                )
              })}
            </div>
            
            <button 
              onClick={confirmAlarm}
              className={`w-full py-4 mt-2 rounded-xl text-sm font-black uppercase tracking-widest active:scale-95 transition-all ${
                selectedDestStop ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Confirm Alarm
            </button>
          </BottomSheet>
        )}

        {/* Step 5: Tracking Info Card */}
        {step === 5 && !alarmTriggered && (
          <m.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-4 right-4 z-[100] bg-slate-800 border border-slate-700 rounded-[2rem] p-5 shadow-2xl backdrop-blur-2xl"
          >
             <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-black text-slate-400 mb-1">{destination?.trainName} ({destination?.trainNumber})</h3>
                  <h2 className="text-xl font-bold text-white">{destination?.name}</h2>
                </div>
                <button onClick={handleCancelMission} className="p-2 rounded-full bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
             </div>
             
             <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Distance Remaining</p>
               <div className="flex items-end space-x-2">
                 <span className="text-4xl font-light text-white tracking-tight tabular-nums">
                   {distanceRemaining ? distanceRemaining.toFixed(1) : '--'}
                 </span>
                 <span className="text-sm font-black text-blue-500 mb-1.5">km</span>
               </div>
               
               {/* Progress Bar from origin to destination */}
               <div className="mt-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-1">
                   <span>Origin</span>
                   <span>Dest</span>
                 </div>
                 <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                     style={{ width: `${progressPercent}%` }}
                   />
                 </div>
               </div>
             </div>
          </m.div>
        )}

        {/* Fullscreen Alarm Alert Overlay */}
        {alarmTriggered && (
          <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[1000] bg-red-600 flex flex-col items-center justify-center p-6 text-center"
          >
            <m.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Bell size={80} className="text-white drop-shadow-2xl mb-6" />
            </m.div>
            
            <m.h1 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-5xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-xl leading-tight"
            >
              Wake Up!<br/>Your stop is<br/>2km away!
            </m.h1>
            
            <p className="text-xl font-bold text-red-200 mb-16">
              {destination?.name}
            </p>
            
            <button 
              onClick={handleDismissAlarm}
              className="px-10 py-5 bg-white text-red-600 rounded-2xl text-xl font-black shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] active:scale-95 transition-all w-full max-w-xs"
            >
              Dismiss Alarm
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* FIX 7 — ADD DEBUG PANEL (DEV ONLY) */}
      {import.meta.env.DEV && (
        <div style={{
          position: "fixed",
          bottom: 80,
          left: 8,
          background: "rgba(0,0,0,0.8)",
          color: "#0f0",
          padding: "8px",
          borderRadius: "8px",
          fontSize: "11px",
          zIndex: 9999,
          fontFamily: "monospace"
        }}>
          <div>
            User:
            {userLocation?.lat?.toFixed(4)},
            {userLocation?.lng?.toFixed(4)}
          </div>
          <div>
            Dest:
            {destination?.lat?.toFixed(4)},
            {destination?.lng ? destination.lng.toFixed(4) : destination?.lon?.toFixed(4)}
          </div>
          <div>
            Distance:
            {distanceRemaining?.toFixed(3)} km
          </div>
          <div>
            Alarm:
            {alarmFiredRef.current
              ? "FIRED"
              : "waiting"}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Bottom Sheet Component
const BottomSheet = ({ children, onBack }) => (
  <m.div 
    initial={{ y: '100%', opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: '100%', opacity: 0 }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="absolute bottom-0 left-0 right-0 z-[100] bg-slate-900 backdrop-blur-3xl border-t border-slate-800 rounded-t-[2rem] p-5 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.5)]"
  >
    <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-5" />
    {onBack && (
      <button onClick={onBack} className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1 mb-3 hover:text-white transition-colors">
        <span>← Back</span>
      </button>
    )}
    {children}
  </m.div>
);
