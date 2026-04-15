const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

const BusRouteSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  routeName: { type: String, required: true },
  busType: { type: String, default: 'SETC' },
  stops: [StopSchema]
});

module.exports = mongoose.model('BusRoute', BusRouteSchema);
