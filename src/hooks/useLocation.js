import { useState, useEffect, useRef } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isSimulator, setIsSimulator] = useState(false);
  const watchIdRef = useRef(null);
  const journeyIntervalRef = useRef(null);

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (journeyIntervalRef.current !== null) {
      clearInterval(journeyIntervalRef.current);
      journeyIntervalRef.current = null;
    }
  };

  const startJourneySimulation = (startLat, startLng, targetLat, targetLng, durationMinutes = 2) => {
    stopTracking();
    setIsSimulator(true);
    let elapsed = 0;
    const intervalTime = 2000; // Update every 2 seconds
    const totalSlots = (durationMinutes * 60 * 1000) / intervalTime;

    journeyIntervalRef.current = setInterval(() => {
      elapsed++;
      const progress = elapsed / totalSlots;
      if (progress >= 1) {
        clearInterval(journeyIntervalRef.current);
      }
      const curLat = startLat + (targetLat - startLat) * progress;
      const curLng = startLng + (targetLng - startLng) * progress;
      setLocation({ lat: curLat, lng: curLng });
      setAccuracy(5);
      setError(null);
    }, intervalTime);
  };

  const [pollingInterval, setPollingInterval] = useState(10000); // Default 10s
  const [batterySaver, setBatterySaver] = useState(false);

  const startTracking = (forcedInterval) => {
    const interval = forcedInterval || (batterySaver ? 30000 : 10000);
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
      timeout: 30000, // Increased to 30s to permanently solve Timeout errors
      maximumAge: batterySaver ? 10000 : 0
    };

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setAccuracy(position.coords.accuracy);
      setError(null);
    };

    const handleError = (err) => {
      console.warn(`Satellite Alert [ID: ${err.code}]: ${err.message}`);
      
      // DEEP RECOVERY: If persistent Failures, switch to Polling Pattern (More robust on macOS)
      if (err.code === 3 || err.code === 2) {
         setError("Signal Obstructed (Searching Satellite...)");
         
         // Clear the current watch and switch to a 10s Poll Heartbeat
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
            journeyIntervalRef.current = setInterval(poll, 15000);
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
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  return { 
    location, 
    error, 
    inaccuracy: accuracy, 
    isSimulator,
    batterySaver,
    setBatterySaver,
    pollingInterval,
    setPollingInterval,
    startTracking, 
    stopTracking, 
    startJourneySimulation,
    setError 
  };
};
