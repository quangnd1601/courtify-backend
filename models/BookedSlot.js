const mongoose = require('mongoose');

const bookedSlotSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  court_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  booking_for_date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  time_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
  
  // Ngày tạo record
  created_at: { type: Date, default: Date.now } 
});

// PARTIAL UNIQUE INDEX: Chống trùng lịch
// Chỉ áp dụng ràng buộc Unique (Duy nhất) khi trạng thái là PENDING hoặc CONFIRMED.
// Nếu khách hủy (CANCELLED) hoặc timeout bị xóa, Slot sẽ được nhả ra.
bookedSlotSchema.index(
  { court_id: 1, booking_for_date: 1, time_slot_id: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } } 
  }
);

module.exports = mongoose.model('BookedSlot', bookedSlotSchema);
