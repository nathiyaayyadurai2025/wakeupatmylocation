import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bell, Navigation, Clock, ShieldCheck, X } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
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

const createDotIcon = (color) => L.divIcon({
  className: '',
  iconSize: [12, 12],
  html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>`
});

const createMainMarker = (color) => L.divIcon({
  className: '',
  iconSize: [24, 24],
  html: `<div style="width:24px;height:24px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5)"></div>`
});

const createUserIcon = () => L.divIcon({
  className: '',
  iconSize: [20, 20],
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 15px #3b82f6;animation:pulse 2s infinite"></div>`
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
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [showAlarmOverlay, setShowAlarmOverlay] = useState(false);
  
  const alarmFiredRef = useRef(false);

  // Load mission from local storage
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
    if (isNaN(destLat) || isNaN(destLng) || !stops.length) {
      console.error("Missing tracking data");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserLoc({ lat: uLat, lng: uLng });
        
        // Find closest stop
        let minD = Infinity;
        let cIdx = 0;
        stops.forEach((st, idx) => {
          const d = haversine(uLat, uLng, st.lat, st.lng);
          if (d < minD) { minD = d; cIdx = idx; }
        });
        
        // Don't revert progress if user gets further away momentarily. 
        // We ensure current stop only increases or stays same.
        setCurrentStopIdx(prev => Math.max(prev, cIdx));

        const dToDest = haversine(uLat, uLng, destLat, destLng);
        setDistance(dToDest);

        const alarmTriggered = localStorage.getItem("alarmTriggered") === "true";
        if (dToDest < 2.0 && !alarmTriggered && !alarmFiredRef.current) {
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

  const cancelMission = () => {
    stopAlarmSound();
    if (navigator.vibrate) navigator.vibrate(0);
    navigate('/');
  };

  if (!stops.length) return <div className="p-10 text-white">Cannot set alarm: location data missing</div>;

  // Polyline splitting
  const passedStops = stops.slice(0, currentStopIdx + 1);
  const remainingStops = stops.slice(currentStopIdx, destIdx + 1); // Up to destination
  
  // Progress
  const totalKm = stops[destIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const currKm = stops[currentStopIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const progressPct = totalKm > 0 ? Math.min(100, Math.max(0, (currKm / totalKm) * 100)) : 0;
  
  const estimatedTimeMins = distance ? Math.max(0, Math.round((distance / 60) * 60)) : 0;

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative">
      {/* ── MAP ── */}
      <div className="flex-1 relative z-0">
        <MapContainer center={[stops[0].lat, stops[0].lng]} zoom={13} zoomControl={false} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFitter stops={stops.slice(0, destIdx + 1)} />

          {/* Lines */}
          {passedStops.length > 1 && (
            <Polyline positions={passedStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#6B7280', weight: 4 }} />
          )}
          {remainingStops.length > 1 && (
            <Polyline positions={remainingStops.map(s => [s.lat, s.lng])} pathOptions={{ color: '#3B82F6', weight: 4, dashArray: '8 6' }} />
          )}

          {/* Markers */}
          {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={createUserIcon()} />}
          
          <Marker position={[stops[0].lat, stops[0].lng]} icon={createMainMarker('#10B981')}>
            <Popup>Boarding: {stops[0].name}</Popup>
          </Marker>

          <Marker position={[destLat, destLng]} icon={createMainMarker('#EF4444')}>
            <Popup>Destination: {destName}</Popup>
          </Marker>
          <Circle center={[destLat, destLng]} radius={2000} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.1, weight: 1 }} />

          {stops.map((st, i) => {
            if (i === 0 || i >= destIdx) return null; // handled
            const isPassed = i <= currentStopIdx;
            return (
              <Marker key={i} position={[st.lat, st.lng]} icon={createDotIcon(isPassed ? '#6B7280' : '#3B82F6')}>
                <Popup>{st.name} (Arrival: {st.arrival})</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div className="bg-slate-900 border-t border-slate-700/50 rounded-t-[2.5rem] p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] -mt-6">
        
        {/* Timeline */}
        <div className="flex space-x-6 overflow-x-auto pb-4 pt-1 px-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {stops.slice(0, destIdx + 1).map((st, i) => {
            const isPassed = i < currentStopIdx;
            const isCurrent = i === currentStopIdx;
            const isDest = i === destIdx;
            return (
              <div key={i} className="flex flex-col items-center min-w-[60px]">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center mb-2 ${isCurrent ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] scale-125' : isDest ? 'bg-red-500' : isPassed ? 'bg-slate-600' : 'border-2 border-blue-500 bg-transparent'}`} />
                <span className={`text-[10px] text-center max-w-[80px] break-words line-clamp-2 ${isPassed ? 'text-slate-500 line-through' : isCurrent ? 'text-blue-400 font-bold' : isDest ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{st.name}</span>
              </div>
            );
          })}
        </div>

        {/* HUD */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white font-black text-lg">{trainName}</h3>
            <span className="text-blue-400 font-bold text-xs bg-blue-500/10 px-2 py-0.5 rounded">#{trainNumber}</span>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Live ETA</p>
            <p className="text-2xl text-white font-light tabular-nums">{estimatedTimeMins} <span className="text-sm font-bold opacity-50">MIN</span></p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-medium">Next Station:</span>
            <span className="text-white font-bold text-right">{stops[Math.min(destIdx, currentStopIdx+1)]?.name} <span className="text-slate-500 text-xs ml-1">({stops[Math.min(destIdx, currentStopIdx+1)]?.arrival})</span></span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-medium">Destination:</span>
            <span className="text-red-400 font-bold text-right flex items-center space-x-1"><ShieldCheck size={14} className="mr-1"/> {destName}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-700 pt-3">
            <span className="text-slate-400 font-medium tracking-widest uppercase text-[10px]">Distance Left</span>
            <span className="text-white font-mono font-bold text-lg">{distance?.toFixed(1) ?? '--'} <span className="text-blue-400 text-xs text-sans">KM</span></span>
          </div>
          
          <div className="pt-2">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1.5 text-slate-500">
              <span>Progress</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <button onClick={cancelMission} className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold rounded-xl text-sm transition-all shadow-sm">
          Cancel Mission
        </button>
      </div>

      {/* ── ALARM OVERLAY ── */}
      <AnimatePresence>
        {showAlarmOverlay && (
          <m.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[3000] bg-red-600/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md"
          >
            <m.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Bell size={80} className="text-white shadow-xl mb-6" />
            </m.div>
            <m.h2 animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-5xl font-black text-white mb-2 tracking-tighter uppercase leading-tight">
              Wake Up!<br/>Your stop is<br/>2km away!
            </m.h2>
            <p className="text-red-200 text-2xl font-bold mb-10 tracking-tight">
              {destName}
            </p>
            <button onClick={dismissAlarm} className="bg-white text-red-600 px-12 py-5 rounded-2xl font-black text-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] active:scale-95 transition-all outline-none">
              Dismiss Alarm
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── DEBUG PANEL ── */}
      {import.meta.env.DEV && (
        <div style={{position:"fixed",top:60,right:8,background:"rgba(0,0,0,0.85)",color:"#0f0",padding:"8px",borderRadius:"8px",fontSize:"11px",zIndex:9999,fontFamily:"monospace"}}>
          <div>User: {userLoc?.lat?.toFixed(4)}, {userLoc?.lng?.toFixed(4)}</div>
          <div>Dest: {destLat?.toFixed(4)}, {destLng?.toFixed(4)}</div>
          <div>Distance: {distance?.toFixed(3)} km</div>
          <div>Current stop: {stops[currentStopIdx]?.name}</div>
          <div>Alarm: {alarmFiredRef.current ? "FIRED" : "waiting"}</div>
        </div>
      )}
    </div>
  );
}
