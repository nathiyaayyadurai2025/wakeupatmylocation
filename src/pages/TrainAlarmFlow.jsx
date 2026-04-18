import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion as m, AnimatePresence } from 'framer-motion';
import { MapPin, Train, Search, Navigation, Bell, AlertTriangle, Check, Loader2, Play } from 'lucide-react';
import { CALCULATE_DISTANCE, TRAIN_DATA } from '../constants';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Web Audio API Alarm Setup
let audioCtx = null;
let oscillatorArray = [];
let alarmInterval = null;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playLoudBeep = () => {
  if (!audioCtx) initAudioContext();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
  oscillatorArray.push(osc);
  
  if (navigator.vibrate) {
    navigator.vibrate([300, 100, 300, 100, 300]);
  }
};

const startAlarmSequence = () => {
  initAudioContext();
  if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 1000]);
  playLoudBeep();
  if (!alarmInterval) {
    alarmInterval = setInterval(playLoudBeep, 1000);
  }
};

const stopAlarmSequence = () => {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (navigator.vibrate) navigator.vibrate(0);
};

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

// Main Application Flow
export default function TrainAlarmFlow() {
  const [step, setStep] = useState(1); // 1: Locating, 2: Stations, 3: Trains, 4: Destinations, 5: Tracking
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  
  const [destination, setDestination] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const watchIdRef = useRef(null);

  // Resume state from localStorage on load
  useEffect(() => {
    const savedDest = localStorage.getItem('wakeMyStop_dest');
    if (savedDest) {
      const parsed = JSON.parse(savedDest);
      setDestination(parsed);
      setStep(5);
      startLiveTracking(parsed);
    } else {
      locateUser();
    }
    
    // Clean up tracking on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      stopAlarmSequence();
    };
  }, []);

  // Step 1: Auto Location
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

  // Step 2: Find Nearby Stations
  const fetchStations = async (lat, lon, radius) => {
    setStep(2);
    try {
      const query = `[out:json];node["railway"="station"](around:${radius},${lat},${lon});out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const parsedStations = data.elements.map(el => {
          const dist = CALCULATE_DISTANCE(lat, lon, el.lat, el.lon);
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
        // Fallback: expand search to 10km automatically
        fetchStations(lat, lon, 10000);
      } else {
        setStations([]); // No stations found even at 10km
      }
    } catch (err) {
      console.error('Overpass API error:', err);
      setStations([]);
    }
  };

  // Step 3: Show Available Trains
  const handleViewTrains = (station) => {
    setSelectedStation(station);
    // Use fallback TRAIN_DATA since live IRCTC API is not provided natively here
    // Filter trains that depart from or stop in a similar named station, or just show all for demo
    // We will show all TRAIN_DATA for demo purposes to assure flow works
    setTrains(TRAIN_DATA);
    setStep(3);
  };

  // Step 4: Set Alarm & Destination
  const handleSelectTrain = (train) => {
    setSelectedTrain(train);
    setStep(4);
  };

  const confirmAlarm = (stop) => {
    initAudioContext(); // Initialize audio context on user interaction
    const destData = {
      name: stop.station,
      lat: stop.lat,
      lng: stop.lng || stop.lon,
      trainName: selectedTrain.trainName
    };
    setDestination(destData);
    localStorage.setItem('wakeMyStop_dest', JSON.stringify(destData));
    setStep(5);
    startLiveTracking(destData);
  };

  // Step 5: Live GPS Tracking
  const startLiveTracking = (dest) => {
    if (!navigator.geolocation) return;
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        const dist = CALCULATE_DISTANCE(latitude, longitude, dest.lat, dest.lng);
        setDistanceRemaining(dist);
        
        if (dist <= 2.0 && !alarmTriggered) {
          setAlarmTriggered(true);
          startAlarmSequence();
        }
      },
      (err) => {
        console.error("GPS Tracking error", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDismissAlarm = () => {
    stopAlarmSequence();
    setAlarmTriggered(false);
    localStorage.removeItem('wakeMyStop_dest');
    setStep(2); // Go back to stations
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };
  
  const handleCancelMission = () => {
    localStorage.removeItem('wakeMyStop_dest');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStep(2);
  }

  // Calculate Map center based on step
  const mapCenter = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [13.0827, 80.2707];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* Search Bar / Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400]">
        <div className="glass-darker p-4 rounded-3xl border border-white/5 flex items-center shadow-xl backdrop-blur-xl">
          <MenuIcon className="text-brand-indigo mr-3" />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">WakeMyStop PWA</p>
            <p className="text-sm font-bold text-white truncate">
              {step === 1 && "Initializing GPS..."}
              {step === 2 && "Finding Railway Stations"}
              {step === 3 && `Trains at ${selectedStation?.name}`}
              {step === 4 && `Viewing ${selectedTrain?.trainName}`}
              {step === 5 && "Live Satellite Tracking"}
            </p>
          </div>
          {step === 5 && !alarmTriggered && (
             <button onClick={handleCancelMission} className="p-2 rounded-full bg-red-500/20 text-red-500">
               <X size={16} />
             </button>
          )}
        </div>
      </div>

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={14} zoomControl={false} className="w-full h-full">
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
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2 }} 
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Overlays / Bottom Sheets */}
      <AnimatePresence>
        {/* Step 1: Loading */}
        {step === 1 && (
          <m.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center p-6 text-center"
          >
            {locationError ? (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl max-w-sm">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">GPS Access Denied</h3>
                <p className="text-slate-400 text-sm mb-6">Please enable location services and allow GPS permissions to use WakeMyStop travel alarm.</p>
                <button onClick={locateUser} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold">Try Again</button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-brand-indigo/20 flex items-center justify-center animate-pulse mb-6 border border-brand-indigo/30">
                  <Navigation size={32} className="text-brand-indigo" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Finding Your Location</h2>
                <p className="text-slate-400 text-sm">Locking onto GPS satellites...</p>
              </>
            )}
          </m.div>
        )}

        {/* Step 2: Stations Sheet */}
        {step === 2 && (
          <BottomSheet>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nearby Railway Stations</h3>
            {stations.length === 0 ? (
               <div className="py-8 text-center text-slate-400 text-sm">
                 <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                 No stations found within 10km.
               </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pb-6 pr-2">
                {stations.map(st => (
                  <div key={st.id} className="glass-darker p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-md mb-1">{st.name}</h4>
                      <p className="text-xs text-brand-indigo font-black">{st.distance.toFixed(1)} km away</p>
                    </div>
                    <button 
                      onClick={() => handleViewTrains(st)}
                      className="px-4 py-2 bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all"
                    >
                      View Trains
                    </button>
                  </div>
                ))}
              </div>
            )}
          </BottomSheet>
        )}

        {/* Step 3: Trains Sheet */}
        {step === 3 && (
          <BottomSheet onBack={() => setStep(2)}>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Trains at {selectedStation?.name}</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pb-6 pr-2">
              {trains.map(train => (
                <div key={train.trainNumber} className="glass-darker p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-white/5 px-2 py-1 rounded-md">{train.trainNumber}</span>
                      <h4 className="font-bold text-white text-md mt-2">{train.trainName}</h4>
                      <p className="text-xs text-slate-400 mt-1">{train.from} → {train.to}</p>
                    </div>
                    <Train size={20} className="text-slate-600" />
                  </div>
                  <button 
                    onClick={() => handleSelectTrain(train)}
                    className="w-full py-3 bg-brand-indigo text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                  >
                    Select Train
                  </button>
                </div>
              ))}
            </div>
          </BottomSheet>
        )}

        {/* Step 4: Destination Sheet */}
        {step === 4 && (
          <BottomSheet onBack={() => setStep(3)}>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Select Destination Stop</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pb-6 pr-2">
              {selectedTrain?.stops.map((stop, idx) => (
                <button 
                  key={idx}
                  onClick={() => confirmAlarm(stop)}
                  className="w-full text-left glass-darker p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 active:scale-95 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-slate-500 group-hover:text-brand-indigo">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{stop.station}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Arrival: {stop.arrival}</p>
                    </div>
                  </div>
                  <div className="text-[10px] px-3 py-1.5 rounded-full bg-brand-indigo/10 text-brand-indigo font-black flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bell size={12} />
                    <span>ALARM</span>
                  </div>
                </button>
              ))}
            </div>
          </BottomSheet>
        )}

        {/* Step 5: Tracking Sheet */}
        {step === 5 && !alarmTriggered && (
          <BottomSheet>
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[10px] font-black text-brand-indigo uppercase tracking-[0.2em] mb-1">Mission Active</h3>
                  <h2 className="text-xl font-black text-white leading-tight">{destination?.name}</h2>
                </div>
                <div className="w-12 h-12 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
             </div>
             
             <div className="bg-black/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                 <m.div 
                   className="h-full bg-brand-indigo" 
                   initial={{ width: '0%' }}
                   animate={{ width: distanceRemaining ? `${Math.min(100, Math.max(0, 100 - (distanceRemaining / 100)))}%` : '0%' }}
                 />
               </div>
               
               <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Distance Remaining</p>
               <div className="flex items-end space-x-2">
                 <span className="text-5xl font-light text-white tracking-tighter tabular-nums">
                   {distanceRemaining ? distanceRemaining.toFixed(1) : '--'}
                 </span>
                 <span className="text-lg font-black text-brand-indigo mb-1.5">KM</span>
               </div>
               <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                 App will trigger a loud alarm and vibrate when you are within <strong className="text-white">2.0 km</strong> of {destination?.name}. Safe to lock screen.
               </p>
             </div>
          </BottomSheet>
        )}

        {/* Fullscreen Alarm Alert */}
        {alarmTriggered && (
          <m.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[1000] bg-red-600 flex flex-col items-center justify-center p-6 text-center"
          >
            <m.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <Bell size={100} className="text-white drop-shadow-2xl mb-8" />
            </m.div>
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-xl">Wake Up!</h1>
            <p className="text-2xl font-bold text-white/90 mb-12">
              You are approaching {destination?.name}
            </p>
            <button 
              onClick={handleDismissAlarm}
              className="px-12 py-5 bg-white text-red-600 rounded-full text-xl font-black shadow-2xl active:scale-95 transition-all w-full max-w-sm"
            >
              STOP ALARM
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Bottom Sheet Component
const BottomSheet = ({ children, onBack }) => (
  <m.div 
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="absolute bottom-0 left-0 right-0 z-[100] bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 shadow-2xl"
  >
    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
    {onBack && (
      <button onClick={onBack} className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1 mb-4 hover:text-white transition-colors">
        <span>← Back</span>
      </button>
    )}
    {children}
  </m.div>
);

const MenuIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);
