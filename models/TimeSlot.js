const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start_time: { type: String, required: true }, // e.g., '05:00'
  end_time: { type: String, required: true },   // e.g., '06:00'
  is_peak_hour: { type: Boolean, default: false } // Đánh dấu giờ cao điểm
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
