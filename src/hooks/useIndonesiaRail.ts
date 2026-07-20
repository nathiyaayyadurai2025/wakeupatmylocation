import { useState, useEffect, useCallback, useMemo } from 'react';
import indonesiaRailService from '../services/IndonesiaRailService';
import { Station, TrainRoute, NearestStationResult } from '../types/railway';

export const useIndonesiaRail = (userLoc?: { lat: number; lng: number } | null) => {
  const [stationQuery, setStationQuery] = useState('');
  const [routeQuery, setRouteQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Initialize service datasets
  useEffect(() => {
    indonesiaRailService.loadData();
  }, []);

  // Filtered stations based on search query
  const stations = useMemo(() => {
    return indonesiaRailService.searchStations(stationQuery);
  }, [stationQuery]);

  // Routes filtered for selected station or general search
  const routesForSelectedStation = useMemo(() => {
    if (!selectedStation) {
      return indonesiaRailService.searchRoutes(routeQuery);
    }
    const filtered = indonesiaRailService.getRoutesForStation(selectedStation.stationCode || selectedStation.stationName);
    if (!routeQuery.trim()) return filtered;

    const q = routeQuery.trim().toLowerCase();
    return filtered.filter(
      (r) => r.trainName.toLowerCase().includes(q) || r.trainNumber.toLowerCase().includes(q)
    );
  }, [selectedStation, routeQuery]);

  // Nearest station detection
  const nearestStationResult = useMemo((): NearestStationResult | null => {
    if (!userLoc || !userLoc.lat || !userLoc.lng) return null;
    return indonesiaRailService.getNearestStation(userLoc.lat, userLoc.lng);
  }, [userLoc]);

  const selectStation = useCallback((station: Station | null) => {
    setSelectedStation(station);
  }, []);

  return {
    stationQuery,
    setStationQuery,
    routeQuery,
    setRouteQuery,
    stations,
    selectedStation,
    selectStation,
    routes: routesForSelectedStation,
    nearestStationResult,
    getAllStations: () => indonesiaRailService.getAllStations(),
    getRoutesForStation: (stationCodeOrName: string) => indonesiaRailService.getRoutesForStation(stationCodeOrName),
  };
};
