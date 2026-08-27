const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  sport_center_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SportCenter', required: true },
  court_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourtType' }, // e.g., INDOOR, OUTDOOR
  court_level_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourtLevel' }, // e.g., NORMAL, VIP
  court_name: { type: String, required: true },
  price: { type: Number, required: true }, // Giá giờ thường
  peak_price: { type: Number }, // Giá giờ cao điểm
  thumbnail: { type: String }, // Hình ảnh đại diện sân
  status: { type: String, enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'], default: 'ACTIVE' },

  // Thống kê
  total_bookings: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Court', courtSchema);
