const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  station: { type: String, required: true },
  arrival: { type: String, default: '--' },
  departure: { type: String, default: '--' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

const TrainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, unique: true },
  trainName: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  stops: [StationSchema],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Train', TrainSchema);
