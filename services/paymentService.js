const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const BookedSlot = require('../models/BookedSlot');
const User = require('../models/User');
const Court = require('../models/Court');
const payOSService = require('./payOSService');

// ============================================================
// LUỒNG TIỀN MẶT / OFFLINE (giữ nguyên)
// ============================================================
const processPayment = async (paymentData) => {
  const { booking_id, payment_method, paid_amount } = paymentData;

  // 1. Kiểm tra hóa đơn tồn tại và chưa được thanh toán
  const booking = await Booking.findById(booking_id);
  if (!booking) throw new Error('Hóa đơn không tồn tại');
  if (booking.status !== 'PENDING') throw new Error('Hóa đơn này đã được xử lý hoặc đã hủy');

  // 2. Tạo bản ghi thanh toán
  const newPayment = new Payment({
    booking_id,
    payment_method,
    paid_amount,
    payment_status: 'SUCCESS',
    paid_at: new Date()
  });
  await newPayment.save();

  // 3. Cập nhật trạng thái Hóa Đơn và Khung Giờ (Lock cứng) thành CONFIRMED
  booking.status = 'CONFIRMED';
  await booking.save();

  await BookedSlot.updateMany(
    { booking_id: booking_id },
    { $set: { status: 'CONFIRMED' } }
  );

  return newPayment;
};

// ============================================================
// LUỒNG PAYOS
// ============================================================

// Sinh orderCode duy nhất (số nguyên dương, tối đa 10 chữ số như payOS yêu cầu)
const generateOrderCode = async () => {
  let orderCode;
  let isDuplicate = true;
  while (isDuplicate) {
    orderCode = Number(String(Date.now()).slice(-10));
    isDuplicate = !!(await Payment.findOne({ order_code: orderCode }));
  }
  return orderCode;
};

// Xác nhận thanh toán từ webhook (hoặc từ kết quả truy vấn payOS) — idempotent
const confirmPaymentFromWebhook = async (orderCode, webhookData) => {
  const payment = await Payment.findOne({ order_code: orderCode });
  if (!payment) {
    console.error(`[payOS] Không tìm thấy Payment với orderCode: ${orderCode}`);
    return null;
  }
  if (payment.payment_status === 'SUCCESS') {
    return payment; // Đã xử lý rồi → bỏ qua (tránh xử lý trùng)
  }

  payment.payment_status = 'SUCCESS';
  if (webhookData.amount) payment.paid_amount = webhookData.amount;
  if (webhookData.paymentLinkId) payment.transaction_id = webhookData.paymentLinkId;
  if (webhookData.reference) payment.transaction_reference = webhookData.reference;
  payment.paid_at = new Date();
  await payment.save();

  // Cập nhật Booking + BookedSlot thành CONFIRMED
  const booking = await Booking.findById(payment.booking_id);
  if (booking && booking.status === 'PENDING') {
    booking.status = 'CONFIRMED';
    await booking.save();

    await BookedSlot.updateMany(
      { booking_id: booking._id },
      { $set: { status: 'CONFIRMED' } }
    );
  }

  return payment;
};

