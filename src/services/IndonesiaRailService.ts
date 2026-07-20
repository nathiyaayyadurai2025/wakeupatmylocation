import { Station, TrainRoute, NearestStationResult } from '../types/railway';
import stationsData from '../data/indonesiaStations.json';
import routesData from '../data/indonesiaRoutes.json';
import { CALCULATE_DISTANCE, ESTIMATE_TIME } from '../constants';

class IndonesiaRailService {
  private stations: Station[] = [];
  private routes: TrainRoute[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize and load datasets lazily
   */
  public async loadData(): Promise<void> {
    if (this.isLoaded) return;
    this.stations = stationsData as Station[];
    this.routes = routesData as TrainRoute[];
    this.isLoaded = true;
  }

  private init(): void {
    this.stations = stationsData as Station[];
    this.routes = routesData as TrainRoute[];
    this.isLoaded = true;
  }

  /**
   * Get all stations
   */
  public getAllStations(): Station[] {
    return this.stations;
  }

  /**
   * Get station by stationCode or stationName
   */
  public getStationByCodeOrName(identifier: string): Station | undefined {
    if (!identifier) return undefined;
    const cleanId = identifier.trim().toLowerCase();
    return this.stations.find(
      (s) =>
        s.stationCode.toLowerCase() === cleanId ||
        s.stationName.toLowerCase() === cleanId ||
        s.stationName.toLowerCase().replace(/stasiun\s+/g, '') === cleanId
    );
  }

  /**
   * Search stations by name, code, city, or province with fuzzy matching
   */
  public searchStations(query: string): Station[] {
    if (!query || query.trim().length === 0) {
      return this.stations;
    }

    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/stasiun\s+/g, '');

    return this.stations.filter((s) => {
      const codeMatch = s.stationCode.toLowerCase().includes(q);
      const nameMatch = s.stationName.toLowerCase().includes(q) || s.stationName.toLowerCase().includes(cleanQ);
      const cityMatch = s.city.toLowerCase().includes(q);
      const provinceMatch = s.province.toLowerCase().includes(q);

      return codeMatch || nameMatch || cityMatch || provinceMatch;
    });
  }

  /**
   * Get all train routes that stop at a given station
   */
  public getRoutesForStation(stationCodeOrName: string): TrainRoute[] {
    if (!stationCodeOrName) return [];
    const target = stationCodeOrName.trim().toLowerCase();
    const cleanTarget = target.replace(/stasiun\s+/g, '').replace(/station\s+/g, '');

    // Try finding station by code first
    const station = this.getStationByCodeOrName(stationCodeOrName);

    return this.routes.filter((route) => {
      return route.stops.some((stop) => {
        // 1. Code match
        if (stop.stationCode && stop.stationCode.toLowerCase() === target) {
          return true;
        }

        // 2. Name match
        const stopName = stop.stationName.toLowerCase();
        const cleanStopName = stopName.replace(/stasiun\s+/g, '').replace(/station\s+/g, '');

        if (stopName.includes(target) || target.includes(stopName) || cleanStopName.includes(cleanTarget)) {
          return true;
        }

        // 3. Distance match if station object exists (< 2.5km)
        if (station && stop.latitude && stop.longitude) {
          const dist = CALCULATE_DISTANCE(station.latitude, station.longitude, stop.latitude, stop.longitude);
          if (dist <= 2.5) return true;
        }

        return false;
      });
    });
  }

  /**
   * Search routes by train name, train number, or category
   */
  public searchRoutes(query: string): TrainRoute[] {
    if (!query || query.trim().length === 0) {
      return this.routes;
    }

    const q = query.trim().toLowerCase();
    return this.routes.filter(
      (r) =>
        r.trainName.toLowerCase().includes(q) ||
        r.trainNumber.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }

  /**
   * Find nearest station to given user lat/lng coordinates using Haversine formula
   */
  public getNearestStation(userLat: number, userLng: number): NearestStationResult | null {
    if (!userLat || !userLng || this.stations.length === 0) return null;

    let nearest: Station | null = null;
    let minDistance = Infinity;

    for (const station of this.stations) {
      const dist = CALCULATE_DISTANCE(userLat, userLng, station.latitude, station.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = station;
      }
    }

    if (!nearest) return null;

    const etaMins = ESTIMATE_TIME(minDistance, 45); // Avg speed 45km/h for local station access
    return {
      station: nearest,
      distanceKm: parseFloat(minDistance.toFixed(2)),
      etaMinutes: etaMins,
    };
  }
}

export const indonesiaRailService = new IndonesiaRailService();
export default indonesiaRailService;
