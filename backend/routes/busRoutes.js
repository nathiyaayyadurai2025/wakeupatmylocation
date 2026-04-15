const express = require('express');
const router = express.Router();
const path = require('path');
const BusRoute = require('../models/BusRoute');

// DIRECT REQUIRE for JS Modules (Ensures 100% Vercel Bundling)
let localBusData = [];
try {
  localBusData = require('../data/tamilnadu_bus_routes.js');
} catch (e) {
  console.error("Critical Failure: Could not bundle tamilnadu_bus_routes.js", e.message);
  localBusData = [];
}

// @route   GET /api/bus/routes
// @desc    Get all 100 bus routes
router.get('/routes', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const routes = await BusRoute.find();
      if (routes && routes.length > 0) return res.json(routes);
    }
    
    // Fallback to bundled 100-route JS module
    res.json(localBusData.map((r, i) => ({
      routeId: r.routeId || `TN-BUS-${i+1}`,
      routeName: r.routeName || r.route,
      stops: (r.stops || []).map(s => ({ stopName: s.stopName || s.name, lat: s.lat, lng: s.lng || s.lon }))
    })));
  } catch (err) {
    console.error("Bus Routes Error:", err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/bus/:routeName
// @desc    Get specific bus route stops
router.get('/:routeName', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
       const route = await BusRoute.findOne({ routeName: req.params.routeName });
       if (route) return res.json(route);
    }

    const localRoute = localBusData.find(r => (r.routeName || r.route) === req.params.routeName);
    
    if (!localRoute) return res.status(404).json({ error: 'Route not found' });
    
    res.json({
      routeName: localRoute.routeName || localRoute.route,
      stops: (localRoute.stops || []).map(s => ({ stopName: s.stopName || s.name, lat: s.lat, lng: s.lng || s.lon }))
    });
  } catch (err) {
    console.error("Bus Route Detail Error:", err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
