import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bell, Train as TrainIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

// ── Haversine ────────────────────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, t = d => d * Math.PI / 180;
  const a = Math.sin(t(lat2 - lat1) / 2) ** 2 + Math.cos(t(lat1)) * Math.cos(t(lat2)) * Math.sin(t(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Web Audio Alarm ──────────────────────────────────────────────────────────
let audioCtx = null, oscillator = null;
function startAlarmSound() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
}
function stopAlarmSound() {
  if (oscillator) { oscillator.stop(); oscillator.disconnect(); oscillator = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}

// ── Leaflet Icons ────────────────────────────────────────────────────────────
const makeIcon = (html, size) => L.divIcon({ className: '', iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2], html });

const userIcon = makeIcon(`
  <div style="position:relative;width:22px;height:22px">
    <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.2);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
    <div style="position:absolute;inset:-2px;border-radius:50%;background:rgba(59,130,246,0.15)"></div>
    <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(59,130,246,0.8)"></div>
  </div>
`, [22, 22]);

const makeStopIcon = (color, size = 9, isOutline = false) => makeIcon(`
  <div style="width:${size}px;height:${size}px;background:${isOutline ? 'transparent' : color};border-radius:50%;border:2px solid ${color};box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>
`, [size, size]);

const makeMainIcon = (color, label) => L.divIcon({
  className: '', iconSize: [0, 0], iconAnchor: [0, 0],
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:none">
      <div style="background:${color};color:white;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;white-space:nowrap;margin-bottom:5px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-family:Inter,sans-serif;letter-spacing:0.02em">${label}</div>
      <div style="width:14px;height:14px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4)"></div>
    </div>
  `
});

// ── Map Fitter ───────────────────────────────────────────────────────────────
function MapFitter({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [60, 60], maxZoom: 14 });
    }
  }, []); // only on mount
  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RedesignedTracking() {
  const navigate = useNavigate();
  const [userLoc, setUserLoc] = useState(null);
  const [distance, setDistance] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [showAlarm, setShowAlarm] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const alarmFiredRef = useRef(false);
  const timelineRef = useRef(null);

  // Read mission data
  const destName = localStorage.getItem('destinationName') || '';
  const destLat = parseFloat(localStorage.getItem('destinationLat'));
  const destLng = parseFloat(localStorage.getItem('destinationLng'));
  const trainName = localStorage.getItem('trainName') || '';
  const trainNumber = localStorage.getItem('trainNumber') || '';

  const stops = useMemo(() => {
    const raw = localStorage.getItem('allStops');
    return raw ? JSON.parse(raw) : [];
  }, []);

  const destIdx = useMemo(() => {
    const idx = stops.findIndex(s => s.name === destName);
    return idx >= 0 ? idx : stops.length - 1;
  }, [stops, destName]);

  // ── GPS Tracking ──
  useEffect(() => {
    if (!stops.length || isNaN(destLat) || isNaN(destLng)) return;

    const id = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: uLat, longitude: uLng, speed: spd } = pos.coords;
        setUserLoc({ lat: uLat, lng: uLng });
        if (spd !== null) setSpeed(Math.round(spd * 3.6));

        // Find nearest stop (never go backwards)
        let minD = Infinity, nearest = 0;
        stops.forEach((s, i) => {
          const d = haversine(uLat, uLng, s.lat, s.lng);
          if (d < minD) { minD = d; nearest = i; }
        });
        setCurrentStopIdx(prev => Math.max(prev, nearest));

        const dDest = haversine(uLat, uLng, destLat, destLng);
        setDistance(dDest);

        if (dDest < 2 && !alarmFiredRef.current && localStorage.getItem('alarmTriggered') !== 'true') {
          alarmFiredRef.current = true;
          setShowAlarm(true);
          startAlarmSound();
          navigator.vibrate?.([500, 200, 500, 200, 500]);
        }
      },
      err => console.error('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [stops, destLat, destLng]);

  const dismissAlarm = useCallback(() => {
    stopAlarmSound();
    navigator.vibrate?.(0);
    localStorage.setItem('alarmTriggered', 'true');
    setShowAlarm(false);
  }, []);

  if (!stops.length) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white p-6">
        <div className="text-center">
          <p className="text-[#9CA3AF] mb-4">Cannot set alarm: location data missing</p>
          <button onClick={() => navigate('/')} className="bg-[#3B82F6] px-6 py-2 rounded-xl font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  // ── Derived state ──
  const routeStops = stops.slice(0, destIdx + 1);
  const passedCoords = routeStops.slice(0, currentStopIdx + 1).map(s => [s.lat, s.lng]);
  const remainingCoords = routeStops.slice(currentStopIdx).map(s => [s.lat, s.lng]);

  const totalKm = stops[destIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const currKm = stops[currentStopIdx].distanceFromOriginKm - stops[0].distanceFromOriginKm;
  const progress = totalKm > 0 ? Math.min(100, Math.max(0, (currKm / totalKm) * 100)) : 0;

  const effectiveSpeed = speed ?? 60;
  const etaMins = distance ? Math.max(0, Math.round((distance / effectiveSpeed) * 60)) : 0;

  const nextStop = currentStopIdx < destIdx ? stops[currentStopIdx + 1] : stops[destIdx];
  const nextStopDist = userLoc ? haversine(userLoc.lat, userLoc.lng, nextStop.lat, nextStop.lng) : null;

  const sheetHeight = sheetExpanded ? '72vh' : '36vh';

  return (
    <div className="h-screen bg-[#0A0F1E] relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── FULL SCREEN MAP ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[stops[0].lat, stops[0].lng]} zoom={12} zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFitter positions={routeStops.map(s => [s.lat, s.lng])} />

          {/* Glow layers */}
          {passedCoords.length > 1 && <Polyline positions={passedCoords} pathOptions={{ color: '#6B7280', weight: 14, opacity: 0.12 }} />}
          {remainingCoords.length > 1 && <Polyline positions={remainingCoords} pathOptions={{ color: '#3B82F6', weight: 14, opacity: 0.12 }} />}

          {/* Route lines */}
          {passedCoords.length > 1 && <Polyline positions={passedCoords} pathOptions={{ color: '#6B7280', weight: 5 }} />}
          {remainingCoords.length > 1 && <Polyline positions={remainingCoords} pathOptions={{ color: '#3B82F6', weight: 5, dashArray: '10 6' }} />}

          {/* 2km radius circle */}
          <Circle center={[destLat, destLng]} radius={2000}
            pathOptions={{ color: 'rgba(239,68,68,0.4)', fillColor: 'rgba(239,68,68,0.08)', fillOpacity: 1, weight: 2, dashArray: '6 4' }} />

          {/* User */}
          {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon} />}

          {/* Boarding / Destination main markers */}
          <Marker position={[stops[0].lat, stops[0].lng]} icon={makeMainIcon('#10B981', 'START')} />
          <Marker position={[destLat, destLng]} icon={makeMainIcon('#EF4444', destName.length > 14 ? destName.slice(0, 12) + '…' : destName)} />

          {/* Intermediate stops */}
          {routeStops.map((s, i) => {
            if (i === 0 || i === destIdx) return null;
            const passed = i < currentStopIdx;
            const current = i === currentStopIdx;
            if (current) return <Marker key={i} position={[s.lat, s.lng]} icon={makeStopIcon('#3B82F6', 12)} />;
            return <Marker key={i} position={[s.lat, s.lng]} icon={makeStopIcon(passed ? '#6B7280' : '#3B82F6', 8, !passed)} />;
          })}
        </MapContainer>
      </div>

      {/* ── TOP FLOATING CARD ── */}
      <m.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
        className="absolute top-16 left-4 right-4 z-10 rounded-2xl flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(10,15,30,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      >
        <div>
          <h2 className="text-[#F9FAFB] font-bold text-[15px] tracking-tight">{trainName}</h2>
          <p className="text-[#9CA3AF] text-xs font-semibold mt-0.5">#{trainNumber}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <m.div className="w-2 h-2 rounded-full bg-[#10B981]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[#10B981] text-[10px] font-black uppercase tracking-widest">Tracking</span>
        </div>
      </m.div>

      {/* ── BOTTOM FLOATING SHEET ── */}
      <m.div
        className="absolute left-0 right-0 bottom-0 z-20 rounded-t-3xl flex flex-col"
        style={{
          background: '#111827',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          height: sheetHeight,
          transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        {/* Drag handle */}
        <button
          onClick={() => setSheetExpanded(e => !e)}
          className="w-full flex flex-col items-center pt-3 pb-2 flex-shrink-0 active:opacity-70 transition-opacity"
        >
          <div className="w-10 h-1 bg-[#374151] rounded-full mb-1" />
          {sheetExpanded ? <ChevronDown size={14} className="text-[#4B5563]" /> : <ChevronUp size={14} className="text-[#4B5563]" />}
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4" style={{ scrollbarWidth: 'none' }}>

          {/* ── Stop Timeline ── */}
          <div ref={timelineRef}
            className="flex items-start gap-0 overflow-x-auto pb-3 relative"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* connecting line */}
            <div className="absolute top-[13px] left-0 right-0 h-[2px] z-0"
              style={{ background: 'linear-gradient(to right, #6B7280 0%, #6B7280 40%, #374151 40%, #374151 100%)' }} />

            {routeStops.map((s, i) => {
              const passed = i < currentStopIdx;
              const current = i === currentStopIdx;
              const isDest = i === destIdx;

              const dotColor = isDest ? '#EF4444' : current ? '#3B82F6' : passed ? '#6B7280' : 'transparent';
              const dotBorder = current || isDest || passed ? dotColor : '#4B5563';

              return (
                <div key={i} className="flex flex-col items-center flex-shrink-0 px-3 relative z-10">
                  {current && (
                    <m.div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] rounded-full"
                      style={{ width: 22, height: 22, border: '2px solid #3B82F6', opacity: 0.5 }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                  )}
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ background: dotColor, border: `2px solid ${dotBorder}`, boxShadow: current ? '0 0 10px rgba(59,130,246,0.6)' : 'none' }}
                  />
                  <span className={`text-center mt-2 leading-tight max-w-[70px] break-words line-clamp-2 ${
                    passed ? 'text-[#4B5563] line-through' : current ? 'text-[#60A5FA] font-bold' : isDest ? 'text-[#EF4444] font-bold' : 'text-[#9CA3AF]'
                  }`} style={{ fontSize: 10 }}>{s.name}</span>
                  <span className="text-[8px] text-[#4B5563] font-bold mt-1">{s.arrival}</span>
                </div>
              );
            })}
          </div>

          {/* ── 3 Stat Cards ── */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: distance?.toFixed(1) ?? '—', unit: 'km', label: 'To destination' },
              { val: etaMins, unit: 'min', label: 'Est. arrival' },
              { val: effectiveSpeed, unit: 'km/h', label: 'Train speed' },
            ].map(({ val, unit, label }, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(28,37,55,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[#F9FAFB] font-bold text-lg tabular-nums leading-none">
                  {val}<span className="text-[10px] text-[#9CA3AF] ml-0.5 font-medium">{unit}</span>
                </div>
                <div className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-wide mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Next Stop Banner ── */}
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(30,64,175,0.4)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <TrainIcon size={20} className="text-[#3B82F6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black text-[#60A5FA] uppercase tracking-widest mb-0.5">Next Stop</div>
              <div className="text-[#F9FAFB] font-bold text-sm tracking-tight truncate">{nextStop?.name}</div>
              <div className="text-[#9CA3AF] text-xs">{nextStop?.arrival}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[#F9FAFB] font-bold text-sm tabular-nums">{nextStopDist?.toFixed(1) ?? '—'}</div>
              <div className="text-[10px] text-[#9CA3AF]">km away</div>
            </div>
          </div>

          {/* ── Progress Bar ── */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide truncate max-w-[40%]">{stops[0]?.name}</span>
              <span className="text-[10px] font-black text-[#9CA3AF]">{Math.round(progress)}%</span>
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide truncate max-w-[40%] text-right">{destName}</span>
            </div>
            <div className="h-2 w-full bg-[#1C2537] rounded-full overflow-hidden">
              <m.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3B82F6, #10B981)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* ── Cancel Button ── */}
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { stopAlarmSound(); navigate('/'); }}
            className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all"
            style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(153,27,27,0.5)', color: '#F87171' }}
          >
            Cancel Alarm
          </m.button>
        </div>
      </m.div>

      {/* ── ALARM OVERLAY ── */}
      <AnimatePresence>
        {showAlarm && (
          <m.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-[3000] flex flex-col items-center justify-center p-6 text-center"
            style={{ background: '#7F1D1D' }}
          >
            {/* Pulsing ring */}
            <div className="relative flex items-center justify-center mb-10 w-40 h-40">
              {[0, 1].map(i => (
                <m.div
                  key={i}
                  className="absolute rounded-full bg-red-500/30"
                  style={{ inset: i * -20 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
              <m.div
                animate={{ rotate: [0, -12, 12, -12, 12, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }}
                className="relative z-10"
              >
                <Bell size={64} className="text-white drop-shadow-lg" />
              </m.div>
            </div>

            <m.h1
              animate={{ opacity: [1, 0.75, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="text-[42px] font-black text-white tracking-tighter leading-none mb-3"
            >
              Wake Up!
            </m.h1>
            <p className="text-red-200 text-xl font-medium mb-8 opacity-90">Your stop is 2km away</p>

            {/* Destination chip */}
            <div className="bg-white px-6 py-2.5 rounded-full mb-12 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <span className="text-[#7F1D1D] font-black text-lg tracking-tight">{destName}</span>
            </div>

            {/* Dismiss */}
            <m.button
              whileTap={{ scale: 0.96 }}
              onClick={dismissAlarm}
              className="absolute bottom-10 left-6 right-6 h-16 bg-white text-[#7F1D1D] font-black text-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
              I'm Awake — Dismiss
            </m.button>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── DEV DEBUG PANEL ── */}
      {import.meta.env.DEV && (
        <div className="absolute top-4 right-4 z-[4000] p-2 rounded-xl text-[10px]"
          style={{ background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace', fontSize: 11 }}>
          <div>User: {userLoc?.lat?.toFixed(4)}, {userLoc?.lng?.toFixed(4)}</div>
          <div>Dest: {destLat?.toFixed(4)}, {destLng?.toFixed(4)}</div>
          <div>Distance: {distance?.toFixed(3)} km</div>
          <div>Stop: {stops[currentStopIdx]?.name}</div>
          <div>Alarm: {alarmFiredRef.current ? 'FIRED' : 'waiting'}</div>
        </div>
      )}
    </div>
  );
}
