const Booking = require('../models/Booking');
const BookedSlot = require('../models/BookedSlot');
const Court = require('../models/Court');
const SportCenter = require('../models/SportCenter');
const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const payOSService = require('./payOSService');

// Tạo lỗi 400 Bad Request (lỗi xác thực dữ liệu từ client)
const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

// Hàm kiểm tra lịch trống (Dùng cho UI check trước khi ấn đặt)
const checkAvailability = async (courtId, date, timeSlotIds) => {
  const existingHolds = await BookedSlot.find({
    court_id: courtId,
    booking_for_date: date,
    time_slot_id: { $in: timeSlotIds },
    status: { $in: ['PENDING', 'CONFIRMED'] }
  });
  return existingHolds;
};

// tạo đơn + chống trùng lịch
const createBooking = async (bookingData) => {
  // User đặt sân luôn ở trạng thái PENDING (Chờ duyệt) — Admin duyệt mới chuyển CONFIRMED
  const initialStatus = 'PENDING';

  // 0. KIỂM TRA TRẠNG THÁI SÂN & CỤM SÂN TRƯỚC KHI ĐẶT
  const courtIds = bookingData.details.map(d => d.court_id);
  const courts = await Court.find({ _id: { $in: courtIds } });
  if (courts.length !== new Set(courtIds).size) {
    throw badRequest('Một số sân không tồn tại.');
  }
  for (const court of courts) {
    if (court.status !== 'ACTIVE') {
      throw badRequest(`Sân "${court.court_name}" hiện không hoạt động (${court.status === 'MAINTENANCE' ? 'đang bảo trì' : 'tạm đóng'}). Không thể đặt.`);
    }
  }
  // Kiểm tra cụm sân của sân có ACTIVE không
  const centerIds = [...new Set(courts.map(c => c.sport_center_id))];
  const centers = await SportCenter.find({ _id: { $in: centerIds } });
  for (const center of centers) {
    if (center.status !== 'ACTIVE') {
      throw badRequest(`Cụm sân "${center.name}" hiện đang tạm đóng. Không thể đặt sân.`);
    }
  }

  // 0.5. Tính subtotal phía SERVER từ các chi tiết sân + dịch vụ (không tin client)
  const subtotal =
    bookingData.details.reduce((sum, d) => sum + (d.price_at_booking || 0), 0) +
    (bookingData.services || []).reduce((sum, s) => sum + (s.price_at_booking || 0) * (s.quantity || 1), 0);

  // 0.6. Xử lý VOUCHER: kiểm tra hợp lệ + tính giảm giá phía SERVER
  let voucher = null;
  let voucherDiscount = 0;
  if (bookingData.voucher_code) {
    voucher = await Voucher.findOne({ code: bookingData.voucher_code, status: 'ACTIVE' });
    if (!voucher) throw badRequest('Voucher không tồn tại hoặc đã hết hạn');

    const now = new Date();
    if (now < new Date(voucher.start_date) || now > new Date(voucher.end_date)) {
      throw badRequest('Voucher đã hết hạn sử dụng');
    }
    if (voucher.usage_limit != null && voucher.used_count >= voucher.usage_limit) {
      throw badRequest('Voucher đã hết lượt sử dụng');
    }
    if (subtotal < (voucher.min_order_value || 0)) {
      throw badRequest(`Đơn tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')}đ để dùng voucher này`);
    }

    if (voucher.discount_type === 'PERCENTAGE') {
      voucherDiscount = Math.round((subtotal * voucher.discount_value) / 100);
      if (voucher.max_discount_amount) voucherDiscount = Math.min(voucherDiscount, voucher.max_discount_amount);
    } else {
      voucherDiscount = voucher.discount_value;
      if (voucher.max_discount_amount) voucherDiscount = Math.min(voucherDiscount, voucher.max_discount_amount);
    }
    voucherDiscount = Math.min(voucherDiscount, subtotal);
  }
  const totalPrice = subtotal - voucherDiscount;

  // 1. push data vào bảng BookedSlot để KHÓA LỊCH
  // Nếu có người khác đã đặt trùng Sân + Ngày + Giờ, đoạn code này sẽ văng lỗi MongoDB 11000 (Duplicate Key)
  const holdPromises = bookingData.details.map(detail => {
    return BookedSlot.create({
      court_id: detail.court_id,
      booking_for_date: bookingData.booking_for_date,
      time_slot_id: detail.time_slot_id,
      status: initialStatus // PENDING (giữ chỗ) hoặc CONFIRMED (tiền mặt)
    });
  });

  const heldSlots = await Promise.all(holdPromises);

  // 2. Chỉ khi nào Khóa Lịch thành công 100%, mới tạo Hóa đơn Booking
  const newBooking = new Booking({
    user_id: bookingData.user_id,
    booking_for_date: bookingData.booking_for_date,
    voucher_id: voucher ? voucher._id : null,
    subtotal,
    voucher_discount: voucherDiscount,
    membership_discount: 0,
    total_price: totalPrice,
    details: bookingData.details,
    services: bookingData.services || [],
    note: bookingData.note || '',
    payment_method: bookingData.payment_method || 'cash',
    status: initialStatus
  });

  const savedBooking = await newBooking.save();

  // Tăng lượt dùng voucher
  if (voucher) {
    await Voucher.findByIdAndUpdate(voucher._id, { $inc: { used_count: 1 } });
  }

  // Cập nhật thống kê số lượt đặt cho CỤM SÂN và các SÂN (denormalization)
  const centerIdsToInc = [...new Set(courts.map(c => c.sport_center_id.toString()))];
  await SportCenter.updateMany({ _id: { $in: centerIdsToInc } }, { $inc: { total_bookings: 1 } });
  await Court.updateMany({ _id: { $in: courts.map(c => c._id) } }, { $inc: { total_bookings: 1 } });

  // 3. Gắn booking_id ngược lại vào các Slot đã khóa để biết Slot này thuộc hóa đơn nào
  await BookedSlot.updateMany(
    { _id: { $in: heldSlots.map(s => s._id) } },
    { $set: { booking_id: savedBooking._id } }
  );

  return savedBooking;
};

