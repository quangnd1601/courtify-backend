const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar_url: { type: String },
  role: { type: String, enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BANNED'], default: 'ACTIVE' },

  // Thống kê
  total_bookings: { type: Number, default: 0 },
  total_spent_amount: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
