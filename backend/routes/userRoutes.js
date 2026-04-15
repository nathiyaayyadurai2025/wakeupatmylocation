const express = require('express');
const router = express.Router();
const UserAlarm = require('../models/UserAlarm');

// @route   POST /api/user/save-alarm
// @desc    Save user's current alarm mission
router.post('/save-alarm', async (req, res) => {
  try {
    const { userId, travelMode, destinationStops, alarmDistance } = req.body;
    
    // Create new alarm record (history)
    const newAlarm = new UserAlarm({
      userId,
      travelMode,
      destinationStops,
      alarmDistance
    });

    await newAlarm.save();
    res.json({ success: true, missionId: newAlarm._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync alarm to cloud' });
  }
});

module.exports = router;
