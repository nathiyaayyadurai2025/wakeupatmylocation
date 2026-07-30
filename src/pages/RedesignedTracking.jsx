import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
    if (isNaN(userLoc.lat) || isNaN(userLoc.lng) || isNaN(destLoc.lat) || isNaN(destLoc.lng)) return;
    const pts = [[userLoc.lat, userLoc.lng], [destLoc.lat, destLoc.lng]];
    map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 });
  }, [userLoc, destLoc, map]);
  return null;
}

export default function RedesignedTracking() {
  const countryFlag = '🇮🇳';
  const navigate = useNavigate();

  const [destination, setDestination] = useState(null);
  const [boardingStation, setBoardingStation] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [distRemaining, setDistRemaining] = useState(8.4);
  const [etaMins, setEtaMins] = useState(12);
  const [currentSpeed, setCurrentSpeed] = useState(55);
  const [alarmRadius, setAlarmRadius] = useState(5); // km
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Sponsor Demo Simulation States
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [simSpeed, setSimSpeed] = useState(5); // 1x, 5x, 10x
  const [simProgress, setSimProgress] = useState(0); // 0 to 1
  const [testAlarmActive, setTestAlarmActive] = useState(false);

  // Toggles
  const [highVolumeEnabled, setHighVolumeEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Screen Wake Lock States & Callbacks
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported] = useState(typeof window !== 'undefined' && 'wakeLock' in navigator);
  const wakeLockRef = useRef(null);

  // GPS lost detection
  const [gpsStatus, setGpsStatus] = useState('Optimal'); // Optimal, Weak, Lost
  const lastFixTimeRef = useRef(Date.now());

  // Vibration loop interval
  const vibrateIntervalRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (!wakeLockSupported) return;
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setWakeLockActive(true);
      wakeLockRef.current.addEventListener('release', () => {
        setWakeLockActive(false);
        wakeLockRef.current = null;
      });
      console.log('Screen Wake Lock acquired successfully');
    } catch (err) {
      console.warn(`Screen Wake Lock request failed: ${err.message}`);
    }
  }, [wakeLockSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn(`Screen Wake Lock release failed: ${err.message}`);
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  // Manage Screen Wake Lock
  useEffect(() => {
    if (!isPaused && !alarmTriggered) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPaused, alarmTriggered, requestWakeLock, releaseWakeLock]);

  // Request Wake Lock again when visibility state changes back to visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isPaused && !alarmTriggered) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, alarmTriggered, requestWakeLock]);

  // Continuous Vibration Alert Loop
  useEffect(() => {
    if (alarmTriggered && vibrationEnabled) {
      if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500]);
        vibrateIntervalRef.current = setInterval(() => {
          navigator.vibrate([500, 250, 500]);
        }, 1500);
      }
    } else {
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
        vibrateIntervalRef.current = null;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    }

    return () => {
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [alarmTriggered, vibrationEnabled]);

  const watchIdRef = useRef(null);

  const updateLocation = useCallback((lat, lng, speed) => {
    const destLatStr = localStorage.getItem('destinationLat');
    const destLngStr = localStorage.getItem('destinationLng');
    const destLat = destLatStr ? parseFloat(destLatStr) : 9.9252;
    const destLng = destLngStr ? parseFloat(destLngStr) : 78.1198;

    lastFixTimeRef.current = Date.now();
    setGpsStatus('Optimal');
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
  }, [alarmRadius, alarmTriggered, isPaused]);

  useEffect(() => {
    // Load boarding station if present
    const boardingStStr = localStorage.getItem('boardingStation');
    if (boardingStStr) {
      try {
        setBoardingStation(JSON.parse(boardingStStr));
      } catch (e) {
        console.warn(e);
      }
    }

    // 1. Load or fallback destination
    let destName = localStorage.getItem('destinationName');
    let destLat = parseFloat(localStorage.getItem('destinationLat'));
    let destLng = parseFloat(localStorage.getItem('destinationLng'));

    if (!destName || isNaN(destLat) || isNaN(destLng)) {
      // Provide clean default destination if user opened /tracking directly
      destName = 'Madurai Junction';
      destLat = 9.9252;
      destLng = 78.1198;

      localStorage.setItem('destinationName', destName);
      localStorage.setItem('destinationLat', destLat.toString());
      localStorage.setItem('destinationLng', destLng.toString());
      localStorage.setItem('trainName', 'Pandian Express');
      localStorage.setItem('trainNumber', '12637');
    }

    const destObj = {
      name: destName,
      lat: destLat,
      lng: destLng,
      trainName: localStorage.getItem('trainName') || 'Train Journey',
      trainNumber: localStorage.getItem('trainNumber') || 'TRN'
    };

    setDestination(destObj);

    // Initial fallback user location near destination (Dindigul Junction)
    const initUserLat = 10.3535;
    const initUserLng = 77.9842;
    setUserLoc({ lat: initUserLat, lng: initUserLng });

    const initialDist = CALCULATE_DISTANCE(initUserLat, initUserLng, destLat, destLng);
    setDistRemaining(parseFloat(initialDist.toFixed(2)));
    setEtaMins(ESTIMATE_TIME(initialDist, 55));

    // 2. Geolocation Watch or Demo Mode simulation loop
    let intervalId = null;

    if (isDemoMode) {
      const startLat = destLat - 0.13;
      const startLng = destLng - 0.04;
      
      let progress = 0;
      setSimProgress(0);

      intervalId = setInterval(() => {
        if (isPaused || alarmTriggered) return;
        
        progress = Math.min(1, progress + 0.015 * simSpeed);
        setSimProgress(progress);

        const currentLat = startLat + (destLat - startLat) * progress;
        const currentLng = startLng + (destLng - startLng) * progress;
        
        setUserLoc({ lat: currentLat, lng: currentLng });
        
        const dist = CALCULATE_DISTANCE(currentLat, currentLng, destLat, destLng);
        setDistRemaining(parseFloat(dist.toFixed(2)));
        setEtaMins(Math.max(0, Math.round((dist / (80 * simSpeed)) * 60)));
        setCurrentSpeed(80 * simSpeed);

        // Alarm Trigger Condition
        if (dist <= alarmRadius && !alarmTriggered) {
          setAlarmTriggered(true);
          TRIGGER_ALARM_SOUND();
        }
      }, 1000);
    } else if (navigator.geolocation) {
      const optionsHigh = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
      const optionsLow = { enableHighAccuracy: false, timeout: 10000, maximumAge: 3000 };

      const getFix = (options) => {
        navigator.geolocation.getCurrentPosition(
          pos => updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed),
          err => {
            console.warn("GPS Resilient Fix Error:", err);
            if (err.code === 1) {
              setGpsStatus('Lost'); // Permission Denied
            } else if (options === optionsHigh) {
              getFix(optionsLow);
            }
          },
          options
        );
      };

      // Get initial fix immediately
      getFix(optionsHigh);

      // Start continuous watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed),
        err => {
          console.warn("GPS Watch Error, falling back to interval:", err);
          setGpsStatus('Weak');
          getFix(optionsLow);
        },
        optionsHigh
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      STOP_ALARM_SOUND();
    };
  }, [alarmRadius, alarmTriggered, isPaused, isDemoMode, simSpeed, updateLocation]);

  // Smart Battery Mode background GPS poller
  useEffect(() => {
    if (isDemoMode || !navigator.geolocation || isPaused || alarmTriggered) return;

    let pollInterval = 4000; // Default fallback: 4s
    if (distRemaining !== null) {
      if (distRemaining > 100) {
        pollInterval = 300000; // >100 km: every 5 minutes
      } else if (distRemaining > 20) {
        pollInterval = 120000; // 20 km to 100 km: every 2 minutes
      } else if (distRemaining > 5) {
        pollInterval = 20000;  // 5 km to 20 km: every 20 seconds
      } else {
        pollInterval = 5000;   // <5 km: every 5 seconds
      }
    }

    const optionsHigh = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    const optionsLow = { enableHighAccuracy: false, timeout: 10000, maximumAge: 3000 };

    const getFix = (options) => {
      navigator.geolocation.getCurrentPosition(
        pos => updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed),
        err => {
          console.warn("Smart Battery GPS Fix Error:", err);
          if (err.code === 1) {
            setGpsStatus('Lost');
          } else if (options === optionsHigh) {
            getFix(optionsLow);
          }
        },
        options
      );
    };

    const intervalId = setInterval(() => {
      getFix(optionsHigh);
      if (Date.now() - lastFixTimeRef.current > pollInterval + 15000) {
        setGpsStatus('Lost');
      }
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [distRemaining, isDemoMode, isPaused, alarmTriggered, updateLocation]);

  const handleDismissAlarm = () => {
    STOP_ALARM_SOUND();
    setAlarmTriggered(false);
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    // Clean up tracking watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();

    // Clear storage keys
    localStorage.removeItem('destinationName');
    localStorage.removeItem('destinationLat');
    localStorage.removeItem('destinationLng');
    localStorage.removeItem('boardingStation');

    navigate('/');
  };

  const handleEndJourney = () => {
    STOP_ALARM_SOUND();
    setAlarmTriggered(false);
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    // Clean up tracking watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();

    // Clear storage keys
    localStorage.removeItem('destinationName');
    localStorage.removeItem('destinationLat');
    localStorage.removeItem('destinationLng');
    localStorage.removeItem('boardingStation');

    navigate('/');
  };

  const progressPercent = distRemaining !== null ? Math.max(5, Math.min(100, (1 - distRemaining / 30) * 100)) : 75;

  return (
    <div className="pt-20 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans max-w-md mx-auto border-x border-slate-200 dark:border-slate-800">
      <div className="px-4 space-y-6">

        {/* Sponsor Pitch Banner & Privacy Badge */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 p-4 rounded-3xl text-white shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-2 -translate-y-2">
            <Train size={120} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
              Sponsor Pitch Draft
            </span>
            <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              🔒 100% Client-Side
            </span>
          </div>
          <h2 className="text-base font-extrabold tracking-tight">WakeUpMyStop — Privacy-First Commuter Alarm</h2>
          <p className="text-[10px] text-blue-100 leading-relaxed font-medium">
            Zero servers, zero backend database tracking. Screen Wake Lock & resilient background GPS loop ensures you wake up at your station.
          </p>
        </div>

        {/* Sponsor Simulation Mode Control Card */}
        <div className="saas-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Simulation Controls</span>
            <span className="text-[10px] font-bold text-blue-600">Pitch Simulator</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setIsDemoMode(false)}
              className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                !isDemoMode ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              ⚡ Live GPS
            </button>
            <button
              onClick={() => {
                setIsDemoMode(true);
                // Pre-populate route: Dindigul [DG] to Chennai Egmore [MS]
                localStorage.setItem('destinationName', 'Chennai Egmore (MS)');
                localStorage.setItem('destinationLat', '13.0826');
                localStorage.setItem('destinationLng', '80.2707');
                localStorage.setItem('boardingStation', JSON.stringify({
                  id: 'dg',
                  name: 'Dindigul Junction (DG)',
                  lat: 10.3535,
                  lng: 77.9842,
                  code: 'DG'
                }));
                // Reload destination
                setDestination({
                  name: 'Chennai Egmore (MS)',
                  lat: 13.0826,
                  lng: 80.2707,
                  trainName: 'Rockfort Express',
                  trainNumber: '12654'
                });
                setBoardingStation({
                  name: 'Dindigul Junction (DG)',
                  lat: 10.3535,
                  lng: 77.9842
                });
              }}
              className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                isDemoMode ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              🎮 Sponsor Demo Mode
            </button>
          </div>

          {isDemoMode && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">Simulation Speed:</span>
                <span className="font-black text-blue-600">{simSpeed}x Speed</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`py-1 rounded-lg text-xs font-extrabold border transition-all ${
                      simSpeed === s 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${simProgress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400">
                <span>Dindigul (DG)</span>
                <span>Chennai Egmore (MS)</span>
              </div>
            </div>
          )}

          {/* Recording & Showcase Helper */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                TRIGGER_ALARM_SOUND();
                setAlarmTriggered(true);
              }}
              className="py-2.5 rounded-xl border border-dashed border-red-500 bg-red-500/5 text-red-600 text-xs font-black hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔊 Test Alarm Now</span>
            </button>
            <button
              onClick={() => {
                STOP_ALARM_SOUND();
                setAlarmTriggered(false);
                if (navigator.vibrate) {
                  navigator.vibrate(0);
                }
              }}
              className="py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔇 Stop Alarm</span>
            </button>
          </div>
        </div>

        {/* Live GPS Map Visualization Header */}
        <div className="w-full h-56 rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg relative">
          {userLoc && destination && (
            <MapContainer
              center={[userLoc.lat, userLoc.lng]} zoom={13} zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapAutoFit userLoc={userLoc} destLoc={{ lat: destination.lat, lng: destination.lng }} />
              {!isNaN(userLoc.lat) && !isNaN(userLoc.lng) && (
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              {!isNaN(destination.lat) && !isNaN(destination.lng) && (
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                  <Popup>{destination.name}</Popup>
                </Marker>
              )}

              {/* Traversed Path: Solid Blue */}
              {boardingStation && !isNaN(boardingStation.lat) && !isNaN(boardingStation.lng) && !isNaN(userLoc.lat) && !isNaN(userLoc.lng) && (
                <Polyline
                  positions={[[boardingStation.lat, boardingStation.lng], [userLoc.lat, userLoc.lng]]}
                  color="#2563EB"
                  weight={4}
                />
              )}

              {/* Remaining Path: Dotted Blue */}
              {!isNaN(userLoc.lat) && !isNaN(userLoc.lng) && !isNaN(destination.lat) && !isNaN(destination.lng) && (
                <Polyline
                  positions={[[userLoc.lat, userLoc.lng], [destination.lat, destination.lng]]}
                  color="#2563EB"
                  weight={4}
                  dashArray="5, 8"
                />
              )}
            </MapContainer>
          )}

          {/* Floating Live Badge */}
          <div className="absolute top-4 left-4 z-[400] px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-black flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Satellite Tracking Active</span>
          </div>

          {/* GPS Lost Warning Overlay */}
          {gpsStatus === 'Lost' && (
            <div className="absolute bottom-4 left-4 right-4 z-[400] px-3 py-2.5 rounded-2xl bg-red-600/95 backdrop-blur-md border border-red-500 text-white text-xs font-black flex items-center gap-2 shadow-xl animate-pulse">
              <AlertOctagon size={16} className="flex-shrink-0" />
              <span>GPS Signal Lost! Move under clear sky.</span>
            </div>
          )}
        </div>

        {/* Alarm Triggered Full-Screen Modal Overlay */}
        <AnimatePresence>
          {alarmTriggered && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-6"
            >
              <m.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="w-full max-w-sm p-8 rounded-[32px] bg-gradient-to-b from-slate-900 to-slate-950 border border-red-500/30 shadow-2xl space-y-6"
              >
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                    <Bell size={40} className="animate-bounce" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/10">
                    Destination Reached
                  </span>
                  <h2 className="text-3xl font-black tracking-tight leading-none mt-2">YOU HAVE ARRIVED!</h2>
                  <p className="text-sm font-bold text-slate-300">
                    You are near <span className="text-white underline decoration-red-500 decoration-2">{destination?.name}</span>!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Live Distance Check</span>
                  <p className="text-sm font-extrabold text-slate-200">
                    Distance remaining: <span className="text-red-400">{distRemaining} km</span>
                  </p>
                </div>

                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismissAlarm}
                  className="w-full h-15 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>⏰ I'm Awake / Dismiss Alarm</span>
                </m.button>
              </m.div>
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
                  {wakeLockActive ? (
                    <Sparkles size={16} className="mx-auto text-emerald-500 mb-1 animate-pulse" />
                  ) : (
                    <Sparkles size={16} className="mx-auto text-slate-400 mb-1" />
                  )}
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Wake Lock</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {wakeLockSupported ? (wakeLockActive ? 'Active' : 'Idle') : 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  {gpsStatus === 'Optimal' ? (
                    <Wifi size={16} className="mx-auto text-indigo-500 mb-1" />
                  ) : (
                    <WifiOff size={16} className="mx-auto text-red-500 mb-1 animate-bounce" />
                  )}
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">GPS Signal</span>
                  <span className={`font-extrabold text-sm ${gpsStatus === 'Lost' ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {gpsStatus}
                  </span>
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

        {/* Privacy Badge */}
        <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>🔒 100% Private — Location processed entirely on your device.</span>
        </div>

      </div>
    </div>
  );
}
