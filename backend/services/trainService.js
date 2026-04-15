const axios = require('axios');
const path = require('path');
const Train = require('../models/Train');

// DIRECT REQUIRE for JS Modules (Ensures 100% Vercel Bundling)
let trainTimings = [];
let railwayStations = [];

try {
  trainTimings = require('../data/train_timings.js');
} catch (e) {
  console.error("Critical Failure: Could not bundle train_timings.js", e.message);
  trainTimings = [];
}

try {
  railwayStations = require('../data/railway_stations.js');
} catch (e) {
  console.error("Critical Failure: Could not bundle railway_stations.js", e.message);
  railwayStations = [];
}

const getTrainByNumber = async (trainNumber) => {
  try {
    const trainData = trainTimings.find(t => t.trainNumber === trainNumber || (t.trainName && t.trainName.toLowerCase().includes(trainNumber.toLowerCase())));

    const resolveStation = (name) => {
      if (!name) return { lat: 13.0827, lon: 80.2707 };
      const station = railwayStations.find(s => s.stationName && (s.stationName.toLowerCase().includes(name.toLowerCase()) || s.stationCode === name));
      return station || { lat: 13.0827, lon: 80.2707 };
    };

    if (trainData && trainData.stations && trainData.stations.length > 0) {
      const now = new Date();
      const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
      const startTimeStr = trainData.stations[0].departureTime || "00:00";
      
      let startH = 0, startM = 0;
      if (startTimeStr && startTimeStr.includes(':')) {
         [startH, startM] = startTimeStr.split(':').map(Number);
      }
      const startTimeInMins = startH * 60 + startM;

      let delay = 0;
      if (currentTimeInMins >= startTimeInMins) {
         delay = Math.random() > 0.3 ? Math.floor(Math.random() * 25) : 0;
      }
      const status = delay > 0 ? `${delay} mins late` : 'On Time';

      const addDelay = (timeStr, mins) => {
        if (!timeStr || timeStr === 'START' || timeStr === 'END' || timeStr === '--') return timeStr;
        if (!timeStr.includes(':')) return timeStr;
        const [h, m] = timeStr.split(':').map(Number);
        const total = h * 60 + m + mins;
        return `${Math.floor((total / 60) % 24).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
      };

      const stopsWithGeo = trainData.stations.map(s => {
        const geo = resolveStation(s.station);
        return {
          station: s.station,
          arrival: s.arrivalTime,
          departure: s.departureTime,
          expectedArrival: addDelay(s.arrivalTime, delay),
          lat: geo.lat,
          lng: geo.lon || geo.lng || 0
        };
      });

      return {
        trainNumber: trainData.trainNumber,
        trainName: trainData.trainName,
        from: trainData.stations[0].station,
        to: trainData.stations[trainData.stations.length - 1].station,
        liveStatus: {
          delayMinutes: delay,
          statusMessage: status,
          lastUpdated: new Date().toLocaleTimeString()
        },
        stops: stopsWithGeo
      };
    }
    throw new Error('Train Not Found');
  } catch (err) {
    console.error(`Error in TrainService: ${err.message}`);
    throw err;
  }
};

const getAllTrains = async () => {
  try {
    return trainTimings.filter(t => t && t.stations && t.stations.length > 0).map(t => {
      const now = new Date();
      const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
      const startTimeStr = t.stations[0].departureTime || "00:00";
      
      let startH = 0, startM = 0;
      if (startTimeStr && startTimeStr.includes(':')) {
        [startH, startM] = startTimeStr.split(':').map(Number);
      }
      const startTimeInMins = startH * 60 + startM;

      let delay = 0;
      if (currentTimeInMins >= startTimeInMins) {
         delay = Math.random() > 0.3 ? Math.floor(Math.random() * 25) : 0;
      }
      const status = delay > 0 ? `${delay} mins late` : 'On Time';

      let currentDayOffset = 0;
      let prevMinutes = -1;

      const addDelay = (timeStr, mins) => {
        if (!timeStr || timeStr === 'START' || timeStr === 'END' || timeStr === '--') return { time: timeStr, dayOffset: currentDayOffset };
        if (!timeStr.includes(':')) return { time: timeStr, dayOffset: currentDayOffset };
        const [h, m] = timeStr.split(':').map(Number);
        const total = h * 60 + m + mins;
        if (prevMinutes !== -1 && (h * 60 + m) < prevMinutes) { currentDayOffset++; }
        prevMinutes = h * 60 + m;
        const newH = Math.floor((total / 60) % 24);
        const newM = total % 60;
        return { time: `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`, dayOffset: currentDayOffset };
      };

      const formatDate = (offset) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      };

      const resolveGeo = (name) => {
        if (!name) return { lat: 13.0827, lon: 80.2707 };
        const s = railwayStations.find(st => st.stationName && (st.stationName.toLowerCase().includes(name.toLowerCase()) || st.stationCode === name));
        return s || { lat: 13.0827, lon: 80.2707 };
      };

      return {
        ...t,
        from: t.stations[0].station,
        to: t.stations[t.stations.length - 1].station,
        liveStatus: {
          delayMinutes: delay,
          statusMessage: status,
          lastUpdated: new Date().toLocaleTimeString()
        },
        stops: t.stations.map(s => {
          const geo = resolveGeo(s.station);
          const { time: expected, dayOffset } = addDelay(s.arrivalTime, delay);
          return {
            station: s.station,
            arrival: s.arrivalTime,
            departure: s.departureTime,
            expectedArrival: expected,
            expectedDate: formatDate(dayOffset),
            lat: geo.lat,
            lng: geo.lon || geo.lng || 0
          };
        })
      };
    });
  } catch (err) {
    console.error("GetAllTrains Error:", err);
    return [];
  }
};

module.exports = { getTrainByNumber, getAllTrains };
