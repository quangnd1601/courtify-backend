const mongoose = require('mongoose');

const sportCenterSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sport_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport' },
  name: { type: String, required: true },
  address: { type: String, required: true },
  default_price: { type: Number },
  opening_time: { type: String }, // e.g., '05:00'
  closing_time: { type: String }, // e.g., '23:00'
  thumbnail: { type: String },
  images: [{ type: String }],
  description: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  
  // Thống kê (Denormalization)
  total_views: { type: Number, default: 0 },
  total_bookings: { type: Number, default: 0 },
  average_rating: { type: Number, default: 0 },
  total_reviews: { type: Number, default: 0 },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SportCenter', sportCenterSchema);
