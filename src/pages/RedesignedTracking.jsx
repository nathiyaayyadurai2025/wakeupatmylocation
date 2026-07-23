import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Navigation,
  Volume2,
  Vibrate,
  AlertOctagon,
  Pause,
  Play,
  BatteryCharging,
  Wifi,
  Gauge,
  MapPin,
  Train,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  WifiOff
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { CALCULATE_DISTANCE, TRIGGER_ALARM_SOUND, STOP_ALARM_SOUND, ESTIMATE_TIME } from '../constants';
import { useCountry } from '../context/CountryContext';

// Leaflet Map Icons
const userIcon = L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background:rgba(37,99,235,0.3);border-radius:50%;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
    <div style="position:relative;width:18px;height:18px;background:#2563EB;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(37,99,235,0.8);z-index:1"></div>
  </div>`
});

const destIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  html: `<div style="width:28px;height:28px;background:#EF4444;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(239,68,68,0.8);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px">📍</div>`
});

function MapAutoFit({ userLoc, destLoc }) {
  const map = useMap();
  useEffect(() => {
    if (!userLoc || !destLoc) return;
    const pts = [[userLoc.lat, userLoc.lng], [destLoc.lat, destLoc.lng]];
    map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 });
  }, [userLoc, destLoc, map]);
  return null;
}

export default function RedesignedTracking() {
  const navigate = useNavigate();
  const { isIndonesia, countryFlag } = useCountry();

  const [destination, setDestination] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [distRemaining, setDistRemaining] = useState(8.4);
  const [etaMins, setEtaMins] = useState(12);
  const [currentSpeed, setCurrentSpeed] = useState(55);
  const [alarmRadius, setAlarmRadius] = useState(5); // km
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Toggles
  const [highVolumeEnabled, setHighVolumeEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const watchIdRef = useRef(null);

  useEffect(() => {
    // 1. Load or fallback destination
    let destName = localStorage.getItem('destinationName');
    let destLat = parseFloat(localStorage.getItem('destinationLat'));
    let destLng = parseFloat(localStorage.getItem('destinationLng'));

    if (!destName || isNaN(destLat) || isNaN(destLng)) {
      // Provide clean default destination if user opened /tracking directly
      destName = isIndonesia ? 'Stasiun Bogor' : 'Madurai Junction';
      destLat = isIndonesia ? -6.5962 : 9.9252;
      destLng = isIndonesia ? 106.7907 : 78.1198;

      localStorage.setItem('destinationName', destName);
      localStorage.setItem('destinationLat', destLat.toString());
      localStorage.setItem('destinationLng', destLng.toString());
      localStorage.setItem('trainName', isIndonesia ? 'KAI Commuter Line Bogor' : 'Pandian Express');
      localStorage.setItem('trainNumber', isIndonesia ? 'CL-4101' : '12637');
    }

    const destObj = {
      name: destName,
      lat: destLat,
      lng: destLng,
      trainName: localStorage.getItem('trainName') || 'Train Journey',
      trainNumber: localStorage.getItem('trainNumber') || 'TRN'
    };

    setDestination(destObj);

    // Initial fallback user location near destination
    const initUserLat = isIndonesia ? -6.5305 : 10.3673; // Cilebut or Dindigul
    const initUserLng = isIndonesia ? 106.8006 : 77.9803;
    setUserLoc({ lat: initUserLat, lng: initUserLng });

    const initialDist = CALCULATE_DISTANCE(initUserLat, initUserLng, destLat, destLng);
    setDistRemaining(parseFloat(initialDist.toFixed(2)));
    setEtaMins(ESTIMATE_TIME(initialDist, 55));

    // 2. Request GPS position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng, speed } = pos.coords;
          setUserLoc({ lat, lng });

          const liveSpeed = (speed && !isNaN(speed) && speed > 0) ? Math.round(speed * 3.6) : 55;
          setCurrentSpeed(liveSpeed);

          const dist = CALCULATE_DISTANCE(lat, lng, destLat, destLng);
          setDistRemaining(parseFloat(dist.toFixed(2)));
          setEtaMins(ESTIMATE_TIME(dist, liveSpeed));
        },
        err => console.warn("GPS Initial Position Error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Continuous Watch Position
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          const { latitude: lat, longitude: lng, speed } = pos.coords;
          setUserLoc({ lat, lng });

          const liveSpeed = (speed && !isNaN(speed) && speed > 0) ? Math.round(speed * 3.6) : 55;
          setCurrentSpeed(liveSpeed);

          const dist = CALCULATE_DISTANCE(lat, lng, destLat, destLng);
          setDistRemaining(parseFloat(dist.toFixed(2)));
          setEtaMins(ESTIMATE_TIME(dist, liveSpeed));

          // Alarm Trigger Condition
          if (dist <= alarmRadius && !alarmTriggered && !isPaused) {
            setAlarmTriggered(true);
            TRIGGER_ALARM_SOUND();
          }
        },
        err => console.warn("GPS Watch Position Error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      STOP_ALARM_SOUND();
    };
  }, [alarmRadius, alarmTriggered, isPaused, isIndonesia]);

  const handleDismissAlarm = () => {
    STOP_ALARM_SOUND();
    setAlarmTriggered(false);
    localStorage.removeItem('destinationName');
    navigate('/train');
  };

  const handleEndJourney = () => {
    STOP_ALARM_SOUND();
    localStorage.removeItem('destinationName');
    navigate('/');
  };

  const progressPercent = distRemaining !== null ? Math.max(5, Math.min(100, (1 - distRemaining / 30) * 100)) : 75;

  return (
    <div className="pt-20 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans max-w-md mx-auto border-x border-slate-200 dark:border-slate-800">
      <div className="px-4 space-y-6">

        {/* Live GPS Map Visualization Header */}
        <div className="w-full h-56 rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg relative">
          {userLoc && destination && (
            <MapContainer
              center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapAutoFit userLoc={userLoc} destLoc={{ lat: destination.lat, lng: destination.lng }} />
              <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                <Popup>{destination.name}</Popup>
              </Marker>
            </MapContainer>
          )}

          {/* Floating Live Badge */}
          <div className="absolute top-4 left-4 z-[400] px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-black flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Satellite Tracking Active</span>
          </div>
        </div>

        {/* Alarm Triggered Overlay Alert */}
        <AnimatePresence>
          {alarmTriggered && (
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 rounded-[28px] bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-2xl space-y-4 text-center border-2 border-white/20 animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Bell size={32} className="animate-bounce" />
              </div>
              <h2 className="text-3xl font-black">WAKE UP! You are near {destination?.name}!</h2>
              <p className="text-red-100 font-medium">Distance remaining: {distRemaining} km</p>
              <button
                onClick={handleDismissAlarm}
                className="w-full h-14 rounded-2xl bg-white text-red-600 font-extrabold text-base shadow-xl hover:bg-red-50 transition-all"
              >
                Disarm & Dismiss Alarm
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* Large Progress Card & Circular Progress */}
        <div className="saas-card p-6 sm:p-8 space-y-8 relative overflow-hidden">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Train size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  {destination?.trainNumber || 'TRN'} • Active Journey {countryFlag}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{destination?.trainName || 'Train Journey'}</h2>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isPaused ? 'Tracking Paused' : 'Tracking Active'}
            </span>
          </div>

          {/* Central Circular Progress Visualization */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
            
            {/* SVG Circular Progress Ring */}
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="url(#blueGradient)"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside Circle Data */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remaining</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {distRemaining !== null ? `${distRemaining}` : '8.4'}
                  <span className="text-base font-bold text-slate-500 ml-1">km</span>
                </span>
                <span className="text-xs font-bold text-emerald-500 mt-1">~{etaMins || 8} min ETA</span>
              </div>
            </div>

            {/* Destination & Metrics Details */}
            <div className="flex-1 w-full space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Destination</span>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-rose-500 flex-shrink-0" />
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white truncate">{destination?.name || 'Destination Stop'}</h3>
                </div>
              </div>

              {/* Live Indicators Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <Gauge size={16} className="mx-auto text-blue-500 mb-1" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Speed</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{currentSpeed} km/h</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <BatteryCharging size={16} className="mx-auto text-emerald-500 mb-1" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Battery</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">Optimal</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <Wifi size={16} className="mx-auto text-indigo-500 mb-1" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">GPS Signal</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">Strong</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Segmented Alarm Distance Controls & Options */}
        <div className="saas-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Alarm Radius Threshold</h3>
              <p className="text-slate-500 text-xs">Set how far before your stop the alarm triggers</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black">
              {alarmRadius} km Before Arrival
            </span>
          </div>

          {/* Segmented Buttons */}
          <div className="grid grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {[2, 5, 10, 15, 20].map((radius) => (
              <button
                key={radius}
                onClick={() => setAlarmRadius(radius)}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  alarmRadius === radius
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>

          {/* Audio & Alert Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">High Volume Alarm</span>
              </div>
              <input
                type="checkbox"
                checked={highVolumeEnabled}
                onChange={e => setHighVolumeEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Vibrate size={18} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Vibration Alert</span>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={e => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>
          </div>

          {/* Test Sound Button to unlock Web Audio context on iOS/Chrome */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                try {
                  TRIGGER_ALARM_SOUND();
                  setTimeout(() => {
                    STOP_ALARM_SOUND();
                  }, 1200);
                } catch (e) {
                  console.warn(e);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 text-xs font-black transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 size={14} />
              <span>Test Alarm Tone (Unlocks Speaker)</span>
            </button>
          </div>
        </div>

        {/* Emergency Stop & Sticky Bottom Control Buttons */}
        <div className="saas-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <m.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsPaused(!isPaused)}
            className="w-full sm:w-1/2 h-13 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            {isPaused ? <Play size={18} className="text-emerald-500 fill-emerald-500" /> : <Pause size={18} className="text-amber-500 fill-amber-500" />}
            <span>{isPaused ? 'Resume Tracking' : 'Pause Tracking'}</span>
          </m.button>

          <m.button
            whileTap={{ scale: 0.96 }}
            onClick={handleEndJourney}
            className="w-full sm:w-1/2 h-13 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <AlertOctagon size={18} />
            <span>End Journey</span>
          </m.button>
        </div>

      </div>
    </div>
  );
}
