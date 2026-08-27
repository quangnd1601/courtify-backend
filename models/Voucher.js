const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount_type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  discount_value: { type: Number, required: true },
  min_order_value: { type: Number, default: 0 },
  max_discount_amount: { type: Number },
  
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  
  usage_limit: { type: Number }, // Số lần dùng tối đa
  used_count: { type: Number, default: 0 },
  
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', voucherSchema);
