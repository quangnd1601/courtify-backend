const mongoose = require('mongoose');

// Schema nhúng cho Chi tiết đặt sân
const bookingDetailSchema = new mongoose.Schema({
  court_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  time_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  price_at_booking: { type: Number, required: true }
}, { _id: false }); // Không cần _id riêng cho mảng nhúng nếu không thực sự cần

// Schema nhúng cho Dịch vụ đi kèm
const bookingServiceSchema = new mongoose.Schema({
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  quantity: { type: Number, required: true },
  price_at_booking: { type: Number, required: true }
}, { _id: false });

// Schema chính cho Hóa đơn đặt sân
const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  user_membership_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserMembership', default: null },
  
  booking_for_date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  
  subtotal: { type: Number, required: true },
  voucher_discount: { type: Number, default: 0 },
  membership_discount: { type: Number, default: 0 },
  total_price: { type: Number, required: true },
  
  note: { type: String },
  payment_method: { type: String, enum: ['cash', 'payos'], default: 'cash' },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' },
  
  // Nhúng (Embedding) - The Hybrid approach
  details: [bookingDetailSchema],
  services: [bookingServiceSchema],
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
