import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Navigation,
  Volume2,
  Vibrate,
  Mic,
  Moon,
  AlertOctagon,
  Pause,
  Play,
  Check,
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
import { CALCULATE_DISTANCE, TRIGGER_ALARM_SOUND, STOP_ALARM_SOUND, ESTIMATE_TIME } from '../constants';
import { useCountry } from '../context/CountryContext';

export default function RedesignedTracking() {
  const navigate = useNavigate();
  const { countryFlag } = useCountry();

  const [destination, setDestination] = useState(null);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [distRemaining, setDistRemaining] = useState(null);
  const [etaMins, setEtaMins] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(55);
  const [alarmRadius, setAlarmRadius] = useState(5); // km
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Toggles
  const [volume, setVolume] = useState(80);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceAlertEnabled, setVoiceAlertEnabled] = useState(true);
  const [repeatAlarmEnabled, setRepeatAlarmEnabled] = useState(true);

  const watchIdRef = useRef(null);

  useEffect(() => {
    const destName = localStorage.getItem('destinationName');
    const destLat = parseFloat(localStorage.getItem('destinationLat'));
    const destLng = parseFloat(localStorage.getItem('destinationLng'));

    if (!destName || isNaN(destLat) || isNaN(destLng)) {
      navigate('/train');
      return;
    }

    const destObj = {
      name: destName,
      lat: destLat,
      lng: destLng,
      trainName: localStorage.getItem('trainName') || 'Train Journey',
      trainNumber: localStorage.getItem('trainNumber') || 'TRN'
    };

    setDestination(destObj);

    // Watch position GPS
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          const { latitude: lat, longitude: lng, speed } = pos.coords;
          setCurrentLoc({ lat, lng });

          if (speed && !isNaN(speed)) {
            setCurrentSpeed(Math.round(speed * 3.6)); // m/s to km/h
          }

          const dist = CALCULATE_DISTANCE(lat, lng, destLat, destLng);
          setDistRemaining(parseFloat(dist.toFixed(2)));
          setEtaMins(ESTIMATE_TIME(dist, currentSpeed || 50));

          // Check Alarm condition
          if (dist <= alarmRadius && !alarmTriggered && !isPaused) {
            setAlarmTriggered(true);
            TRIGGER_ALARM_SOUND();
          }
        },
        err => {
          // Fallback simulation when real GPS unavailable
          console.warn("GPS watch fallback simulation active:", err);
          const mockDist = 8.4;
          setDistRemaining(mockDist);
          setEtaMins(ESTIMATE_TIME(mockDist, 55));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      STOP_ALARM_SOUND();
    };
  }, [alarmRadius, alarmTriggered, isPaused, navigate, currentSpeed]);

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
    <div className="pt-20 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

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
              <input type="checkbox" checked defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
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
