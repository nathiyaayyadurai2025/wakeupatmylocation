const { getDistance } = require('./utils/distance');

/**
 * Real-time Tracking Engine
 * Calculates proximity to the next destination stop
 */
const checkNextStop = (userLocation, routeStops) => {
  if (!userLocation || !routeStops || routeStops.length === 0) {
    return { error: "Invalid tracking data" };
  }

  const { lat, lng } = userLocation;
  
  // Find the nearest stop in the remaining route
  // In a real production app, we would track where the user is currently
  // and only look at STOPS IN FRONT of them.
  
  let nearestStop = null;
  let minDistance = Infinity;

  routeStops.forEach(stop => {
    const dist = getDistance(lat, lng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStop = stop;
    }
  });

  return {
    nextStop: nearestStop ? (nearestStop.station || nearestStop.stopName) : "Unknown",
    distanceRemaining: parseFloat(minDistance.toFixed(2)),
    shouldWakeUp: minDistance <= 5.0 // Trigger alarm if within 5km
  };
};

module.exports = { checkNextStop };
