const mongoose = require('mongoose');

const membershipTypeSchema = new mongoose.Schema({
  sport_center_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SportCenter', required: true },
  name: { type: String, required: true }, // e.g., 'Gói 1 Tháng', 'Gói Vip Năm'
  price: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  discount_rate: { type: Number, required: true }, // Giảm bao nhiêu % khi book sân
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
});

module.exports = mongoose.model('MembershipType', membershipTypeSchema);
