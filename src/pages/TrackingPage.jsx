import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Navigation, Map as MapIcon, Settings as SettingsIcon, Bell, Train, Bus, Info, 
  ChevronUp, ChevronDown, Check, X, MapPinOff, LocateFixed, Activity, 
  Zap, Clock, ShieldCheck, Sliders, Gauge, ArrowRight, AlertTriangle, RefreshCw,
  Terminal, Download
} from 'lucide-react';
import { AlarmContext } from '../App';
import { CALCULATE_DISTANCE, ESTIMATE_TIME } from '../constants';
import { useLocation } from '../hooks/useLocation';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ─── Fix for leaflet default markers ───────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Custom SVG Train Marker ────────────────────────────────────────────────
const createTrainIcon = () => L.divIcon({
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `
    <div style="
      width:44px;height:44px;
      background:linear-gradient(135deg,#3b82f6,#6366f1);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 3px rgba(59,130,246,0.35),0 4px 18px rgba(59,130,246,0.5);
      border:2.5px solid #fff;
    ">
      <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>
        <rect x='4' y='4' width='16' height='12' rx='3'/>
        <path d='M4 12h16'/>
        <path d='M8 20l-2 2'/>
        <path d='M16 20l2 2'/>
        <path d='M8 9h.01'/><path d='M16 9h.01'/>
      </svg>
    </div>
  `,
});

// ─── Destination Pin Icon ──────────────────────────────────────────────────
const createDestIcon = () => L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  html: `
    <div style="
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
    ">
      <svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>
        <ellipse cx='18' cy='33' rx='6' ry='2' fill='rgba(0,0,0,0.2)'/>
        <path d='M18 2 C10.3 2 4 8.3 4 16 C4 26 18 34 18 34 C18 34 32 26 32 16 C32 8.3 25.7 2 18 2Z' fill='#10b981'/>
        <circle cx='18' cy='16' r='5' fill='white'/>
      </svg>
    </div>
  `,
});

// ─── Helpers ───────────────────────────────────────────────────────────────
const isValidCoord = (loc) =>
  loc && typeof loc.lat === 'number' && typeof (loc.lng ?? loc.lon) === 'number';

