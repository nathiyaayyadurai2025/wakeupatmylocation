import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bell, Train as TrainIcon } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const a = Math.sin(toRad(lat2 - lat1)/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1)/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

let audioCtx = null;
let oscillator = null;

function startAlarmSound() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
}

function stopAlarmSound() {
  if (oscillator) { oscillator.stop(); oscillator.disconnect(); oscillator = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}

const createDotIcon = (color, size=8) => L.divIcon({
  className: '', iconSize: [size, size],
  html: `<div style="width:${size}px;height:${size}px;background:${color==="outline" ? 'transparent' : color};border-radius:50%;border:2px solid ${color==="outline" ? '#3B82F6' : 'white'};box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`
});

const createMainMarker = (color, label) => L.divIcon({
  className: '', iconSize: [0, 0],
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);">
    <div style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;margin-bottom:4px;box-shadow:0 4px 10px rgba(0,0,0,0.5);white-space:nowrap;">${label}</div>
    <div style="width:16px;height:16px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.5)"></div>
  </div>`
});

const createUserIcon = () => L.divIcon({
  className: '', iconSize: [20, 20],
  html: `<div style="width:20px;height:20px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #3B82F6;animation:pulse 2s infinite">
    <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.3);animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"></div>
  </div>`
});

function MapFitter({ stops }) {
  const map = useMap();
  useEffect(() => {
    if (stops && stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [stops, map]);
  return null;
}

export default function RedesignedTracking() {
  const navigate = useNavigate();
  const [userLoc, setUserLoc] = useState(null);
  const [distance, setDistance] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [showAlarmOverlay, setShowAlarmOverlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const alarmFiredRef = useRef(false);

  const destName = localStorage.getItem("destinationName");
  const destLat = parseFloat(localStorage.getItem("destinationLat"));
  const destLng = parseFloat(localStorage.getItem("destinationLng"));
  const trainName = localStorage.getItem("trainName");
  const trainNumber = localStorage.getItem("trainNumber");
  
  const stops = useMemo(() => {
    const raw = localStorage.getItem("allStops");
    return raw ? JSON.parse(raw) : [];
  }, []);

  const destIdx = stops.findIndex(s => s.name === destName);
  
  useEffect(() => {
    if (isNaN(destLat) || isNaN(destLng) || !stops.length) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        const sData = pos.coords.speed;
        setUserLoc({ lat: uLat, lng: uLng });
        if(sData !== null) setSpeed(Math.round(sData * 3.6));
        
        let minD = Infinity; let cIdx = 0;
        stops.forEach((st, idx) => {
          const d = haversine(uLat, uLng, st.lat, st.lng);
          if (d < minD) { minD = d; cIdx = idx; }
        });
        setCurrentStopIdx(prev => Math.max(prev, cIdx));

        const dToDest = haversine(uLat, uLng, destLat, destLng);
        setDistance(dToDest);

        if (dToDest < 2.0 && localStorage.getItem("alarmTriggered") !== "true" && !alarmFiredRef.current) {
          alarmFiredRef.current = true;
          setShowAlarmOverlay(true);
          startAlarmSound();
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        }
      },
      err => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [destLat, destLng, stops]);

  const dismissAlarm = () => {
    stopAlarmSound();
    if (navigator.vibrate) navigator.vibrate(0);
    localStorage.setItem("alarmTriggered", "true");
    setShowAlarmOverlay(false);
  };

  if (!stops.length) return null;

  const passedStops = stops.slice(0, currentStopIdx + 1);
  const remainingStops = stops.slice(currentStopIdx, destIdx + 1);
  
  const totalKm = stops[destIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const currKm = stops[currentStopIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const progressPct = totalKm > 0 ? Math.min(100, Math.max(0, (currKm / totalKm) * 100)) : 0;
  
  const currentSpeed = speed !== null ? speed : 60; // default 60 km/h
  const estimatedTimeMins = distance ? Math.max(0, Math.round((distance / currentSpeed) * 60)) : 0;

  const nextStop = stops[Math.min(destIdx, currentStopIdx + 1)];
  const nextStopD = userLoc && nextStop ? haversine(userLoc.lat, userLoc.lng, nextStop.lat, nextStop.lng) : null;

  return (
    <div className="h-screen bg-[#0A0F1E] font-sans relative overflow-hidden flex flex-col pt-10">
      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[stops[0].lat, stops[0].lng]} zoom={13} zoomControl={false} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" />
          <MapFitter stops={stops.slice(0, destIdx + 1)} />

          {/* Glow Lines */}
          {passedStops.length > 1 && <Polyline positions={passedStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#6B7280', weight: 12, opacity: 0.15 }} />}
          {remainingStops.length > 1 && <Polyline positions={remainingStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#3B82F6', weight: 12, opacity: 0.15 }} />}
          
          {/* Main Lines */}
          {passedStops.length > 1 && <Polyline positions={passedStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#6B7280', weight: 5 }} />}
          {remainingStops.length > 1 && <Polyline positions={remainingStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#3B82F6', weight: 5, dashArray: '10 6' }} />}

          {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={createUserIcon()} />}
          
          <Marker position={[stops[0].lat, stops[0].lng]} icon={createMainMarker('#10B981', 'START')} />
          <Marker position={[destLat, destLng]} icon={createMainMarker('#EF4444', destName)} />
          
          <Circle center={[destLat, destLng]} radius={2000} pathOptions={{ color: 'rgba(239,68,68,0.4)', fillColor: 'rgba(239,68,68,0.08)', fillOpacity: 1, weight: 2, dashArray: '6 4' }} />

          {stops.map((st, i) => {
            if (i === 0 || i >= destIdx) return null;
            const isPassed = i < currentStopIdx;
            const isCurrent = i === currentStopIdx;
            return (
              <m.div key={i}>
                <Marker position={[st.lat, st.lng]} icon={createDotIcon(isCurrent ? '#3B82F6' : isPassed ? '#6B7280' : 'outline', isCurrent ? 12 : 8)} />
              </m.div>
            );
          })}
        </MapContainer>
      </div>

      {/* TOP FLOATING CARD */}
      <div className="absolute top-16 left-4 right-4 z-10">
        <m.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0A0F1E]/85 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">{trainName}</h2>
            <p className="text-[#9CA3AF] text-xs font-semibold mt-0.5">{trainNumber}</p>
          </div>
          <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Tracking</span>
          </div>
        </m.div>
      </div>

      {/* BOTTOM SHEET */}
      <m.div 
        initial={{ y: '100%' }} animate={{ y: expanded ? 0 : '0%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`absolute bottom-0 left-0 right-0 bg-[#111827] rounded-t-3xl z-20 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] flex flex-col ${expanded ? 'h-[70vh]' : 'h-[320px]'}`}
      >
        <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="w-12 h-1.5 bg-[#4B5563] rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5" style={{ scrollbarWidth: 'none' }}>
          
          {/* Timeline */}
          <div className="flex space-x-6 overflow-x-auto pb-2 pt-2 px-1 relative" style={{ scrollbarWidth: 'none' }}>
            <div className="absolute top-[13px] left-0 right-0 h-[2px] bg-[#4B5563] z-0" />
            
            {stops.slice(0, destIdx + 1).map((st, i) => {
              const isPassed = i < currentStopIdx;
              const isCurrent = i === currentStopIdx;
              const isDest = i === destIdx;
              const dotClr = isDest ? 'bg-[#EF4444] border-2 border-[#111827]' : isCurrent ? 'bg-[#3B82F6] shadow-[0_0_12px_#3B82F6] border-2 border-[#111827]' : isPassed ? 'bg-[#6B7280] border-2 border-[#111827]' : 'bg-[#111827] border-2 border-[#3B82F6]';
              return (
                <div key={i} className="flex flex-col items-center min-w-[70px] relative z-10 group">
                  {isCurrent && <div className="absolute top-1 left-1/2 -translate-x-1/2 -mt-[5px] w-5 h-5 rounded-full border border-[#3B82F6] animate-ping" />}
                  <div className={`w-3.5 h-3.5 rounded-full mb-3 transition-colors ${dotClr}`} />
                  <span className={`text-[10px] text-center max-w-[80px] break-words line-clamp-2 leading-tight ${isPassed ? 'text-[#6B7280] line-through' : isCurrent ? 'text-[#60A5FA] font-bold' : isDest ? 'text-[#EF4444] font-bold' : 'text-[#F9FAFB] font-medium'}`}>{st.name}</span>
                  <span className="text-[9px] text-[#4B5563] font-bold mt-1">{st.arrival}</span>
                </div>
              );
            })}
          </div>

          {/* Stats Boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1C2537] rounded-xl p-3 text-center border border-white/5">
              <div className="text-white font-bold text-lg tabular-nums">{distance?.toFixed(1) ?? '--'} <span className="text-xs text-[#9CA3AF]">km</span></div>
              <div className="text-[9px] uppercase tracking-wider text-[#9CA3AF] font-bold mt-0.5">To Destination</div>
            </div>
            <div className="bg-[#1C2537] rounded-xl p-3 text-center border border-white/5">
              <div className="text-white font-bold text-lg tabular-nums">{estimatedTimeMins} <span className="text-xs text-[#9CA3AF]">min</span></div>
              <div className="text-[9px] uppercase tracking-wider text-[#9CA3AF] font-bold mt-0.5">Estimated Arrv</div>
            </div>
            <div className="bg-[#1C2537] rounded-xl p-3 text-center border border-white/5">
              <div className="text-white font-bold text-lg tabular-nums">{currentSpeed} <span className="text-xs text-[#9CA3AF]">km/h</span></div>
              <div className="text-[9px] uppercase tracking-wider text-[#9CA3AF] font-bold mt-0.5">Train Speed</div>
            </div>
          </div>

          {/* Next Stop Banner */}
          {nextStop && (
            <div className="bg-[#1E3A8A]/40 border border-[#1E40AF]/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#3B82F6]/20 rounded-full flex items-center justify-center text-[#60A5FA]">
                  <TrainIcon size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#60A5FA] tracking-wider mb-0.5">Next Stop</div>
                  <div className="text-white font-bold text-sm tracking-tight">{nextStop.name} <span className="text-[#9CA3AF] font-medium ml-1">({nextStop.arrival})</span></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{nextStopD?.toFixed(1) ?? '--'} <span className="text-[10px] text-[#9CA3AF]">km</span></div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#9CA3AF] mb-2 px-1">
              <span>{stops[0].name}</span>
              <span className="text-[#F9FAFB]">{Math.round(progressPct)}%</span>
              <span>{destName}</span>
            </div>
            <div className="h-2 w-full bg-[#1C2537] rounded-full overflow-hidden">
              <m.div 
                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Cancel Button */}
          <button 
            onClick={() => { stopAlarmSound(); navigate('/'); }}
            className="w-full h-12 bg-[#7F1D1D]/40 border border-[#991B1B]/50 hover:bg-[#7F1D1D]/60 active:scale-95 text-[#F87171] font-bold rounded-xl transition-all"
          >
            Cancel Alarm
          </button>
        </div>
      </m.div>

      {/* ALARM OVERLAY */}
      <AnimatePresence>
        {showAlarmOverlay && (
          <m.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[1000] bg-[#7F1D1D] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
              <m.div animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 bg-red-500/50 rounded-full" />
              <m.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="relative z-10 text-white">
                <Bell size={64} style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} />
              </m.div>
            </div>
            
            <m.h1 animate={{ opacity: [1, 0.8, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-[42px] font-black text-white leading-tight mb-2 tracking-tighter">
              WAKE UP!
            </m.h1>
            <p className="text-red-200 text-xl font-medium tracking-wide mb-8">
              Your stop is 2km away
            </p>
            
            <div className="bg-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-12">
              <span className="text-[#7F1D1D] font-bold text-lg tracking-tight">{destName}</span>
            </div>

            <m.button 
              whileTap={{ scale: 0.95 }}
              onClick={dismissAlarm} 
              className="absolute bottom-10 left-6 right-6 h-16 bg-white text-[#7F1D1D] font-black text-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] outline-none"
            >
              I'm Awake — Dismiss
            </m.button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
