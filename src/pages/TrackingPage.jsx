import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Navigation, Map as MapIcon, Settings as SettingsIcon, Bell, Train, Bus, Info, 
  ChevronUp, ChevronDown, Check, X, MapPinOff, LocateFixed, Activity, 
  Zap, Clock, ShieldCheck, Sliders, Gauge, ArrowRight, AlertTriangle, RefreshCw,
  Terminal, Download, Play, Pause
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
const RoutePolylines = ({ routeCoords, currentStationIdx }) => {
  if (!routeCoords || routeCoords.length < 2) return null;

  const idx = Math.max(0, Math.min(currentStationIdx ?? 0, routeCoords.length - 1));

  // Completed: from route start up to (and including) current station — DOTTED
  const completedPath = routeCoords.slice(0, idx + 1).map(s => [s.lat, s.lng]);
  // Remaining: from current station onward to destination — SOLID
  const remainingPath = routeCoords.slice(idx).map(s => [s.lat, s.lng]);

  const isValid = (p) => p.length >= 2 && p.every(c => Array.isArray(c) && typeof c[0] === 'number');

  return (
    <>
      {/* ── Completed segment: dashed grey (DOTTED) ── */}
      {isValid(completedPath) && (
        <Polyline
          positions={completedPath}
          pathOptions={{
            color: '#64748b',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 12',
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

// ─── AutoFollowController ───────────────────────────────────────────────────
// Auto-follows user position at zoom 15–17 with smooth animation
const AutoFollowController = ({ position, autoFollow, recenterKey }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  // Auto-follow on position changes
  useEffect(() => {
    if (!position || !autoFollow) return;
    const currentZoom = map.getZoom();
    const targetZoom = currentZoom < 15 ? 16 : Math.min(currentZoom, 17);
    map.flyTo(position, targetZoom, { animate: true, duration: 1.2 });
  }, [position, autoFollow, map]);

  // Recenter on button press
  useEffect(() => {
    if (recenterKey === 0) return;
    if (!position) return;
    map.flyTo(position, 16, { animate: true, duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  // Initial fit to route on first render
  useEffect(() => {
    if (hasInitialized.current || !position) return;
    map.setView(position, 14);
    hasInitialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  return null;
};

// ─── MapBoundsController ────────────────────────────────────────────────────
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
const MapObserver = ({ setMapZoom }) => {
  useMapEvents({
    zoomend: (e) => setMapZoom(e.target.getZoom())
  });
  return null;
};

// ─── AnimatedTrainMarker ────────────────────────────────────────────────────
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

// ─── Debug Status Badge ─────────────────────────────────────────────────────
const StatusBadge = ({ value, greenWhen, yellowWhen, label }) => {
  let color = 'bg-red-500/20 text-red-400 border-red-500/30';
  if (greenWhen) color = 'bg-green-500/20 text-green-400 border-green-500/30';
  else if (yellowWhen) color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md border ${color}`}>
      {value}
    </span>
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
  const [autoFollow, setAutoFollow] = useState(true);

  // ── Debug State ──
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const debugLog = useRef([]);
  const latestDataRef = useRef(null);
  const [mapZoom, setMapZoom] = useState(10);

  // ── Simulation slider state ──
  const [isSimSliderActive, setIsSimSliderActive] = useState(false);
  const [simSliderValue, setSimSliderValue] = useState(0);

  // ── Location hook ──
  const { 
    location, inaccuracy, speed, error: locationError, isSimulator, simulationProgress,
    batterySaver, setBatterySaver, 
    startTracking, stopTracking, startJourneySimulation,
    initSimulationRoute, setSimulationSlider
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
  const apiResponseTimeRef = useRef(null);

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

  // ── Origin stop ──
  const originStop = useMemo(() => {
    if (allRouteStops && allRouteStops.length > 0) return allRouteStops[0];
    return null;
  }, [allRouteStops]);

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE COORDS: clipped between ORIGIN and DESTINATION (inclusive)
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
  // CORE TRACKING ENGINE
  // Uses: Remaining Distance / Average Speed for ETA
  // ─────────────────────────────────────────────────────────────────────────
  const runTrackingEngine = useCallback(() => {
    const loc = location;
    if (!loc || !allRouteStops || !destinationStop) return;

    const apiStart = performance.now();

    // Update context location
    if (!prevLocRef.current || prevLocRef.current.lat !== loc.lat || prevLocRef.current.lng !== loc.lng) {
      setUserLocation(loc);
      prevLocRef.current = loc;
    }

    const stations = allRouteStops;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // ── Timetable-based current station index ──
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

    // ── Destination index ──
    const destName = destinationStop.station || destinationStop.stopName;
    const destStation = stations.find(s => (s.station || s.stopName) === destName) ?? stations[stations.length - 1];

    // ── Distance ──
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

    // ── Progress ──
    const destIdx = stations.findIndex(s => (s.station || s.stopName) === destName);
    const validDest = destIdx > 0 ? destIdx : stations.length - 1;
    const rawProgress = (stIdx / validDest) * 100;
    setProgress(Math.min(rawProgress, 99));

    // ── ETA: Remaining Distance / Average Speed ──
    // Average Speed = Total Route Distance / Total Route Time
    const firstDep = parseMins(stations[0].departure || stations[0].arrival);
    const lastArr = parseMins(destStation.arrival ?? destStation.departure);
    let avgSpeedKmh = travelMode === 'train' ? 65 : 45; // fallback

    if (firstDep !== null && lastArr !== null) {
      let totalMins = lastArr - firstDep;
      if (totalMins <= 0) totalMins += 1440; // overnight crossing
      const totalKm = typeof destStation.km === 'number' && typeof stations[0].km === 'number'
        ? destStation.km - stations[0].km
        : 0;
      if (totalKm > 0 && totalMins > 0) {
        avgSpeedKmh = (totalKm / totalMins) * 60;
      }
    }

    // Use GPS speed if available and moving
    const gpsSpeedKmh = (speed && speed > 1) ? speed * 3.6 : null;
    const effectiveSpeed = gpsSpeedKmh || avgSpeedKmh;
    
    const finalETA = effectiveSpeed > 0 ? Math.round(remKm / effectiveSpeed * 60) : 0;
    setEstimatedTime(finalETA);

    // ── Alarm trigger ──
    const distToFinal = CALCULATE_DISTANCE(loc.lat, loc.lng, destStation.lat, destStation.lng ?? destStation.lon);
    if (distToFinal <= settings.distanceThreshold) {
      setIsAlarmActive(true);
      setActiveStop(destinationStop);
      navigate('/alarm');
    }
    lastDistanceRef.current = distToFinal;

    // API response time tracking
    apiResponseTimeRef.current = Math.round(performance.now() - apiStart);

  }, [location, allRouteStops, destinationStop, settings, navigate, setIsAlarmActive,
      setUserLocation, setRemainingDistance, travelMode, setActiveStop, speed]);

  // ── Lifecycle: start tracking + 5s refresh ──
  useEffect(() => {
    setMounted(true);
    startTracking();

    // 5-second refresh tick for ETA updates
    intervalRef.current = setInterval(() => {
      setLastRefresh(Date.now());
    }, 5000);

    return () => {
      stopTracking?.();
      clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Run engine on location change or 5s tick ──
  useEffect(() => {
    runTrackingEngine();
  }, [location, lastRefresh, runTrackingEngine]);

  // ── Within routeCoords, find the index of currentStation ──
  const routeCurrentIdx = useMemo(() => {
    if (!routeCoords || !allRouteStops) return 0;
    const currentStationName = allRouteStops[currentStationIdx]?.station ?? allRouteStops[currentStationIdx]?.stopName;
    if (!currentStationName) return 0;
    const idx = routeCoords.findIndex(s => (s.station ?? s.stopName) === currentStationName);
    return idx >= 0 ? idx : 0;
  }, [routeCoords, currentStationIdx, allRouteStops]);

  // ── Train marker position ──
  const trainMarkerPos = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const s = routeCoords[routeCurrentIdx];
    return s ? [s.lat, s.lng] : null;
  }, [routeCoords, routeCurrentIdx]);

  // ── GPS user marker position for auto-follow ──
  const userMarkerPos = useMemo(() => {
    if (!location) return null;
    return [location.lat, location.lng];
  }, [location]);

  // ── Destination marker position ──
  const destMarkerPos = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const last = routeCoords[routeCoords.length - 1];
    return last ? [last.lat, last.lng] : null;
  }, [routeCoords]);

  // ── Derived display data ──
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

  // ── Debug mode logic ──
  const _etaTrack = useRef({ val: null, time: Date.now() });
  const _gpsTrack = useRef({ lat: null, lng: null, time: Date.now() });

  useEffect(() => {
    if (_etaTrack.current.val !== estimatedTime) {
      _etaTrack.current = { val: estimatedTime, time: Date.now() };
    }
    const etaStale = estimatedTime !== null && (Date.now() - _etaTrack.current.time > 60000 * 3);

    if (_gpsTrack.current.lat !== location?.lat || _gpsTrack.current.lng !== location?.lng) {
      _gpsTrack.current = { lat: location?.lat, lng: location?.lng, time: Date.now() };
    }
    const gpsStale = location?.lat ? (Date.now() - _gpsTrack.current.time > 15000) : true;

    const gpsSpeedKmh = speed ? Math.round(speed * 3.6) : 0;

    latestDataRef.current = {
      timestamp: new Date().toISOString(),
      gps: {
        permission: locationError ? 'DENIED' : 'GRANTED',
        lat: location?.lat?.toFixed(5) ?? '--',
        lng: location?.lng?.toFixed(5) ?? '--',
        accuracy: inaccuracy ? Math.round(inaccuracy) : '--',
        lastUpdate: new Date(_gpsTrack.current.time).toLocaleTimeString(),
        interval: '5s',
        stale: gpsStale
      },
      tracking: {
        active: mounted ? 'Yes' : 'No',
        mode: travelMode || 'unknown',
        speed: gpsSpeedKmh,
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
        followActive: autoFollow ? 'Yes' : 'No', 
        markerVisible: !!trainMarkerPos ? 'Yes' : 'No',
        routeVisible: (routeCoords && routeCoords.length > 0) ? 'Yes' : 'No',
        dottedVisible: (routeCoords && currentStationIdx > 0) ? 'Yes' : 'No'
      },
      alarm: {
        distanceToDest: lastDistanceRef.current ? lastDistanceRef.current.toFixed(2) : '--',
        alertRadius: settings.distanceThreshold ?? 2,
        status: 'Standby'
      },
      performance: {
        apiResponseMs: apiResponseTimeRef.current ?? '--',
        gpsUpdateInterval: '5s',
        mapSmooth: mapZoom >= 10 ? 'OK' : 'Low'
      }
    };
  }, [location, remainingDistance, estimatedTime, progress, settings, currentStationIdx, allRouteStops, stopsRemaining, travelMode, trainMarkerPos, mapZoom, locationError, mounted, routeCoords, autoFollow, speed, inaccuracy]);

  useEffect(() => {
    if (!isDebugActive) return;
    const tick = () => {
      if (latestDataRef.current) {
        setDebugData({ ...latestDataRef.current });
        debugLog.current.push({ ...latestDataRef.current });
      }
    };
    tick();
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

  // ── Simulation slider handler ──
  const handleSimSlider = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setSimSliderValue(val);
    
    // Initialize route if not yet done
    if (!isSimulator && routeCoords && routeCoords.length >= 2) {
      const start = routeCoords[0];
      const end = routeCoords[routeCoords.length - 1];
      initSimulationRoute(start.lat, start.lng, end.lat, end.lng);
    }
    setSimulationSlider(val);
  }, [isSimulator, routeCoords, initSimulationRoute, setSimulationSlider]);

  // ── Loading guard ──
  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan animate-pulse mb-8 shadow-2xl shadow-cyan-900/40">
          <Activity size={40} />
        </div>
        <h1 className="text-3xl font-light text-gradient tracking-tighter mb-4 leading-none">Establishing Satellite Lock</h1>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Preparing Route Visualization... v3.1</p>
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

          {/* Auto-follow user GPS position */}
          <AutoFollowController 
            position={userMarkerPos} 
            autoFollow={autoFollow} 
            recenterKey={recenterKey}
          />

          {/* Fit bounds to the clipped route (initial only) */}
          <MapBoundsController routeCoords={routeCoords} recenterKey={0} />

          {/* Completed (dotted) + remaining (solid) route polylines */}
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

      {/* ══════════ MAP CONTROLS (RIGHT SIDE) ══════════ */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-3">
        {/* Recenter */}
        <button
          onClick={() => setRecenterKey(k => k + 1)}
          className="w-12 h-12 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-brand-cyan shadow-xl hover:bg-slate-800/90 transition-all"
          title="Recenter map"
        >
          <LocateFixed size={20} />
        </button>

        {/* Auto-follow toggle */}
        <button
          onClick={() => setAutoFollow(!autoFollow)}
          className={`w-12 h-12 bg-slate-900/90 backdrop-blur-md border rounded-2xl flex items-center justify-center shadow-xl transition-all ${autoFollow ? 'border-brand-cyan/50 text-brand-cyan' : 'border-white/10 text-slate-500'}`}
          title={autoFollow ? 'Auto-follow ON' : 'Auto-follow OFF'}
        >
          <Navigation size={18} className={autoFollow ? 'fill-current' : ''} />
        </button>

        {/* Debug toggle */}
        <button
          onClick={() => setIsDebugActive(!isDebugActive)}
          className={`w-12 h-12 bg-slate-900/90 backdrop-blur-md border rounded-2xl flex items-center justify-center shadow-xl transition-all ${isDebugActive ? 'border-amber-500/50 text-amber-400' : 'border-white/10 text-slate-400'}`}
          title="Toggle Debug Mode"
        >
          <Terminal size={18} />
        </button>

        {/* Simulation toggle */}
        <button
          onClick={() => setIsSimSliderActive(!isSimSliderActive)}
          className={`w-12 h-12 bg-slate-900/90 backdrop-blur-md border rounded-2xl flex items-center justify-center shadow-xl transition-all ${isSimSliderActive ? 'border-violet-500/50 text-violet-400' : 'border-white/10 text-slate-400'}`}
          title="Simulation Mode"
        >
          <Sliders size={18} />
        </button>
      </div>

      {/* ══════════ SIMULATION SLIDER ══════════ */}
      <AnimatePresence>
        {isSimSliderActive && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[280px] left-5 right-20 z-20"
          >
            <div className="glass-darker p-4 rounded-2xl border border-violet-500/30 shadow-2xl bg-black/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Play size={12} className="text-violet-400" />
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Simulation Mode</span>
                </div>
                <span className="text-[10px] font-mono text-white">{Math.round(simSliderValue)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={simSliderValue}
                onChange={handleSimSlider}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 ${simSliderValue}%, #1e293b ${simSliderValue}%)`,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-600 font-bold">🚉 Start</span>
                <span className="text-[9px] text-slate-600 font-bold">🎯 Destination</span>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ══════════ DEBUG PANEL ══════════ */}
      <AnimatePresence>
        {isDebugActive && (
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-5 top-[12%] z-[25] w-64 glass-darker p-4 rounded-3xl border border-amber-500/30 shadow-2xl bg-black/80 max-h-[70vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Terminal size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Debug Mode</span>
              </div>
              <button onClick={() => setIsDebugActive(false)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {debugData ? (
              <div className="space-y-3 overflow-y-auto pr-1 pb-1 flex-1" style={{ scrollbarWidth: 'thin' }}>
                
                {/* Error/Warning Banners */}
                {debugData.gps.stale && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2 text-[9px] font-black uppercase tracking-widest rounded-xl text-center">
                    ⚠️ GPS not updating!
                  </div>
                )}
                {debugData.tracking.etaStale && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 text-[9px] font-black uppercase tracking-widest rounded-xl text-center">
                    ❌ ETA not changing!
                  </div>
                )}

                {/* GPS Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">📡 GPS</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">Permission:</span> 
                      <StatusBadge value={debugData.gps.permission} greenWhen={debugData.gps.permission === 'GRANTED'} />
                    </div>
                    <div><span className="text-slate-500">Lat:</span> <span className="text-white font-mono">{debugData.gps.lat}</span></div>
                    <div><span className="text-slate-500">Lng:</span> <span className="text-white font-mono">{debugData.gps.lng}</span></div>
                    <div>
                      <span className="text-slate-500">Accuracy:</span>{' '}
                      <StatusBadge 
                        value={`${debugData.gps.accuracy}m`} 
                        greenWhen={debugData.gps.accuracy !== '--' && debugData.gps.accuracy <= 20} 
                        yellowWhen={debugData.gps.accuracy !== '--' && debugData.gps.accuracy <= 50} 
                      />
                    </div>
                    <div><span className="text-slate-500">Interval:</span> <span className="text-blue-400 font-mono">{debugData.gps.interval}</span></div>
                  </div>
                </div>

                {/* Tracking Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">🚂 Tracking</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="flex justify-between col-span-2">
                      <span className="text-slate-500">Active:</span> 
                      <StatusBadge value={debugData.tracking.active} greenWhen={debugData.tracking.active === 'Yes'} />
                    </div>
                    <div><span className="text-slate-500">Mode:</span> <span className="text-white font-mono uppercase">{debugData.tracking.mode}</span></div>
                    <div>
                      <span className="text-slate-500">Speed:</span>{' '}
                      <StatusBadge 
                        value={`${debugData.tracking.speed} km/h`} 
                        greenWhen={debugData.tracking.speed > 0} 
                        yellowWhen={debugData.tracking.speed === 0} 
                      />
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">Distance:</span>
                      <span className="text-white font-mono">{debugData.tracking.distance} km</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-slate-500">ETA:</span> 
                      <StatusBadge 
                        value={`${debugData.tracking.eta} mins`} 
                        greenWhen={!debugData.tracking.etaStale && debugData.tracking.eta !== '--'} 
                        yellowWhen={debugData.tracking.etaStale} 
                      />
                    </div>
                  </div>
                </div>

                {/* Route Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-violet-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">🗺️ Route</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Total:</span> <span className="text-white font-mono">{debugData.route.totalStops}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Done:</span> <StatusBadge value={debugData.route.completed} greenWhen={debugData.route.completed > 0} /></div>
                    <div className="flex justify-between"><span className="text-slate-500">Left:</span> <StatusBadge value={debugData.route.remaining} yellowWhen={debugData.route.remaining > 0} greenWhen={debugData.route.remaining === 0} /></div>
                    <div className="flex justify-between"><span className="text-slate-500">Progress:</span> <span className="text-white font-mono">{debugData.route.progressPercent}%</span></div>
                  </div>
                </div>

                {/* Map Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">🗺️ Map</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Marker:</span> <StatusBadge value={debugData.map.markerVisible} greenWhen={debugData.map.markerVisible === 'Yes'} /></div>
                    <div className="flex justify-between"><span className="text-slate-500">Route:</span> <StatusBadge value={debugData.map.routeVisible} greenWhen={debugData.map.routeVisible === 'Yes'} /></div>
                    <div className="flex justify-between"><span className="text-slate-500">Auto-Follow:</span> <StatusBadge value={debugData.map.followActive} greenWhen={debugData.map.followActive === 'Yes'} /></div>
                    <div className="flex justify-between"><span className="text-slate-500">Zoom:</span> <span className="text-white font-mono">{debugData.map.zoom}</span></div>
                  </div>
                </div>

                {/* Alarm Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">🔔 Alarm</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-slate-500">Dist to Dest:</span> <span className="text-white font-mono">{debugData.alarm.distanceToDest} km</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Radius:</span> <span className="text-white font-mono">{debugData.alarm.alertRadius} km</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status:</span> <StatusBadge value={debugData.alarm.status} yellowWhen={debugData.alarm.status === 'Standby'} greenWhen={debugData.alarm.status === 'TRIGGERED'} /></div>
                  </div>
                </div>

                {/* Performance Section */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2">⚡ Performance</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">API Response:</span> 
                      <StatusBadge 
                        value={`${debugData.performance.apiResponseMs}ms`} 
                        greenWhen={debugData.performance.apiResponseMs !== '--' && debugData.performance.apiResponseMs < 2000} 
                        yellowWhen={debugData.performance.apiResponseMs !== '--' && debugData.performance.apiResponseMs < 5000} 
                      />
                    </div>
                    <div className="flex justify-between"><span className="text-slate-500">GPS Interval:</span> <span className="text-green-400 font-mono">{debugData.performance.gpsUpdateInterval}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Map Render:</span> <StatusBadge value={debugData.performance.mapSmooth} greenWhen={debugData.performance.mapSmooth === 'OK'} /></div>
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
              className="mt-3 w-full py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center space-x-2 hover:bg-amber-500/20 active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/20 flex-shrink-0"
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

                  {/* Station timeline */}
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-slate-600 ring-4 ring-slate-950" />
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Origin</p>
                      <p className="text-sm font-light text-white">{originStop?.station ?? originStop?.stopName ?? '--'}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-brand-cyan shadow-lg shadow-cyan-950 ring-4 ring-slate-950" />
                      <p className="text-[8px] font-black text-brand-cyan uppercase tracking-widest">🚂 Now At</p>
                      <p className="text-sm font-semibold text-white">{currentStopName}</p>
                      <p className="text-[9px] text-slate-600">{stopsRemaining} stop{stopsRemaining !== 1 ? 's' : ''} to destination</p>
                    </div>
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
