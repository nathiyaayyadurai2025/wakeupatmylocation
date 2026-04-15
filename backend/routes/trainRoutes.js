const express = require('express');
const router = express.Router();
const Train = require('../models/Train');
const { getTrainByNumber, getAllTrains } = require('../services/trainService');

// @route   GET /api/train
// @desc    Get all available trains for selection
router.get('/', async (req, res) => {
  try {
    const trains = await getAllTrains();
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// @route   GET /api/train/:trainNumber
// @desc    Get real train details by number
router.get('/:trainNumber', async (req, res) => {
  try {
    const trainNumber = req.params.trainNumber;
    const trainData = await getTrainByNumber(trainNumber);
    if (!trainData) {
        return res.status(404).json({ error: 'Train Not Found', message: 'The specified train was not found in the mission registry.' });
    }
    res.json(trainData);
  } catch (err) {
    console.error(`Status 500 error in trainRoutes: ${err.message}`);
    res.status(404).json({ 
      error: 'Mission Data Unavailable', 
      message: 'The requested train could not be located in the current fleet.' 
    });
  }
});

module.exports = router;