const getMyBookings = async (userId) => {
  return await Booking.find({ user_id: userId })
    .populate({
      path: 'details.court_id',
      select: 'court_name sport_center_id price peak_price',
      populate: {
        path: 'sport_center_id',
        select: 'name address sport_id',
        populate: {
          path: 'sport_id',
          select: 'name'
        }
      }
    })
    .populate('details.time_slot_id', 'start_time end_time is_peak_hour')
    .populate('services.service_id', 'service_name price')
    .populate('voucher_id', 'code discount_type discount_value')
    .sort({ created_at: -1 });
};

const getAllBookings = async () => {
  const bookings = await Booking.find()
    .populate('user_id', 'name phone email')
    .populate({
      path: 'details.court_id',
      select: 'court_name sport_center_id price peak_price',
      populate: {
        path: 'sport_center_id',
        select: 'name address sport_id',
        populate: {
          path: 'sport_id',
          select: 'name'
        }
      }
    })
    .populate('details.time_slot_id', 'start_time end_time is_peak_hour')
    .populate('services.service_id', 'service_name price')
    .populate('voucher_id', 'code discount_type discount_value')
    .sort({ created_at: -1 });

  // Gắn thêm thông tin thanh toán (cho admin theo dõi hoàn tiền)
  const bookingIds = bookings.map((b) => b._id);
  const payments = await Payment.find({ booking_id: { $in: bookingIds } });
  const paymentMap = {};
  payments.forEach((p) => {
    paymentMap[p.booking_id.toString()] = p;
  });

  return bookings.map((b) => {
    const doc = b.toObject();
    const p = paymentMap[b._id.toString()];
    doc.payment = p
      ? {
          order_code: p.order_code,
          payment_provider: p.payment_provider,
          payment_status: p.payment_status,
          paid_amount: p.paid_amount,
          paid_at: p.paid_at,
          refund_note: p.refund_note,
        }
      : null;
    return doc;
  });
};

const getBookingById = async (bookingId) => {
  return await Booking.findById(bookingId);
};

// Lấy bản ghi thanh toán của một booking (dùng để kiểm tra đơn đã thanh toán chưa)
const getPaymentByBookingId = async (bookingId) => {
  return await Payment.findOne({ booking_id: bookingId });
};

const updateBookingStatus = async (bookingId, status) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Không tìm thấy đơn đặt sân');
  }

  // Xử lý TIỀN khi HỦY đơn
  if (status === 'CANCELLED') {
    // Hoàn lại số lượt đặt cho CỤM SÂN & SÂN (không cho âm)
    const courtIds = booking.details.map(d => d.court_id);
    const bookingCourts = await Court.find({ _id: { $in: courtIds } });
    const centerIds = [...new Set(bookingCourts.map(c => c.sport_center_id.toString()))];
    await SportCenter.updateMany(
      { _id: { $in: centerIds }, total_bookings: { $gt: 0 } },
      { $inc: { total_bookings: -1 } }
    );
    await Court.updateMany(
      { _id: { $in: courtIds }, total_bookings: { $gt: 0 } },
      { $inc: { total_bookings: -1 } }
    );
    // Hoàn lại lượt dùng voucher (nếu có) để khách/người khác dùng lại
    if (booking.voucher_id) {
      await Voucher.updateOne(
        { _id: booking.voucher_id, used_count: { $gt: 0 } },
        { $inc: { used_count: -1 } }
      );
    }
    const payment = await Payment.findOne({ booking_id: bookingId });
    if (payment && payment.payment_provider === 'payOS') {
      if (payment.payment_status === 'SUCCESS') {
        // Đã thanh toán payOS → đánh dấu cần hoàn tiền thủ công (payOS chưa có API refund)
        payment.payment_status = 'REFUND_PENDING';
        payment.refund_note = 'Đơn đã hủy sau khi thanh toán payOS. Cần hoàn tiền thủ công.';
        await payment.save();
      } else if (payment.payment_status === 'PENDING') {
        // Chưa thanh toán → hủy luôn payment link payOS đang chờ
        try {
          await payOSService.cancelPaymentLink(payment.order_code, 'Hủy đơn đặt sân');
        } catch (error) {
          console.error('[payOS] Lỗi hủy link khi hủy đơn:', error.message);
        }
        payment.payment_status = 'FAILED';
        await payment.save();
      }
    }
  }

  booking.status = status;
  await booking.save();

  // Đồng bộ trạng thái sang BookedSlot tương ứng để giải phóng lịch nếu CANCELLED
  let slotStatus = 'PENDING';
  if (status === 'CONFIRMED' || status === 'COMPLETED') slotStatus = 'CONFIRMED';
  if (status === 'CANCELLED') slotStatus = 'CANCELLED';

  await BookedSlot.updateMany(
    { booking_id: bookingId },
    { $set: { status: slotStatus } }
  );

  return booking;
};

module.exports = {
  checkAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  getPaymentByBookingId,
  updateBookingStatus
};