// Tạo link thanh toán payOS cho một booking
const createOnlinePaymentLink = async (bookingId, userId) => {
  // 1. Kiểm tra hóa đơn
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Hóa đơn không tồn tại');
  if (booking.user_id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền thanh toán hóa đơn này');
  }
  if (booking.status !== 'PENDING') {
    throw new Error('Hóa đơn này đã được xử lý hoặc đã hủy');
  }

  // 2. Xử lý payment cũ (nếu có)
  const existingPayment = await Payment.findOne({ booking_id: bookingId });
  if (existingPayment) {
    if (existingPayment.payment_status === 'SUCCESS') {
      throw new Error('Hóa đơn này đã được thanh toán');
    }

    if (existingPayment.payment_status === 'PENDING') {
      let payosStatus = null;
      try {
        const info = await payOSService.getPaymentLinkInfo(existingPayment.order_code);
        payosStatus = info.status;
        if (payosStatus === 'PAID') {
          await confirmPaymentFromWebhook(existingPayment.order_code, {
            amount: info.amount,
            paymentLinkId: info.id,
            reference: info.transactions && info.transactions[0]
              ? info.transactions[0].reference
              : null,
          });
          throw new Error('Hóa đơn này đã được thanh toán');
        }
      } catch (error) {
        if (error.message === 'Hóa đơn này đã được thanh toán') throw error;
        payosStatus = null;
      }

      if (payosStatus === 'PENDING' || payosStatus === 'PROCESSING') {
        if (existingPayment.checkout_url) {
          return {
            checkoutUrl: existingPayment.checkout_url,
            orderCode: existingPayment.order_code,
            paymentLinkId: existingPayment.transaction_id,
          };
        }
      }

      await Payment.deleteOne({ _id: existingPayment._id });
    } else {
      await Payment.deleteOne({ _id: existingPayment._id });
    }
  }

  // 3. Lấy thông tin user + sân để xây dựng dữ liệu thanh toán
  const user = await User.findById(userId);
  const courtIds = booking.details.map((d) => d.court_id);
  const courts = await Court.find({ _id: { $in: courtIds } });

  // 4. Sinh orderCode duy nhất
  const orderCode = await generateOrderCode();

  // 5. Tạo bản ghi Payment PENDING trước
  const newPayment = new Payment({
    booking_id: bookingId,
    payment_method: 'payos',
    payment_provider: 'payOS',
    order_code: orderCode,
    paid_amount: Math.round(booking.total_price),
    payment_status: 'PENDING',
  });
  await newPayment.save();

  // 6. Xây dựng returnUrl/cancelUrl từ env — BẮT BUỘC cấu hình trong .env (xem .env.example)
  const baseReturnUrl = process.env.PAYOS_RETURN_URL;
  const baseCancelUrl = process.env.PAYOS_CANCEL_URL;
  if (!baseReturnUrl || !baseCancelUrl) {
    throw new Error('Thiếu PAYOS_RETURN_URL / PAYOS_CANCEL_URL trong file .env. Vui lòng cấu hình theo .env.example');
  }

  const centerId = courts.length > 0 ? (courts[0].sport_center_id || '') : '';
  const pairs = booking.details.map((d) => `${d.court_id}:${d.time_slot_id}`).join(',');
  const contextQuery =
    `booking_id=${encodeURIComponent(bookingId)}` +
    `&center_id=${encodeURIComponent(centerId)}` +
    `&date=${encodeURIComponent(booking.booking_for_date)}` +
    `&pairs=${encodeURIComponent(pairs)}` +
    `&total=${booking.total_price}` +
    `&payment_method=payos`;

  const returnUrl = `${baseReturnUrl}?${contextQuery}`;
  const cancelUrl = `${baseCancelUrl}?booking_id=${encodeURIComponent(bookingId)}&payment_method=payos`;

  // 7. Gọi payOS tạo link thanh toán
  const paymentLink = await payOSService.createPaymentLink({
    orderCode,
    amount: Math.round(booking.total_price),
    description: `DAT SAN ${orderCode}`,
    buyerName: user ? user.name : undefined,
    buyerEmail: user ? user.email : undefined,
    buyerPhone: user ? user.phone : undefined,
    returnUrl,
    cancelUrl,
  });

  // 8. Lưu thông tin link thanh toán vào Payment
  newPayment.transaction_id = paymentLink.paymentLinkId;
  newPayment.checkout_url = paymentLink.checkoutUrl;
  await newPayment.save();

  return {
    checkoutUrl: paymentLink.checkoutUrl,
    orderCode,
    paymentLinkId: paymentLink.paymentLinkId,
  };
};

// Kiểm tra trạng thái thanh toán (nếu chưa SUCCESS → tự xác minh trực tiếp với payOS)
const getPaymentStatus = async (orderCode, userId) => {
  const payment = await Payment.findOne({ order_code: orderCode });
  if (!payment) throw new Error('Không tìm thấy giao dịch');

  const booking = await Booking.findById(payment.booking_id);
  if (!booking) throw new Error('Không tìm thấy hóa đơn');
  if (booking.user_id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xem giao dịch này');
  }

  if (payment.payment_status !== 'SUCCESS') {
    try {
      const info = await payOSService.getPaymentLinkInfo(orderCode);
      if (info.status === 'PAID') {
        await confirmPaymentFromWebhook(orderCode, {
          amount: info.amount,
          paymentLinkId: info.id,
          reference: info.transactions && info.transactions[0]
            ? info.transactions[0].reference
            : null,
        });
        return { status: 'SUCCESS', booking_status: 'CONFIRMED' };
      }
      return { status: 'PENDING', payos_status: info.status };
    } catch (error) {
      return { status: payment.payment_status || 'PENDING', payos_status: null, error: error.message };
    }
  }

  return { status: 'SUCCESS', booking_status: booking.status };
};

// Hủy link thanh toán
const cancelPaymentLink = async (orderCode, userId) => {
  const payment = await Payment.findOne({ order_code: orderCode });
  if (!payment) throw new Error('Không tìm thấy giao dịch');

  const booking = await Booking.findById(payment.booking_id);
  if (!booking) throw new Error('Không tìm thấy hóa đơn');
  if (booking.user_id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền hủy giao dịch này');
  }
  if (payment.payment_status === 'SUCCESS') {
    throw new Error('Giao dịch đã hoàn tất, không thể hủy');
  }

  try {
    await payOSService.cancelPaymentLink(orderCode, 'Khách hàng hủy thanh toán');
  } catch (error) {
    console.error('[payOS] Lỗi hủy link:', error.message);
  }
  payment.payment_status = 'FAILED';
  await payment.save();
  return payment;
};

// (Admin) Xác nhận đã hoàn tiền thủ công trên my.payos.vn
const markRefunded = async (orderCode) => {
  const payment = await Payment.findOne({ order_code: orderCode });
  if (!payment) throw new Error('Không tìm thấy giao dịch');
  if (payment.payment_status !== 'REFUND_PENDING') {
    throw new Error('Giao dịch không ở trạng thái cần hoàn tiền (REFUND_PENDING)');
  }
  payment.payment_status = 'REFUNDED';
  payment.refunded_at = new Date();
  await payment.save();
  return payment;
};

module.exports = {
  processPayment,
  createOnlinePaymentLink,
  confirmPaymentFromWebhook,
  getPaymentStatus,
  cancelPaymentLink,
  markRefunded,
};