const parseMins = (timeStr) => {
  if (!timeStr || timeStr === '--' || timeStr === 'START' || timeStr === 'END') return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// ─── RoutePolylines ─────────────────────────────────────────────────────────
// Draws the completed (dashed grey) + remaining (solid blue) segments
// Only between the customer's start station and destination station.
const RoutePolylines = ({ routeCoords, currentStationIdx }) => {
  if (!routeCoords || routeCoords.length < 2) return null;

  const idx = Math.max(0, Math.min(currentStationIdx ?? 0, routeCoords.length - 1));

  // Completed: from route start up to (and including) current station
  const completedPath = routeCoords.slice(0, idx + 1).map(s => [s.lat, s.lng]);
  // Remaining: from current station onward to destination
  const remainingPath = routeCoords.slice(idx).map(s => [s.lat, s.lng]);

  const isValid = (p) => p.length >= 2 && p.every(c => Array.isArray(c) && typeof c[0] === 'number');

  return (
    <>
      {/* ── Completed segment: dashed grey ── */}
      {isValid(completedPath) && (
        <Polyline
          positions={completedPath}
          pathOptions={{
            color: '#64748b',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 8',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
      {/* ── Remaining segment: solid blue ── */}
      {isValid(remainingPath) && (
        <Polyline
          positions={remainingPath}
          pathOptions={{
            color: '#3b82f6',
            weight: 5,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </>
  );
};

// ─── MapBoundsController ────────────────────────────────────────────────────
// On first render: fitBounds to the entire clipped route segment.
// On subsequent ticks: only re-pan if user explicitly requests recenter.
const MapBoundsController = ({ routeCoords, recenterKey }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!routeCoords || routeCoords.length < 1) return;
    const latLngs = routeCoords.map(s => [s.lat, s.lng]);
    if (latLngs.length === 1) {
      map.flyTo(latLngs[0], 13, { animate: true, duration: 1.2 });
    } else {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
    }
    hasInitialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  // Initial load fit
  useEffect(() => {
    if (hasInitialized.current || !routeCoords || routeCoords.length < 1) return;
    const latLngs = routeCoords.map(s => [s.lat, s.lng]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    } else {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], animate: false });
    }
    hasInitialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCoords]);

  return null;
};

// ─── MapObserver ────────────────────────────────────────────────────────────
// Passively tracks internal Leaflet states useful for debug panels without re-rendering root excessively
const MapObserver = ({ setMapZoom }) => {
  useMapEvents({
    zoomend: (e) => setMapZoom(e.target.getZoom())
  });
  return null;
};

// ─── AnimatedTrainMarker ────────────────────────────────────────────────────
// Moves smoothly between positions using requestAnimationFrame interpolation
const AnimatedTrainMarker = ({ position }) => {
  const markerRef = useRef(null);
  const prevPosRef = useRef(null);
  const rafRef = useRef(null);
  const [icon] = useState(() => createTrainIcon());

  useEffect(() => {
    if (!position || !markerRef.current) return;
    const target = L.latLng(position[0], position[1]);

    if (!prevPosRef.current) {
      markerRef.current.setLatLng(target);
      prevPosRef.current = target;
      return;
    }

    const start = prevPosRef.current;
    const startTime = performance.now();
    const DURATION = 1800; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // easeInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const lat = start.lat + (target.lat - start.lat) * ease;
      const lng = start.lng + (target.lng - start.lng) * ease;
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = target;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [position]);

  if (!position) return null;
  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
    >
      <Popup>🚂 Train is here</Popup>
    </Marker>
  );
};

// ─── TrackingPage ───────────────────────────────────────────────────────────
const TrackingPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [topMinimized, setTopMinimized] = useState(true);
  const [bottomMinimized, setBottomMinimized] = useState(true);
  const [recenterKey, setRecenterKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isMissedStop, setIsMissedStop] = useState(false);

  // ── Debug State ──
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const debugLog = useRef([]);
  const latestDataRef = useRef(null);
  const [mapZoom, setMapZoom] = useState(10);

  // ── Location hook ──
  const { 
    location, inaccuracy, error: locationError, isSimulator, 
    batterySaver, setBatterySaver, 
    startTracking, stopTracking, startJourneySimulation 
  } = useLocation();

  // ── Context ──
  const { 
    userLocation, setUserLocation, 
    selectedStops, settings, 
    setIsAlarmActive, setActiveStop,
    remainingDistance, setRemainingDistance,
    travelMode, selectedTrain, selectedBusRoute,
    t 
  } = useContext(AlarmContext);

  // ── Route state ──
  const [currentStationIdx, setCurrentStationIdx] = useState(0);
  const [nextStop, setNextStop] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [progress, setProgress] = useState(0);

  // ── Refs ──
  const lastDistanceRef = useRef(null);
  const prevLocRef = useRef(null);
  const prevDistRef = useRef(null);
  const intervalRef = useRef(null);

  // ── All stops for the selected route ──
  const allRouteStops = useMemo(() =>
    travelMode === 'train' ? selectedTrain?.stops : selectedBusRoute?.stops,
    [travelMode, selectedTrain, selectedBusRoute]
  );

  // ── Destination (from user selection) ──
  const destinationStop = useMemo(() => {
    if (selectedStops.length > 0) return selectedStops[selectedStops.length - 1];
    if (allRouteStops) return allRouteStops[allRouteStops.length - 1];
    return null;
  }, [selectedStops, allRouteStops]);

  // ── Origin stop (first in train's full stop list, OR first selected stop) ──
  const originStop = useMemo(() => {
    if (allRouteStops && allRouteStops.length > 0) return allRouteStops[0];
    return null;
  }, [allRouteStops]);

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE COORDS: clipped between ORIGIN and DESTINATION (inclusive)
  // This is what we visualize on the map — only the relevant segment.
  // ─────────────────────────────────────────────────────────────────────────
  const routeCoords = useMemo(() => {
    if (!allRouteStops || allRouteStops.length < 2 || !destinationStop) return null;

    const destName = destinationStop.station || destinationStop.stopName;
    const destIdx = allRouteStops.findIndex(s => (s.station || s.stopName) === destName);
    if (destIdx < 0) return null;

    // Start from index 0 (origin) to destIdx (inclusive)
    return allRouteStops.slice(0, destIdx + 1).filter(s =>
      typeof s.lat === 'number' && typeof (s.lng ?? s.lon) === 'number'
    ).map(s => ({ ...s, lng: s.lng ?? s.lon }));
  }, [allRouteStops, destinationStop]);

  // ─────────────────────────────────────────────────────────────────────────
  // CORE TRACKING ENGINE — called on location update or 30s tick
  // ─────────────────────────────────────────────────────────────────────────
  const runTrackingEngine = useCallback(() => {
    const loc = location;
    if (!loc || !allRouteStops || !destinationStop) return;

    // Update context location
    if (!prevLocRef.current || prevLocRef.current.lat !== loc.lat || prevLocRef.current.lng !== loc.lng) {
      setUserLocation(loc);
      prevLocRef.current = loc;
    }

    const stations = allRouteStops;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // ── Timetable-based current station index ──────────────────────────────
    // Walk the timetable; find the last station whose scheduled departure is ≤ now
    let stIdx = 0;
    for (let i = 0; i < stations.length; i++) {
      const dep = parseMins(stations[i].departure || stations[i].arrival);
      const arr = parseMins(stations[i].arrival);
      const refTime = dep ?? arr;
      if (refTime !== null) {
        if (nowMins >= refTime) {
          stIdx = i;
        } else {
          break;
        }
      }
    }

    setCurrentStationIdx(stIdx);
    setNextStop(stations[stIdx]);

    // ── Destination index (within full stop list) ──────────────────────────
    const destName = destinationStop.station || destinationStop.stopName;
    const destStation = stations.find(s => (s.station || s.stopName) === destName) ?? stations[stations.length - 1];

    // ── Distance ──────────────────────────────────────────────────────────
    let remKm = 0;
    if (typeof destStation.km === 'number' && typeof stations[stIdx].km === 'number') {
      remKm = Math.max(0, destStation.km - stations[stIdx].km);
    } else {
      const d = CALCULATE_DISTANCE(loc.lat, loc.lng, destStation.lat, destStation.lng ?? destStation.lon);
      remKm = d * (travelMode === 'train' ? 1.25 : 1.15);
    }

    if (prevDistRef.current !== remKm.toFixed(0)) {
      setRemainingDistance(remKm.toFixed(0));
      prevDistRef.current = remKm.toFixed(0);
    }

    // ── Progress ──────────────────────────────────────────────────────────
    const destIdx = stations.findIndex(s => (s.station || s.stopName) === destName);
    const validDest = destIdx > 0 ? destIdx : stations.length - 1;
    const rawProgress = (stIdx / validDest) * 100;
    setProgress(Math.min(rawProgress, 99));

    // ── ETA ───────────────────────────────────────────────────────────────
    const destArrival = parseMins(destStation.arrival ?? destStation.departure);
    let finalETA = 0;
    if (destArrival !== null) {
      let diff = destArrival - nowMins;
      if (diff < 0) diff += 1440;
      finalETA = diff;
    } else {
      const speed = travelMode === 'train' ? 65 : 45;
      finalETA = Math.round(remKm / speed * 60);
    }
    setEstimatedTime(finalETA);

    // ── Alarm trigger ─────────────────────────────────────────────────────
    const distToFinal = CALCULATE_DISTANCE(loc.lat, loc.lng, destStation.lat, destStation.lng ?? destStation.lon);
    if (distToFinal <= settings.distanceThreshold) {
      setIsAlarmActive(true);
      setActiveStop(destinationStop);
      navigate('/alarm');
    }
    lastDistanceRef.current = distToFinal;

  }, [location, allRouteStops, destinationStop, settings, navigate, setIsAlarmActive,
      setUserLocation, setRemainingDistance, travelMode, setActiveStop]);

  // ── Lifecycle: start tracking + 30s refresh ─────────────────────────────
  useEffect(() => {
    setMounted(true);
    startTracking();

    // 30-second refresh tick
    intervalRef.current = setInterval(() => {
      setLastRefresh(Date.now());
    }, 30000);

    return () => {
      stopTracking?.();
      clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Run engine on location change or 30s tick ──────────────────────────
  useEffect(() => {
    runTrackingEngine();
  }, [location, lastRefresh, runTrackingEngine]);

  // ── Within routeCoords, find the index of currentStation ─────────────────
  const routeCurrentIdx = useMemo(() => {
    if (!routeCoords || !allRouteStops) return 0;
    const currentStationName = allRouteStops[currentStationIdx]?.station ?? allRouteStops[currentStationIdx]?.stopName;
    if (!currentStationName) return 0;
    const idx = routeCoords.findIndex(s => (s.station ?? s.stopName) === currentStationName);
    return idx >= 0 ? idx : 0;
  }, [routeCoords, currentStationIdx, allRouteStops]);

  // ── Train marker position = current station in route ─────────────────────
  const trainMarkerPos = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const s = routeCoords[routeCurrentIdx];
    return s ? [s.lat, s.lng] : null;
  }, [routeCoords, routeCurrentIdx]);

  // ── Destination marker position ───────────────────────────────────────────
  const destMarkerPos = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const last = routeCoords[routeCoords.length - 1];
    return last ? [last.lat, last.lng] : null;
  }, [routeCoords]);

  // ── Derived display data ─────────────────────────────────────────────────
  const currentStopName = useMemo(() => {
    if (!allRouteStops) return 'Tracking...';
    return allRouteStops[currentStationIdx]?.station ?? allRouteStops[currentStationIdx]?.stopName ?? 'Origin';
  }, [allRouteStops, currentStationIdx]);

  const destinationIdx = useMemo(() => {
    if (!allRouteStops || selectedStops.length === 0) return -1;
    const dest = selectedStops[0];
    return allRouteStops.findIndex(s => (s.station ?? s.stopName) === (dest.station ?? dest.stopName));
  }, [allRouteStops, selectedStops]);

  const stopsRemaining = Math.max(0, (destinationIdx > 0 ? destinationIdx : (allRouteStops?.length ?? 1) - 1) - currentStationIdx);

  const progressChars = (p) => {
    const filled = Math.floor(p / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  };

  const formatRemainingTime = (mins) => {
    if (mins === null || mins === undefined) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getETAClock = (mins) => {
    if (mins === null || mins === undefined) return '--:--';
    const etaDate = new Date(Date.now() + mins * 60000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const [destIcon] = useState(() => createDestIcon());

  // ── Debug mode logic ────────────────────────────────────────────────────────
  const _etaTrack = useRef({ val: null, time: Date.now() });
  const _gpsTrack = useRef({ lat: null, lng: null, time: Date.now() });

  useEffect(() => {
    if (_etaTrack.current.val !== estimatedTime) {
      _etaTrack.current = { val: estimatedTime, time: Date.now() };
    }
    const etaStale = estimatedTime !== null && (Date.now() - _etaTrack.current.time > 60000 * 3); // 3 mins motionless ETA considered error

    if (_gpsTrack.current.lat !== location?.lat || _gpsTrack.current.lng !== location?.lng) {
      _gpsTrack.current = { lat: location?.lat, lng: location?.lng, time: Date.now() };
    }
    const gpsStale = location?.lat ? (Date.now() - _gpsTrack.current.time > 15000) : true; // 15 sec no change

    latestDataRef.current = {
      timestamp: new Date().toISOString(),
      gps: {
        permission: locationError ? 'DENIED' : 'GRANTED',
        lat: location?.lat?.toFixed(5) ?? '--',
        lng: location?.lng?.toFixed(5) ?? '--',
        accuracy: location?.accuracy ? Math.round(location.accuracy) : '--',
        lastUpdate: new Date(_gpsTrack.current.time).toLocaleTimeString(),
        interval: '3s',
        stale: gpsStale
      },
      tracking: {
        active: mounted ? 'Yes' : 'No',
        mode: travelMode || 'unknown',
        speed: location?.speed ? Math.round(location.speed * 3.6) : 0,
        distance: remainingDistance ?? '--',
        eta: estimatedTime !== null ? estimatedTime : '--',
        etaStale
      },
      route: {
        totalStops: allRouteStops?.length ?? 0,
        completed: currentStationIdx ?? 0,
        remaining: stopsRemaining ?? 0,
        progressPercent: progress.toFixed(1)
      },
      map: {
        zoom: mapZoom ?? 10,
        followActive: 'Yes', 
        markerVisible: !!trainMarkerPos ? 'Yes' : 'No',
        routeVisible: (routeCoords && routeCoords.length > 0) ? 'Yes' : 'No',
        dottedVisible: (routeCoords && currentStationIdx > 0) ? 'Yes' : 'No'
      },
      alarm: {
        distanceToDest: lastDistanceRef.current ? lastDistanceRef.current.toFixed(2) : '--',
        alertRadius: settings.distanceThreshold ?? 2,
        status: 'Standby'
      }
    };
  }, [location, remainingDistance, estimatedTime, progress, settings, currentStationIdx, allRouteStops, stopsRemaining, travelMode, trainMarkerPos, mapZoom, locationError, mounted, routeCoords]);

  useEffect(() => {
    if (!isDebugActive) return;
    const tick = () => {
      if (latestDataRef.current) {
        setDebugData({ ...latestDataRef.current });
        debugLog.current.push({ ...latestDataRef.current });
      }
    };
    tick(); // run right away
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [isDebugActive]);

  const exportDebugLog = useCallback((e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(debugLog.current, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tracking_test_log.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, []);

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan animate-pulse mb-8 shadow-2xl shadow-cyan-900/40">
          <Activity size={40} />
        </div>
        <h1 className="text-3xl font-light text-gradient tracking-tighter mb-4 leading-none">Establishing Satellite Lock</h1>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Preparing Route Visualization... v3.0</p>
      </div>
    );
  }

  // Map center fallback
  const mapCenter = routeCoords && routeCoords.length > 0
    ? [routeCoords[Math.floor(routeCoords.length / 2)].lat, routeCoords[Math.floor(routeCoords.length / 2)].lng]
    : (isValidCoord(userLocation) ? [userLocation.lat, userLocation.lng] : [13.0827, 80.2707]);

  return (
    <div className="flex flex-col h-screen relative bg-slate-950 overflow-hidden">

      {/* ══════════ MAP ══════════ */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={mapCenter}
          zoom={10}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
          />

          <MapObserver setMapZoom={setMapZoom} />

          {/* Fit bounds to the clipped route; recenterKey triggers explicit recenter */}
          <MapBoundsController routeCoords={routeCoords} recenterKey={recenterKey} />

          {/* Completed + remaining route polylines */}
          <RoutePolylines routeCoords={routeCoords} currentStationIdx={routeCurrentIdx} />

          {/* Animated train marker at current station */}
          {trainMarkerPos && <AnimatedTrainMarker position={trainMarkerPos} />}

          {/* Destination marker */}
          {destMarkerPos && (
            <Marker position={destMarkerPos} icon={destIcon}>
              <Popup>🎯 Destination: {destinationStop?.station ?? destinationStop?.stopName}</Popup>
            </Marker>
          )}

          {/* GPS accuracy ring around user's real location */}
          {isValidCoord(userLocation) && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={180}
              pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.08, weight: 1, dashArray: '4,4' }}
            />
          )}
        </MapContainer>
      </div>

      {/* ══════════ RECENTER BUTTON ══════════ */}
      <button
        onClick={() => setRecenterKey(k => k + 1)}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-brand-cyan shadow-xl hover:bg-slate-800/90 transition-all"
        title="Recenter map"
      >
        <LocateFixed size={20} />
      </button>

      {/* ══════════ DEBUG TEST MODE BUTTON ══════════ */}
      <button
        onClick={() => setIsDebugActive(!isDebugActive)}
        className={`absolute right-5 top-[60%] -translate-y-1/2 z-20 px-3 h-10 bg-slate-900/90 backdrop-blur-md border ${isDebugActive ? 'border-amber-500/50 text-amber-400' : 'border-white/10 text-slate-400'} rounded-xl flex items-center space-x-2 shadow-xl hover:bg-slate-800/90 transition-all font-bold text-[10px] uppercase tracking-widest`}
      >
        <Terminal size={14} />
        <span className="hidden sm:inline">Tracking Test Mode</span>
        <span className="sm:hidden">Test Mode</span>
      </button>

      {/* ══════════ DEBUG PANEL ══════════ */}
      <AnimatePresence>
        {isDebugActive && (
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-5 top-[35%] z-[25] w-64 glass-darker p-4 rounded-3xl border border-amber-500/30 shadow-2xl bg-black/80"
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Terminal size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tracking Debug Mode</span>
              </div>
              <button onClick={() => setIsDebugActive(false)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {debugData ? (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 pb-1 custom-scrollbar">
                
                {/* Error/Warning Banners */}
                {debugData.gps.stale && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2 text-[9px] font-black uppercase tracking-widest rounded-xl text-center">
                    Warning: GPS not updating!
                  </div>
                )}
                {debugData.tracking.etaStale && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 text-[9px] font-black uppercase tracking-widest rounded-xl text-center">
                    Error: ETA not changing!
                  </div>
                )}

                {/* GPS Diagnostics */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">GPS Diagnostics</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">GPS Permission:</span> 
                      <span className={debugData.gps.permission === 'GRANTED' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{debugData.gps.permission}</span>
                    </div>
                    <div><span className="text-slate-500">Cur Lat:</span> <span className="text-white font-mono">{debugData.gps.lat}</span></div>
                    <div><span className="text-slate-500">Cur Lng:</span> <span className="text-white font-mono">{debugData.gps.lng}</span></div>
                    <div>
                      <span className="text-slate-500">Accuracy:</span>{' '}
                      <span className={`font-mono font-bold ${debugData.gps.accuracy === '--' ? 'text-slate-400' : debugData.gps.accuracy <= 20 ? 'text-green-400' : debugData.gps.accuracy <= 50 ? 'text-amber-400' : 'text-red-400'}`}>{debugData.gps.accuracy}m</span>
                    </div>
                    <div><span className="text-slate-500">Interval:</span> <span className="text-blue-400 font-mono">{debugData.gps.interval}</span></div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">Last Update:</span>
                      <span className="text-white font-mono">{debugData.gps.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                {/* Tracking Diagnostics */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">Tracking Diagnostics</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="flex justify-between col-span-2">
                      <span className="text-slate-500">Tracking Active:</span> 
                      <span className={debugData.tracking.active === 'Yes' ? 'text-green-400 font-bold' : 'text-slate-500'}>{debugData.tracking.active}</span>
                    </div>
                    <div><span className="text-slate-500">Mode:</span> <span className="text-white font-mono uppercase">{debugData.tracking.mode}</span></div>
                    <div>
                      <span className="text-slate-500">Speed:</span>{' '}
                      <span className={`font-mono font-bold ${debugData.tracking.speed > 0 ? 'text-green-400' : 'text-amber-400'}`}>{debugData.tracking.speed} km/h</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">Distance to Dest:</span>
                      <span className="text-white font-mono">{debugData.tracking.distance} km</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">ETA Remaining:</span> 
                      <span className={`font-mono ${debugData.tracking.etaStale ? 'text-red-400 font-bold' : 'text-white'}`}>{debugData.tracking.eta} mins</span>
                    </div>
                  </div>
                </div>

                {/* Route Diagnostics */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-violet-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">Route Diagnostics</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Total Stops:</span> <span className="text-white font-mono">{debugData.route.totalStops}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Completed:</span> <span className="text-green-400 font-mono font-bold">{debugData.route.completed}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Remaining:</span> <span className="text-amber-400 font-mono font-bold">{debugData.route.remaining}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Progress:</span> <span className="text-white font-mono">{debugData.route.progressPercent}%</span></div>
                  </div>
                </div>

                {/* Map Diagnostics */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">Map Diagnostics</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Marker Visible:</span> <span className={debugData.map.markerVisible === 'Yes' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{debugData.map.markerVisible}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Route Visible:</span> <span className={debugData.map.routeVisible === 'Yes' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{debugData.map.routeVisible}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Remaining Dotted:</span> <span className={debugData.map.dottedVisible === 'Yes' ? 'text-green-400 font-bold' : 'text-amber-400'}>{debugData.map.dottedVisible}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Map Follow User:</span> <span className={debugData.map.followActive === 'Yes' ? 'text-green-400 font-bold' : 'text-slate-400'}>{debugData.map.followActive}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Current Zoom:</span> <span className="text-white font-mono">{debugData.map.zoom}</span></div>
                  </div>
                </div>

                {/* Alarm Diagnostics */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">Alarm</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Distance to Dest:</span> <span className="text-white font-mono">{debugData.alarm.distanceToDest} km</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Alert Radius:</span> <span className="text-white font-mono">{debugData.alarm.alertRadius} km</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="text-amber-400 font-bold uppercase">{debugData.alarm.status}</span></div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Initializing Telemetry...</span>
              </div>
            )}

            <button
              onClick={exportDebugLog}
              className="mt-4 w-full py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center space-x-2 hover:bg-amber-500/20 active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/20"
            >
              <Download size={14} />
              <span>Export Debug Logs</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* ══════════ LAST REFRESH BADGE ══════════ */}
      <div className="absolute right-5 bottom-36 z-20 flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-full">
        <RefreshCw size={10} className="text-brand-cyan animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          {new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </div>

      {/* ══════════ TOP DASHBOARD OVERLAY ══════════ */}
      <div className="absolute top-0 left-0 right-0 z-10 p-5 pt-12">
        <m.div
          onClick={() => setTopMinimized(!topMinimized)}
          whileTap={{ scale: 0.98 }}
          className={`glass-darker p-5 rounded-[2.5rem] border ${locationError ? 'border-red-500/50 bg-red-950/20' : 'border-white/5'} shadow-2xl backdrop-blur-3xl cursor-pointer transition-all duration-500 overflow-hidden`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-2xl glass-interactive flex items-center justify-center ${locationError ? 'text-red-400' : 'text-brand-cyan'}`}>
                {locationError ? <AlertTriangle size={24} className="animate-pulse" /> : <Train size={24} />}
              </div>
              <div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Route Progress</h2>
                <p className="text-lg font-light text-gradient truncate max-w-[170px]">
                  {travelMode === 'train' ? selectedTrain?.trainName : travelMode === 'bus' ? selectedBusRoute?.routeName : 'Live Tracking'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Live blip */}
              <div className="flex items-center space-x-1.5 bg-green-900/30 border border-green-500/20 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">LIVE</span>
              </div>
              <div className="w-8 h-8 rounded-full glass-interactive flex items-center justify-center text-slate-400">
                {topMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!topMinimized && (
              <m.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="space-y-4"
              >
                {/* ── Route Timeline Card ── */}
                <div className="glass-interactive p-5 rounded-3xl border border-white/5 space-y-4 bg-black/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapIcon size={14} className="text-brand-cyan" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Route Overview</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{routeCoords?.length ?? 0} STOPS</span>
                  </div>

                  {/* Station timeline: Origin → Current → Destination */}
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                    {/* Origin */}
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-slate-600 ring-4 ring-slate-950" />
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Origin</p>
                      <p className="text-sm font-light text-white">{originStop?.station ?? originStop?.stopName ?? '--'}</p>
                    </div>

                    {/* Current station (train position) */}
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-brand-cyan shadow-lg shadow-cyan-950 ring-4 ring-slate-950" />
                      <p className="text-[8px] font-black text-brand-cyan uppercase tracking-widest">🚂 Now At</p>
                      <p className="text-sm font-semibold text-white">{currentStopName}</p>
                      <p className="text-[9px] text-slate-600">{stopsRemaining} stop{stopsRemaining !== 1 ? 's' : ''} to destination</p>
                    </div>

                    {/* Destination */}
                    <div className="relative">
                      <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full ${stopsRemaining === 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-700'} ring-4 ring-slate-950`} />
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Destination</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-black text-white">{destinationStop?.station ?? destinationStop?.stopName ?? 'Select stop'}</p>
                        <span className="text-[8px] font-bold text-brand-cyan bg-cyan-950/30 px-2 py-0.5 rounded-full border border-cyan-900/30">
                          STOP {(destinationIdx >= 0 ? destinationIdx : (allRouteStops?.length ?? 1) - 1) + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/5 w-full" />

                  <button
                    onClick={(e) => { e.stopPropagation(); setBatterySaver(!batterySaver); }}
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-2xl border transition-all ${batterySaver ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold' : 'bg-white/5 border-white/10 text-slate-400'}`}
                  >
                    <Zap size={14} className={batterySaver ? 'fill-current animate-pulse' : ''} />
                    <span className="text-[10px] uppercase tracking-[0.2em]">{batterySaver ? 'Battery Save Active' : 'High Performance Sync'}</span>
                  </button>
                </div>

                {/* ── Progress bar ── */}
                <div className="glass-interactive p-4 rounded-3xl border border-white/5 space-y-3 bg-black/20">
                  <div className="font-mono text-brand-cyan tracking-tighter text-sm flex justify-center items-center bg-black/60 py-3 rounded-2xl border border-white/5 shadow-inner">
                    <span className="mr-3 opacity-90">{progressChars(progress)}</span>
                    <span className="font-black">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Journey Progress</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-black">{progress.toFixed(0)}% COMPLETE</span>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>

      {/* ══════════ MISSED STOP OVERLAY ══════════ */}
      <AnimatePresence>
        {isMissedStop && (
          <m.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-red-600/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md"
          >
            <m.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <Bell size={80} className="text-white mb-6" />
            </m.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">⚠️ MISSED STOP!</h2>
            <p className="text-white/80 text-xl font-medium mb-8 leading-tight">
              You passed <span className="font-bold underline">{nextStop?.station ?? nextStop?.stopName}</span>!<br />
              Remaining Distance Increasing.
            </p>
            <button onClick={() => setIsMissedStop(false)} className="bg-white text-red-600 px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
              ACKNOWLEDGE
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* ══════════ BOTTOM TELEMETRY CARD ══════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-32">
        <m.div
          onClick={() => setBottomMinimized(!bottomMinimized)}
          whileTap={{ scale: 0.98 }}
          className="glass-darker p-6 rounded-[3rem] border border-white/5 cursor-pointer shadow-2xl backdrop-blur-3xl transition-all duration-500 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{bottomMinimized ? 'Distance Remaining' : 'Mission Telemetry'}</h3>
              <div className="flex items-end space-x-2">
                <span className={`${bottomMinimized ? 'text-3xl' : 'text-5xl'} font-light text-white tracking-tighter tabular-nums transition-all duration-500`}>{remainingDistance ?? '--'}</span>
                <span className="text-lg font-black text-brand-cyan mb-1 uppercase">KM</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full glass-interactive flex items-center justify-center text-brand-cyan shadow-lg shadow-cyan-950/40">
              {bottomMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <AnimatePresence>
            {!bottomMinimized && (
              <m.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ETA to Destination</h3>
                    <div className="flex flex-col">
                      <div className="flex items-end space-x-2">
                        <span className="text-4xl font-light text-white tracking-tighter tabular-nums">{formatRemainingTime(estimatedTime)}</span>
                        <span className="text-[10px] font-black text-brand-cyan mb-1.5 uppercase opacity-60">REMAINING</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock size={12} className="text-brand-cyan" />
                        <span className="text-xl font-bold text-white tracking-tight">ETA: {getETAClock(estimatedTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/5" />
                  <div className="text-right flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                      <Gauge size={24} />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full" />

                {/* Legend */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-1 rounded-full bg-slate-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#64748b 0,#64748b 5px,transparent 5px,transparent 9px)' }} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-1 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Remaining</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Safe-Sleep ON</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Alarm Active</p>
                      <p className="text-xs font-light text-white">Within {settings.distanceThreshold}km of destination</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startJourneySimulation(
                        userLocation?.lat ?? 13.0827,
                        userLocation?.lng ?? 80.2707,
                        nextStop?.lat,
                        nextStop?.lng ?? nextStop?.lon,
                        1.2
                      );
                    }}
                    className="bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-indigo transition-all"
                  >
                    Demo Sim
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </div>
  );
};

export default TrackingPage;
