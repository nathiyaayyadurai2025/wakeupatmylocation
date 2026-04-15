const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const trainRoutes = require('./routes/trainRoutes');
const busRoutes = require('./routes/busRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection with Fallback (No Crash if MongoDB not running)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wakestop')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.log('⚠️ MongoDB connection failed. Running with mock/cached storage only.');
  // We do not exit(1) to keep the API server alive for the user
});

// Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'WakeStop API Connected!', 
    available_endpoints: ['/api/train', '/api/bus', '/api/user'] 
  });
});

app.use('/api/train', trainRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/user', userRoutes);

// Root Hello for connectivity check
app.get('/', (req, res) => {
  res.json({ message: 'WakeStop API is running', status: 'OK' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// Port listener only runs if not in a serverless function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 WakeStop Backend listening on port ${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
