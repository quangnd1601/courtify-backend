const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },

  payment_method: { type: String, required: true }, // e.g., 'cash', 'payos'
  payment_provider: { type: String }, // e.g., 'payOS'
  transaction_id: { type: String }, // paymentLinkId của payOS
  transaction_reference: { type: String }, // Mã giao dịch tham chiếu từ payOS (webhook)

  order_code: { type: Number, unique: true, sparse: true }, // Mã đơn hàng (orderCode) trên payOS
  checkout_url: { type: String }, // Link thanh toán payOS

  paid_amount: { type: Number, required: true },
  payment_status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUND_PENDING', 'REFUNDED'], default: 'PENDING' },

  // Hoàn tiền hoàn thủ công trên my.payos.vn
  refund_note: { type: String },
  refunded_at: { type: Date },

  paid_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
