const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  sport_center_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SportCenter', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
