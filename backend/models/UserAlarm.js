const mongoose = require('mongoose');

const UserAlarmSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  travelMode: { type: String, enum: ['train', 'bus', 'general'], required: true },
  destinationStops: [{
    name: String,
    lat: Number,
    lng: Number
  }],
  alarmDistance: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserAlarm', UserAlarmSchema);
