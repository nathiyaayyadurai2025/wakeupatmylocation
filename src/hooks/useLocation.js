import { useState, useEffect, useRef, useCallback } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(null); // m/s from GPS
  const [isSimulator, setIsSimulator] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0); // 0–100 for slider
  const watchIdRef = useRef(null);
  const journeyIntervalRef = useRef(null);
  const simRouteRef = useRef(null); // stores {startLat, startLng, targetLat, targetLng}

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (journeyIntervalRef.current !== null) {
      clearInterval(journeyIntervalRef.current);
      journeyIntervalRef.current = null;
    }
  }, []);

  // Simulation: auto-play journey from start to target
  const startJourneySimulation = useCallback((startLat, startLng, targetLat, targetLng, durationMinutes = 2) => {
    stopTracking();
    setIsSimulator(true);
    setSimulationProgress(0);
    simRouteRef.current = { startLat, startLng, targetLat, targetLng };

    let elapsed = 0;
    const intervalTime = 2000; // Update every 2 seconds
    const totalSlots = (durationMinutes * 60 * 1000) / intervalTime;

    journeyIntervalRef.current = setInterval(() => {
      elapsed++;
      const progress = Math.min(elapsed / totalSlots, 1);
      setSimulationProgress(progress * 100);
      
      if (progress >= 1) {
        clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
      }
      const curLat = startLat + (targetLat - startLat) * progress;
      const curLng = startLng + (targetLng - startLng) * progress;
      setLocation({ lat: curLat, lng: curLng, accuracy: 5, speed: 20 }); // ~72km/h simulated
      setAccuracy(5);
      setSpeed(20);
      setError(null);
    }, intervalTime);
  }, [stopTracking]);

  // Simulation: manual slider (0–100) — moves position along the route
  const setSimulationSlider = useCallback((percent) => {
    if (!simRouteRef.current) return;
    const { startLat, startLng, targetLat, targetLng } = simRouteRef.current;
    const p = percent / 100;
    const curLat = startLat + (targetLat - startLat) * p;
    const curLng = startLng + (targetLng - startLng) * p;
    setSimulationProgress(percent);
    setLocation({ lat: curLat, lng: curLng, accuracy: 5, speed: 20 });
    setAccuracy(5);
    setSpeed(20);
    setError(null);
  }, []);

  // Initialize simulation route without auto-play
  const initSimulationRoute = useCallback((startLat, startLng, targetLat, targetLng) => {
    stopTracking();
    setIsSimulator(true);
    setSimulationProgress(0);
    simRouteRef.current = { startLat, startLng, targetLat, targetLng };
    // Set initial position at start
    setLocation({ lat: startLat, lng: startLng, accuracy: 5, speed: 0 });
    setAccuracy(5);
    setSpeed(0);
    setError(null);
  }, [stopTracking]);

  const [pollingInterval, setPollingInterval] = useState(5000); // Default 5s for performance
  const [batterySaver, setBatterySaver] = useState(false);

  const startTracking = useCallback((forcedInterval) => {
    const interval = forcedInterval || (batterySaver ? 15000 : 5000);
    setPollingInterval(interval);

    if (journeyIntervalRef.current !== null) {
      clearInterval(journeyIntervalRef.current);
      journeyIntervalRef.current = null;
    }
    setIsSimulator(false);
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const geolocationOptions = {
      enableHighAccuracy: !batterySaver,
      timeout: 30000,
      maximumAge: batterySaver ? 10000 : 0
    };

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed, // m/s or null
      });
      setAccuracy(position.coords.accuracy);
      setSpeed(position.coords.speed);
      setError(null);
    };

    const handleError = (err) => {
      console.warn(`Satellite Alert [ID: ${err.code}]: ${err.message}`);
      
      // DEEP RECOVERY: If persistent Failures, switch to Polling Pattern (More robust on macOS)
      if (err.code === 3 || err.code === 2) {
         setError("Signal Obstructed (Searching Satellite...)");
         
         if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
         }

         if (!journeyIntervalRef.current) {
            console.info("Forcing Heartbeat Polling for signal recovery...");
            const poll = () => {
              navigator.geolocation.getCurrentPosition(
                handleSuccess, 
                (retryErr) => console.log(`Polling Retry Failed: ${retryErr.message}`),
                { enableHighAccuracy: false, timeout: 15000 }
              );
            };
            poll();
            journeyIntervalRef.current = setInterval(poll, 10000);
         }
      } else if (err.code === 1) {
         setError("GPS Permission Denied. Check Settings.");
      } else {
         setError("Satellite Search Engine Active...");
      }
    };

    // Use watchPosition for real-time tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    );
  }, [batterySaver]);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return { 
    location, 
    error, 
    inaccuracy: accuracy,
    speed,
    isSimulator,
    simulationProgress,
    batterySaver,
    setBatterySaver,
    pollingInterval,
    setPollingInterval,
    startTracking, 
    stopTracking, 
    startJourneySimulation,
    initSimulationRoute,
    setSimulationSlider,
    setError 
  };
};
