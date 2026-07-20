export type Country = 'IN' | 'ID';

export type OperatorType = 'PT KAI' | 'KAI Commuter' | 'KAI Bandara' | 'Indian Railways';

export type RouteCategory = 'Antarkota' | 'Commuter Line' | 'Bandara' | 'KRL' | 'Intercity Trains' | 'Commuter Line Trains';

export interface Station {
  stationCode: string;
  stationName: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  operator: OperatorType | string;
}

export interface RouteStop {
  stationCode: string;
  stationName: string;
  arrival: string;
  departure: string;
  distanceFromOriginKm: number;
  latitude: number;
  longitude: number;
}

export interface TrainRoute {
  id: string;
  trainName: string;
  trainNumber: string;
  category: RouteCategory | string;
  origin: string;
  destination: string;
  stops: RouteStop[];
}

export interface NearestStationResult {
  station: Station;
  distanceKm: number;
  etaMinutes: number;
}
